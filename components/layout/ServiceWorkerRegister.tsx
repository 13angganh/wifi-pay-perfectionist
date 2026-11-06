// ══════════════════════════════════════════
// components/layout/ServiceWorkerRegister.tsx — mendaftarkan /sw.js (v11.11.1)
// Sebelumnya TIDAK ada kode yang mendaftarkan Service Worker (komentar lama menyebut "di layout", padahal tidak ada),
// sehingga instalasi baru tidak mendapat halaman offline dan pembaruan otomatis. Mendaftarkan SW yang sudah
// terdaftar aman (browser mengembalikan pendaftaran yang ada). Hanya produksi; /sw.js dibuat tiap build oleh
// scripts/inject-sw-hash.js dari public/sw.template.js (skipWaiting + clients.claim → pembaruan tanpa hard refresh).
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      // updateViaCache:'none' → berkas sw.js selalu diperiksa ke server, tidak dari cache HTTP.
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => { /* tanpa SW app tetap jalan (online) */ });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
