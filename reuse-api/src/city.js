// ===== 市のデータ（設定・区分・自治区と収集日）=====
// 公開: GET /api/city/:id … アプリが起動時に読む（ETag付き。編集すると version が上がる）
// 職員: 市の設定・自治区の追加/編集/削除・変更履歴
import { HttpError, bad, json, readJson, text, cities } from "./util.js";
import { requireStaff, audit } from "./auth.js";

// 職員が画面から変えられる設定（それ以外の設定は配布物の config.js 側で固定）
const CONFIG_FIELDS = {
  cityName: s => text(s, 1, 40, "cityName"),
  cityShort: s => text(s, 1, 20, "cityShort"),
  brandColor: s => color(s),
  brandColorDark: s => color(s),
  logo: s => urlOrEmpty(s),
  officialUrl: s => urlOrEmpty(s),
  dictUrl: s => urlOrEmpty(s),
  dataUpdated: s => text(s, 0, 20, "dataUpdated"),
  collectTime: s => { const v = String(s || ""); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) bad("collectTime", "HH:MM"); return v; },
  sodaiUrl: s => urlOrEmpty(s),
  sodaiPhone: s => { const v = String(s || "").trim(); if (v && !/^[0-9+\-() ]{6,20}$/.test(v)) bad("sodaiPhone"); return v; },
  sodaiNote: s => text(s, 0, 200, "sodaiNote"),
};
function color(s) { const v = String(s || ""); if (!/^#[0-9a-fA-F]{6}$/.test(v)) bad("color", "#rrggbb"); return v.toLowerCase(); }
function urlOrEmpty(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  if (v.length > 300) bad("url");
  try { const u = new URL(v); if (u.protocol !== "https:") bad("url", "https only"); } catch (e) { if (e instanceof HttpError) throw e; bad("url"); }
  return v;
}

// 収集日の書式を厳密に検査する
//   毎週: {weekly:[0..6]}  第n曜: {monthly:{week:n, day}} / {monthly:{weeks:[n,m], day}}  文言だけ: {text}
export function validSchedule(s, catKeys) {
  if (!s || typeof s !== "object" || Array.isArray(s)) bad("schedule");
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (!catKeys.includes(k)) bad("schedule", `unknown category ${k}`);
    if (!v || typeof v !== "object") bad("schedule");
    const e = {};
    const ints = (a, lo, hi) => Array.isArray(a) && a.length && a.length <= 7 && a.every(x => Number.isInteger(x) && x >= lo && x <= hi) && new Set(a).size === a.length;
    if (v.weekly != null) {
      if (!ints(v.weekly, 0, 6)) bad("schedule", `${k}: weekly`);
      e.weekly = [...v.weekly].sort((a, b) => a - b);
    } else if (v.monthly != null) {
      const mo = v.monthly, weeks = mo.weeks != null ? mo.weeks : [mo.week];
      if (!ints(weeks, 1, 5) || !Number.isInteger(mo.day) || mo.day < 0 || mo.day > 6) bad("schedule", `${k}: monthly`);
      const ws = [...weeks].sort((a, b) => a - b);
      e.monthly = ws.length === 1 ? { week: ws[0], day: mo.day } : { weeks: ws, day: mo.day };
    }
    if (v.text != null && String(v.text).trim()) e.text = text(v.text, 1, 100, `${k}.text`);
    if (e.weekly || e.monthly || e.text) out[k] = e;
  }
  return out;
}

async function loadCity(env, id) {
  if (!cities(env).includes(id)) throw new HttpError(404, "not_found", "city not found");
  const c = await env.DB.prepare(`SELECT id, config, categories, version, updated_at FROM cities WHERE id = ?`).bind(id).first();
  if (!c) throw new HttpError(404, "not_found", "city not found");
  return { ...c, config: JSON.parse(c.config), categories: JSON.parse(c.categories) };
}

async function districtsOf(env, id) {
  const { results } = await env.DB.prepare(
    `SELECT id, area, name, schedule, verified FROM districts WHERE city = ? ORDER BY sort, rowid`).bind(id).all();
  return results.map(r => ({ id: r.id, area: r.area, name: r.name, verified: !!r.verified, schedule: JSON.parse(r.schedule) }));
}

export async function cityRoutes(req, env, url) {
  const p = url.pathname, m = req.method;
  let r;
  if ((r = p.match(/^\/api\/city\/([a-z0-9-]{2,20})$/)) && m === "GET") return publicPack(req, env, r[1]);
  if ((r = p.match(/^\/api\/staff\/city\/([a-z0-9-]{2,20})\/config$/)) && m === "PUT") return putConfig(req, env, r[1]);
  if ((r = p.match(/^\/api\/staff\/city\/([a-z0-9-]{2,20})\/districts$/)) && m === "POST") return addDistrict(req, env, r[1]);
  if ((r = p.match(/^\/api\/staff\/city\/([a-z0-9-]{2,20})\/districts\/([\w-]{1,40})$/)) && m === "PUT") return putDistrict(req, env, r[1], r[2]);
  if ((r = p.match(/^\/api\/staff\/city\/([a-z0-9-]{2,20})\/districts\/([\w-]{1,40})$/)) && m === "DELETE") return delDistrict(req, env, r[1], r[2]);
  if ((r = p.match(/^\/api\/staff\/city\/([a-z0-9-]{2,20})\/audit$/)) && m === "GET") return listAudit(req, env, r[1], url);
  return null;
}

async function publicPack(req, env, id) {
  const c = await loadCity(env, id);
  const etag = `"${id}-${c.version}"`;
  const headers = { ETag: etag, "Cache-Control": "public, max-age=60" };
  if (req.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  return json({ id, version: c.version, updated_at: c.updated_at, config: c.config, categories: c.categories,
    districts: await districtsOf(env, id) }, 200, headers);
}

const bump = (env, id) => env.DB.prepare(`UPDATE cities SET version = version + 1, updated_at = ? WHERE id = ?`).bind(Date.now(), id);

async function putConfig(req, env, id) {
  const who = await requireStaff(req, env, { city: id, role: "admin" });
  const c = await loadCity(env, id);
  const b = await readJson(req);
  const next = { ...c.config }, changed = {};
  for (const [k, f] of Object.entries(CONFIG_FIELDS)) {
    if (b[k] === undefined) continue;
    const v = f(b[k]);
    if (v !== c.config[k]) { changed[k] = [c.config[k] ?? "", v]; next[k] = v; }
  }
  if (!Object.keys(changed).length) return json({ ok: true, version: c.version, changed: 0 });
  await env.DB.batch([
    env.DB.prepare(`UPDATE cities SET config = ? WHERE id = ?`).bind(JSON.stringify(next), id),
    bump(env, id),
  ]);
  await audit(env, who, id, "config.update", "", changed);
  return json({ ok: true, version: c.version + 1, changed: Object.keys(changed).length });
}

function districtBody(b, catKeys) {
  return {
    area: text(b.area, 1, 30, "area"),
    name: text(b.name, 1, 40, "name"),
    schedule: validSchedule(b.schedule || {}, catKeys),
    verified: b.verified === false ? 0 : 1,
  };
}

async function addDistrict(req, env, id) {
  const who = await requireStaff(req, env, { city: id });
  const c = await loadCity(env, id);
  const d = districtBody(await readJson(req), Object.keys(c.categories));
  const did = "n" + crypto.randomUUID().slice(0, 8);
  const { mx } = await env.DB.prepare(`SELECT COALESCE(MAX(sort), 0) AS mx FROM districts WHERE city = ?`).bind(id).first();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO districts (city, id, area, name, schedule, verified, sort, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, did, d.area, d.name, JSON.stringify(d.schedule), d.verified, mx + 1, Date.now()),
    bump(env, id),
  ]);
  await audit(env, who, id, "district.add", did, { area: d.area, name: d.name, schedule: d.schedule });
  return json({ ok: true, id: did }, 201);
}

async function putDistrict(req, env, id, did) {
  const who = await requireStaff(req, env, { city: id });
  const c = await loadCity(env, id);
  const old = await env.DB.prepare(`SELECT area, name, schedule, verified FROM districts WHERE city = ? AND id = ?`).bind(id, did).first();
  if (!old) throw new HttpError(404, "not_found", "district not found");
  const d = districtBody(await readJson(req), Object.keys(c.categories));
  const before = { area: old.area, name: old.name, schedule: JSON.parse(old.schedule), verified: !!old.verified };
  const after = { area: d.area, name: d.name, schedule: d.schedule, verified: !!d.verified };
  if (JSON.stringify(before) === JSON.stringify(after)) return json({ ok: true, changed: 0 });
  await env.DB.batch([
    env.DB.prepare(`UPDATE districts SET area = ?, name = ?, schedule = ?, verified = ?, updated_at = ? WHERE city = ? AND id = ?`)
      .bind(d.area, d.name, JSON.stringify(d.schedule), d.verified, Date.now(), id, did),
    bump(env, id),
  ]);
  await audit(env, who, id, "district.update", did, { before, after });
  return json({ ok: true, changed: 1 });
}

async function delDistrict(req, env, id, did) {
  const who = await requireStaff(req, env, { city: id, role: "admin" });
  const old = await env.DB.prepare(`SELECT area, name, schedule FROM districts WHERE city = ? AND id = ?`).bind(id, did).first();
  if (!old) throw new HttpError(404, "not_found", "district not found");
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM districts WHERE city = ? AND id = ?`).bind(id, did),
    bump(env, id),
  ]);
  await audit(env, who, id, "district.delete", did, { area: old.area, name: old.name, schedule: JSON.parse(old.schedule) });
  return json({ ok: true });
}

async function listAudit(req, env, id, url) {
  await requireStaff(req, env, { city: id });
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit"), 10) || 50, 1), 200);
  const { results } = await env.DB.prepare(
    `SELECT staff_name, action, target, detail, created_at FROM audit WHERE city = ? ORDER BY created_at DESC LIMIT ?`).bind(id, limit).all();
  return json({ audit: results.map(a => ({ ...a, detail: JSON.parse(a.detail || "null") })) });
}

// 通知の送信判定で使う
export { loadCity, districtsOf };
