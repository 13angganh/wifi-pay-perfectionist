// ══════════════════════════════════════════
// hooks/useRekap.ts — Rekap filter & data logic
// Dipecah dari RekapView.tsx (task 1.15)
//
// CATATAN v11.6.4: hook ini TIDAK DIPAKAI di manapun (dikonfirmasi via
// grep — tidak ada satupun import 'useRekap' di seluruh codebase).
// RekapView.tsx (komponen nyata yang dipakai app) menduplikasi logic ini
// langsung inline, tidak pernah memanggil hook ini — kemungkinan sisa
// refactor task 1.15 yang tidak pernah selesai diintegrasikan (sama
// seperti hooks/useEntry.ts). Isi hook ini sendiri sudah benar, tidak ada
// bug — murni tidak terpakai.
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { getPay, fuzzyMatch, getMembersForZone } from '@/lib/helpers';
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

  const mems     = getMembersForZone(activeZone, appData); // FIX: custom zone support
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
