// ===== リユース掲示板 API（Cloudflare Worker + D1 + KV）=====
// 公開: 一覧/詳細/投稿/受け取り希望/メッセージ/通報/画像
// 管理: 承認待ち一覧/承認/却下（Authorization: Bearer ADMIN_TOKEN）

const CATEGORIES = ["furniture", "appliance", "kids", "clothes", "daily", "hobby", "other"];
const MAX_IMAGE = 2 * 1024 * 1024;
const HOUR = 3600 * 1000;
const LIMIT_POSTS_PER_HOUR = 5;
const LIMIT_MSGS_PER_HOUR = 30;
const IMAGE_TTL_SEC = 60 * 24 * 3600;

class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const bad = (code, msg) => { throw new HttpError(400, code, msg || code); };

export default {
  async fetch(req, env) {
    const cors = corsHeaders(env, req.headers.get("Origin") || "");
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    let res;
    try {
      res = await route(req, env, new URL(req.url));
    } catch (e) {
      if (e instanceof HttpError) res = json({ error: e.code, message: e.message }, e.status);
      else { console.error(e); res = json({ error: "server", message: "internal error" }, 500); }
    }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
};

async function route(req, env, url) {
  const p = url.pathname, m = req.method;
  let r;
  if (m === "GET" && p === "/api/health") return json({ ok: true });
  if (m === "GET" && p === "/api/posts") return listPosts(env, url);
  if (m === "POST" && p === "/api/posts") return createPost(req, env);
  if ((r = p.match(/^\/api\/posts\/([\w-]{8,64})$/)) && m === "GET") return getPost(env, url, r[1]);
  if ((r = p.match(/^\/api\/posts\/([\w-]{8,64})\/owner$/)) && m === "GET") return ownerView(req, env, url, r[1]);
  if ((r = p.match(/^\/api\/posts\/([\w-]{8,64})\/close$/)) && m === "POST") return closePost(req, env, r[1]);
  if ((r = p.match(/^\/api\/posts\/([\w-]{8,64})\/report$/)) && m === "POST") return reportPost(req, env, r[1]);
  if ((r = p.match(/^\/api\/posts\/([\w-]{8,64})\/threads$/)) && m === "POST") return createThread(req, env, r[1]);
  if ((r = p.match(/^\/api\/threads\/([\w-]{8,64})$/)) && m === "GET") return getThread(req, env, r[1]);
  if ((r = p.match(/^\/api\/threads\/([\w-]{8,64})\/messages$/)) && m === "POST") return postMessage(req, env, r[1]);
  if ((r = p.match(/^\/img\/([\w-]{8,64}\.(?:jpg|png|webp))$/)) && m === "GET") return serveImage(env, r[1]);
  if (p.startsWith("/api/admin/")) return admin(req, env, url);
  throw new HttpError(404, "not_found", "not found");
}

// ---------- 公開API ----------
async function listPosts(env, url) {
  const city = url.searchParams.get("city") || "";
  if (!cities(env).includes(city)) bad("city");
  const { results } = await env.DB.prepare(
    `SELECT id, city, area, category, title, body, handover, image_key, created_at, expires_at
       FROM posts WHERE city = ? AND status = 'approved' AND expires_at > ?
      ORDER BY created_at DESC LIMIT 100`
  ).bind(city, Date.now()).all();
  return json({ posts: results.map(x => publicPost(x, url)) });
}

async function getPost(env, url, id) {
  const x = await env.DB.prepare(
    `SELECT id, city, area, category, title, body, handover, image_key, created_at, expires_at
       FROM posts WHERE id = ? AND status = 'approved' AND expires_at > ?`
  ).bind(id, Date.now()).first();
  if (!x) throw new HttpError(404, "not_found", "post not found");
  return json({ post: publicPost(x, url) });
}

async function createPost(req, env) {
  const fd = await req.formData();
  const ip = clientIp(req);
  await verifyTurnstile(env, fd.get("turnstile"), ip);

  const city = text(fd.get("city"), 1, 20, "city");
  if (!cities(env).includes(city)) bad("city");
  const category = text(fd.get("category"), 1, 20, "category");
  if (!CATEGORIES.includes(category)) bad("category");
  const area = text(fd.get("area"), 1, 60, "area");
  const title = text(fd.get("title"), 1, 40, "title");
  const body = text(fd.get("body"), 1, 500, "body");
  const handover = text(fd.get("handover") || "", 0, 100, "handover");
  checkPublicText([title, body, handover]);

  const ipHash = await sha(ip + salt(env));
  const now = Date.now();
  const recent = await env.DB.prepare(`SELECT COUNT(*) AS c FROM posts WHERE ip_hash = ? AND created_at > ?`)
    .bind(ipHash, now - HOUR).first();
  if (recent.c >= LIMIT_POSTS_PER_HOUR) throw new HttpError(429, "rate", "too many posts");

  let imageKey = null;
  const f = fd.get("image");
  if (f && typeof f === "object" && f.size > 0) {
    if (f.size > MAX_IMAGE) throw new HttpError(413, "image_size", "image too large");
    const buf = await f.arrayBuffer();
    const kind = sniffImage(new Uint8Array(buf));
    if (!kind) bad("image_type", "unsupported image");
    imageKey = `${crypto.randomUUID()}.${kind.ext}`;
    // 写真は60日で自動削除（公開は承認から14日なので十分な余裕）
    await env.IMAGES.put(imageKey, buf, { metadata: { contentType: kind.type }, expirationTtl: IMAGE_TTL_SEC });
  }

  const id = crypto.randomUUID();
  const ownerToken = token();
  await env.DB.prepare(
    `INSERT INTO posts (id, city, area, category, title, body, handover, image_key, status, owner_hash, ip_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
  ).bind(id, city, area, category, title, body, handover, imageKey, await sha(ownerToken), ipHash, now, now + ttl(env)).run();
  return json({ id, ownerToken, status: "pending" }, 201);
}

async function ownerView(req, env, url, id) {
  const post = await env.DB.prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first();
  await requireToken(req, post && post.owner_hash);
  const { results: threads } = await env.DB.prepare(
    `SELECT id, created_at FROM threads WHERE post_id = ? ORDER BY created_at`).bind(id).all();
  const msgs = threads.length ? (await env.DB.prepare(
    `SELECT thread_id, sender, body, created_at FROM messages
      WHERE thread_id IN (${threads.map(() => "?").join(",")}) ORDER BY created_at`
  ).bind(...threads.map(t => t.id)).all()).results : [];
  return json({
    post: { ...publicPost(post, url), status: post.status, expired: post.expires_at <= Date.now() },
    threads: threads.map(t => ({ id: t.id, created_at: t.created_at,
      messages: msgs.filter(mm => mm.thread_id === t.id).map(({ sender, body, created_at }) => ({ sender, body, created_at })) })),
  });
}

async function closePost(req, env, id) {
  const post = await env.DB.prepare(`SELECT owner_hash, status FROM posts WHERE id = ?`).bind(id).first();
  await requireToken(req, post && post.owner_hash);
  if (!["approved", "pending"].includes(post.status)) bad("state", "post cannot be closed");
  await env.DB.prepare(`UPDATE posts SET status = 'closed' WHERE id = ?`).bind(id).run();
  return json({ ok: true, status: "closed" });
}

async function reportPost(req, env, id) {
  const { reason = "" } = await readJson(req);
  const post = await env.DB.prepare(`SELECT status FROM posts WHERE id = ?`).bind(id).first();
  if (!post) throw new HttpError(404, "not_found", "post not found");
  const ipHash = await sha(clientIp(req) + salt(env));
  await env.DB.prepare(`INSERT OR IGNORE INTO reports (id, post_id, ip_hash, reason, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, ipHash, String(reason).slice(0, 200), Date.now()).run();
  const { c } = await env.DB.prepare(`SELECT COUNT(*) AS c FROM reports WHERE post_id = ?`).bind(id).first();
  const hide = c >= Number(env.REPORT_HIDE_THRESHOLD || 3) && post.status === "approved";
  // 通報が閾値に達したら承認待ちに戻して非公開（職員が再確認）
  await env.DB.prepare(`UPDATE posts SET report_count = ?${hide ? ", status = 'pending'" : ""} WHERE id = ?`).bind(c, id).run();
  return json({ ok: true });
}

async function createThread(req, env, postId) {
  const { message, turnstile } = await readJson(req);
  const ip = clientIp(req);
  await verifyTurnstile(env, turnstile, ip);
  const post = await env.DB.prepare(`SELECT status, expires_at FROM posts WHERE id = ?`).bind(postId).first();
  if (!post || post.status !== "approved" || post.expires_at <= Date.now()) throw new HttpError(404, "not_found", "post not available");
  const body = text(message, 1, 500, "message");
  const ipHash = await rateMessages(env, ip);
  const threadId = crypto.randomUUID(), requesterToken = token(), now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO threads (id, post_id, requester_hash, created_at) VALUES (?, ?, ?, ?)`)
      .bind(threadId, postId, await sha(requesterToken), now),
    env.DB.prepare(`INSERT INTO messages (id, thread_id, sender, body, ip_hash, created_at) VALUES (?, ?, 'requester', ?, ?, ?)`)
      .bind(crypto.randomUUID(), threadId, body, ipHash, now),
  ]);
  return json({ threadId, requesterToken }, 201);
}

async function getThread(req, env, threadId) {
  const { thread, post, role } = await threadAuth(req, env, threadId);
  const { results } = await env.DB.prepare(
    `SELECT sender, body, created_at FROM messages WHERE thread_id = ? ORDER BY created_at`).bind(thread.id).all();
  return json({ role, post: { id: post.id, title: post.title, area: post.area, status: post.status }, messages: results });
}

async function postMessage(req, env, threadId) {
  const { message } = await readJson(req);
  const { thread, post, role } = await threadAuth(req, env, threadId);
  if (!["approved", "closed"].includes(post.status)) bad("state", "post not active");
  const body = text(message, 1, 500, "message");
  const ipHash = await rateMessages(env, clientIp(req));
  await env.DB.prepare(`INSERT INTO messages (id, thread_id, sender, body, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), thread.id, role, body, ipHash, Date.now()).run();
  return json({ ok: true }, 201);
}

async function serveImage(env, key) {
  const { value, metadata } = await env.IMAGES.getWithMetadata(key, { type: "arrayBuffer" });
  if (!value) throw new HttpError(404, "not_found", "image not found");
  return new Response(value, { headers: {
    "Content-Type": (metadata && metadata.contentType) || "application/octet-stream",
    // 却下した写真が長く残らないよう、ブラウザのキャッシュは1時間まで
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  } });
}

// ---------- 管理API ----------
async function admin(req, env, url) {
  const adminToken = String(env.ADMIN_TOKEN || "").trim();
  if (!adminToken) throw new HttpError(500, "config", "admin not configured");
  const auth = (req.headers.get("Authorization") || "").trim();
  if (auth !== `Bearer ${adminToken}`) throw new HttpError(401, "auth", "unauthorized");
  const p = url.pathname;
  let r;
  if (req.method === "GET" && p === "/api/admin/posts") {
    const status = url.searchParams.get("status") || "pending";
    const where = status === "reported" ? "report_count > 0" : "status = ?";
    const stmt = env.DB.prepare(
      `SELECT * FROM posts WHERE ${where} ORDER BY created_at DESC LIMIT 200`);
    const { results } = await (status === "reported" ? stmt : stmt.bind(status)).all();
    const ids = results.map(x => x.id);
    const reps = ids.length ? (await env.DB.prepare(
      `SELECT post_id, reason, created_at FROM reports WHERE post_id IN (${ids.map(() => "?").join(",")})`
    ).bind(...ids).all()).results : [];
    return json({ posts: results.map(x => ({
      ...publicPost(x, url), status: x.status, report_count: x.report_count,
      reports: reps.filter(rr => rr.post_id === x.id).map(rr => rr.reason),
    })) });
  }
  if ((r = p.match(/^\/api\/admin\/posts\/([\w-]{8,64})\/(approve|reject)$/)) && req.method === "POST") {
    const post = await env.DB.prepare(`SELECT image_key FROM posts WHERE id = ?`).bind(r[1]).first();
    if (!post) throw new HttpError(404, "not_found", "post not found");
    if (r[2] === "approve") {
      // 公開期間は承認時点から数える
      await env.DB.prepare(`UPDATE posts SET status = 'approved', expires_at = ? WHERE id = ?`)
        .bind(Date.now() + ttl(env), r[1]).run();
    } else {
      await env.DB.prepare(`UPDATE posts SET status = 'rejected' WHERE id = ?`).bind(r[1]).run();
      if (post.image_key) await env.IMAGES.delete(post.image_key);
    }
    return json({ ok: true, status: r[2] === "approve" ? "approved" : "rejected" });
  }
  throw new HttpError(404, "not_found", "not found");
}

// ---------- 共通 ----------
function publicPost(x, url) {
  return { id: x.id, city: x.city, area: x.area, category: x.category, title: x.title, body: x.body,
    handover: x.handover, image: x.image_key ? `${url.origin}/img/${x.image_key}` : null,
    created_at: x.created_at, expires_at: x.expires_at };
}

async function threadAuth(req, env, threadId) {
  const tok = req.headers.get("X-Token") || "";
  const thread = await env.DB.prepare(`SELECT * FROM threads WHERE id = ?`).bind(threadId).first();
  if (!thread || !tok) throw new HttpError(403, "auth", "forbidden");
  const post = await env.DB.prepare(`SELECT id, title, area, status, owner_hash FROM posts WHERE id = ?`).bind(thread.post_id).first();
  const h = await sha(tok);
  const role = post && h === post.owner_hash ? "owner" : h === thread.requester_hash ? "requester" : null;
  if (!role) throw new HttpError(403, "auth", "forbidden");
  return { thread, post, role };
}

async function requireToken(req, hash) {
  const tok = req.headers.get("X-Token") || "";
  if (!hash || !tok || (await sha(tok)) !== hash) throw new HttpError(403, "auth", "forbidden");
}

async function rateMessages(env, ip) {
  const ipHash = await sha(ip + salt(env));
  const { c } = await env.DB.prepare(`SELECT COUNT(*) AS c FROM messages WHERE ip_hash = ? AND created_at > ?`)
    .bind(ipHash, Date.now() - HOUR).first();
  if (c >= LIMIT_MSGS_PER_HOUR) throw new HttpError(429, "rate", "too many messages");
  return ipHash;
}

async function verifyTurnstile(env, tokenValue, ip) {
  if (env.DEV_SKIP_TURNSTILE === "1") return;
  const secret = String(env.TURNSTILE_SECRET || "").trim();
  if (!secret) throw new HttpError(500, "config", "turnstile not configured");
  if (!tokenValue) throw new HttpError(400, "turnstile", "bot check required");
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: String(tokenValue), remoteip: ip }),
  });
  const d = await r.json();
  if (!d.success) throw new HttpError(403, "turnstile", "bot check failed");
}

// 公開される投稿本文に、連絡先・URL・価格を書かせない（無償譲渡＆個人情報保護）
function checkPublicText(parts) {
  const s = parts.join("\n").normalize("NFKC");
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(s)) bad("pii", "email not allowed");
  if (/https?:\/\/|www\./i.test(s)) bad("pii", "url not allowed");
  if (/(?:^|[^\d])0\d{1,4}[-\s(]?\d{1,4}[-\s)]?\d{3,4}(?!\d)/.test(s) || /\+81/.test(s)) bad("pii", "phone not allowed");
  if (/line\s*id|ライン\s*id/i.test(s)) bad("pii", "contact id not allowed");
  if (/(?:^|[^\d])[1-9][\d,]*\s*(?:円|yen)|¥\s*[1-9]/i.test(s)) bad("price", "free items only");
}

function text(v, min, max, field) {
  const s = String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  const n = [...s].length;
  if (n < min || n > max) bad("length", `${field} must be ${min}-${max} chars`);
  return s;
}

function sniffImage(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: "webp", type: "image/webp" };
  return null;
}

async function readJson(req) {
  try { return await req.json(); } catch { bad("json", "invalid json"); }
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
function corsHeaders(env, origin) {
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const h = { "Vary": "Origin" };
  if (allowed.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type, X-Token, Authorization";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}
const cities = env => String(env.ALLOWED_CITIES || "").split(",").map(s => s.trim());
const ttl = env => Number(env.POST_TTL_DAYS || 14) * 24 * HOUR;
const salt = env => String(env.IP_SALT || "gomi-reuse").trim();
const clientIp = req => req.headers.get("CF-Connecting-IP") || "0.0.0.0";
function token() {
  const b = new Uint8Array(24); crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function sha(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("");
}
