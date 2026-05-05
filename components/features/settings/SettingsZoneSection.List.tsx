// ══════════════════════════════════════════
// components/features/settings/SettingsZoneSection.List.tsx
// Dipecah dari SettingsZoneSection.tsx (task 1.15)
// Daftar zona custom + toggle visible + delete
// ══════════════════════════════════════════
'use client';
import { Trash2, Eye, EyeOff } from 'lucide-react';

interface Zone { key: string; color: string; }

interface Props {
  zones:     Zone[];
  hidden:    string[];
  onToggle:  (key: string) => void;
  onDelete:  (key: string) => void;
}

export default function ZoneList({ zones, hidden, onToggle, onDelete }: Props) {
  if (zones.length === 0) return null;
  return (
    <div style={{ marginTop:12 }}>
      {zones.map(z => (
        <div key={z.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bg3)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:z.color, display:'inline-block' }} />
            <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:13 }}>{z.key}</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => onToggle(z.key)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--txt3)', padding:'5px 8px', borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center' }}>
              {hidden.includes(z.key) ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => onDelete(z.key)} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--c-belum)', padding:'5px 8px', borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
