// ══════════════════════════════════════════
// components/features/operasional/operasional.logic.ts — logika murni layar Operasional (REDESAIN T10)
// Tanpa store/React. Aturan zip yang dipertahankan: nominal item disimpan dalam RIBUAN rupiah (sama dengan
// pembayaran; rp() mengalikan 1000), `+val || 0` untuk nominal, ringkasan = pendapatan zona − total pengeluaran.
// PERBAIKAN ZONA KUSTOM (disetujui): ringkasan satu baris untuk SETIAP zona aktif (getAllActiveZones +
// getZoneTotal), bukan dua baris tetap.
// ══════════════════════════════════════════
import type { AppData, AppSettings, OpsItem } from '@/types';
import { getAllActiveZones } from '@/lib/member';
import { getZoneTotal } from '@/lib/payment';

export type OpsIconKey = 'electric' | 'internet' | 'maintenance' | 'salary' | 'receipt' | 'other' | 'transport' | 'rent' | 'device' | 'collector' | 'shopping';
export const OPS_ICON_KEYS: OpsIconKey[] = ['electric', 'internet', 'maintenance', 'device', 'salary', 'collector', 'transport', 'rent', 'shopping', 'receipt', 'other'];

/** Ikon yang dipakai item: pilihan user bila valid, kalau tidak otomatis dari nama. */
export function resolveOpsIcon(item: { label: string; icon?: string }): OpsIconKey {
  return item.icon && (OPS_ICON_KEYS as string[]).includes(item.icon) ? (item.icon as OpsIconKey) : opsIconKey(item.label);
}

/** Ikon item dipilih dari kata kunci keterangan (hanya tampilan; tidak disimpan). */
export function opsIconKey(label: string): OpsIconKey {
  const s = (label || '').trim().toLowerCase();
  if (!s) return 'receipt';
  if (/(listrik|pln|electric|token)/.test(s)) return 'electric';
  if (/(internet|wifi|bandwidth|kuota|isp)/.test(s)) return 'internet';
  if (/(perawatan|maintenance|servis|service|repair|perbaikan|kabel|alat)/.test(s)) return 'maintenance';
  if (/(gaji|salary|upah|honor|teknisi)/.test(s)) return 'salary';
  return 'other';
}

export function opsTotal(items: OpsItem[]): number {
  return items.reduce((sum, it) => sum + (+it.nominal || 0), 0);
}

export interface OpsSummary {
  zones: { zone: string; total: number }[];
  gross: number;
  expense: number;
  net: number;
}

export function buildOpsSummary(appData: AppData, settings: AppSettings, year: number, month: number, items: OpsItem[]): OpsSummary {
  const zones = getAllActiveZones(settings).map(zone => ({ zone, total: getZoneTotal(appData, zone, year, month) }));
  const gross = zones.reduce((sum, z) => sum + z.total, 0);
  const expense = opsTotal(items);
  return { zones, gross, expense, net: gross - expense };
}

/** Nilai kolom nominal (teks) → angka ribuan; sama dengan zip (`+val || 0`), tidak negatif. */
export function parseNominal(raw: string): number {
  const n = +raw || 0;
  return n < 0 ? 0 : n;
}

/** Ubah satu kolom item; mengembalikan daftar baru (tidak memutasi). */
export function withUpdatedItem(items: OpsItem[], index: number, field: 'label' | 'nominal', raw: string): OpsItem[] {
  return items.map((it, i) => (i === index ? { ...it, [field]: field === 'nominal' ? parseNominal(raw) : raw } : it));
}

/** Apakah nilai baru benar-benar berbeda (hindari simpan + catat log saat blur tanpa perubahan). */
export function isItemChanged(item: OpsItem | undefined, field: 'label' | 'nominal', raw: string): boolean {
  if (!item) return false;
  return field === 'nominal' ? (+item.nominal || 0) !== parseNominal(raw) : (item.label || '') !== raw;
}

export interface OpsFormValue { label: string; nominal: string; icon?: OpsIconKey | '' }
export type OpsFormError = 'labelRequired' | null;

export function validateOpsForm(v: OpsFormValue): OpsFormError {
  return v.label.trim() ? null : 'labelRequired';
}

export function itemFromForm(v: OpsFormValue): OpsItem {
  const it: OpsItem = { label: v.label.trim(), nominal: parseNominal(v.nominal) };
  if (v.icon) it.icon = v.icon;   // jangan kirim undefined ke Firebase
  return it;
}
