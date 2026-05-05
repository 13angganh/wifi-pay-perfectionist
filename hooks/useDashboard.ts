// ══════════════════════════════════════════
// hooks/useDashboard.ts — Dashboard data logic
// Dipecah dari DashboardView.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getZoneTotal, isLunas, isFree, getPay, getArrears } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

export function useDashboard() {
  const { appData, syncStatus, selYear, selMonth } = useAppStore();
  const t    = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const dy = selYear;
  const dm = selMonth;

  // Income
  const krsTotal    = getZoneTotal(appData, 'KRS', dy, dm);
  const slkTotal    = getZoneTotal(appData, 'SLK', dy, dm);
  const totalIncome = krsTotal + slkTotal;
  const prevDm      = dm === 0 ? 11 : dm - 1;
  const prevDy      = dm === 0 ? dy - 1 : dy;
  const krsPrev     = getZoneTotal(appData, 'KRS', prevDy, prevDm);
  const slkPrev     = getZoneTotal(appData, 'SLK', prevDy, prevDm);
  const totalPrev   = krsPrev + slkPrev;
  const krsPct2     = krsPrev > 0 ? Math.round(((krsTotal - krsPrev) / krsPrev) * 100) : null;
  const slkPct2     = slkPrev > 0 ? Math.round(((slkTotal - slkPrev) / slkPrev) * 100) : null;
  const totalPct    = totalPrev > 0 ? Math.round(((totalIncome - totalPrev) / totalPrev) * 100) : null;
  const opsData     = appData.operasional?.[`${dy}_${dm}`] || { items: [] };
  const totalOps    = (opsData.items || []).reduce((s, it) => s + (+it.nominal || 0), 0);
  const netIncome   = totalIncome - totalOps;

  // Member counts
  const krsAll   = appData.krsMembers || [];
  const slkAll   = appData.slkMembers || [];
  const krsLunas = krsAll.filter(m => isLunas(appData, 'KRS', m, dy, dm) && !isFree(appData, 'KRS', m, dy, dm)).length;
  const krsBelum = krsAll.filter(m => getPay(appData, 'KRS', m, dy, dm) === null && !isFree(appData, 'KRS', m, dy, dm)).length;
  const slkLunas = slkAll.filter(m => isLunas(appData, 'SLK', m, dy, dm) && !isFree(appData, 'SLK', m, dy, dm)).length;
  const slkBelum = slkAll.filter(m => getPay(appData, 'SLK', m, dy, dm) === null && !isFree(appData, 'SLK', m, dy, dm)).length;
  const krsPct   = krsAll.length ? Math.round(krsLunas / krsAll.length * 100) : 0;
  const slkPct   = slkAll.length ? Math.round(slkLunas / slkAll.length * 100) : 0;
  const krsFree  = krsAll.filter(m => isFree(appData, 'KRS', m, dy, dm)).length;
  const slkFree  = slkAll.filter(m => isFree(appData, 'SLK', m, dy, dm)).length;
  const totalFree = krsFree + slkFree;

  // Tunggakan top 5
  const topTunggak: { z: string; name: string; count: number; oldest: string }[] = [];
  for (const z of ['KRS', 'SLK'] as const) {
    const mems = z === 'KRS' ? appData.krsMembers : appData.slkMembers;
    for (const name of mems) {
      const unpaid = getArrears(appData, z, name, dy, dm).filter(u => !isFree(appData, z, name, u.y, u.mi));
      if (unpaid.length > 0) topTunggak.push({ z, name, count: unpaid.length, oldest: unpaid[0].label });
    }
  }
  topTunggak.sort((a, b) => b.count - a.count);
  const top5 = topTunggak.slice(0, 5);

  const lastBackup = typeof window !== 'undefined' ? localStorage.getItem('wp_last_backup') : null;
  const backupLbl  = lastBackup ? new Date(+lastBackup).toLocaleDateString('id-ID') : t('common.noData');
  const bulanLbl   = `${MONTH_NAMES[dm]} ${dy}`;

  return {
    dy, dm, MONTH_NAMES, bulanLbl, backupLbl, syncStatus,
    krsTotal, slkTotal, totalIncome, totalOps, netIncome,
    krsPrev, slkPrev, totalPrev,
    krsPct2, slkPct2, totalPct,
    krsAll, slkAll,
    krsLunas, krsBelum, slkLunas, slkBelum,
    krsPct, slkPct, krsFree, slkFree, totalFree,
    top5,
  };
}
