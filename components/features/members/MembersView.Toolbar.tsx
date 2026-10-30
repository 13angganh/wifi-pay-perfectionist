// ══════════════════════════════════════════
// components/features/members/MembersView.Toolbar.tsx — cari + tombol tambah, chip status A20, hitungan + urutkan
// (REDESAIN T9, T4 keputusan 1, 8, 9, 12). Komponen presentasi: state dimiliki MembersView.
// Placeholder cari = A21 (nama, ID, atau IP). Tombol tambah disembunyikan saat Member terkunci (zip).
// ══════════════════════════════════════════
'use client';

import { Fab } from '@/components/ui/Fab';
import { CardFilter, Vis } from '@/components/ui/CardFilter';
import { CheckCircle, Gift, ListBullets, MagnifyingGlass, PauseCircle, X, XCircle } from '@phosphor-icons/react';
import { ArrowsDownUp } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import type { RekapCounts, RekapFilter } from '../rekap/rekap.logic';
import { SORT_MODES, type SortMode } from './members.logic';
import m from './members.module.css';

/** Label pilihan urut (panah teks, bukan emoji — T4 keputusan 12). */
const SORT_LABEL: Record<SortMode, string> = {
  'name-asc': 'A-Z', 'name-desc': 'Z-A', 'id-asc': 'ID ↑', 'id-desc': 'ID ↓', 'ip-asc': 'IP ↑', 'ip-desc': 'IP ↓',
};

interface Props {
  search: string;
  onSearch: (q: string) => void;
  locked: boolean;
  onAdd: () => void;
  filter: RekapFilter;
  counts: RekapCounts;
  onFilter: (f: RekapFilter) => void;
  countText: string;
  /** judul tooltip pada pilihan urut: "Status bulan <bulan acuan>" */
  statusTitle: string;
  sort: SortMode;
  onSort: (s: SortMode) => void;
}

export default function MembersToolbar({ search, onSearch, locked, onAdd, filter, counts, onFilter, countText, statusTitle, sort, onSort }: Props) {
  const t = useT();
  const chips = [
    { key: 'all' as const,   icon: ListBullets,   label: t('common.all') },
    { key: 'lunas' as const, icon: CheckCircle,   label: t('status.lunas') },
    { key: 'belum' as const, icon: XCircle,       label: t('status.belum') },
    { key: 'free' as const,  icon: Gift,          label: t('status.free') },
    // REDESAIN T12 (D8): filter member yang NONAKTIF pada bulan yang dilihat
    { key: 'nonaktif' as const, icon: PauseCircle, label: t('status.nonaktif') },
  ];
  return (
    <>
      <div className={m.msr}>
        <div className={`wp-field ${m.msrFld}`}>
          <div className="wp-inpw">
            <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
            <input
              className="wp-inp"
              data-testid="members-search"
              type="text"
              placeholder={t('members.searchPlaceholder')}
              aria-label={t('members.searchPlaceholder')}
              value={search}
              onChange={e => onSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <span className="wp-inpw__end" style={{ pointerEvents: 'auto' }}>
                <button type="button" className={m.msrClr} aria-label={t('entry.clearSearch')} onClick={() => onSearch('')}><X /></button>
              </span>
            )}
          </div>
        </div>
        <CardFilter compact screen="members" items={[['chips', 'view.members.chips'], ['ip', 'view.members.ip']].map(([id, k]) => ({ id, label: t(k) }))} />
        {!locked && <Fab label={t('members.add')} onClick={onAdd} />}
      </div>

<Vis screen="members" id="chips">      <FilterChips ariaLabel={t('entry.filterAria')}>
        {chips.map(c => (
          <FilterChip key={c.key} active={filter === c.key} count={counts[c.key] ?? 0} onClick={() => onFilter(c.key)}>
            <c.icon aria-hidden="true" /> {c.label}
          </FilterChip>
        ))}
      </FilterChips></Vis>

      <div className={m.cnt}>
        <span data-testid="members-count">{countText}</span>
        <label className={m.sort} title={statusTitle}>
          <ArrowsDownUp size={14} aria-hidden="true" />
          <Select size="sm" aria-label={t('members.sort')} value={sort} onChange={e => onSort(e.target.value as SortMode)}>
            {SORT_MODES.map(k => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
          </Select>
        </label>
      </div>
    </>
  );
}
