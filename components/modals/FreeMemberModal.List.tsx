// ══════════════════════════════════════════
// components/modals/FreeMemberModal.List.tsx
// Dipecah dari FreeMemberModal.tsx (task 1.15)
// Daftar semua free member aktif di zona ini
// ══════════════════════════════════════════
'use client';
import { Gift } from 'lucide-react';

import { useT } from '@/hooks/useT';
import type { AppData } from '@/types';

interface Props {
  appData:    AppData;
  zone:       string;
  MONTH_NAMES: string[];
  onSelect:   (name: string) => void;
}

export default function FreeMemberList({ appData, zone, MONTH_NAMES, onSelect }: Props) {
  const t = useT();
  const entries = Object.entries(appData.freeMembers || {})
    .filter(([k]) => k.startsWith(zone + '__'))
    .map(([k, fm]) => ({ name: k.slice(zone.length + 2), fm }));

  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:14 }}>
      <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:10 }}>
        {t('freemodal.existing').toUpperCase()}
      </div>
      {entries.map(({ name, fm }) => (
        <div
          key={name}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bg3)', cursor:'pointer' }}
          onClick={() => onSelect(name)}
        >
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Gift size={12} color="var(--c-free)" />
            <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:12 }}>{name}</span>
          </div>
          <span style={{ fontSize:10, color:'var(--txt4)' }}>
            {MONTH_NAMES[fm.fromMonth]} {fm.fromYear}
            {fm.toYear !== undefined ? ` → ${MONTH_NAMES[fm.toMonth!]} ${fm.toYear}` : ' → ∞'}
          </span>
        </div>
      ))}
    </div>
  );
}
