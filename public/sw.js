// public/sw.js — WiFi Pay Service Worker v3
// Fix: cache /offline page + proper fallback chain

const CACHE_NAME = 'wifipay-v3';

// Asset yang di-cache saat install
const PRECACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
];

// ── Install: precache semua asset penting ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first dengan fallback ──
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Bypass: Firebase, CDN, Google APIs — selalu network
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('cdnjs') ||
    url.hostname.includes('fonts.g') ||
    url.pathname.includes('_next/webpack-hmr')
  ) {
    return;
  }

  // Hanya handle GET
  if (request.method !== 'GET') return;

  e.respondWith(
    fetch(request)
      .then(res => {
        // Cache response sukses
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        // Offline: coba dari cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Navigasi ke halaman → tampilkan /offline
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline');
          if (offlinePage) return offlinePage;
        }

        // Fallback terakhir: halaman root
        const root = await caches.match('/');
        if (root) return root;

        // Tidak ada cache sama sekali
        return new Response('Offline — tidak ada koneksi internet', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
