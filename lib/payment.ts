// ══════════════════════════════════════════
// lib/payment.ts — Payment logic helpers
// Dipecah dari helpers.ts (task 1.15)
// ══════════════════════════════════════════

import { AppData, FreeMember } from '@/types';
import { MONTHS, getYears } from './constants';
import { fbKey } from './firebase-key';

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
      // task 1.01: cek isLunas (termasuk free member)
      if (!isLunas(data, zone, name, y, mi)) {
        unpaid.push({ label: `${MONTHS[mi]} ${y}`, y, mi });
      }
    }
  }
  return unpaid;
}
