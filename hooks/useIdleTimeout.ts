// hooks/useIdleTimeout.ts
// Auto-lock PIN setelah idle X menit.
// PENTING: ini timeout PIN saja — BUKAN logout Firebase.
// Firebase session tetap aktif, user tidak kehilangan data.

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useIdleTimeout(timeoutMinutes: number) {
  const { settings, pinUnlocked, setPinUnlocked } = useAppStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);

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

    // 'scroll' dipisah dari event diskrit lain: scroll event dari #content
    // (overflow-y:auto) bubbles ke window dan bisa terpicu puluhan kali/detik
    // saat fling-scroll cepat di mobile. Tanpa throttle, tiap event memanggil
    // reset() (clearTimeout+setTimeout) — beban JS tambahan tepat saat
    // compositor sedang rasterize sel Rekap. Pola rAF identik dgn
    // handleContentScroll di AppShell.tsx: guard cegah rAF menumpuk, reset()
    // jalan max sekali per frame.
    function onScroll() {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        reset();
      });
    }

    const discreteEvents = ['mousemove', 'keydown', 'touchstart', 'click'] as const;
    discreteEvents.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mulai timer pertama kali
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
      discreteEvents.forEach(ev => window.removeEventListener(ev, reset));
      window.removeEventListener('scroll', onScroll);
    };
  }, [timeoutMinutes, settings.pinEnabled, pinUnlocked, setPinUnlocked]);
}
