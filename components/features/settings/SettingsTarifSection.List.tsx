// ══════════════════════════════════════════
// components/features/settings/SettingsTarifSection.List.tsx
// Dipecah dari SettingsTarifSection.tsx (task 1.15)
// Tarif list per member + input tarif
// ══════════════════════════════════════════
'use client';

interface TarifRowProps {
  name:    string;
  zone:    string;
  tarif:   number | undefined;
  onChange: (v: number) => void;
}

export function TarifRow({ name, zone, tarif, onChange }: TarifRowProps) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bg3)' }}>
      <div>
        <div style={{ fontFamily:"var(--font-mono),monospace", fontSize:12 }}>{name}</div>
        <div style={{ fontSize:9, color:'var(--txt4)' }}>{zone}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <input
          type="number" inputMode="numeric"
          defaultValue={tarif || ''}
          placeholder="0"
          style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', padding:'5px 8px', borderRadius:'var(--r-sm)', fontSize:12, width:80, textAlign:'right', fontFamily:"var(--font-mono),monospace" }}
          onBlur={e => onChange(+e.target.value)}
        />
        <span style={{ fontSize:10, color:'var(--txt4)' }}>×1000</span>
      </div>
    </div>
  );
}
