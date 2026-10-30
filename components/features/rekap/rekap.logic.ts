// ══════════════════════════════════════════
// components/features/rekap/rekap.logic.ts — logika murni layar Rekap (REDESAIN T8)
//
// Fungsi murni (tanpa store/React) supaya bisa diuji unit. Semua pembacaan data lewat helper zip
// (getPay/isFree/getKey); tidak ada percabangan KRS/SLK — zona selalu datang dari pemanggil.
//
// Perilaku zip yang DIPERTAHANKAN:
//  • total baris (kolom TOTAL kanan) = jumlah nilai sel dengan bulan gratis dihitung 0
//  • total kolom / total keseluruhan / subtotal halaman = jumlah nilai mentah getPay
//    (dua rumus ini sengaja tidak disatukan: itu perilaku v11.7.1)
//  • nominal batch = tarif member, atau QuickPay pertama bila member tak punya tarif
//
// Perubahan yang DISETUJUI user (serah-terima T3):
//  • A15 filter status di bulan acuan (Semua/Lunas/Belum/Gratis) — dihitung dari getPay/isFree
//  • keputusan 5 + 6: batch hanya menyentuh sel BELUM BAYAR (lunas/Akm/gratis dilewati)
// REDESAIN T12: status bulan datang dari SATU resolver (getMonthStatus). Bulan Belum terdaftar / Nonaktif tanpa
// pembayaran = N/A: sel diberi penanda khusus ('na'), tidak masuk hitungan Lunas/Belum, dan tidak bisa dipilih batch.
// Total baris/kolom tetap jumlah pembayaran apa adanya (pembayaran yang sudah tercatat di bulan N/A tetap dihitung).
// ══════════════════════════════════════════
import { getKey, getPay, isFree, getMonthStatus, isNotApplicable } from '@/lib/helpers';
import type { MonthStatus } from '@/lib/helpers';
import { MONTHS } from '@/lib/constants';
import { isBatchEligible } from '../entry/batch';
import type { AppData } from '@/types';

/** Status bulan acuan satu member = status resolver T12 (lunas | belum | free | nonaktif | belumTerdaftar). */
export type RekapStatus = MonthStatus;
export type RekapFilter = 'all' | RekapStatus;
/** Hitungan chip: empat kunci lama selalu ada; kunci N/A baru muncul bila ada member N/A pada bulan acuan. */
export type RekapCounts = Record<'all' | 'lunas' | 'belum' | 'free', number> & Partial<Record<'nonaktif' | 'belumTerdaftar', number>>;
export type NaStatus = 'nonaktif' | 'belumTerdaftar';

/** Jenis tampilan sel (T3 keputusan 3). */
export type CellKind =
  | 'free'    // member gratis pada bulan itu → ikon gift
  | 'akm'     // nilai 0 → "Akm" (akumulasi)
  | 'paid'    // nilai > 0 → nominal
  | 'due'     // belum bayar dan sudah jatuh tempo (bulan ≤ bulan acuan) → latar merah + ikon x
  | 'future'  // belum bayar dan belum jatuh tempo → "—"
  | 'na';     // T12: Belum terdaftar / Nonaktif tanpa pembayaran → penanda khusus (tidak terhitung)

/** Status member pada periode acuan (A15). */
export function refStatus(data: AppData, zone: string, name: string, year: number, month: number): RekapStatus {
  return getMonthStatus(data, zone, name, year, month);
}

export function statusCounts(
  data: AppData, zone: string, names: readonly string[], year: number, month: number,
): RekapCounts {
  const c: RekapCounts = { all: names.length, lunas: 0, belum: 0, free: 0 };
  for (const n of names) {
    const s = refStatus(data, zone, n, year, month);
    c[s] = (c[s] ?? 0) + 1;
  }
  return c;
}

export function filterByStatus(
  data: AppData, zone: string, names: readonly string[], year: number, month: number, filter: RekapFilter,
): string[] {
  if (filter === 'all') return [...names];
  return names.filter(n => refStatus(data, zone, n, year, month) === filter);
}

/**
 * Jenis sel. `refMonth` = bulan acuan (selMonth); "sudah jatuh tempo" mengikuti kriteria getArrears:
 * bulan ≤ bulan acuan pada tahun yang ditampilkan. Hanya pembeda visual, tidak mengubah data.
 */
export function cellState(
  data: AppData, zone: string, name: string, year: number, mi: number, refMonth: number,
): { kind: CellKind; na?: NaStatus } {
  const s = getMonthStatus(data, zone, name, year, mi);
  if (s === 'free') return { kind: 'free' };
  if (isNotApplicable(s)) return { kind: 'na', na: s };
  const v = getPay(data, zone, name, year, mi);
  if (v === null) return { kind: mi <= refMonth ? 'due' : 'future' };
  return { kind: v === 0 ? 'akm' : 'paid' };
}

export function cellKind(
  data: AppData, zone: string, name: string, year: number, mi: number, refMonth: number,
): CellKind {
  return cellState(data, zone, name, year, mi, refMonth).kind;
}

/** Total satu baris (kolom TOTAL): bulan gratis dihitung 0 (perilaku zip). */
export function rowTotal(data: AppData, zone: string, name: string, year: number): number {
  let sum = 0;
  for (let mi = 0; mi < MONTHS.length; mi++) {
    if (isFree(data, zone, name, year, mi)) continue;
    sum += getPay(data, zone, name, year, mi) || 0;
  }
  return sum;
}

/** Total tiap bulan (12 kolom) untuk sekelompok member — nilai mentah getPay (perilaku zip). */
export function columnTotals(data: AppData, zone: string, names: readonly string[], year: number): number[] {
  return MONTHS.map((_, mi) => names.reduce((s, n) => s + (getPay(data, zone, n, year, mi) || 0), 0));
}

export const sum = (xs: readonly number[]) => xs.reduce((s, v) => s + v, 0);

export interface Page<T> {
  totalPages: number;
  /** halaman efektif (1-based) setelah di-clamp */
  page: number;
  /** indeks awal (0-based) dan akhir-eksklusif pada daftar penuh */
  start: number;
  end: number;
  items: T[];
}

/** Paginasi. totalPages minimal 1 (v11.6.5); page di-clamp supaya tidak pernah kosong. */
export function paginate<T>(list: readonly T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * perPage;
  const end = Math.min(start + perPage, list.length);
  return { totalPages, page: current, start, end, items: list.slice(start, start + perPage) };
}

/** Nominal batch satu member: tarif member, atau QuickPay pertama (zip: `tarif ?? quickAmounts[0] ?? 100`). */
export function batchAmount(data: AppData, zone: string, name: string, fallback: number): { amt: number; hasTarif: boolean } {
  const tarif = data.memberInfo?.[`${zone}__${name}`]?.tarif as number | undefined;
  return { amt: tarif ?? fallback, hasTarif: !!tarif };
}

export interface RekapBatchPlan {
  /** key payment → nominal yang akan ditulis */
  payments: Record<string, number>;
  entries: { name: string; amt: number }[];
  /** terkunci (dilewati, seperti zip) */
  locked: string[];
  /** terpilih tetapi kini sudah lunas/Akm/gratis — dilewati, TIDAK ditimpa (keputusan 5/6) */
  skippedPaid: string[];
}

export function buildRekapBatch(
  data: AppData, zone: string, selected: readonly string[], year: number, month: number,
  fallback: number, isLocked: (name: string) => boolean,
): RekapBatchPlan {
  const plan: RekapBatchPlan = { payments: {}, entries: [], locked: [], skippedPaid: [] };
  for (const name of selected) {
    if (isLocked(name)) { plan.locked.push(name); continue; }
    if (!isBatchEligible(data, zone, name, year, month)) { plan.skippedPaid.push(name); continue; }
    const { amt } = batchAmount(data, zone, name, fallback);
    plan.payments[getKey(zone, name, year, month)] = amt;
    plan.entries.push({ name, amt });
  }
  return plan;
}
