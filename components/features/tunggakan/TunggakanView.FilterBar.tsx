// ══════════════════════════════════════════
// components/features/tunggakan/TunggakanView.FilterBar.tsx — REDESAIN T8 (T3 keputusan 9, 11)
// Dipakai ulang (sebelumnya yatim): pilih mode (Nunggak / Rajin / Gratis, dengan jumlah) dan, hanya di mode
// Nunggak, chip aging (Total / Baru / Segera / Kritis + jumlah). Komponen presentasi: state dimiliki TunggakanView.
// ══════════════════════════════════════════
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { Clock, Fire, Gift, Star, Warning, WarningCircle } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Segmented } from '@/components/ui/Segmented';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import type { AgingFilter, TunggakanMode } from '@/hooks/useTunggakan';

interface Props {
  mode: TunggakanMode;
  aging: AgingFilter;
  counts: Record<TunggakanMode, number>;
  agingCounts: Record<AgingFilter, number>;
  onMode: (m: TunggakanMode) => void;
  onAging: (f: AgingFilter) => void;
}

const AGING_COLOR = { baru: 'var(--c-warn)', segera: 'var(--zc-slk)', kritis: 'var(--c-belum)' } as const;

export default function TunggakanFilterBar({ mode, aging, counts, agingCounts, onMode, onAging }: Props) {
  const t = useT();
  return (
    <>
      <Segmented<TunggakanMode>
        ariaLabel={t('tunggakan.modeAria')}
        value={mode}
        onChange={onMode}
        options={[
          { value: 'nakal', label: <><WarningCircle aria-hidden="true" /> {t('tunggakan.nakal')}</>, count: counts.nakal, color: 'var(--c-belum)' },
          { value: 'rajin', label: <><Star aria-hidden="true" /> {t('tunggakan.rajin')}</>,           count: counts.rajin, color: 'var(--c-lunas)' },
          { value: 'free',  label: <><Gift aria-hidden="true" /> {t('status.free')}</>,               count: counts.free,  color: 'var(--c-free)' },
        ]}
      />

      {mode === 'nakal' && (
        <Vis screen="tunggakan" id="chips">
        <FilterChips ariaLabel={t('tunggakan.agingAria')}>
          <FilterChip active={aging === 'total'} count={agingCounts.total} onClick={() => onAging('total')}>
            <Warning aria-hidden="true" /> {t('tunggakan.filter.total')}
          </FilterChip>
          {([
            ['baru', Clock, t('tunggakan.filter.new')],
            ['segera', WarningCircle, t('tunggakan.filter.soon')],
            ['kritis', Fire, t('tunggakan.filter.critical')],
          ] as const).map(([key, Icon, label]) => (
            <FilterChip key={key} color={AGING_COLOR[key]} active={aging === key}
              count={agingCounts[key]} onClick={() => onAging(key)}>
              <Icon aria-hidden="true" /> {label}
            </FilterChip>
          ))}
        </FilterChips>
        </Vis>
      )}
    </>
  );
}
