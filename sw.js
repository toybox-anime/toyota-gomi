// Service Worker — オフライン対応（アプリシェルをキャッシュ）
const CACHE = "gomi-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./config.js",
  "./data.js",
  "./dict.js",
  "./guide.js",
  "./photo.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネット優先→失敗時キャッシュ（データ更新を取りこぼさない。オフラインでも動く）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 外部CDN（TensorFlow.js/モデル等）はSWで扱わず素通し
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
