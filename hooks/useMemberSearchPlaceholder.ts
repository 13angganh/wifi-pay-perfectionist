'use client';
// v11.10.3 — satu-satunya sumber teks placeholder pencarian member per zona (Entri, Rekap, Tunggakan):
// "Cari nama member di KRS..." / "Search member name in KRS...".
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';

export function useMemberSearchPlaceholder(): string {
  const t = useT();
  const zone = useAppStore(s => s.activeZone);
  return `${t('common.searchMemberIn')} ${zone}...`;
}
