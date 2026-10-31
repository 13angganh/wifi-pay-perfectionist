'use client';
import { useEffect, type RefObject } from 'react';

// Kunci arah geser (sentuh): satu gerakan jari menggeser HORIZONTAL atau VERTIKAL, tidak diagonal.
// Dua scroll TERPISAH: jari di tabel hanya menggeser tabel (tanpa menyambung ke halaman di ujung); jari di luar tabel menggeser halaman.
// Bila tabel tidak bisa digeser pada sumbu itu, gerakan dibiarkan ke halaman (tidak ditangkap).
//
// v11.10.2 — perbaikan getar/glitch saat menggeser mentok di ujung tabel (laporan user):
//  1. Hanya menggeser sendiri bila touchmove `cancelable`. Saat browser sudah mengambil alih scroll native (mis. main thread
//     sedang sibuk), Chrome mengirim touchmove tidak-cancelable; menggeser lagi lewat JS membuat scroll GANDA (native + manual)
//     dan efek overscroll native di ujung ikut tampil → terasa bergetar. Kini gerakan itu diserahkan penuh ke browser.
//  2. Geseran dijepit ke [0, maksimum] dan inersia BERHENTI begitu menabrak ujung (dulu terus berputar tanpa hasil ±1 detik).
//  3. Kecepatan lepas jari dihaluskan (rata-rata bergerak), dibatasi, dan DIABAIKAN bila jari sempat diam > 80 ms sebelum
//     diangkat (dulu memakai kecepatan event terakhir apa adanya → tabel tiba-tiba "melempar" walau jari sudah diam).
//  4. Sentuhan lebih dari satu jari tidak ditangkap. touchcancel mereset kunci.
// Pasangan CSS (rekap.module.css `.rwc`): overscroll-behavior: none + touch-action: pan-x pan-y.
const MAX_V = 4;          // px/ms — batas kecepatan inersia
const STALE_MS = 80;      // jari diam lebih lama dari ini sebelum diangkat → tanpa inersia
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function useAxisLock(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0, sy = 0, px = 0, py = 0, vx = 0, vy = 0, pt = 0, raf = 0;
    let lock: 'x' | 'y' | null = null;
    let ignore = false;
    const stop = () => cancelAnimationFrame(raf);

    /** Geser satu sumbu, dijepit ke ujung; mengembalikan jarak yang BENAR-BENAR bergeser. */
    const scrollAxis = (axis: 'x' | 'y', d: number): number => {
      if (axis === 'x') {
        const before = el.scrollLeft;
        el.scrollLeft = clamp(before + d, 0, Math.max(0, el.scrollWidth - el.clientWidth));
        return el.scrollLeft - before;
      }
      const before = el.scrollTop;
      el.scrollTop = clamp(before + d, 0, Math.max(0, el.scrollHeight - el.clientHeight));
      return el.scrollTop - before;
    };

    const reset = () => { lock = null; ignore = false; vx = vy = 0; };
    const onStart = (e: TouchEvent) => {
      stop();
      reset();
      if (e.touches.length > 1) { ignore = true; return; }
      const t = e.touches[0];
      sx = px = t.clientX; sy = py = t.clientY; pt = e.timeStamp;
    };
    const onMove = (e: TouchEvent) => {
      if (ignore) return;
      if (e.touches.length > 1) { ignore = true; lock = null; return; }
      const t = e.touches[0];
      if (!lock) {
        const ax = Math.abs(t.clientX - sx), ay = Math.abs(t.clientY - sy);
        if (ax < 6 && ay < 6) return;
        const axis = ax > ay ? 'x' : 'y';
        const can = axis === 'x' ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
        if (!can) { ignore = true; return; }
        lock = axis;
      }
      // Browser sudah memegang scroll native → jangan menggeser lagi lewat JS (mencegah scroll ganda/bergetar).
      if (!e.cancelable) { ignore = true; lock = null; return; }
      e.preventDefault();
      const dx = px - t.clientX, dy = py - t.clientY, dt = Math.max(1, e.timeStamp - pt);
      // rata-rata bergerak: satu event ber-dt kecil tidak lagi menghasilkan lonjakan kecepatan
      vx = vx * 0.6 + (dx / dt) * 0.4; vy = vy * 0.6 + (dy / dt) * 0.4;
      px = t.clientX; py = t.clientY; pt = e.timeStamp;
      if (lock === 'x') scrollAxis('x', dx); else scrollAxis('y', dy);
    };
    const onEnd = (e: TouchEvent) => {
      const axis = lock;
      lock = null;
      if (!axis || ignore) return;
      if (e.timeStamp - pt > STALE_MS) return; // jari sudah diam sebelum diangkat
      let v = clamp(axis === 'x' ? vx : vy, -MAX_V, MAX_V);
      let last = performance.now();
      const step = (now: number) => {
        const dt = now - last; last = now;
        v *= Math.pow(0.995, dt);
        if (Math.abs(v) < 0.02) return;
        const moved = scrollAxis(axis, v * dt);
        if (moved === 0) return; // menabrak ujung → inersia selesai (tanpa lanjut memutar)
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const onCancel = () => { stop(); reset(); };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      stop();
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, [ref]);
}
