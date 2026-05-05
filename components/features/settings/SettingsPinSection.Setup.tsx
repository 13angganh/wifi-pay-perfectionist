// ══════════════════════════════════════════
// components/features/settings/SettingsPinSection.Setup.tsx
// Dipecah dari SettingsPinSection.tsx (task 1.15)
// Aktifkan PIN baru
// ══════════════════════════════════════════
'use client';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useT } from '@/hooks/useT';

interface Props { onSave: (pin: string) => void; }

export default function PinSetup({ onSave }: Props) {
  const t = useT();
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr]   = useState('');

  function handleSave() {
    if (pin1.length !== 4 || !/^\d{4}$/.test(pin1)) { setErr(t('settings.pin.invalid')); return; }
    if (pin1 !== pin2) { setErr(t('settings.pin.mismatch')); return; }
    onSave(pin1);
  }

  const inputStyle: React.CSSProperties = { width:100, letterSpacing:8, textAlign:'center', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', padding:'10px', borderRadius:'var(--r-sm)', fontSize:20, fontFamily:"var(--font-mono),monospace" };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div>
        <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6 }}>{t('settings.pin.new')}</div>
        <input style={inputStyle} type="password" maxLength={4} inputMode="numeric" value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g,'').slice(0,4))} />
      </div>
      <div>
        <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6 }}>{t('settings.pin.confirm')}</div>
        <input style={inputStyle} type="password" maxLength={4} inputMode="numeric" value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g,'').slice(0,4))} />
      </div>
      {err && <div style={{ fontSize:11, color:'var(--c-belum)' }}>{err}</div>}
      <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--zc)', color:'#fff', border:'none', padding:'11px 18px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
        <ShieldCheck size={14} /> {t('settings.pin.activate')}
      </button>
    </div>
  );
}
