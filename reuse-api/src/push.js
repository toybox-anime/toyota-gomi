// ===== 前日20時の通知（Web Push）=====
// 中身の無い「合図」だけを送り、表示する文はスマホ側（sw.js）が保存済みの収集日から作る。
//   → 通知の暗号化が要らず、サーバーは「誰がどの地区か」以外の情報を持たない。
// 送るのは翌日に収集がある人だけ。Cron（20:00〜20:29 JST、毎分）で40件ずつ送る。
import { HttpError, bad, json, readJson, sha, clientIp, salt, cities, jstDay, HOUR } from "./util.js";
import { districtsOf } from "./city.js";

const BATCH = 40;                 // 無料枠の外部リクエスト上限（50/回）に収める
const MAX_SUBS_PER_IP_DAY = 30;
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/];
const VAPID_SUB = "https://toybox-anime.github.io/toyota-gomi/";

export async function pushRoutes(req, env, url) {
  const p = url.pathname, m = req.method;
  if (m === "GET" && p === "/api/push/key") return json({ key: await publicKey(env) });
  if (m === "POST" && p === "/api/push/subscribe") return subscribe(req, env);
  if (m === "POST" && p === "/api/push/unsubscribe") return unsubscribe(req, env);
  if (m === "POST" && p === "/api/push/test") return testPush(req, env);
  return null;
}

function checkEndpoint(ep) {
  let u;
  try { u = new URL(String(ep || "")); } catch { bad("endpoint"); }
  if (u.protocol !== "https:" || !PUSH_HOSTS.some(re => re.test(u.hostname)) || u.href.length > 1000) bad("endpoint", "unsupported push service");
  return u.href;
}

async function limitIp(env, req, kind, max) {
  const ipHash = await sha(clientIp(req) + salt(env));
  const row = await env.DB.prepare(
    `INSERT INTO ev_rate (day, ip_hash, n) VALUES (?, ?, 1)
     ON CONFLICT(day, ip_hash) DO UPDATE SET n = n + 1 RETURNING n`).bind(`${kind}:${jstDay()}`, ipHash).first();
  if (row && row.n > max) throw new HttpError(429, "rate", "too many requests");
}

async function subscribe(req, env) {
  const b = await readJson(req);
  const city = String(b.city || "");
  if (!cities(env).includes(city)) bad("city");
  const endpoint = checkEndpoint(b.endpoint);
  const district = String(b.district || "");
  const lang = ["ja", "en", "pt", "easy"].includes(b.lang) ? b.lang : "ja";
  const d = await env.DB.prepare(`SELECT 1 FROM districts WHERE city = ? AND id = ?`).bind(city, district).first();
  if (!d) bad("district");
  await limitIp(env, req, "push", MAX_SUBS_PER_IP_DAY);
  const id = await sha(endpoint), now = Date.now();
  await env.DB.prepare(
    `INSERT INTO push_subs (id, city, district, lang, endpoint, created_at, updated_at, fail_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET city = excluded.city, district = excluded.district, lang = excluded.lang, updated_at = excluded.updated_at, fail_count = 0`
  ).bind(id, city, district, lang, endpoint, now, now).run();
  return json({ ok: true });
}

async function unsubscribe(req, env) {
  const b = await readJson(req);
  const endpoint = checkEndpoint(b.endpoint);
  await env.DB.prepare(`DELETE FROM push_subs WHERE id = ?`).bind(await sha(endpoint)).run();
  return json({ ok: true });
}

// 登録した本人が「テスト通知」を押したとき、その端末にだけすぐ送る
async function testPush(req, env) {
  const b = await readJson(req);
  const endpoint = checkEndpoint(b.endpoint);
  const sub = await env.DB.prepare(`SELECT endpoint FROM push_subs WHERE id = ?`).bind(await sha(endpoint)).first();
  if (!sub) throw new HttpError(404, "not_found", "not subscribed");
  await limitIp(env, req, "pushtest", 5);
  const r = await sendPing(env, sub.endpoint, new Map());
  if (!r.ok) throw new HttpError(502, "push", `push service ${r.status}`);
  return json({ ok: true });
}

// ---------- 定時送信 ----------
export async function runPush(env, now = Date.now()) {
  if (!env.VAPID_PRIVATE_JWK) return { skipped: "no key" };
  const target = jstDay(now + 24 * HOUR);               // 20時(JST)に動く → 翌日の収集
  const run = await env.DB.prepare(`SELECT * FROM push_runs WHERE day = ?`).bind(target).first()
    || { day: target, cursor: "", done: 0, sent: 0, failed: 0 };
  if (run.done) return { done: true };
  const { results: subs } = await env.DB.prepare(
    `SELECT id, city, district, endpoint FROM push_subs WHERE id > ? ORDER BY id LIMIT ?`).bind(run.cursor, BATCH).all();
  const dt = new Date(target + "T00:00:00Z");
  const cache = new Map(), jwts = new Map();
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async s => {
    if (!cache.has(s.city)) cache.set(s.city, new Map((await districtsOf(env, s.city)).map(d => [d.id, d])));
    const d = cache.get(s.city).get(s.district);
    if (!d || !Object.values(d.schedule).some(sc => collectsOn(sc, dt))) return;
    const r = await sendPing(env, s.endpoint, jwts);
    if (r.ok) { sent++; return; }
    failed++;
    // 404/410 は購読が消えている。それ以外は5回続いたら消す
    if (r.status === 404 || r.status === 410) await env.DB.prepare(`DELETE FROM push_subs WHERE id = ?`).bind(s.id).run();
    else await env.DB.prepare(`UPDATE push_subs SET fail_count = fail_count + 1 WHERE id = ?`).bind(s.id).run();
  }));
  const done = subs.length < BATCH ? 1 : 0;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO push_runs (day, cursor, done, sent, failed, updated_at) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET cursor = excluded.cursor, done = excluded.done, sent = sent + ?, failed = failed + ?, updated_at = excluded.updated_at`)
      .bind(target, subs.length ? subs[subs.length - 1].id : run.cursor, done, sent, failed, now, sent, failed),
    env.DB.prepare(`DELETE FROM push_subs WHERE fail_count >= 5`),
    env.DB.prepare(`DELETE FROM push_runs WHERE day < ?`).bind(jstDay(now - 30 * 24 * HOUR)),
  ]);
  return { target, batch: subs.length, sent, failed, done: !!done };
}

// 日付は UTC の器に入れた「JSTの日付」で扱う
function collectsOn(s, dt) {
  if (!s) return false;
  const w = dt.getUTCDay(), nth = Math.floor((dt.getUTCDate() - 1) / 7) + 1;
  if (s.weekly) return s.weekly.includes(w);
  if (s.monthly) return s.monthly.day === w && (s.monthly.weeks || [s.monthly.week]).includes(nth);
  return false;
}

async function sendPing(env, endpoint, jwts) {
  const aud = new URL(endpoint).origin;
  if (!jwts.has(aud)) jwts.set(aud, await vapidJwt(env, aud));
  try {
    const r = await fetch(endpoint, { method: "POST", headers: {
      TTL: String(12 * 3600), Urgency: "normal", "Content-Length": "0",
      Authorization: `vapid t=${jwts.get(aud)}, k=${await publicKey(env)}`,
    } });
    return { ok: r.status >= 200 && r.status < 300, status: r.status };
  } catch { return { ok: false, status: 0 }; }
}

// ---------- VAPID（送信元の署名）----------
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
let _jwk = null, _key = null;
function jwk(env) {
  if (!_jwk) {
    try { _jwk = JSON.parse(String(env.VAPID_PRIVATE_JWK || "")); } catch { _jwk = null; }
    if (!_jwk || !_jwk.x || !_jwk.y || !_jwk.d) throw new HttpError(503, "config", "push not configured");
  }
  return _jwk;
}
async function publicKey(env) {
  const k = jwk(env);
  const raw = new Uint8Array(65); raw[0] = 4; raw.set(fromB64u(k.x), 1); raw.set(fromB64u(k.y), 33);
  return b64u(raw);
}
async function vapidJwt(env, aud) {
  if (!_key) _key = await crypto.subtle.importKey("jwk", { ...jwk(env), key_ops: ["sign"], ext: false }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const data = `${enc({ typ: "JWT", alg: "ES256" })}.${enc({ aud, exp: Math.floor(Date.now() / 1000) + 50 * 60, sub: VAPID_SUB })}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, _key, new TextEncoder().encode(data));
  return `${data}.${b64u(sig)}`;
}
