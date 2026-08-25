// components/features/settings/CollapsibleGroup.tsx
// Wrapper expand/collapse LEVEL 1 utk Settings — kontainer navigasi murni yg
// membungkus beberapa CollapsibleSection (level 2) di dalamnya. Styling dibuat
// lebih tegas drpd CollapsibleSection (border lebih jelas, padding lebih besar,
// title lebih besar) supaya mata bisa langsung bedakan level 1 vs level 2 tanpa
// baca teks dulu. Saat collapsed, HANYA judul polos — tidak ada ringkasan status
// (badge status tetap di level 2 saja, sesuai keputusan user).
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type React from 'react';

interface Props {
  title:       string;
  icon:        React.ReactNode;
  defaultOpen?: boolean;
  children:    React.ReactNode;
}

export default function CollapsibleGroup({
  title, icon, defaultOpen = false, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background:'var(--bg2)',
      border:'1px solid var(--border2)',
      borderRadius:'var(--r-lg)',
      marginBottom:14,
      boxShadow:'var(--shadow-md)',
      overflow:'hidden',
    }}>
      {/* Header — klik untuk toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:12,
          padding:'16px 18px', background:'none', border:'none',
          cursor:'pointer', textAlign:'left',
          transition:'background var(--t-fast)',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='none'}
        aria-expanded={open}
      >
        {/* Icon — sedikit lebih besar drpd CollapsibleSection */}
        <span style={{ color:'var(--zc)', flexShrink:0, display:'flex' }}>{icon}</span>

        {/* Title — fs-heading (15px) drpd fs-body (13px) di level 2 */}
        <span style={{
          flex:1, fontFamily:"var(--font-sans),sans-serif",
          fontWeight:800, fontSize:'var(--fs-heading)', color:'var(--txt)',
          letterSpacing:'-0.01em',
        }}>
          {title}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={18}
          strokeWidth={2}
          style={{
            color:'var(--txt3)', flexShrink:0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition:'transform 0.2s ease',
          }}
        />
      </button>

      {/* Content — isi grup: beberapa CollapsibleSection level 2 di dalamnya.
          Sedikit indent drpd padding CollapsibleSection sendiri, supaya kelihatan
          "masuk ke dalam" kontainer level 1. */}
      {open && (
        <div style={{ padding:'0 12px 12px', borderTop:'1px solid var(--border2)' }}>
          <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:0 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
