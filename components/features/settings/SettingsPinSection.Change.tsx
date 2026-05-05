// ══════════════════════════════════════════
// components/features/settings/SettingsPinSection.Change.tsx
// Dipecah dari SettingsPinSection.tsx (task 1.15)
// Ganti PIN yang sudah aktif
// ══════════════════════════════════════════
'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useT } from '@/hooks/useT';

interface Props {
  currentHash: string;
  onSave: (pin: string) => void;
  onDeactivate: () => void;
}

export default function PinChange({ currentHash, onSave, onDeactivate }: Props) {
  const t = useT();
  const [old, setOld]   = useState('');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr]   = useState('');

  function simpleHash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return String(Math.abs(h));
  }

  function handleChange() {
    if (simpleHash(old) !== currentHash) { setErr(t('settings.pin.wrongCurrent')); return; }
    if (pin1.length !== 4 || !/^\d{4}$/.test(pin1)) { setErr(t('settings.pin.invalid')); return; }
    if (pin1 !== pin2) { setErr(t('settings.pin.mismatch')); return; }
    onSave(pin1);
  }

  const inputStyle: React.CSSProperties = { width:100, letterSpacing:8, textAlign:'center', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', padding:'10px', borderRadius:'var(--r-sm)', fontSize:20, fontFamily:"var(--font-mono),monospace" };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[
        [t('settings.pin.current'), old, setOld],
        [t('settings.pin.new'),     pin1, setPin1],
        [t('settings.pin.confirm'), pin2, setPin2],
      ].map(([label, val, set]) => (
        <div key={String(label)}>
          <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6 }}>{String(label)}</div>
          <input style={inputStyle} type="password" maxLength={4} inputMode="numeric" value={String(val)} onChange={e => (set as (v: string) => void)(e.target.value.replace(/\D/g,'').slice(0,4))} />
        </div>
      ))}
      {err && <div style={{ fontSize:11, color:'var(--c-belum)' }}>{err}</div>}
      <button onClick={handleChange} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--zc)', color:'#fff', border:'none', padding:'11px 18px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
        <RefreshCw size={14} /> {t('settings.pin.change')}
      </button>
      <button onClick={onDeactivate} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--c-belum)', padding:'9px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12 }}>
        {t('settings.pin.deactivate')}
      </button>
    </div>
  );
}
