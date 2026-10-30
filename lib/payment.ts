// ══════════════════════════════════════════
// lib/payment.ts — Payment logic helpers
// Dipecah dari helpers.ts (task 1.15)
// ══════════════════════════════════════════

import { AppData, MemberPeriods } from '@/types';
import { MONTHS, getYears } from './constants';
import { fbKey } from './firebase-key';
import { getMembersForZone } from './member';
import { getMemberPeriods, inAnyPeriod, isBeforeJoined } from './memberPeriods';

// ── Payment key ──
export function getKey(zone: string, name: string, year: number, month: number): string {
  return `${zone}__${fbKey(name)}__${year}__${month}`;
}

// ── Get payment value ──
export function getPay(data: AppData, zone: string, name: string, year: number, month: number): number | null {
  return data.payments?.[getKey(zone, name, year, month)] ?? null;
}

// ══════════════════════════════════════════
// REDESAIN T12 — status satu bulan satu member (SATU resolver; isFree/isLunas/getArrears diturunkan darinya)
//   'belumTerdaftar' : sebelum "Terdaftar sejak" dan tanpa pembayaran → N/A (tidak terhitung)
//   'nonaktif'       : di dalam periode nonaktif dan tanpa pembayaran → N/A (tidak terhitung)
//   'free'           : di dalam periode free (Rp 0; tetap kategori Free, BUKAN Belum)
//   'lunas' / 'belum': ada / tidak ada pembayaran
// Prioritas bila periode tumpang tindih: Belum terdaftar > Nonaktif > Free > (Lunas/Belum dari pembayaran).
// Pengecualian: pembayaran yang SUDAH tercatat di bulan Belum-terdaftar/Nonaktif tetap dihitung dan tampil
// 'lunas' (uang nyata tidak disembunyikan). Free tetap menang atas pembayaran, persis seperti sebelum T12.
// Data lama (satu periode free, tanpa terdaftar/nonaktif) menghasilkan keluaran yang sama dengan sebelum T12.
// ══════════════════════════════════════════
export type MonthStatus = 'belumTerdaftar' | 'nonaktif' | 'free' | 'lunas' | 'belum';

/** Resolver murni: `paid` = ada nilai pembayaran (termasuk 0) pada bulan itu. */
export function resolveMonthStatus(mp: MemberPeriods | undefined, paid: boolean, year: number, month: number): MonthStatus {
  if (mp) {
    if (isBeforeJoined(mp, year, month)) return paid ? 'lunas' : 'belumTerdaftar';
    if (inAnyPeriod(mp.inactive, year, month)) return paid ? 'lunas' : 'nonaktif';
    if (inAnyPeriod(mp.free, year, month)) return 'free';
  }
  return paid ? 'lunas' : 'belum';
}

export function getMonthStatus(data: AppData, zone: string, name: string, year: number, month: number): MonthStatus {
  return resolveMonthStatus(getMemberPeriods(data, zone, name), getPay(data, zone, name, year, month) !== null, year, month);
}

/** N/A = bulan yang TIDAK terhitung sama sekali (Belum terdaftar / Nonaktif tanpa pembayaran). */
export function isNotApplicable(s: MonthStatus): s is 'belumTerdaftar' | 'nonaktif' {
  return s === 'belumTerdaftar' || s === 'nonaktif';
}

// ── Check free member (diturunkan dari resolver) ──
export function isFree(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  return getMonthStatus(data, zone, name, year, month) === 'free';
}

// ── Check lunas (val !== null OR free). N/A tanpa pembayaran = false; penghitung WAJIB menyaring N/A lewat isNotApplicable(getMonthStatus) ──
export function isLunas(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  const s = getMonthStatus(data, zone, name, year, month);
  return s === 'free' || s === 'lunas';
}

// ── Get effective pay (free = 0) ──
export function getEffectivePay(data: AppData, zone: string, name: string, year: number, month: number): number | null {
  if (getMonthStatus(data, zone, name, year, month) === 'free') return 0;
  return data.payments?.[getKey(zone, name, year, month)] ?? null;
}

// ── Get zone total income ──
// REDESAIN T9 (serah-terima T4 bagian 3 butir 1): daftar anggota lewat getMembersForZone, sehingga zona
// kustom dihitung dari anggotanya sendiri (sebelumnya semua zona selain KRS jatuh ke anggota SLK).
export function getZoneTotal(data: AppData, zone: string, year: number, month: number): number {
  const mems = getMembersForZone(zone, data);
  return mems.reduce((s, m) => s + (data.payments?.[getKey(zone, m, year, month)] || 0), 0);
}

// ── REDESAIN T12: iterator bulan-tertagih — dari tahun pertama sampai (upToYear, upToMonth), hanya bulan yang
//    TERHITUNG (Free/Lunas/Belum); bulan N/A (Belum terdaftar / Nonaktif tanpa pembayaran) dilewati. ──
export interface BillableMonth { label: string; y: number; mi: number; status: 'free' | 'lunas' | 'belum' }

export function billableMonths(data: AppData, zone: string, name: string, upToYear: number, upToMonth: number): BillableMonth[] {
  const out: BillableMonth[] = [];
  const mp = getMemberPeriods(data, zone, name);
  for (const y of getYears()) {
    if (y > upToYear) break;
    const maxM = y === upToYear ? upToMonth : 11;
    for (let mi = 0; mi <= maxM; mi++) {
      const status = resolveMonthStatus(mp, getPay(data, zone, name, y, mi) !== null, y, mi);
      if (status === 'belumTerdaftar' || status === 'nonaktif') continue;
      out.push({ label: `${MONTHS[mi]} ${y}`, y, mi, status });
    }
  }
  return out;
}

// ── Get member arrears: bulan tertagih berstatus 'belum' (Free = lunas; N/A tidak ditagih) ──
export function getArrears(data: AppData, zone: string, name: string, upToYear: number, upToMonth: number) {
  const unpaid: { label: string; y: number; mi: number }[] = [];
  for (const b of billableMonths(data, zone, name, upToYear, upToMonth)) {
    if (b.status === 'belum') unpaid.push({ label: b.label, y: b.y, mi: b.mi });
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
