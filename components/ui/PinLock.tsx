// components/ui/PinLock.tsx — Fase 4: redesign premium, numpad 56x56px
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Delete } from 'lucide-react';

export default function PinLock() {
  const { settings, setPinUnlocked, pinUnlocked } = useAppStore();
  const [digits, setDigits]   = useState(['','','','']);
  const [error,  setError]    = useState('');
  const [shake,  setShake]    = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { refs[0].current?.focus(); }, []);

  if (!settings.pinEnabled || pinUnlocked) return null;

  function simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return String(Math.abs(h));
  }

  function handleDigit(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError('');
    if (val && i < 3) refs[i+1].current?.focus();
    if (next.every(d => d !== '') && val) {
      const entered = next.join('');
      if (simpleHash(entered) === settings.pin) {
        setPinUnlocked(true);
      } else {
        setShake(true);
        setError('PIN salah, coba lagi');
        setTimeout(() => {
          setShake(false);
          setDigits(['','','','']);
          refs[0].current?.focus();
        }, 600);
      }
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i-1].current?.focus();
  }

  const padKeys = ['1','2','3','4','5','6','7','8','9','','0','DEL'];

  function pressPad(k: string) {
    if (k === 'DEL') {
      const last = digits.map((d,i)=>({d,i})).filter(x=>x.d).pop();
      if (!last) return;
      const next = [...digits]; next[last.i]=''; setDigits(next);
      refs[last.i].current?.focus();
    } else {
      const idx = digits.findIndex(d=>d==='');
      if (idx === -1) return;
      handleDigit(idx, k);
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'var(--bg)',
      backdropFilter:'blur(16px)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:0, padding:24,
    }}>
      {/* Logo */}
      <div style={{
        width:72, height:72, borderRadius:20, marginBottom:20,
        overflow:'hidden',
        boxShadow:'0 8px 32px rgba(201,149,42,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <img src="/icon-512.png" alt="WiFi Pay" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily:"'Syne',sans-serif", fontWeight:800,
        fontSize:22, color:'var(--txt)',
        letterSpacing:'-0.02em', marginBottom:6,
      }}>
        WiFi Pay
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize:11, color:'var(--txt3)',
        letterSpacing:'.1em', textTransform:'uppercase',
        marginBottom:32,
      }}>
        Masukkan PIN
      </div>

      {/* Dot indicator */}
      <div
        style={{ display:'flex', gap:16, marginBottom: error ? 12 : 32 }}
        className={shake ? 'pin-shake' : ''}
      >
        {digits.map((d,i) => (
          <div key={i} style={{
            width:14, height:14, borderRadius:'50%',
            background: d ? 'var(--zc)' : 'transparent',
            border: d ? '2px solid var(--zc)' : '2px solid var(--txt4)',
            transition:'all .15s var(--ease-out)',
            boxShadow: d ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
          }} />
        ))}
      </div>

      {/* Error */}
      <div style={{
        fontSize:11, color:'var(--c-belum)',
        marginBottom:20, minHeight:16, textAlign:'center',
        opacity: error ? 1 : 0,
        transition:'opacity .15s',
      }}>
        {error || '—'}
      </div>

      {/* Hidden inputs for keyboard */}
      <div style={{ position:'absolute', opacity:0, pointerEvents:'none' }}>
        {digits.map((d,i) => (
          <input key={i} ref={refs[i]} type="tel" maxLength={1} value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {padKeys.map((k,i) => {
          if (k === '') return <div key={i} />;
          const isDel = k === 'DEL';
          return (
            <button
              key={i}
              onClick={() => pressPad(k)}
              aria-label={isDel ? 'Hapus angka' : k}
              style={{
                width:64, height:56, borderRadius:'var(--r-md)',
                border:'1px solid var(--border)',
                background: isDel ? 'var(--bg3)' : 'var(--bg2)',
                color: isDel ? 'var(--txt3)' : 'var(--txt)',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer',
                transition:'all var(--t-fast) var(--ease-smooth)',
                fontFamily: isDel ? undefined : "'DM Mono',monospace",
                fontWeight:600, fontSize:22,
                boxShadow:'var(--shadow-xs)',
                WebkitTapHighlightColor:'transparent',
              }}
              onMouseDown={e => (e.currentTarget.style.transform='scale(.93)')}
              onMouseUp={e   => (e.currentTarget.style.transform='scale(1)')}
              onTouchStart={e => (e.currentTarget.style.transform='scale(.93)')}
              onTouchEnd={e  => (e.currentTarget.style.transform='scale(1)')}
            >
              {isDel ? <Delete size={20} strokeWidth={1.5} /> : k}
            </button>
          );
        })}
      </div>

      <style>{`
        .pin-shake {
          animation: pinShake .5s var(--ease-spring);
        }
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
