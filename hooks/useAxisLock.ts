'use client';
import { useEffect, type RefObject } from 'react';

// Kunci arah geser (sentuh): satu gerakan jari menggeser HORIZONTAL atau VERTIKAL, tidak diagonal.
// Dua scroll TERPISAH: jari di tabel hanya menggeser tabel (tanpa menyambung ke halaman di ujung); jari di luar tabel menggeser halaman.
// Bila tabel tidak bisa digeser pada sumbu itu, gerakan dibiarkan ke halaman (tidak ditangkap).
export function useAxisLock(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0, sy = 0, px = 0, py = 0, vx = 0, vy = 0, pt = 0, raf = 0;
    let lock: 'x' | 'y' | null = null;
    let ignore = false;
    const stop = () => cancelAnimationFrame(raf);
    const scrollBy = (dx: number, dy: number) => {
      if (lock === 'x') el.scrollLeft += dx; else el.scrollTop += dy;
    };
    const onStart = (e: TouchEvent) => { stop(); const t = e.touches[0]; sx = px = t.clientX; sy = py = t.clientY; lock = null; ignore = false; vx = vy = 0; pt = e.timeStamp; };
    const onMove = (e: TouchEvent) => {
      if (ignore) return;
      const t = e.touches[0];
      if (!lock) {
        const ax = Math.abs(t.clientX - sx), ay = Math.abs(t.clientY - sy);
        if (ax < 6 && ay < 6) return;
        lock = ax > ay ? 'x' : 'y';
        const can = lock === 'x' ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
        if (!can) { lock = null; ignore = true; return; }
      }
      if (e.cancelable) e.preventDefault();
      const dx = px - t.clientX, dy = py - t.clientY, dt = Math.max(1, e.timeStamp - pt);
      vx = dx / dt; vy = dy / dt; px = t.clientX; py = t.clientY; pt = e.timeStamp;
      scrollBy(lock === 'x' ? dx : 0, lock === 'y' ? dy : 0);
    };
    const onEnd = () => {
      if (!lock) return;
      const axis = lock; let v = axis === 'x' ? vx : vy; let last = performance.now();
      const step = (now: number) => {
        const dt = now - last; last = now; v *= Math.pow(0.995, dt);
        if (Math.abs(v) < 0.02) return;
        lock = axis; scrollBy(axis === 'x' ? v * dt : 0, axis === 'y' ? v * dt : 0);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', stop, { passive: true });
    return () => { stop(); el.removeEventListener('touchstart', onStart); el.removeEventListener('touchmove', onMove); el.removeEventListener('touchend', onEnd); el.removeEventListener('touchcancel', stop); };
  }, [ref]);
}
