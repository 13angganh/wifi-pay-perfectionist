// ══════════════════════════════════════════
// lib/pinThrottle.ts — jeda setelah PIN salah berulang (v11.11.1)
// 5 kali salah berturut-turut → masukan PIN ditahan 30 detik. Disimpan di perangkat (per akun) supaya tidak bisa
// dilewati dengan menutup/memuat ulang app. Biometrik tidak terpengaruh (tidak bisa ditebak). Ini penghalang
// untuk orang iseng, bukan pengaman data (sesi Firebase sudah terbuka di perangkat).
// ══════════════════════════════════════════

export const PIN_MAX_FAILS    = 5;
export const PIN_LOCK_SECONDS = 30;

export interface PinThrottle { fails: number; until: number }

const EMPTY: PinThrottle = { fails: 0, until: 0 };
const keyOf = (uid: string | null) => `wp_pin_throttle_${uid ?? 'device'}`;

function load(uid: string | null): PinThrottle {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw);
    return { fails: Number(p?.fails) || 0, until: Number(p?.until) || 0 };
  } catch { return { ...EMPTY }; }
}
function save(uid: string | null, s: PinThrottle): void {
  try { localStorage.setItem(keyOf(uid), JSON.stringify(s)); } catch { /* penyimpanan ditolak: jeda tetap berlaku di sesi ini lewat state komponen */ }
}

/** Sisa detik jeda (0 = tidak sedang dijeda). */
export function pinLockRemaining(s: PinThrottle, now: number = Date.now()): number {
  return s.until > now ? Math.ceil((s.until - now) / 1000) : 0;
}

export function readPinThrottle(uid: string | null, now: number = Date.now()): PinThrottle {
  const s = load(uid);
  // Jeda sudah lewat → mulai lagi dari nol.
  if (s.until && s.until <= now) { const fresh = { ...EMPTY }; save(uid, fresh); return fresh; }
  return s;
}

/** Catat satu PIN salah. Pada kegagalan ke-5: mulai jeda dan hitung ulang dari nol. */
export function recordPinFail(uid: string | null, now: number = Date.now()): PinThrottle {
  const cur = readPinThrottle(uid, now);
  const fails = cur.fails + 1;
  const next: PinThrottle = fails >= PIN_MAX_FAILS ? { fails: 0, until: now + PIN_LOCK_SECONDS * 1000 } : { fails, until: 0 };
  save(uid, next);
  return next;
}

export function clearPinThrottle(uid: string | null): void {
  try { localStorage.removeItem(keyOf(uid)); } catch { /* abaikan */ }
}
