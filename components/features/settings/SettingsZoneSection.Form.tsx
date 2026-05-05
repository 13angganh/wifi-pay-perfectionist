// ══════════════════════════════════════════
// components/features/settings/SettingsZoneSection.Form.tsx
// Dipecah dari SettingsZoneSection.tsx (task 1.15)
// Form tambah zona baru
// ══════════════════════════════════════════
'use client';
import { Plus } from 'lucide-react';
import { useT } from '@/hooks/useT';

interface Props {
  value:    string;
  color:    string;
  onChange: (v: string) => void;
  onColor:  (v: string) => void;
  onAdd:    () => void;
}

export default function ZoneForm({ value, color, onChange, onColor, onAdd }: Props) {
  const t = useT();
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input
        style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', padding:'9px 12px', borderRadius:'var(--r-sm)', fontFamily:"var(--font-mono),monospace", fontSize:13, minHeight:38 }}
        placeholder={t('settings.zones.placeholder')}
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().slice(0,6))}
        maxLength={6}
      />
      <input type="color" value={color} onChange={e => onColor(e.target.value)} style={{ width:38, height:38, border:'1px solid var(--border)', borderRadius:'var(--r-sm)', cursor:'pointer', background:'none', padding:2 }} />
      <button onClick={onAdd} style={{ background:'var(--zc)', color:'#fff', border:'none', padding:'9px 14px', borderRadius:'var(--r-sm)', cursor:'pointer', minHeight:38, display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600 }}>
        <Plus size={14} /> {t('action.add')}
      </button>
    </div>
  );
}
