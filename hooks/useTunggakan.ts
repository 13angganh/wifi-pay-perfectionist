// ══════════════════════════════════════════
// hooks/useTunggakan.ts — data layar Tunggakan (REDESAIN T8)
// Dulu yatim (tidak diimpor siapa pun) dan memuat daftar dua zona bawaan yang tertanam di kode untuk mode TOTAL.
// Kini dipakai TunggakanView sebagai SATU-SATUNYA sumber perhitungan, tanpa percabangan zona bawaan:
//   zona aktif → [activeZone]; mode TOTAL → getAllActiveZones(settings) (bawaan + kustom, yang tidak disembunyikan).
//
// Perilaku zip yang DIPERTAHANKAN (TunggakanView v11.7.1):
//  • tunggakan = bulan belum lunas s/d periode acuan, bulan gratis tidak dihitung; urut jumlah bulan terbanyak
//  • rajin = bukan gratis di bulan acuan DAN tanpa tunggakan; gratis = isFree di bulan acuan
//  • member gratis di bulan acuan yang masih punya tunggakan tetap tampil di daftar tunggakan (seperti zip)
//  • aging: 1 bulan = baru, 2–3 = segera, 4+ = kritis
//  • nominal tagihan = jumlah bulan × tarif member (atau QuickPay pertama) — rumus yang sama dengan doWABlast
// Perubahan yang DISETUJUI (serah-terima T3): A19 pencarian nama (memakai `search` store, pola sama Rekap/Entry),
// A16 nominal tunggakan per member + total (jumlah bulan × tarif — tidak ada data baru).
// REDESAIN T12: bulan Belum terdaftar / Nonaktif (tanpa pembayaran) tidak pernah menjadi tunggakan (getArrears hanya
// menghitung bulan berstatus "belum"); member yang N/A pada bulan acuan tidak ikut daftar Rajin maupun Free.
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getArrears, isFree, getMonthStatus, isNotApplicable, fuzzyMatch, getMembersForZone, getAllActiveZones } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';
import type { AppData, AppSettings } from '@/types';

export type TunggakanMode = 'nakal' | 'rajin' | 'free';
export type AgingLevel = 'baru' | 'segera' | 'kritis';
export type AgingFilter = 'total' | AgingLevel;

export interface UnpaidMonth { label: string; y: number; mi: number }

export interface TunggakanItem {
  zone: string;
  name: string;
  unpaid: UnpaidMonth[];
  count: number;
  /** tarif member bila ada (undefined = pakai default QuickPay pertama) */
  tarif: number | undefined;
  /** jumlah bulan × (tarif ?? default), dalam ribuan seperti semua nominal app */
  amount: number;
}

export interface TunggakanMember { zone: string; name: string }

export interface TunggakanResult {
  /** seluruh member zona (sebelum pencarian) — untuk keadaan "belum ada member" */
  memberCount: number;
  arrears: TunggakanItem[];
  rajin: TunggakanMember[];
  free: TunggakanMember[];
  aging: Record<AgingFilter, number>;
}

export const agingOf = (count: number): AgingLevel => (count >= 4 ? 'kritis' : count >= 2 ? 'segera' : 'baru');

/** Zona yang dihitung: zona aktif, atau semua zona aktif untuk mode TOTAL. Tanpa daftar zona tertanam. */
export function tunggakanZones(activeZone: string, settings: AppSettings): string[] {
  return activeZone === 'TOTAL' ? getAllActiveZones(settings) : [activeZone];
}

export function filterArrearsByAging(items: readonly TunggakanItem[], f: AgingFilter): TunggakanItem[] {
  return f === 'total' ? [...items] : items.filter(x => agingOf(x.count) === f);
}

/** Fungsi murni — seluruh logika layar ada di sini supaya bisa diuji unit. */
export function buildTunggakan(
  data: AppData, zones: readonly string[], year: number, month: number, search: string, fallbackTarif: number,
): TunggakanResult {
  const arrears: TunggakanItem[] = [];
  const rajin: TunggakanMember[] = [];
  const free: TunggakanMember[] = [];
  let memberCount = 0;

  for (const zone of zones) {
    const mems = getMembersForZone(zone, data); // zona kustom ikut
    memberCount += mems.length;
    for (const name of mems) {
      if (!fuzzyMatch(name, search)) continue;
      const unpaid = getArrears(data, zone, name, year, month)
        .filter(u => !isFree(data, zone, name, u.y, u.mi));
      if (unpaid.length > 0) {
        const tarif = data.memberInfo?.[`${zone}__${name}`]?.tarif as number | undefined;
        arrears.push({ zone, name, unpaid, count: unpaid.length, tarif, amount: unpaid.length * (tarif ?? fallbackTarif) });
      }
      const refStatus = getMonthStatus(data, zone, name, year, month);
      if (refStatus === 'free') free.push({ zone, name });
      else if (!isNotApplicable(refStatus) && unpaid.length === 0) rajin.push({ zone, name });
    }
  }
  arrears.sort((a, b) => b.count - a.count); // urutan sort stabil → urutan member dipertahankan di jumlah sama

  const aging: Record<AgingFilter, number> = { total: arrears.length, baru: 0, segera: 0, kritis: 0 };
  for (const x of arrears) aging[agingOf(x.count)]++;
  return { memberCount, arrears, rajin, free, aging };
}

export function useTunggakan() {
  const { appData, activeZone, selYear, selMonth, search } = useAppStore();
  const settings = useAppStore(s => s.settings);
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const zones = tunggakanZones(activeZone, settings);
  const fallbackTarif = settings?.quickAmounts?.[0] ?? 100;
  const result = buildTunggakan(appData, zones, selYear, selMonth, search, fallbackTarif);
  return { ...result, zones, fallbackTarif, MONTH_NAMES, selYear, selMonth, settings };
}
