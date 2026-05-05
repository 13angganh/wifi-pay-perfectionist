// ══════════════════════════════════════════
// hooks/useEntry.ts — Entry page data & filter logic
// Dipecah dari EntryView.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getPay, isLunas, isFree, fuzzyMatch } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

export function useEntry() {
  const {
    appData, activeZone,
    selYear, selMonth,
    search, filterStatus,
    batchMode, batchSelected, batchYear, batchMonth,
    syncStatus,
  } = useAppStore();

  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const mems        = activeZone === 'KRS' ? appData.krsMembers : appData.slkMembers;

  const freeCount = mems.filter(m => isFree(appData, activeZone, m, selYear, selMonth)).length;
  const paid      = mems.filter(m => isLunas(appData, activeZone, m, selYear, selMonth) && !isFree(appData, activeZone, m, selYear, selMonth)).length;
  const unpaid    = mems.filter(m => getPay(appData, activeZone, m, selYear, selMonth) === null && !isFree(appData, activeZone, m, selYear, selMonth)).length;
  const total     = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, selYear, selMonth) || 0), 0);

  const potensiUnpaid = mems.reduce((sum, m) => {
    const belum = getPay(appData, activeZone, m, selYear, selMonth) === null && !isFree(appData, activeZone, m, selYear, selMonth);
    if (!belum) return sum;
    const info  = appData.memberInfo?.[activeZone + '__' + m] || {};
    return sum + ((info.tarif as number | undefined) ?? 0);
  }, 0);

  const filterStatus2 = filterStatus ?? 'all';
  const filtered = mems.filter(m => {
    if (!fuzzyMatch(m, search)) return false;
    if (filterStatus2 === 'paid')   return isLunas(appData, activeZone, m, selYear, selMonth);
    if (filterStatus2 === 'unpaid') return getPay(appData, activeZone, m, selYear, selMonth) === null && !isFree(appData, activeZone, m, selYear, selMonth);
    if (filterStatus2 === 'free')   return isFree(appData, activeZone, m, selYear, selMonth);
    return true;
  });

  const batchPreview = batchSelected.map(name => {
    const info  = appData.memberInfo?.[activeZone + '__' + name] || {};
    const tarif = info.tarif as number | undefined;
    return { name, tarif: tarif ?? 0 };
  });

  return {
    mems, filtered, freeCount, paid, unpaid, total, potensiUnpaid,
    filterStatus2, MONTH_NAMES,
    batchMode, batchSelected, batchYear, batchMonth, batchPreview,
    syncStatus,
  };
}
