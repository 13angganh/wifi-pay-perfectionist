// ══════════════════════════════════════════
// lib/helpers.ts — Re-export barrel (task 1.15)
// Fase 2: Hapus enc/dec/saveCred/clearCred/getSavedCred (keamanan — task 2.01)
// ══════════════════════════════════════════

export { fbKey } from './firebase-key';
export { rp, rpShort, formatDate } from './format';
export { getKey, getPay, isFree, isLunas, getEffectivePay, getZoneTotal, getArrears, getPrevMonth, calcPctDelta, resolveEntryCardPeriod, resolveDisplayStatus, getMonthStatus, isNotApplicable, billableMonths } from './payment';
export type { MonthStatus, BillableMonth } from './payment';
export { getAllActiveZones, getMembersForZone, setMembersForZone, fuzzyMatch, textMatch, convertMemberIPs } from './member';

import { AppData } from '@/types';
import { tLog } from './i18n';

// ── cn utility (class merge) — tetap di helpers.ts ──
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── friendlyAuthError — tetap di helpers.ts (dipakai hooks/useAuth.ts) ──
export function friendlyAuthError(code: string): string {
  // v11.11.1: pesan galat mengikuti bahasa aplikasi (dulu selalu bahasa Indonesia).
  const map: Record<string, string> = {
    'auth/invalid-email'             : 'auth.err.invalidEmail',
    'auth/user-not-found'            : 'auth.err.userNotFound',
    'auth/wrong-password'            : 'auth.err.wrongPassword',
    'auth/email-already-in-use'      : 'auth.err.emailInUse',
    'auth/weak-password'             : 'auth.err.weakPassword',
    'auth/invalid-credential'        : 'auth.err.invalidCredential',
    'auth/invalid-login-credentials' : 'auth.err.invalidCredential',
    'auth/network-request-failed'    : 'auth.err.network',
    'auth/too-many-requests'         : 'auth.err.tooMany',
    'auth/user-disabled'             : 'auth.err.disabled',
    'auth/operation-not-allowed'     : 'auth.err.notAllowed',
    'auth/internal-error'            : 'auth.err.internal',
    'auth/unauthorized-domain'       : 'auth.err.unauthorizedDomain',
  };
  if (!map[code]) console.error('[Auth Error Code]:', code);
  return map[code] ? tLog(map[code]) : tLog('auth.err.unknown').replace('{code}', code);
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
