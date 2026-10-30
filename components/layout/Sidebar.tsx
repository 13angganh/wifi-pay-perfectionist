// ══════════════════════════════════════════
// components/layout/Sidebar.tsx
// v11.3: Tombol akun buka AccountModal (link Google + ganti akun + keluar)
// REDESAIN T6: Phosphor + token baru. AccountModal kini dimiliki AppShell (satu instance
// dipakai Header [avatar] dan Sidebar [kartu akun]) — Sidebar hanya memanggil onOpenAccount.
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from '@/lib/navItems';
import SidebarUserSection from './Sidebar.UserSection';
import AppLogo from '@/components/ui/AppLogo';
import type { ViewName } from '@/types';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';
import { getInitials } from './userInitials';

interface Props {
  onNavigate: (v: ViewName) => void;
  onOpenAccount: () => void;
}

export default function Sidebar({ onNavigate, onOpenAccount }: Props) {
  const t = useT();
  const { currentView, userName, userEmail } = useAppStore();

  const initials    = getInitials(userName, userEmail);
  const displayName = userName || userEmail?.split('@')[0] || 'Pengguna';

  function item({ v, Icon, labelKey }: NavItem) {
    const on = currentView === v;
    return (
      <button
        key={v}
        type="button"
        className={`sb-item${on ? ' on' : ''}`}
        onClick={() => onNavigate(v)}
        aria-current={on ? 'page' : undefined}
      >
        <span className="si" aria-hidden="true"><Icon size={20} weight={on ? 'fill' : 'regular'} /></span>
        {t(labelKey)}
      </button>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sb-header">
        <AppLogo size="m" />
        <div>
          <div className="sb-app-name">{APP_NAME}</div>
          <div className="sb-app-ver">{APP_VERSION_FULL}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav" aria-label={t('nav.sidebarAria')}>
        {NAV_ITEMS.map(item)}
        <div className="sb-divider" role="separator" />
        {item(SETTINGS_ITEM)}
      </nav>

      {/* User section — klik buka AccountModal (dimiliki AppShell) */}
      <SidebarUserSection initials={initials} displayName={displayName} onOpenAccount={onOpenAccount} />
    </>
  );
}
