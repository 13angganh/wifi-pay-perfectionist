// ══════════════════════════════════════════
// lib/payDate.ts — REDESAIN T12 (F4): SATU helper tanggal bayar untuk SEMUA jalur pembayaran.
//
// Tanggal bayar disimpan di memberInfo["ZONA__NAMA"]["date_TAHUN_BULAN"] (format YYYY-MM-DD) dan tampil di Riwayat
// Pembayaran member. Sebelum T12 hanya sebagian jalur yang mencatatnya (Entry nominal-diketik, Entry batch, dan Rekap
// nominal-diketik tidak), dan jalur yang mencatatnya memakai toISOString() = tanggal UTC (di WIB dini hari mundur sehari).
// Aturan sekarang, sama di semua jalur — mengikuti pengaturan aplikasi `autoDate`:
//   • otomatis (autoDate = true)  → tanggal LOKAL perangkat hari ini
//   • manual   (autoDate = false) → tanggal yang dipilih pengguna (pemilih tanggal; kolom "Tgl Bayar" di kartu Entry);
//                                   bila tidak dipilih, tidak ada tanggal yang ditulis
// Pembayaran lama tanpa tanggal tetap kosong. Tidak ada percabangan zona: kunci = `${zona}__${nama}`.
// ══════════════════════════════════════════
import type { AppData } from '@/types';

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Tanggal LOKAL perangkat (YYYY-MM-DD) — BUKAN toISOString() (UTC). */
export function localDateISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** YYYY-MM-DD yang benar-benar ada di kalender (menolak 2026-02-31, teks bebas, dst). */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export const payDateKey = (year: number, month: number): string => `date_${year}_${month}`;

/**
 * Tanggal yang harus ditulis untuk satu pembayaran, menurut pengaturan aplikasi.
 * `manualDate` hanya dipakai saat autoDate mati; kosong/tidak valid → null (tidak ada tanggal yang ditulis).
 */
export function resolvePayDate(autoDate: boolean | undefined, manualDate?: string | null, now?: Date): string | null {
  if (autoDate) return localDateISO(now);
  return isIsoDate(manualDate) ? manualDate : null;
}

/** Salin data dengan tanggal bayar satu member/bulan ditulis ke memberInfo. `date` null → data dikembalikan apa adanya. */
export function setPayDate(data: AppData, zone: string, name: string, year: number, month: number, date: string | null): AppData {
  return setPayDates(data, zone, [name], year, month, date);
}

/** Versi batch: satu salinan memberInfo untuk banyak member (bulan yang sama). */
export function setPayDates(
  data: AppData, zone: string, names: readonly string[], year: number, month: number, date: string | null,
): AppData {
  if (!date || names.length === 0) return data;
  const dateKey = payDateKey(year, month);
  const memberInfo = { ...(data.memberInfo || {}) };
  for (const name of names) {
    const infoKey = `${zone}__${name}`;
    memberInfo[infoKey] = { ...(memberInfo[infoKey] || {}), [dateKey]: date };
  }
  return { ...data, memberInfo };
}

/** Bentuk jalur tulis granular (memberInfo/{infoKey}/{dateKey}) untuk satu pembayaran, atau undefined bila tak ada tanggal. */
export interface PayDatePatch { infoKey: string; dateKey: string; date: string }
export function payDatePatch(zone: string, name: string, year: number, month: number, date: string | null): PayDatePatch | undefined {
  return date ? { infoKey: `${zone}__${name}`, dateKey: payDateKey(year, month), date } : undefined;
}

/** Terapkan patch tanggal granular ke salinan data (pasangan lokal dari jalur tulis granular). undefined → data apa adanya. */
export function applyPayDatePatch(data: AppData, p: PayDatePatch | undefined): AppData {
  if (!p) return data;
  const memberInfo = { ...(data.memberInfo || {}) };
  memberInfo[p.infoKey] = { ...(memberInfo[p.infoKey] || {}), [p.dateKey]: p.date };
  return { ...data, memberInfo };
}

/** Nilai tanggal yang sedang tersimpan untuk patch itu (untuk rollback bila tulis ke Firebase gagal). */
export function readPayDate(data: AppData, p: PayDatePatch): string | undefined {
  const v = data.memberInfo?.[p.infoKey]?.[p.dateKey];
  return typeof v === 'string' ? v : undefined;
}

/** Kembalikan tanggal ke nilai sebelumnya (undefined = hapus kuncinya) — rollback selektif satu kunci. */
export function restorePayDate(data: AppData, p: PayDatePatch, prev: string | undefined): AppData {
  const info = { ...(data.memberInfo?.[p.infoKey] || {}) };
  if (prev === undefined) delete info[p.dateKey]; else info[p.dateKey] = prev;
  return { ...data, memberInfo: { ...(data.memberInfo || {}), [p.infoKey]: info } };
}
