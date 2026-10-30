// ══════════════════════════════════════════
// components/layout/Sidebar.UserSection.tsx
// v11.3: Satu tombol akun → buka AccountModal (REDESAIN T6: restyle + Phosphor)
// ══════════════════════════════════════════
'use client';

import { CaretRight } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';

interface Props {
  initials:      string;
  displayName:   string;
  onOpenAccount: () => void;
}

export default function SidebarUserSection({ initials, displayName, onOpenAccount }: Props) {
  const t = useT();
  return (
    <div className="sb-user-section">
      <button type="button" className="sb-user-card" onClick={onOpenAccount} aria-label={t('sidebar.accountAria')}>
        <span className="hdr-av hdr-av--sm" aria-hidden="true">{initials}</span>
        <span className="sb-user-card__tx">
          <b>{displayName}</b>
          <span>{t('sidebar.manageAccount')}</span>
        </span>
        <CaretRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
