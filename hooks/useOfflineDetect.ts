// ══════════════════════════════════════════
// hooks/useOfflineDetect.ts — Offline detection hook
// Dipecah dari AppShell.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';

export function useOfflineDetect() {
  const [offline, setOffline] = useState(false);
  const [show, setShow]       = useState(false);

  useEffect(() => {
    function onOnline()  { setOffline(false); setTimeout(() => setShow(false), 1200); }
    function onOffline() { setOffline(true); setShow(true); }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!navigator.onLine) { setOffline(true); setShow(true); }

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return { offline, show };
}
