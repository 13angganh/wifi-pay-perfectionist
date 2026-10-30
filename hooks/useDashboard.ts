// ══════════════════════════════════════════
// hooks/useDashboard.ts — Dashboard data logic (REDESAIN T7)
//
// Satu-satunya sumber hitungan Dashboard. DashboardView.tsx hanya merender hasil
// computeDashboard(); tidak ada hitungan ganda di komponen (sebelumnya DashboardView
// dan hook ini menghitung hal yang sama secara terpisah).
//
// Perbaikan percabangan KRS/SLK (serah-terima T4 §3 butir 6, T5 §3): daftar zona dari
// getAllActiveZones(settings), anggota dari getMembersForZone(). Zona kustom ikut
// terhitung di statistik, insight, tunggakan, dan grafik 6 bulan.
//
// Total per zona dihitung di sini (getMembersForZone + getPay), BUKAN lewat getZoneTotal:
// getZoneTotal di lib/payment.ts masih menghitung zona kustom dari anggota SLK sampai
// diperbaiki di T9 (T4 §3 butir 1). Setelah T9, fungsi zoneTotal() di bawah boleh diganti
// pemanggilan getZoneTotal (catatan T11).
//
// Aturan hitung dipertahankan dari v11.5.21 (Opsi A): member gratis termasuk "lunas";
// "belum" tidak menghitung member gratis.
// REDESAIN T12: member Belum terdaftar / Nonaktif pada bulan itu (tanpa pembayaran) = N/A: tidak masuk lunas, belum,
// maupun penyebut persen (ZoneStat.members = member yang TERHITUNG bulan itu). Pendapatan tetap dari pembayaran apa adanya.
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import {
  getPay, isFree, getArrears, getPrevMonth, calcPctDelta, getMonthStatus, isNotApplicable,
  getAllActiveZones, getMembersForZone,
} from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { MONTHS, MONTHS_EN } from '@/lib/constants';
import type { AppData, AppSettings } from '@/types';

export interface ZoneStat {
  zone:    string;
  total:   number;          // pendapatan zona pada periode (satuan ribu, sama dgn payments)
  prev:    number;          // pendapatan zona bulan sebelumnya
  pct:     number | null;   // perubahan persen vs bulan lalu (null = tidak ada baseline)
  members: number;          // jumlah member zona yang TERHITUNG bulan itu (N/A tidak masuk — penyebut persen)
  lunas:   number;          // termasuk gratis (Opsi A)
  belum:   number;          // tidak termasuk gratis
  free:    number;
  lunasPct: number;         // lunas / members, dibulatkan
}

export interface ArrearItem {
  z: string; name: string; count: number;
  oldest: string; oldestY: number; oldestMi: number;
}

export interface DashboardData {
  dy: number; dm: number; prevDy: number; prevDm: number;
  zones:  ZoneStat[];
  totalIncome: number; totalPrev: number; totalPct: number | null;
  totalOps: number; netIncome: number;
  /** pendapatan total (semua zona aktif) untuk 6 bulan berakhir di periode terpilih, urut lama → baru */
  history: { y: number; m: number; total: number }[];
  totalLunas: number; totalBelum: number; totalFree: number; totalMembers: number;
  /** semua member terdaftar di zona aktif (termasuk yang N/A bulan ini) — untuk keadaan kosong/memuat */
  totalListed: number;
  tunggakanDelta: number | null;        // % perubahan jumlah belum bayar vs bulan lalu
  lunasPctNow: number; lunasPctDelta: number;   // poin persentase
  topTunggak: ArrearItem[];             // semua, sudah terurut turun; tampilan memotong 5
}

/** Total pembayaran satu zona pada satu bulan; mendukung zona kustom. */
export function zoneTotal(data: AppData, zone: string, year: number, month: number): number {
  return getMembersForZone(zone, data).reduce((s, m) => s + (getPay(data, zone, m, year, month) || 0), 0);
}

function zoneCounts(data: AppData, zone: string, year: number, month: number) {
  const mems = getMembersForZone(zone, data);
  let lunas = 0, belum = 0, free = 0, tracked = 0;
  for (const m of mems) {
    const s = getMonthStatus(data, zone, m, year, month);
    if (isNotApplicable(s)) continue;
    tracked++;
    if (s === 'free') { free++; lunas++; }
    else if (s === 'lunas') lunas++;
    else belum++;
  }
  return { members: tracked, lunas, belum, free };
}

/** n bulan berakhir di (year, month), urut lama → baru. */
export function lastMonths(year: number, month: number, n: number): { y: number; m: number }[] {
  const out: { y: number; m: number }[] = [{ y: year, m: month }];
  for (let i = 1; i < n; i++) {
    const p = getPrevMonth(out[0].y, out[0].m);
    out.unshift({ y: p.year, m: p.month });
  }
  return out;
}

export function computeDashboard(data: AppData, settings: AppSettings, dy: number, dm: number): DashboardData {
  const zoneKeys = getAllActiveZones(settings);
  const { year: prevDy, month: prevDm } = getPrevMonth(dy, dm);

  const zones: ZoneStat[] = zoneKeys.map(zone => {
    const total = zoneTotal(data, zone, dy, dm);
    const prev  = zoneTotal(data, zone, prevDy, prevDm);
    const c = zoneCounts(data, zone, dy, dm);
    return {
      zone, total, prev,
      pct: prev > 0 ? Math.round(((total - prev) / prev) * 100) : null,
      ...c,
      lunasPct: c.members ? Math.round((c.lunas / c.members) * 100) : 0,
    };
  });

  const sum = (f: (z: ZoneStat) => number) => zones.reduce((s, z) => s + f(z), 0);
  const totalIncome = sum(z => z.total);
  const totalPrev   = sum(z => z.prev);
  const totalPct    = totalPrev > 0 ? Math.round(((totalIncome - totalPrev) / totalPrev) * 100) : null;

  const opsData  = data.operasional?.[`${dy}_${dm}`] || { items: [] };
  const totalOps = (opsData.items || []).reduce((s, it) => s + (+it.nominal || 0), 0);

  const totalMembers = sum(z => z.members);
  const totalListed  = zoneKeys.reduce((s, z) => s + getMembersForZone(z, data).length, 0);
  const totalLunas   = sum(z => z.lunas);
  const totalBelum   = sum(z => z.belum);
  const totalFree    = sum(z => z.free);

  // Insight: tunggakan & rasio lunas vs bulan lalu (semua zona aktif)
  let belumPrev = 0, lunasPrev = 0, trackedPrev = 0;
  for (const zone of zoneKeys) {
    for (const m of getMembersForZone(zone, data)) {
      const s = getMonthStatus(data, zone, m, prevDy, prevDm);
      if (isNotApplicable(s)) continue;
      trackedPrev++;
      if (s === 'free' || s === 'lunas') lunasPrev++;
      if (s === 'belum') belumPrev++;
    }
  }
  const tunggakanDelta = calcPctDelta(totalBelum, belumPrev);
  const lunasPctNow    = totalMembers ? Math.round((totalLunas / totalMembers) * 100) : 0;
  const lunasPctPrev   = trackedPrev ? Math.round((lunasPrev / trackedPrev) * 100) : 0;

  // Tunggakan terbanyak (lintas zona aktif)
  const topTunggak: ArrearItem[] = [];
  for (const z of zoneKeys) {
    for (const name of getMembersForZone(z, data)) {
      const unpaid = getArrears(data, z, name, dy, dm).filter(u => !isFree(data, z, name, u.y, u.mi));
      if (unpaid.length > 0) {
        topTunggak.push({ z, name, count: unpaid.length, oldest: unpaid[0].label, oldestY: unpaid[0].y, oldestMi: unpaid[0].mi });
      }
    }
  }
  topTunggak.sort((a, b) => b.count - a.count);

  // A14: 6 bulan pendapatan total (tanpa field baru)
  const history = lastMonths(dy, dm, 6).map(({ y, m }) => ({
    y, m,
    total: (y === dy && m === dm) ? totalIncome
         : (y === prevDy && m === prevDm) ? totalPrev
         : zoneKeys.reduce((s, z) => s + zoneTotal(data, z, y, m), 0),
  }));

  return {
    dy, dm, prevDy, prevDm, zones,
    totalIncome, totalPrev, totalPct, totalOps, netIncome: totalIncome - totalOps,
    history, totalLunas, totalBelum, totalFree, totalMembers, totalListed,
    tunggakanDelta, lunasPctNow, lunasPctDelta: lunasPctNow - lunasPctPrev,
    topTunggak,
  };
}

export function useDashboard() {
  const { appData, syncStatus, selYear, selMonth, settings } = useAppStore();
  const t    = useT();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const data = computeDashboard(appData, settings, selYear, selMonth);

  const lastBackup = typeof window !== 'undefined' ? localStorage.getItem('wp_last_backup') : null;
  const backupLbl  = lastBackup ? new Date(+lastBackup).toLocaleDateString('id-ID') : t('common.noData');
  const bulanLbl   = `${MONTH_NAMES[selMonth]} ${selYear}`;

  return { ...data, MONTH_NAMES, bulanLbl, backupLbl, syncStatus };
}
