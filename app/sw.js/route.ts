// app/sw.js/route.ts
// SW di-generate server-side dengan BUILD_ID unik tiap deploy Vercel
// public/sw.js DIHAPUS agar route ini yang dipakai (public/ override API route)
import { NextResponse } from 'next/server';

// BUILD_ID dari env Vercel (VERCEL_GIT_COMMIT_SHA) — unik tiap commit
const BUILD_ID   = process.env.NEXT_PUBLIC_BUILD_ID || '202605270714';
const CACHE_NAME = `wifipay-${BUILD_ID}`;

const SW = `
// WiFi Pay Service Worker — build: ${BUILD_ID}
// Cache name unik tiap deploy → browser auto-detect perubahan → install SW baru
const CACHE_NAME = '${CACHE_NAME}';

const PRECACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/favicon.ico',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip: Firebase, Google, CDN, HMR, SW itself
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('cdnjs') ||
    url.pathname.startsWith('/sw.js') ||
    url.pathname.includes('_next/webpack-hmr')
  ) return;

  if (request.method !== 'GET') return;

  e.respondWith(
    fetch(request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        // Offline fallback chain
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          const offline = await caches.match('/offline');
          if (offline) return offline;
          const root = await caches.match('/');
          if (root) return root;
        }

        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
`.trim();

export async function GET() {
  return new NextResponse(SW, {
    headers: {
      'Content-Type':           'application/javascript; charset=utf-8',
      'Cache-Control':          'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
