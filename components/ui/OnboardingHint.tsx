// components/ui/OnboardingHint.tsx — Fase 4: first-time onboarding hints
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface HintItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const HINTS: HintItem[] = [
  {
    key: 'hint_sidebar',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </div>
    ),
    title: 'Navigasi via Sidebar',
    desc: 'Ketuk ikon menu di kiri atas untuk membuka semua fitur aplikasi.',
  },
  {
    key: 'hint_zone',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M10.15 17a6 6 0 0 1 3.73 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
      </div>
    ),
    title: 'Ganti Zona WiFi',
    desc: 'Ketuk tombol KRS atau SLK di header untuk berpindah zona data WiFi.',
  },
  {
    key: 'hint_entry',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      </div>
    ),
    title: 'Catat Pembayaran',
    desc: 'Buka menu Entry untuk mencatat pembayaran WiFi member per bulan.',
  },
];

const STORAGE_KEY = 'wifipay_onboarding_done';

interface Props {
  /** Tampilkan onboarding hint. Default: cek localStorage. */
  forceShow?: boolean;
}

export default function OnboardingHint({ forceShow }: Props) {
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState(0);
  const [exiting, setExiting]   = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (forceShow) { setVisible(true); return; }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setVisible(true);
    } catch { /* private mode — skip */ }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [forceShow]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }, 260);
  }

  function next() {
    if (step < HINTS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const hint = HINTS[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan awal WiFi Pay"
      style={{
        position:'fixed', inset:0, zIndex:9998,
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        padding:'0 12px 24px',
        background:'rgba(0,0,0,0.55)',
        animation: exiting
          ? 'fadeOut 260ms var(--ease-out) forwards'
          : 'fadeIn 200ms var(--ease-out) forwards',
      }}
      onClick={dismiss}
    >
      <div
        style={{
          width:'100%', maxWidth:400,
          background:'rgba(24,28,39,0.97)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'var(--r-xl)',
          padding:'20px 20px 16px',
          boxShadow:'var(--shadow-lg)',
          backdropFilter:'blur(16px)',
          animation: exiting
            ? 'slideDown 260ms var(--ease-in) forwards'
            : 'slideUp 320ms var(--ease-spring) forwards',
          position:'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{
          width:36, height:4, borderRadius:'var(--r-full)',
          background:'rgba(255,255,255,0.15)',
          margin:'0 auto 16px',
        }} />

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Tutup panduan"
          style={{
            position:'absolute', top:16, right:16,
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:'var(--r-full)', width:28, height:28,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--txt3)',
          }}
        >
          <X size={13} strokeWidth={1.5} />
        </button>

        {/* Content */}
        <div style={{ textAlign:'center', padding:'0 8px' }}>
          <div style={{ marginBottom:14 }}>{hint.icon}</div>
          <div style={{
            fontFamily:"var(--font-sans),sans-serif", fontWeight:800,
            fontSize:16, color:'var(--txt)', marginBottom:8,
          }}>
            {hint.title}
          </div>
          <div style={{
            fontFamily:"var(--font-sans),sans-serif",
            fontSize:13, color:'var(--txt2)', lineHeight:1.55,
            marginBottom:20,
          }}>
            {hint.desc}
          </div>
        </div>

        {/* Dots + Next */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          {/* Step dots */}
          <div style={{ display:'flex', gap:5 }}>
            {HINTS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 16 : 5,
                height:5, borderRadius:'var(--r-full)',
                background: i === step ? 'var(--zc)' : 'rgba(255,255,255,0.2)',
                transition:'width var(--t-base) var(--ease-spring), background var(--t-base)',
              }} />
            ))}
          </div>

          <button
            onClick={next}
            style={{
              background:'var(--zc)', color:'#fff', border:'none',
              borderRadius:'var(--r-md)', padding:'9px 20px',
              fontFamily:"var(--font-sans),sans-serif", fontWeight:600,
              fontSize:13, cursor:'pointer',
              minWidth:80,
              transition:'opacity var(--t-fast)',
            }}
          >
            {step < HINTS.length - 1 ? 'Lanjut' : 'Mengerti!'}
          </button>
        </div>

        {/* Skip text */}
        {step < HINTS.length - 1 && (
          <button
            onClick={dismiss}
            style={{
              display:'block', width:'100%', marginTop:12,
              background:'none', border:'none',
              fontFamily:"var(--font-sans),sans-serif",
              fontSize:11, color:'var(--txt4)',
              cursor:'pointer', textAlign:'center',
            }}
          >
            Lewati semua
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes slideDown { from { transform:translateY(0) } to { transform:translateY(40px); opacity:0 } }
      `}</style>
    </div>
  );
}
