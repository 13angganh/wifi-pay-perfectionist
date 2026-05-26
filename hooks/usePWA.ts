// ══════════════════════════════════════════
// hooks/usePWA.ts — PWA install + SW update logic
// Dipecah dari AppShell.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function usePWA() {
  const { setDeferredPrompt, setUpdateBanner } = useAppStore();

  // PWA install prompt
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, [setDeferredPrompt]);

  // Service Worker registration + update detection
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
      reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setUpdateBanner(true);
      }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // Ada update tersedia — skip waiting langsung
            sw.postMessage({ type: 'SKIP_WAITING' });
            setUpdateBanner(true);
          } else if (sw.state === 'installed') {
            // First install — langsung aktif
            sw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, [setUpdateBanner]);
}
