// public/sw.js — WiFi Pay Next PWA Service Worker
const CACHE = "wifipay-next-v1";
const ASSETS = ["/", "/dashboard", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Bypass Firebase & CDN — selalu network-first
  if (e.request.url.includes("firebase") || e.request.url.includes("googleapis") ||
      e.request.url.includes("cdnjs") || e.request.url.includes("fonts.g")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // App shell — network-first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/")))
  );
});

self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
