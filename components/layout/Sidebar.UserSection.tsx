// ══════════════════════════════════════════
// components/layout/Sidebar.UserSection.tsx
// Dipecah dari Sidebar.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useT } from '@/hooks/useT';
import { LogOut, UserRoundX } from 'lucide-react';

interface Props {
  initials:     string;
  displayName:  string;
  onSwitch:     () => void;
  onLogout:     () => void;
}

export default function SidebarUserSection({ initials, displayName, onSwitch, onLogout }: Props) {
  const t = useT();

  return (
    <div className="sb-user-section">
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{
          width:32, height:32, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg,var(--zc),color-mix(in srgb,var(--zc) 60%,#000))',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"var(--font-mono),monospace", fontWeight:500, fontSize:12, color:'#fff',
          letterSpacing:'.01em',
        }}>
          {initials}
        </div>
        <div style={{ overflow:'hidden' }}>
          <div style={{
            fontSize:13, fontWeight:500, color:'var(--txt)',
            fontFamily:"var(--font-sans),sans-serif",
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {displayName}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6 }}>
        <button
          className="sb-user-btn"
          onClick={onSwitch}
          aria-label="Ganti akun"
          style={{ flex:1 }}
        >
          <UserRoundX size={13} strokeWidth={1.5} />
          <span>{t('action.changeAccount')}</span>
        </button>
        <button
          className="sb-user-btn danger"
          onClick={onLogout}
          aria-label="Keluar dari aplikasi"
          style={{ flex:1 }}
        >
          <LogOut size={13} strokeWidth={1.5} />
          <span>{t('action.logout')}</span>
        </button>
      </div>
    </div>
  );
}
