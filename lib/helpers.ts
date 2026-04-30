// ══════════════════════════════════════════
// lib/helpers.ts — Utility functions
// ══════════════════════════════════════════

import { AppData, AppSettings, FreeMember } from '@/types';
import { MONTHS, getYears } from './constants';

// ── Firebase key sanitizer ──
export function fbKey(s: string): string {
  return s.replace(/\./g,'-').replace(/#/g,'-').replace(/\$/g,'-')
          .replace(/\[/g,'-').replace(/]/g,'-').replace(/\//g,'-');
}

// ── Credential encryption (base64) ──
export function enc(s: string): string {
  try { return btoa(unescape(encodeURIComponent(s))); } catch { return ''; }
}
export function dec(s: string): string {
  try { return decodeURIComponent(escape(atob(s))); } catch { return ''; }
}

// ── Currency format ──
export function rp(v: number): string {
  return 'Rp ' + (v * 1000).toLocaleString('id-ID');
}
export function rpShort(v: number | null | undefined): string {
  return v !== null && v !== undefined ? (v * 1000).toLocaleString('id-ID') : '—';
}

// ── Payment key ──
export function getKey(zone: string, name: string, year: number, month: number): string {
  return `${zone}__${fbKey(name)}__${year}__${month}`;
}

// ── Get payment value ──
export function getPay(data: AppData, zone: string, name: string, year: number, month: number): number | null {
  return data.payments?.[getKey(zone, name, year, month)] ?? null;
}

// ── Check free member ──
export function isFree(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  const key = zone + '__' + name;
  const fm: FreeMember | undefined = data.freeMembers?.[key];
  if (!fm || !fm.active) return false;
  const ym = year * 12 + month;
  const fromYm = fm.fromYear * 12 + fm.fromMonth;
  const toYm = (fm.toYear != null && fm.toMonth != null) ? fm.toYear * 12 + fm.toMonth : Infinity;
  return ym >= fromYm && ym <= toYm;
}

// ── Check lunas (val !== null OR free) ──
export function isLunas(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  if (isFree(data, zone, name, year, month)) return true;
  return getPay(data, zone, name, year, month) !== null;
}

// ── Get effective pay (free = 0) ──
export function getEffectivePay(data: AppData, zone: string, name: string, year: number, month: number): number | null {
  if (isFree(data, zone, name, year, month)) return 0;
  return data.payments?.[getKey(zone, name, year, month)] ?? null;
}

// ── Get zone total income ──
export function getZoneTotal(data: AppData, zone: string, year: number, month: number): number {
  const mems = zone === 'KRS' ? data.krsMembers : data.slkMembers;
  return mems.reduce((s, m) => s + (data.payments?.[getKey(zone, m, year, month)] || 0), 0);
}

// ── Get member arrears ──
export function getArrears(data: AppData, zone: string, name: string, upToYear: number, upToMonth: number) {
  const unpaid: { label: string; y: number; mi: number }[] = [];
  for (const y of getYears()) {
    if (y > upToYear) break;
    const maxM = y === upToYear ? upToMonth : 11;
    for (let mi = 0; mi <= maxM; mi++) {
      const v = getPay(data, zone, name, y, mi);
      if (v === null) unpaid.push({ label: `${MONTHS[mi]} ${y}`, y, mi });
    }
  }
  return unpaid;
}

// ── Clean old logs (30 hari) ──
export function cleanOldEditLogs(data: AppData): AppData {
  if (!data.activityLog?.length) return data;
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const cleaned = data.activityLog.filter(l => !(l.ts && (now - l.ts) > thirtyDays));
  const trimmed = cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
  return { ...data, activityLog: trimmed };
}

// ── Auth error messages ──
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

// ── Saved credential helpers (localStorage) ──
export function saveCred(email: string, pass: string, displayName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wp_cred', enc(email + '::' + pass));
  localStorage.setItem('wp_remember_email', email);
  localStorage.setItem('wp_remember_name', displayName || email.split('@')[0]);
}

export function clearCred() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wp_cred');
  localStorage.removeItem('wp_remember_email');
  localStorage.removeItem('wp_remember_name');
}

export function getSavedCred(): { email: string; pass: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('wp_cred');
  if (!raw) return null;
  try {
    const decoded = dec(raw);
    const idx = decoded.indexOf('::');
    if (idx < 0) return null;
    return { email: decoded.slice(0, idx), pass: decoded.slice(idx + 2) };
  } catch { return null; }
}

// ── cn utility (class merge) ──
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Get all active zones (base + custom, excluding hidden) ──
export function getAllActiveZones(settings: AppSettings): string[] {
  const base = ['KRS', 'SLK'];
  const custom = (settings.customZones || [])
    .filter(z => !(settings.hiddenZones || []).includes(z.key))
    .map(z => z.key);
  return [...base, ...custom];
}

// ── Get member list for a given zone ──
export function getMembersForZone(zone: string, appData: AppData): string[] {
  if (zone === 'KRS') return appData.krsMembers || [];
  if (zone === 'SLK') return appData.slkMembers || [];
  return appData.zoneMembers?.[zone] || [];
}

// ── Fuzzy match (subsequence matching) ──
// Contoh: query "ag" → match "Angga", "Agus"
export function fuzzyMatch(str: string, query: string): boolean {
  if (!query) return true;
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    while (si < s.length && s[si] !== q[qi]) si++;
    if (si >= s.length) return false;
    si++;
  }
  return true;
}

// ── Format tanggal — "1 Apr 2026" ──
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
export function formatDate(dateStr: string | number | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}
