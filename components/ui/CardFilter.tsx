'use client';
// Filter tampil/sembunyi kartu per layar (Dashboard, Grafik). Data tidak berubah; hanya tampilan. Tersimpan per perangkat.
import { useState, type ReactNode } from 'react';
import { SlidersHorizontal } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { ChecklistRow } from './ChecklistRow';

export function Vis({ screen, id, children }: { screen: string; id: string; children: ReactNode }) {
  const hidden = useAppStore(s => s.hiddenCards[screen]);
  return hidden?.includes(id) ? null : <>{children}</>;
}

export function CardFilter({ screen, items, compact }: { screen: string; items: { id: string; label: string }[]; compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const hidden = useAppStore(s => s.hiddenCards[screen]) ?? [];
  const toggle = useAppStore(s => s.toggleCardVisible);
  const showAll = useAppStore(s => s.showAllCards);
  const n = items.filter(it => hidden.includes(it.id)).length;
  return (
    <>
      <button type="button" className={compact ? 'wp-filterbtn wp-filterbtn--icon' : 'wp-filterbtn'} onClick={() => setOpen(true)} aria-label={t('view.filterAria')} title={t('view.filter')}>
        <SlidersHorizontal aria-hidden="true" weight="bold" />{compact ? null : <> {t('view.filter')}</>}
        {n > 0 && <span className="wp-filterbtn__n">{n}</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('view.filterTitle')} subtitle={t('view.filterSub')}>
        {items.map(it => (
          <ChecklistRow key={it.id} checked={!hidden.includes(it.id)} onToggle={() => toggle(screen, it.id)}>{it.label}</ChecklistRow>
        ))}
        <Button variant="secondary" size="sm" onClick={() => showAll(screen)} disabled={n === 0}>{t('view.showAll')}</Button>
      </Sheet>
    </>
  );
}
