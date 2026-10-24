// Service Worker — オフライン対応（アプリシェルをキャッシュ）＋前日通知の表示
const CACHE = "gomi-v13";
const ASSETS = [
  "./",
  "./index.html",
  "./config.js",
  "./data.js",
  "./dict.js",
  "./guide.js",
  "./photo.js",
  "./icons.js",
  "./citydata.js",
  "./reuse.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];
// 通知に使う設定（地区の収集日など）。アプリ更新で消さない
const SETTINGS = "gomi-settings";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("gomi-v") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネット優先→失敗時キャッシュ（データ更新を取りこぼさない。オフラインでも動く）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 外部（API・TensorFlow.js等）はSWで扱わず素通し
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

// ===== 前日20時の通知 =====
// サーバーからは中身の無い合図だけが届く。文は端末に保存した「地区の収集日」から作る。
function collectsOn(s, d) {
  if (!s) return false;
  const w = d.getDay(), nth = Math.floor((d.getDate() - 1) / 7) + 1;
  if (s.weekly) return s.weekly.includes(w);
  if (s.monthly) return s.monthly.day === w && (s.monthly.weeks || [s.monthly.week]).includes(nth);
  return false;
}
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let title = "ごみ収集日ガイド", body = "", url = "./";
    try {
      const c = await caches.open(SETTINGS);
      const r = await c.match(new URL("./__notify", self.registration.scope).href);
      if (r) {
        const s = await r.json();
        const t = new Date(); t.setDate(t.getDate() + 1);
        const ks = Object.keys(s.schedule || {}).filter(k => collectsOn(s.schedule[k], t));
        title = s.title || title; url = s.url || url;
        body = ks.length ? String(s.msg).replace("{c}", ks.map(k => s.cats[k] || k).join("・")) : (s.none || "");
      }
    } catch (_) {}
    await self.registration.showNotification(title, {
      body, icon: "icon-192.png", badge: "icon-192.png", tag: "gomi-tomorrow", renotify: true, data: { url },
    });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope) && "focus" in w) return w.focus();
    return clients.openWindow(url);
  }));
});
