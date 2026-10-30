// ══════════════════════════════════════════
// components/features/entry/batch.ts — logika pilih-banyak (batch) Entry (REDESAIN T7)
//
// Perubahan logika yang DISETUJUI user (serah-terima T2 keputusan 8b): dalam mode pilih,
// HANYA member belum bayar yang bisa dipilih (lunas dan gratis ditolak). Guard ini dipakai di
// ketiga titik masuk batch di EntryView: toggle satu member, Pilih Semua (setBatchSelected),
// dan executeBatch (lewat buildBatchPayments). Fungsi murni supaya bisa diuji unit.
//
// Perilaku zip yang TIDAK diubah: member belum bayar tanpa tarif tetap bisa dipilih dan
// dilewati saat eksekusi (toast entry.batchSkipped); kunci payment = `${zone}__${name}__${y}__${m}`.
// REDESAIN T12: member Belum terdaftar / Nonaktif pada periode itu (tanpa pembayaran) dikecualikan dari batch.
// ══════════════════════════════════════════
import { getMonthStatus } from '@/lib/helpers';
import type { AppData } from '@/types';

/** Belum bayar = status "belum": tanpa pembayaran, bukan gratis, bukan Belum terdaftar/Nonaktif pada periode itu. */
export function isBatchEligible(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  return getMonthStatus(data, zone, name, year, month) === 'belum';
}

/** Saring daftar nama: hanya yang belum bayar. */
export function filterBatchEligible(data: AppData, zone: string, names: readonly string[], year: number, month: number): string[] {
  return names.filter(n => isBatchEligible(data, zone, n, year, month));
}

/** Toggle satu member; member yang tidak berhak (lunas/gratis) tidak pernah masuk pilihan. */
export function toggleBatchSelection(
  current: readonly string[], name: string, data: AppData, zone: string, year: number, month: number,
): string[] {
  if (current.includes(name)) return current.filter(n => n !== name);
  if (!isBatchEligible(data, zone, name, year, month)) return [...current];
  return [...current, name];
}

/**
 * Pilih Semua: bila semua yang berhak (di daftar terfilter) sudah terpilih → kosongkan;
 * selain itu pilih semua yang berhak. Lunas/gratis tidak pernah ikut.
 */
export function toggleSelectAll(
  current: readonly string[], visible: readonly string[], data: AppData, zone: string, year: number, month: number,
): string[] {
  const eligible = filterBatchEligible(data, zone, visible, year, month);
  const allSelected = eligible.length > 0 && eligible.every(n => current.includes(n));
  return allSelected ? [] : eligible;
}

export interface BatchPlan {
  /** key payment → nominal (tarif) yang akan ditulis */
  payments:   Record<string, number>;
  /** "NAMA: Rp x" untuk log */
  details:    { name: string; tarif: number }[];
  /** terpilih, belum bayar, tetapi belum punya tarif (dilewati) */
  noTarif:    string[];
  /** terpilih tetapi kini sudah lunas/gratis (mis. data berubah setelah dipilih) — dilewati, TIDAK ditimpa */
  ineligible: string[];
}

export function buildBatchPayments(
  data: AppData, zone: string, selected: readonly string[], year: number, month: number,
): BatchPlan {
  const plan: BatchPlan = { payments: {}, details: [], noTarif: [], ineligible: [] };
  for (const name of selected) {
    if (!isBatchEligible(data, zone, name, year, month)) { plan.ineligible.push(name); continue; }
    const tarif = data.memberInfo?.[zone + '__' + name]?.tarif as number | undefined;
    if (!tarif) { plan.noTarif.push(name); continue; }
    plan.payments[`${zone}__${name}__${year}__${month}`] = tarif;
    plan.details.push({ name, tarif });
  }
  return plan;
}
