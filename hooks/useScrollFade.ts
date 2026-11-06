// ══════════════════════════════════════════
// hooks/useScrollFade.ts — bayangan gradien di dasar area isi (v11.11.1)
// Aturan: bayangan HANYA tampil bila ada yang bisa digulir DAN masih ada isi di bawah. Halaman pendek (tidak
// bisa digulir) atau yang sudah di dasar → tidak tampil, agar tidak ambigu. Dihitung ulang saat: digulir,
// ukuran area/isi berubah (ResizeObserver), isi berubah (MutationObserver), dan pindah halaman (dependensi).
// ══════════════════════════════════════════
'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Selisih (px) di bawah ini dianggap "tidak ada yang bisa digulir" / "sudah di dasar". */
const NO_SCROLL_EPS = 4;
const AT_BOTTOM_PX  = 32;

export interface ScrollMetrics { scrollHeight: number; scrollTop: number; clientHeight: number }

/** Murni: true bila bayangan perlu tampil. */
export function computeScrollFade(m: ScrollMetrics): boolean {
  const overflow = m.scrollHeight - m.clientHeight;
  if (overflow <= NO_SCROLL_EPS) return false;                       // tidak ada yang bisa digulir
  return m.scrollHeight - m.scrollTop - m.clientHeight >= AT_BOTTOM_PX; // masih ada isi di bawah
}

export function useScrollFade(ref: RefObject<HTMLElement | null>, resetKey: unknown): { visible: boolean; onScroll: () => void } {
  const [visible, setVisible] = useState(false);
  const raf = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = computeScrollFade(el);
    setVisible(prev => (prev === next ? prev : next));
  }, [ref]);

  // Hitung di frame berikutnya, maksimal satu kali per frame (scroll bisa memanggil puluhan kali per detik).
  const schedule = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => { raf.current = null; measure(); });
  }, [measure]);

  // Pindah halaman → ukur ulang.
  useEffect(() => { schedule(); }, [resetKey, schedule]);

  // Ukuran area/isi berubah (isi dimuat, daftar dibuka-tutup, layar diputar) → ukur ulang.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
    ro?.observe(el);
    mo?.observe(el, { childList: true, subtree: true });
    schedule();
    return () => {
      ro?.disconnect();
      mo?.disconnect();
      if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
    };
  }, [ref, schedule]);

  return { visible, onScroll: schedule };
}
