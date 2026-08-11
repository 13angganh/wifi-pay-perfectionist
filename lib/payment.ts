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

// ── v11.5.2: bulan sebelumnya, dengan wrap tahun (Januari → Desember tahun lalu) ──
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

// ── v11.5.7: resolusi bulan/tahun yang ditampilkan di kartu member (Entry).
// Prioritas: nilai yang sudah disimpan per-member (entryCardYear/Month[name]) — ini berarti
// kartu sudah pernah dibuka sebelumnya dan "terkunci" ke bulan saat itu, tidak boleh ikut
// bergeser meski toggle period Entry (selYear/selMonth) berubah setelahnya (mencegah kartu
// yang sedang diisi user tergeser mendadak). Jika belum pernah tersimpan, fallback ke
// selYear/selMonth — yaitu toggle period Entry yang sedang aktif — BUKAN ke tanggal
// kalender sistem. Ini memperbaiki bug: toggle atas ke bulan X lalu membuka kartu baru
// dulu menampilkan bulan kalender hari ini, mengabaikan toggle X sepenuhnya. ──
export function resolveEntryCardPeriod(
  name: string,
  entryCardYear: Record<string, number>,
  entryCardMonth: Record<string, number>,
  selYear: number,
  selMonth: number,
): { year: number; month: number } {
  return {
    year:  entryCardYear[name]  ?? selYear,
    month: entryCardMonth[name] ?? selMonth,
  };
}

// ── v11.5.10: resolusi tampilan header kartu member (border kiri, badge status, nominal
// ringkas) di Entry. Kartu TERTUTUP → selalu ikuti toggle period atas (toggleVal/
// toggleFree) — status ringkas untuk bulan yang sedang dilihat user secara umum. Kartu
// TERBUKA → header harus konsisten dengan isi form BULAN/NOMINAL di dalamnya
// (cardVal/cardFree, yang sudah ikut cardYear/cardMonth kartu itu sendiri) — supaya
// border/badge tidak menampilkan status bulan lain sementara form di bawahnya
// menampilkan bulan yang berbeda. ──
export function resolveDisplayStatus(
  isExpanded: boolean,
  toggleVal: number | null,
  toggleFree: boolean,
  cardVal: number | null,
  cardFree: boolean,
): { val: number | null; free: boolean; statusBorder: 'var(--c-free)' | 'var(--c-lunas)' | 'var(--c-belum)' } {
  const val  = isExpanded ? cardVal  : toggleVal;
  const free = isExpanded ? cardFree : toggleFree;
  const statusBorder = free
    ? 'var(--c-free)'
    : (val !== null ? 'var(--c-lunas)' : 'var(--c-belum)');
  return { val, free, statusBorder };
}

// ── v11.5.2: persentase perubahan dari `prev` ke `now`, generik untuk insight dashboard.
// Mengembalikan null jika tidak ada baseline yang masuk akal untuk dihitung (prev=0 tapi
// now>0 — itu kenaikan "tak terhingga" secara persentase, tidak informatif ditampilkan).
// Jika prev=0 DAN now=0, hasilnya 0 (kondisi netral/stabil, bukan "tidak ada data"). ──
export function calcPctDelta(now: number, prev: number): number | null {
  if (prev > 0) return Math.round(((now - prev) / prev) * 100);
  return now > 0 ? null : 0;
}
