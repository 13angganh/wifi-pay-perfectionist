// ══════════════════════════════════════════
// lib/haptic.ts — Haptic feedback helper (navigator.vibrate)
// Graceful degradation: diam jika device tidak support.
// Seluruh vibration di project wajib melalui file ini.
// ══════════════════════════════════════════

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try { navigator.vibrate(pattern); } catch { /* silently ignore */ }
}

export const haptic = {
  /** Konfirmasi ringan — tombol bayar, toggle */
  light:   () => vibrate(10),
  /** Aksi selesai — payment sukses */
  success: () => vibrate([10, 30, 10]),
  /** Long press terkonfirmasi — batch mode aktif */
  medium:  () => vibrate(25),
  /** Error / peringatan */
  error:   () => vibrate([20, 10, 20]),
  /** Custom pattern */
  custom:  (pattern: number | number[]) => vibrate(pattern),
} as const;
