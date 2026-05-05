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
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setUpdateBanner(true);
      }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed') {
            sw.postMessage({ type: 'SKIP_WAITING' });
            setUpdateBanner(true);
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
