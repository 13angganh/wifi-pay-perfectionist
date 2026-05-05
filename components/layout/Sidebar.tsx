// ══════════════════════════════════════════
// components/layout/Sidebar.tsx (task 1.15: dipecah)
// ══════════════════════════════════════════
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doLogout, switchAccount } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';
import { Settings } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navItems';
import SidebarUserSection from './Sidebar.UserSection';
import type { ViewName } from '@/types';

function getInitials(name: string | null, email: string | null): string {
  const n = name || email?.split('@')[0] || '?';
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

interface Props { onNavigate: (v: ViewName) => void; }

export default function Sidebar({ onNavigate }: Props) {
  const router = useRouter();
  const t = useT();
  const { currentView, userName, userEmail, setSidebar } = useAppStore();

  async function handleSwitchAccount() {
    await switchAccount(); // task 1.04
    router.replace('/login');
    setSidebar(false);
  }

  async function handleLogout() {
    await doLogout();
    router.replace('/login');
    setSidebar(false);
  }

  const initials     = getInitials(userName, userEmail);
  const displayName  = userName || userEmail?.split('@')[0] || 'Pengguna';

  return (
    <>
      {/* Header */}
      <div className="sb-header">
        <div className="sb-logo" style={{
          overflow:'hidden', padding:0,
          boxShadow:'0 2px 8px rgba(201,149,42,0.2)',
        }}>
          <Image src="/icon-512.png" alt="WiFi Pay" width={512} height={512}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        </div>
        <div>
          <div className="sb-app-name">WiFi Pay</div>
          <div style={{ fontSize:8, color:'var(--txt5)', letterSpacing:'.06em' }}>v11.2 Next</div>
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

      <SidebarUserSection
        initials={initials}
        displayName={displayName}
        onSwitch={handleSwitchAccount}
        onLogout={handleLogout}
      />

      <div style={{
        padding:'10px 16px',
        borderTop:'1px solid var(--border)',
        fontSize:9, color:'var(--txt5)',
        letterSpacing:'.04em', textAlign:'center',
      }}>
        WiFi Pay v11.2 Next
      </div>
    </>
  );
}
