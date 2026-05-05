// ══════════════════════════════════════════
// hooks/useMembersFilter.ts — Members search & filter logic
// Dipecah dari MembersView.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { isFree, fuzzyMatch } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

type SortMode = 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc' | 'ip-asc' | 'ip-desc';

export function useMembersFilter(sortMode: SortMode) {
  const { appData, newMemberZone: zone, search, selYear, selMonth } = useAppStore();
  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const mems  = zone === 'KRS' ? appData.krsMembers : appData.slkMembers;
  const zc    = zone === 'KRS' ? 'var(--zc-krs)' : 'var(--zc-slk)';

  const freeThisMonth = (name: string) => isFree(appData, zone, name, selYear, selMonth);

  const filtered = mems
    .filter(m => fuzzyMatch(m, search))
    .sort((a, b) => {
      const ia = appData.memberInfo?.[zone + '__' + a] || {};
      const ib = appData.memberInfo?.[zone + '__' + b] || {};
      if (sortMode === 'name-asc')  return a.localeCompare(b);
      if (sortMode === 'name-desc') return b.localeCompare(a);
      if (sortMode === 'id-asc')    return String(ia.id || '').localeCompare(String(ib.id || ''));
      if (sortMode === 'id-desc')   return String(ib.id || '').localeCompare(String(ia.id || ''));
      if (sortMode === 'ip-asc')    return String(ia.ip || '').localeCompare(String(ib.ip || ''));
      if (sortMode === 'ip-desc')   return String(ib.ip || '').localeCompare(String(ia.ip || ''));
      return 0;
    });

  return { mems, filtered, freeThisMonth, zc, MONTH_NAMES, zone };
}
