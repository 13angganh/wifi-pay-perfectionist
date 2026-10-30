// ══════════════════════════════════════════
// components/features/grafik/grafik.logic.ts — perhitungan murni layar Grafik (REDESAIN T9)
//
// Fungsi murni (tanpa store/React) supaya bisa diuji unit. Rumus zip DIPERTAHANKAN (total bulanan, total tahunan,
// persen vs tahun lalu, proyeksi = rata-rata 3 bulan terakhir yang terisi, komposisi lunas/belum/gratis, dua periode),
// dengan SATU PERBAIKAN yang disetujui user (serah-terima T4 bagian 3 butir 3): zona kustom diperlakukan sama dengan
// zona bawaan — daftar anggota lewat getMembersForZone, mode TOTAL = jumlah SEMUA zona aktif (getAllActiveZones),
// tidak ada percabangan per-nama-zona.
//
// Tambahan yang DISETUJUI (A25, A26): Transaksi per bulan dan Pelanggan Aktif per bulan, dihitung dari getPay/isFree/isLunas
// (tanpa field data baru).
// REDESAIN T12: komposisi status (donut) tidak menghitung member Belum terdaftar / Nonaktif pada bulan itu (N/A): bukan
// bagian dari penyebut kepatuhan. Pendapatan, Transaksi, dan Pelanggan Aktif tetap dari pembayaran yang tercatat.
// ══════════════════════════════════════════
import { MONTHS } from '@/lib/constants';
import { getAllActiveZones, getMembersForZone } from '@/lib/member';
import { getMonthStatus, getPay, getZoneTotal, isFree, isLunas, isNotApplicable } from '@/lib/payment';
import type { AppData, AppSettings } from '@/types';

/** Nilai khusus `activeZone` untuk gabungan semua zona aktif. */
export const TOTAL_ZONE = 'TOTAL';

/** Zona yang dihitung untuk `activeZone`: TOTAL = semua zona aktif, selain itu zona itu sendiri. */
export function zonesFor(activeZone: string, settings: Pick<AppSettings, 'customZones' | 'hiddenZones'>): string[] {
  return activeZone === TOTAL_ZONE ? getAllActiveZones(settings as AppSettings) : [activeZone];
}

/** Jumlah member di semua `zones` (dasar kartu EmptyState "belum ada data"). */
export function memberCount(data: AppData, zones: readonly string[]): number {
  return zones.reduce((s, z) => s + getMembersForZone(z, data).length, 0);
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Total pendapatan 12 bulan satu zona. */
export function zoneMonthTotals(data: AppData, zone: string, year: number): number[] {
  return MONTHS.map((_, mi) => getZoneTotal(data, zone, year, mi));
}

/** Total pendapatan 12 bulan gabungan `zones` (nilai ribuan, sama seperti rp()). */
export function monthTotals(data: AppData, zones: readonly string[], year: number): number[] {
  return MONTHS.map((_, mi) => sum(zones.map(z => getZoneTotal(data, z, year, mi))));
}

/** Total pendapatan per tahun untuk `years`. */
export function yearTotals(data: AppData, zones: readonly string[], years: readonly number[]): number[] {
  return years.map(y => sum(monthTotals(data, zones, y)));
}

/** Total satu bulan gabungan `zones`. */
export function periodTotal(data: AppData, zones: readonly string[], year: number, month: number): number {
  return sum(zones.map(z => getZoneTotal(data, z, year, month)));
}

/** Persen perubahan seperti zip: null bila tahun lalu 0/tidak ada. */
export function pctChange(cur: number, prev: number | undefined): number | null {
  return prev ? Math.round(((cur - prev) / prev) * 100) : null;
}

/** Rata-rata bulan yang terisi (zip: rata-rata nilai > 0). */
export function avgNonZero(values: readonly number[]): number {
  const nz = values.filter(v => v > 0);
  return nz.length ? Math.round(sum(nz) / nz.length) : 0;
}

/** Proyeksi bulan depan = rata-rata 3 bulan terakhir yang terisi sampai `nowMonth` (zip). */
export function projection(mData: readonly number[], nowMonth: number): { value: number; basis: number } {
  const last3 = mData.slice(0, nowMonth + 1).filter(v => v > 0).slice(-3);
  return { value: last3.length ? Math.round(sum(last3) / last3.length) : 0, basis: last3.length };
}

export interface StatusBreakdown { lunas: number; belum: number; free: number; total: number }

/** Komposisi status satu bulan (zip getDonutData): gratis dulu, lalu lunas, sisanya belum. N/A (T12) tidak dihitung. */
export function statusBreakdown(data: AppData, zones: readonly string[], year: number, month: number): StatusBreakdown {
  let lunas = 0, belum = 0, free = 0, total = 0;
  for (const z of zones) {
    for (const m of getMembersForZone(z, data)) {
      const s = getMonthStatus(data, z, m, year, month);
      if (isNotApplicable(s)) continue;
      total++;
      if (s === 'free') free++;
      else if (s === 'lunas') lunas++;
      else belum++;
    }
  }
  return { lunas, belum, free, total };
}

/** A25 Transaksi: member yang punya pembayaran tercatat bulan itu (bukan gratis). */
export function transactionCount(data: AppData, zones: readonly string[], year: number, month: number): number {
  let n = 0;
  for (const z of zones) for (const m of getMembersForZone(z, data)) {
    if (!isFree(data, z, m, year, month) && getPay(data, z, m, year, month) !== null) n++;
  }
  return n;
}

/** A26 Pelanggan Aktif: member lunas atau gratis bulan itu. */
export function activeCustomerCount(data: AppData, zones: readonly string[], year: number, month: number): number {
  let n = 0;
  for (const z of zones) for (const m of getMembersForZone(z, data)) if (isLunas(data, z, m, year, month)) n++;
  return n;
}

/** Deret 12 bulan dari fungsi hitung per bulan. */
export const series12 = (fn: (month: number) => number): number[] => MONTHS.map((_, mi) => fn(mi));

/** Bulan sebelumnya dengan wrap tahun (Januari → Desember tahun lalu). */
export function prevMonthOf(year: number, month: number): { year: number; month: number } {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

/**
 * Label sumbu ringkas untuk nilai dalam satuan RIBUAN rupiah (seperti rp()): 1000 → "1jt", 500 → "500rb",
 * 1500000 → "1,5M"-style tidak dipakai; ≥ 1 miliar rupiah → "M". `lang` menentukan pemisah desimal.
 */
export function compactRp(v: number, lang: 'id' | 'en' = 'id'): string {
  const n = Math.abs(v) * 1000;
  const sign = v < 0 ? '-' : '';
  const fmt = (x: number) => Number(x.toFixed(1)).toString().replace('.', lang === 'id' ? ',' : '.');
  if (n >= 1e9) return `${sign}${fmt(n / 1e9)}M`;
  if (n >= 1e6) return `${sign}${fmt(n / 1e6)}jt`;
  if (n >= 1e3) return `${sign}${fmt(n / 1e3)}rb`;
  return `${sign}${Math.round(n)}`;
}

/** Tambahkan alpha (0–1) ke warna hex 6 digit; selain itu dikembalikan apa adanya. */
export function withAlpha(hex: string, a: number): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(a * 255).toString(16).padStart(2, '0') : hex;
}
