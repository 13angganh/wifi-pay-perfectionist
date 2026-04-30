// hooks/useIdleTimeout.ts
// Auto-lock PIN setelah idle X menit.
// PENTING: ini timeout PIN saja — BUKAN logout Firebase.
// Firebase session tetap aktif, user tidak kehilangan data.

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useIdleTimeout(timeoutMinutes: number) {
  const { settings, pinUnlocked, setPinUnlocked } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Jika PIN tidak aktif, timeout 0, atau PIN sudah terkunci → tidak perlu listen
    if (!settings.pinEnabled || timeoutMinutes === 0 || !pinUnlocked) return;

    const ms = timeoutMinutes * 60 * 1000;

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPinUnlocked(false);
      }, ms);
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));

    // Mulai timer pertama kali
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [timeoutMinutes, settings.pinEnabled, pinUnlocked, setPinUnlocked]);
}
