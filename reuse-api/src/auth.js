// ===== 職員ログイン =====
// パスワードは使わない。職員ごとに長いランダムの「ログイン用のカギ」を発行し、ハッシュだけ保存する。
//   1) 管理者が職員を登録 → 招待URL（72時間・1回限り）を本人に渡す
//   2) 本人が招待URLを開く → カギが1回だけ表示される（ブラウザのパスワード保存に入れる）
//   3) ログインID＋カギでログイン → 12時間のセッション
// ADMIN_TOKEN（システム管理者＝運営者）は全市を扱える。
import { HttpError, bad, json, readJson, text, sha, token, clientIp, salt, cities, sameString, HOUR } from "./util.js";

const SESSION_TTL = 12 * HOUR;
const INVITE_TTL = 72 * HOUR;
const LOGIN_FAIL_LIMIT = 10;              // 1回線あたり1時間に失敗10回まで
const ROLES = ["editor", "admin"];        // editor=収集日の編集 / admin=＋市の設定・職員管理・削除
const LOGIN_ID = /^[a-z0-9._-]{3,32}$/;

// 誰がアクセスしているか（未ログインは null）
export async function principal(req, env) {
  const m = (req.headers.get("Authorization") || "").match(/^Bearer\s+(\S+)$/);
  if (!m) return null;
  const adminToken = String(env.ADMIN_TOKEN || "").trim();
  if (adminToken && sameString(m[1], adminToken)) {
    return { id: "super", super: true, role: "admin", city: "*", name: "システム管理者", login_id: "super" };
  }
  const row = await env.DB.prepare(
    `SELECT s.id, s.city, s.role, s.name, s.login_id FROM sessions x JOIN staff s ON s.id = x.staff_id
      WHERE x.token_hash = ? AND x.expires_at > ? AND s.disabled = 0`
  ).bind(await sha(m[1]), Date.now()).first();
  return row ? { ...row, super: false } : null;
}

// 権限チェック。city を渡すとその市の職員（またはシステム管理者）だけ通す
export async function requireStaff(req, env, { city, role = "editor" } = {}) {
  const who = await principal(req, env);
  if (!who) throw new HttpError(401, "auth", "login required");
  if (city && !who.super && who.city !== city) throw new HttpError(403, "forbidden", "other city");
  if (ROLES.indexOf(who.role) < ROLES.indexOf(role)) throw new HttpError(403, "forbidden", "role");
  return who;
}

export async function audit(env, who, city, action, target, detail) {
  let d = JSON.stringify(detail ?? null);
  if (d.length > 4000) d = d.slice(0, 4000);
  await env.DB.prepare(`INSERT INTO audit (id, city, staff_id, staff_name, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), city, who.id, who.name, action, String(target || ""), d, Date.now()).run();
}

export async function authRoutes(req, env, url) {
  const p = url.pathname, m = req.method;
  let r;
  if (m === "POST" && p === "/api/auth/login") return login(req, env);
  if (m === "POST" && p === "/api/auth/logout") return logout(req, env);
  if (m === "POST" && p === "/api/auth/invite") return acceptInvite(req, env);
  if (m === "GET" && p === "/api/staff/me") {
    const who = await requireStaff(req, env);
    return json({ me: { login_id: who.login_id, name: who.name, role: who.role, city: who.city, super: who.super },
      cities: who.super ? cities(env) : [who.city] });
  }
  if (m === "GET" && p === "/api/staff/users") return listUsers(req, env, url);
  if (m === "POST" && p === "/api/staff/users") return createUser(req, env);
  if ((r = p.match(/^\/api\/staff\/users\/([\w-]{8,64})\/(invite|disable|enable)$/)) && m === "POST") return userAction(req, env, r[1], r[2]);
  return null;
}

async function login(req, env) {
  const ipHash = await sha(clientIp(req) + salt(env));
  const now = Date.now();
  const { c } = await env.DB.prepare(`SELECT COUNT(*) AS c FROM auth_fail WHERE ip_hash = ? AND created_at > ?`).bind(ipHash, now - HOUR).first();
  if (c >= LOGIN_FAIL_LIMIT) throw new HttpError(429, "rate", "too many attempts");
  const b = await readJson(req);
  const loginId = String(b.login_id || "").trim().toLowerCase();
  const key = String(b.key || "").trim();
  const st = LOGIN_ID.test(loginId) && key.length >= 20
    ? await env.DB.prepare(`SELECT * FROM staff WHERE login_id = ? AND disabled = 0`).bind(loginId).first() : null;
  if (!st || !st.key_hash || !sameString(await sha(key), st.key_hash)) {
    await env.DB.prepare(`INSERT INTO auth_fail (ip_hash, created_at) VALUES (?, ?)`).bind(ipHash, now).run();
    throw new HttpError(401, "auth", "invalid login");
  }
  const tok = token(32);
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO sessions (token_hash, staff_id, created_at, expires_at) VALUES (?, ?, ?, ?)`).bind(await sha(tok), st.id, now, now + SESSION_TTL),
    env.DB.prepare(`UPDATE staff SET last_login = ? WHERE id = ?`).bind(now, st.id),
    env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(now),
    env.DB.prepare(`DELETE FROM auth_fail WHERE created_at < ?`).bind(now - 24 * HOUR),
  ]);
  return json({ token: tok, expires_at: now + SESSION_TTL, me: { login_id: st.login_id, name: st.name, role: st.role, city: st.city, super: false } });
}

async function logout(req, env) {
  const m = (req.headers.get("Authorization") || "").match(/^Bearer\s+(\S+)$/);
  if (m) await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha(m[1])).run();
  return json({ ok: true });
}

// 招待URLを開いた本人に、ログイン用のカギを1回だけ渡す
async function acceptInvite(req, env) {
  const { invite } = await readJson(req);
  const inv = String(invite || "");
  if (!/^[0-9a-f]{32,128}$/.test(inv)) bad("invite");
  const st = await env.DB.prepare(`SELECT * FROM staff WHERE invite_hash = ? AND invite_expires > ? AND disabled = 0`)
    .bind(await sha(inv), Date.now()).first();
  if (!st) throw new HttpError(404, "invite", "invite expired or used");
  const key = token(24);
  await env.DB.prepare(`UPDATE staff SET key_hash = ?, invite_hash = NULL, invite_expires = NULL WHERE id = ?`).bind(await sha(key), st.id).run();
  await env.DB.prepare(`DELETE FROM sessions WHERE staff_id = ?`).bind(st.id).run();
  await audit(env, { id: st.id, name: st.name }, st.city, "staff.activate", st.login_id, null);
  return json({ login_id: st.login_id, name: st.name, city: st.city, key });
}

async function listUsers(req, env, url) {
  const city = url.searchParams.get("city") || "";
  const who = await requireStaff(req, env, { city, role: "admin" });
  if (!cities(env).includes(city)) bad("city");
  const { results } = await env.DB.prepare(
    `SELECT id, login_id, name, role, disabled, created_at, last_login, key_hash IS NOT NULL AS active, invite_expires
       FROM staff WHERE city = ? ORDER BY created_at`).bind(city).all();
  return json({ users: results.map(u => ({ ...u, active: !!u.active, disabled: !!u.disabled, invited: !!u.invite_expires && u.invite_expires > Date.now() })), viewer: who.login_id });
}

async function createUser(req, env) {
  const b = await readJson(req);
  const city = String(b.city || "");
  const who = await requireStaff(req, env, { city, role: "admin" });
  if (!cities(env).includes(city)) bad("city");
  const loginId = String(b.login_id || "").trim().toLowerCase();
  if (!LOGIN_ID.test(loginId)) bad("login_id", "login_id: a-z 0-9 . _ - 3-32 chars");
  const role = ROLES.includes(b.role) ? b.role : "editor";
  const name = text(b.name, 1, 40, "name");
  const exists = await env.DB.prepare(`SELECT 1 FROM staff WHERE login_id = ?`).bind(loginId).first();
  if (exists) throw new HttpError(409, "exists", "login_id already used");
  const invite = token(24), id = crypto.randomUUID(), now = Date.now();
  await env.DB.prepare(
    `INSERT INTO staff (id, city, login_id, name, role, invite_hash, invite_expires, disabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).bind(id, city, loginId, name, role, await sha(invite), now + INVITE_TTL, now).run();
  await audit(env, who, city, "staff.create", loginId, { name, role });
  return json({ id, login_id: loginId, invite, invite_expires: now + INVITE_TTL }, 201);
}

async function userAction(req, env, id, action) {
  const st = await env.DB.prepare(`SELECT * FROM staff WHERE id = ?`).bind(id).first();
  if (!st) throw new HttpError(404, "not_found", "staff not found");
  const who = await requireStaff(req, env, { city: st.city, role: "admin" });
  if (!who.super && who.id === st.id && action === "disable") bad("self", "cannot disable yourself");
  if (action === "invite") {
    // 再招待：今のカギは無効になり、新しい招待URLで作り直す（カギをなくしたとき）
    const invite = token(24), exp = Date.now() + INVITE_TTL;
    await env.DB.batch([
      env.DB.prepare(`UPDATE staff SET key_hash = NULL, invite_hash = ?, invite_expires = ? WHERE id = ?`).bind(await sha(invite), exp, id),
      env.DB.prepare(`DELETE FROM sessions WHERE staff_id = ?`).bind(id),
    ]);
    await audit(env, who, st.city, "staff.reinvite", st.login_id, null);
    return json({ invite, invite_expires: exp });
  }
  const off = action === "disable" ? 1 : 0;
  await env.DB.batch([
    env.DB.prepare(`UPDATE staff SET disabled = ? WHERE id = ?`).bind(off, id),
    env.DB.prepare(`DELETE FROM sessions WHERE staff_id = ?`).bind(id),
  ]);
  await audit(env, who, st.city, off ? "staff.disable" : "staff.enable", st.login_id, null);
  return json({ ok: true });
}
