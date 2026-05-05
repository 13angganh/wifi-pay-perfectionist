// ══════════════════════════════════════════
// hooks/useTunggakan.ts — Tunggakan filter logic
// Dipecah dari TunggakanView.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getArrears, isFree, fuzzyMatch } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

export interface TunggakanItem {
  zone: string;
  name: string;
  unpaid: { label: string; y: number; mi: number }[];
}

export function useTunggakan() {
  const { appData, activeZone, selYear, selMonth, search, settings } = useAppStore();
  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const zones = activeZone === 'TOTAL'
    ? ['KRS', 'SLK']
    : [activeZone];

  const items: TunggakanItem[] = [];
  for (const zone of zones) {
    const mems = zone === 'KRS' ? appData.krsMembers : appData.slkMembers;
    for (const name of mems) {
      if (!fuzzyMatch(name, search)) continue;
      const unpaid = getArrears(appData, zone, name, selYear, selMonth)
        .filter(u => !isFree(appData, zone, name, u.y, u.mi));
      if (unpaid.length > 0) items.push({ zone, name, unpaid });
    }
  }
  items.sort((a, b) => b.unpaid.length - a.unpaid.length);

  return { items, MONTH_NAMES, selYear, selMonth, settings };
}
