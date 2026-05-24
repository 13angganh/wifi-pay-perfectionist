// components/features/settings/CollapsibleSection.tsx
// Wrapper expand/collapse untuk semua section di Settings
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type React from 'react';

interface Props {
  title:       string;
  icon:        React.ReactNode;
  defaultOpen?: boolean;
  badge?:      string; // misal "Aktif" atau "6 zona"
  badgeColor?: string;
  children:    React.ReactNode;
}

export default function CollapsibleSection({
  title, icon, defaultOpen = false, badge, badgeColor = 'var(--txt4)', children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background:'var(--bg2)',
      border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:'var(--r-md)',
      marginBottom:10,
      boxShadow:'var(--shadow-md)',
      overflow:'hidden',
    }}>
      {/* Header — klik untuk toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:10,
          padding:'14px 16px', background:'none', border:'none',
          cursor:'pointer', textAlign:'left',
          transition:'background var(--t-fast)',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='none'}
        aria-expanded={open}
      >
        {/* Icon */}
        <span style={{ color:'var(--zc)', flexShrink:0, display:'flex' }}>{icon}</span>

        {/* Title */}
        <span style={{
          flex:1, fontFamily:"var(--font-sans),sans-serif",
          fontWeight:700, fontSize:13, color:'var(--txt)',
        }}>
          {title}
        </span>

        {/* Badge */}
        {badge && (
          <span style={{
            fontSize:9, fontWeight:700, letterSpacing:'.05em',
            padding:'2px 8px', borderRadius:100,
            background:'var(--bg3)', color: badgeColor,
            border:'1px solid var(--border)',
            marginRight:4, flexShrink:0,
          }}>
            {badge}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          style={{
            color:'var(--txt4)', flexShrink:0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition:'transform 0.2s ease',
          }}
        />
      </button>

      {/* Content */}
      {open && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border2)' }}>
          <div style={{ paddingTop:14 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
