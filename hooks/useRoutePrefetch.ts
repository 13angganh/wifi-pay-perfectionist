'use client';
// ══════════════════════════════════════════
// hooks/useRoutePrefetch.ts — v11.10.2
// Memuat lebih dulu (prefetch) semua rute menu saat browser sedang senggang, supaya pindah menu lewat
// bottom nav / sidebar tidak menunggu jaringan. Sebelumnya TIDAK ada prefetch sama sekali: `router.push`
// ke rute yang belum dimuat mengambil data rute itu baru saat diketuk, jadi layar tampak diam atau
// berkedip skeleton sebelum berpindah (terasa "lag").
// Satu rute per slot senggang (tidak menumpuk di awal), rute aktif dilewati. Tidak berpengaruh di mode
// dev (Next mengabaikan prefetch di dev) dan aman bila router tidak punya fungsi prefetch (mis. mock test).
// Grafik memakai next/dynamic (Chart.js), jadi modulnya ikut dihangatkan paling akhir.
// ══════════════════════════════════════════
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS, SETTINGS_ITEM } from '@/lib/navItems';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (h: number) => void;
};

export function useRoutePrefetch() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === 'undefined' || typeof router?.prefetch !== 'function') return;
    const w = window as IdleWindow;
    const queue = [...NAV_ITEMS, SETTINGS_ITEM].map(i => `/${i.v}`);
    let cancelled = false;
    let idleHandle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (cancelled) return;
      if (typeof w.requestIdleCallback === 'function') idleHandle = w.requestIdleCallback(step, { timeout: 2000 });
      else timer = setTimeout(step, 300);
    };
    const step = () => {
      if (cancelled) return;
      const route = queue.shift();
      if (!route) {
        // Terakhir: hangatkan chunk Grafik (Chart.js) agar buka Grafik pertama kali tidak berkedip skeleton.
        void import('@/components/features/grafik/GrafikView').catch(() => {});
        return;
      }
      if (route !== window.location.pathname) {
        try { router.prefetch(route); } catch { /* prefetch hanya optimasi; abaikan bila gagal */ }
      }
      schedule();
    };

    // beri waktu layar pertama selesai tampil dulu
    timer = setTimeout(schedule, 1200);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (idleHandle !== undefined && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleHandle);
    };
  }, [router]);
}
