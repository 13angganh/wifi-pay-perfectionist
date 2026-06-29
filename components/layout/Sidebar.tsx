// ══════════════════════════════════════════
// components/layout/Sidebar.tsx
// v11.3: Tombol akun buka AccountModal (link Google + ganti akun + keluar)
// ══════════════════════════════════════════
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { Settings } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navItems';
import SidebarUserSection from './Sidebar.UserSection';
import AccountModal from '@/components/modals/AccountModal';
import type { ViewName } from '@/types';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';

function getInitials(name: string | null, email: string | null): string {
  const n = name || email?.split('@')[0] || '?';
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

interface Props { onNavigate: (v: ViewName) => void; }

export default function Sidebar({ onNavigate }: Props) {
  const t = useT();
  const { currentView, userName, userEmail, setSidebar } = useAppStore();
  const [showAccount, setShowAccount] = useState(false);

  function handleOpenAccount() {
    // v11.5 FIX: jangan tutup sidebar sebelum modal terbuka — modal punya z-index lebih
    // tinggi (300) dari sidebar (200), jadi sudah otomatis tampil di atasnya. Menutup
    // sidebar dulu (dengan setTimeout) menyebabkan sidebar terlihat "autocollapse" sebelum
    // modal muncul, lalu user harus buka sidebar lagi untuk melihat detail — sesuai laporan.
    setShowAccount(true);
  }

  const initials    = getInitials(userName, userEmail);
  const displayName = userName || userEmail?.split('@')[0] || 'Pengguna';

  return (
    <>
      {/* Header */}
      <div className="sb-header">
        <div className="sb-logo" style={{
          overflow:'hidden', padding:0,
          boxShadow:'0 2px 8px rgba(201,149,42,0.2)',
        }}>
          <Image src="/icon-512.png" alt={APP_NAME} width={512} height={512}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        </div>
        <div>
          <div className="sb-app-name">{APP_NAME}</div>
          <div style={{ fontSize:8, color:'var(--txt5)', letterSpacing:'.06em' }}>{APP_VERSION_FULL}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav" aria-label="Menu navigasi utama">
        {NAV_ITEMS.map(item => (
          <button key={item.v}
            className={`sb-item ${currentView === item.v ? 'on' : ''}`}
            onClick={() => onNavigate(item.v)}
            aria-label={t(item.labelKey)}
            aria-current={currentView === item.v ? 'page' : undefined}
          >
            <span className="si" aria-hidden="true">{item.icon}</span>
            {t(item.labelKey)}
          </button>
        ))}

        <div className="sb-divider" role="separator" />

        <button
          className={`sb-item ${currentView === 'settings' ? 'on' : ''}`}
          onClick={() => onNavigate('settings')}
          aria-label="Pengaturan"
          aria-current={currentView === 'settings' ? 'page' : undefined}
        >
          <span className="si" aria-hidden="true"><Settings size={16} strokeWidth={1.5} /></span>
          {t('nav.settings')}
        </button>
      </nav>

      {/* User section — klik buka AccountModal */}
      <SidebarUserSection
        initials={initials}
        displayName={displayName}
        onOpenAccount={handleOpenAccount}
      />

      {/* AccountModal */}
      <AccountModal open={showAccount} onClose={() => { setShowAccount(false); setSidebar(false); }} />
    </>
  );
}
