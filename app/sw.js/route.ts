// app/sw.js/route.ts — Generate sw.js dengan BUILD_ID dari env
// Ini memastikan setiap deploy Vercel punya sw.js unik → browser auto-update SW
import { NextResponse } from 'next/server';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString(36);
const CACHE_NAME = `wifipay-v4-${BUILD_ID}`;

const SW_CONTENT = `
// WiFi Pay Service Worker — build: ${BUILD_ID}
const CACHE_NAME = '${CACHE_NAME}';

const PRECACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
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

  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('cdnjs') ||
    url.pathname.includes('_next/webpack-hmr') ||
    url.pathname.startsWith('/sw.js')
  ) return;

  if (request.method !== 'GET') return;

  e.respondWith(
    fetch(request)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline');
          if (offlinePage) return offlinePage;
        }
        const root = await caches.match('/');
        if (root) return root;
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
`.trim();

export async function GET() {
  return new NextResponse(SW_CONTENT, {
    headers: {
      'Content-Type':          'application/javascript',
      'Cache-Control':         'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
