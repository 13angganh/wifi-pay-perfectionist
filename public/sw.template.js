// WiFi Pay — Service Worker (generated from sw.template.js)
// Strategy: network-first halaman, cache-first assets statis
// CACHE_VERSION berubah tiap build → browser auto-detect update → install SW baru

const CACHE_VERSION = 'wifipay-v__BUILD_HASH__';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;

let isUpgrade = false;

const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
];

// ── Install ──
self.addEventListener('install', (event) => {
  isUpgrade = self.registration.active !== null;
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
  if (isUpgrade) {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
    });
  }
});

// ── Fetch ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/_next/data/') ||
    url.searchParams.has('_rsc') ||
    url.pathname.includes('__nextjs') ||
    url.pathname === '/sw.js'
  ) return;

  // Static assets → cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/apple-touch-icon.png'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Halaman → network-first, fallback /offline
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok && res.status < 400) {
          caches.open(PAGES_CACHE)
            .then(cache => cache.put(request, res.clone()))
            .catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const accept = request.headers.get('Accept') || '';
        if (accept.includes('text/html')) {
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
        }
        return new Response('Tidak ada koneksi internet.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
