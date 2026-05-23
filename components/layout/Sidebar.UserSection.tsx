// ══════════════════════════════════════════
// components/layout/Sidebar.UserSection.tsx
// v11.3: Satu tombol akun → buka AccountModal
// ══════════════════════════════════════════
'use client';

import { User } from 'lucide-react';

interface Props {
  initials:      string;
  displayName:   string;
  onOpenAccount: () => void;
}

export default function SidebarUserSection({ initials, displayName, onOpenAccount }: Props) {
  return (
    <div className="sb-user-section">
      <button
        onClick={onOpenAccount}
        aria-label="Buka pengaturan akun"
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:10,
          background:'none', border:'1px solid var(--border)',
          borderRadius:'var(--r-sm)', padding:'9px 12px',
          cursor:'pointer', transition:'all var(--t-fast)',
          textAlign:'left',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='none'}
      >
        {/* Avatar */}
        <div style={{
          width:30, height:30, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg,var(--zc),color-mix(in srgb,var(--zc) 60%,#000))',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"var(--font-mono),monospace", fontWeight:500, fontSize:11, color:'#fff',
        }}>
          {initials}
        </div>
        {/* Nama */}
        <div style={{ flex:1, overflow:'hidden' }}>
          <div style={{
            fontSize:12, fontWeight:600, color:'var(--txt)',
            fontFamily:"var(--font-sans),sans-serif",
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {displayName}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:1 }}>Kelola akun</div>
        </div>
        <User size={13} strokeWidth={1.5} style={{ color:'var(--txt4)', flexShrink:0 }} />
      </button>
    </div>
  );
}
