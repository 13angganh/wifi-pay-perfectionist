// ══════════════════════════════════════════
// components/features/rekap/RekapView.FilterBar.tsx — REDESAIN T8 (T3 keputusan 1, 4)
// Dipakai ulang (sebelumnya yatim): pemilih periode (tahun dulu, lalu bulan acuan), pencarian, dan chip
// filter status A15 (Semua/Lunas/Belum/Gratis + jumlah). Komponen presentasi: state dimiliki RekapView.
// ══════════════════════════════════════════
'use client';

import { CardFilter, Vis } from '@/components/ui/CardFilter';
import { CheckCircle, Gift, ListBullets, MagnifyingGlass, X, XCircle } from '@phosphor-icons/react';
import { getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import { Select } from '@/components/ui/Select';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import type { RekapCounts, RekapFilter } from './rekap.logic';

interface Props {
  year: number;
  month: number;
  monthNames: string[];
  onYear: (y: number) => void;
  onMonth: (m: number) => void;
  search: string;
  onSearch: (q: string) => void;
  filter: RekapFilter;
  counts: RekapCounts;
  onFilter: (f: RekapFilter) => void;
}

export default function RekapFilterBar({
  year, month, monthNames, onYear, onMonth, search, onSearch, filter, counts, onFilter,
}: Props) {
  const t = useT();
  const chips = [
    { key: 'all' as const,   icon: ListBullets, label: t('common.all') },
    { key: 'lunas' as const, icon: CheckCircle, label: t('status.lunas') },
    { key: 'belum' as const, icon: XCircle,     label: t('status.belum') },
    { key: 'free' as const,  icon: Gift,        label: t('status.free') },
  ];
  return (
    <>
      {/* Tahun dulu, bulan kedua (urutan DOM dijaga: test paginasi memilih opsi tahun pertama) */}
      <div className="wp-pbar" role="group" aria-label={t('rekap.periodAria')}>
        <Select size="sm" aria-label={t('common.year')} value={year} onChange={e => onYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select size="sm" aria-label={t('common.month')} value={month} onChange={e => onMonth(+e.target.value)}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <CardFilter compact screen="rekap" items={[['sum', 'view.rekap.sum'], ['chips', 'view.rekap.chips']].map(([id, k]) => ({ id, label: t(k) }))} />
      </div>

      <div className="wp-field">
        <div className="wp-inpw">
          <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
          <input
            className="wp-inp"
            data-testid="rekap-search"
            type="text"
            placeholder={t('rekap.searchPlaceholder')}
            aria-label={t('header.searchMember')}
            value={search}
            onChange={e => onSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <span className="wp-inpw__end" style={{ pointerEvents: 'auto' }}>
              <button type="button" aria-label={t('entry.clearSearch')} onClick={() => onSearch('')}
                style={{ background: 'none', border: 0, color: 'inherit', display: 'flex', cursor: 'pointer' }}>
                <X />
              </button>
            </span>
          )}
        </div>
      </div>

<Vis screen="rekap" id="chips">      <FilterChips ariaLabel={t('entry.filterAria')}>
        {chips.map(c => (
          <FilterChip key={c.key} active={filter === c.key} count={counts[c.key] ?? 0} onClick={() => onFilter(c.key)}>
            <c.icon aria-hidden="true" /> {c.label}
          </FilterChip>
        ))}
      </FilterChips></Vis>
    </>
  );
}
