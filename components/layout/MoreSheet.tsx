// ══════════════════════════════════════════
// components/layout/MoreSheet.tsx — sheet "Lainnya" (grid 3 kolom) untuk Bottom Navigation
// Dibangun di atas primitive Sheet (Esc, fokus, scroll-lock, portal).
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { MORE_NAV_ITEMS } from '@/lib/navItems';
import Sheet from '@/components/ui/Sheet';
import type { ViewName } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (v: ViewName) => void;
}

export default function MoreSheet({ open, onClose, onNavigate }: Props) {
  const t = useT();
  const currentView = useAppStore(s => s.currentView);

  return (
    <Sheet open={open} onClose={onClose} title={t('nav.more')} className="more-sheet">
      <div className="more-grid">
        {MORE_NAV_ITEMS.map(({ v, Icon, labelKey }) => {
          const on = currentView === v;
          return (
            <button
              key={v}
              type="button"
              className={`more-item${on ? ' on' : ''}`}
              aria-current={on ? 'page' : undefined}
              onClick={() => onNavigate(v)}
            >
              <Icon size={24} weight={on ? 'fill' : 'duotone'} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
