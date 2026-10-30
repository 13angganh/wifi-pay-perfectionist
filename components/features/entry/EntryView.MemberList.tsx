// ══════════════════════════════════════════
// components/features/entry/EntryView.MemberList.tsx (REDESAIN T7)
// Daftar kartu member + state skeleton / kosong / tidak ditemukan / error.
// File ini sebelumnya yatim (duplikat daftar yang dirender langsung di EntryView); kini dipakai EntryView
// sebagai satu-satunya pemilik markup daftar. Desktop: 2 kolom (.mlist).
// ══════════════════════════════════════════
'use client';

import type { ReactNode } from 'react';
import { ClipboardText, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useT } from '@/hooks/useT';
import e from './entry.module.css';

export interface MemberListProps {
  names: string[];
  /** jumlah member zona sebelum disaring (0 = zona kosong) */
  totalInZone: number;
  loading: boolean;
  failed: boolean;
  search: string;
  onResetSearch: () => void;
  onGoMembers: () => void;
  renderItem: (name: string, index: number) => ReactNode;
}

export function MemberList({ names, totalInZone, loading, failed, search, onResetSearch, onGoMembers, renderItem }: MemberListProps) {
  const t = useT();

  if (loading && totalInZone === 0) return <SkeletonList count={5} />;

  if (failed && totalInZone === 0) {
    return (
      <EmptyState
        icon={WarningCircle}
        title={t('entry.loadErrorTitle')}
        description={t('entry.loadErrorDesc')}
        action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
        size="md"
      />
    );
  }

  if (names.length === 0) {
    const searching = search.trim() !== '';
    return searching ? (
      <EmptyState
        icon={MagnifyingGlass}
        title={t('entry.noMatch')}
        description={t('entry.noMatchDesc')}
        action={<Button variant="secondary" size="sm" onClick={onResetSearch}>{t('entry.resetSearch')}</Button>}
        size="md"
      />
    ) : (
      <EmptyState
        icon={ClipboardText}
        title={t('members.empty')}
        description={t('onboarding.step1')}
        action={totalInZone === 0 ? <Button variant="primary" size="sm" onClick={onGoMembers}>{t('entry.zoneEmptyAction')}</Button> : undefined}
        size="md"
      />
    );
  }

  return (
    <div id="entry-cards" className={e.mlist}>
      {names.map((name, i) => <div key={name}>{renderItem(name, i)}</div>)}
    </div>
  );
}
