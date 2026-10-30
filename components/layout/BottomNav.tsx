// ══════════════════════════════════════════
// components/layout/BottomNav.tsx — navigasi bawah (Register Tambahan A1, mode 'bottom')
// 4 tab (Dashboard, Entry, Rekap, Tunggakan) + "Lainnya" yang membuka MoreSheet
// (Grafik, Log, Member, Operasional, Pengaturan). Daftar dari lib/navItems.tsx.
// Tidak ada logika bisnis: hanya memanggil onNavigate(view) milik AppShell.
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { DotsThree } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { BOTTOM_NAV_ITEMS, MORE_NAV_ITEMS } from '@/lib/navItems';
import type { ViewName } from '@/types';
import MoreSheet from './MoreSheet';

interface Props { onNavigate: (v: ViewName) => void; }

export default function BottomNav({ onNavigate }: Props) {
  const t = useT();
  const currentView = useAppStore(s => s.currentView);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreOpen || MORE_NAV_ITEMS.some(m => m.v === currentView);

  return (
    <>
      <nav id="bnav" aria-label={t('nav.main')}>
        {BOTTOM_NAV_ITEMS.map(({ v, Icon, labelKey }) => {
          const on = currentView === v;
          return (
            <button
              key={v}
              type="button"
              className={`nb${on ? ' on' : ''}`}
              aria-current={on ? 'page' : undefined}
              onClick={() => onNavigate(v)}
            >
              <Icon size={24} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`nb${moreActive ? ' on' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(o => !o)}
        >
          <DotsThree size={24} weight={moreActive ? 'fill' : 'regular'} aria-hidden="true" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>

      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onNavigate={(v) => { setMoreOpen(false); onNavigate(v); }}
      />
    </>
  );
}
