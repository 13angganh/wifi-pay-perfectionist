// ══════════════════════════════════════════
// lib/helpers.ts — Re-export barrel (task 1.15)
// Fase 2: Hapus enc/dec/saveCred/clearCred/getSavedCred (keamanan — task 2.01)
// ══════════════════════════════════════════

export { fbKey } from './firebase-key';
export { rp, rpShort, formatDate } from './format';
export { getKey, getPay, isFree, isLunas, getEffectivePay, getZoneTotal, getArrears } from './payment';
export { getAllActiveZones, getMembersForZone, fuzzyMatch } from './member';

import { AppData } from '@/types';

// ── cn utility (class merge) — tetap di helpers.ts ──
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── friendlyAuthError — tetap di helpers.ts (dipakai hooks/useAuth.ts) ──
export function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email'             : 'Email tidak valid',
    'auth/user-not-found'            : 'Akun tidak ditemukan',
    'auth/wrong-password'            : 'Password salah',
    'auth/email-already-in-use'      : 'Email sudah terdaftar',
    'auth/weak-password'             : 'Password terlalu lemah',
    'auth/invalid-credential'        : 'Email atau password salah',
    'auth/invalid-login-credentials' : 'Email atau password salah',
    'auth/network-request-failed'    : 'Gagal terhubung ke jaringan',
    'auth/too-many-requests'         : 'Terlalu banyak percobaan, coba lagi nanti',
    'auth/user-disabled'             : 'Akun telah dinonaktifkan',
    'auth/operation-not-allowed'     : 'Login email/password belum diaktifkan di Firebase',
    'auth/internal-error'            : 'Terjadi kesalahan server, coba lagi',
    'auth/unauthorized-domain'       : 'Domain belum diizinkan di Firebase Console',
  };
  if (!map[code]) console.error('[Auth Error Code]:', code);
  return map[code] || `Terjadi kesalahan (${code})`;
}

// ── cleanOldEditLogs — tetap di helpers.ts (dipakai lib/db.ts) ──
export function cleanOldEditLogs(data: AppData): AppData {
  if (!data.activityLog?.length) return data;
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const cleaned = data.activityLog.filter(l => !(l.ts && (now - l.ts) > thirtyDays));
  const trimmed = cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
  return { ...data, activityLog: trimmed };
}
