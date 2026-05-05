// ══════════════════════════════════════════
// hooks/useRekap.ts — Rekap filter & data logic
// Dipecah dari RekapView.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getPay, fuzzyMatch } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

export function useRekap() {
  const {
    appData, activeZone, selYear,
    search, rekapExpanded,
    globalLocked, lockedEntries,
    syncStatus, settings,
  } = useAppStore();

  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const mems     = activeZone === 'KRS' ? appData.krsMembers : appData.slkMembers;
  const filtered = mems.filter(m => fuzzyMatch(m, search));
  const grand    = MONTHS.reduce((s, _, mi) =>
    s + mems.reduce((ss, m) => ss + (getPay(appData, activeZone, m, selYear, mi) || 0), 0), 0);

  return {
    mems, filtered, grand, MONTH_NAMES,
    appData, activeZone, selYear,
    search, rekapExpanded, globalLocked, lockedEntries,
    syncStatus, settings,
  };
}
