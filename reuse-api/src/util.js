// ===== 共通の小道具（全APIで使う）=====
export const HOUR = 3600 * 1000;

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const bad = (code, msg) => { throw new HttpError(400, code, msg || code); };

export async function readJson(req) {
  try { return await req.json(); } catch { bad("json", "invalid json"); }
}
export function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}

// 制御文字を除き、文字数を検査した文字列を返す
export function text(v, min, max, field) {
  const s = String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  const n = [...s].length;
  if (n < min || n > max) bad("length", `${field} must be ${min}-${max} chars`);
  return s;
}

export function corsHeaders(env, origin) {
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const h = { "Vary": "Origin" };
  if (allowed.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type, X-Token, Authorization, If-None-Match";
    h["Access-Control-Expose-Headers"] = "ETag";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

export const cities = env => String(env.ALLOWED_CITIES || "").split(",").map(s => s.trim()).filter(Boolean);
export const salt = env => String(env.IP_SALT || "gomi-reuse").trim();
export const clientIp = req => req.headers.get("CF-Connecting-IP") || "0.0.0.0";
export const jstDay = (t = Date.now()) => new Date(t + 9 * HOUR).toISOString().slice(0, 10);

export function token(bytes = 24) {
  const b = new Uint8Array(bytes); crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}
export async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("");
}
// 文字列の比較で所要時間から中身を推測されないようにする
export function sameString(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
