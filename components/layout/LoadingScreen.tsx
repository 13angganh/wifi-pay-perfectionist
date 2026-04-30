// components/layout/LoadingScreen.tsx — Fase 4: navy design, Lucide Wifi
'use client';

import { Wifi } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      zIndex:9999,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:0,
    }}>
      {/* Logo dengan glow + pulse */}
      <div className="ls-logo-wrap">
        <div style={{
          width:72, height:72, borderRadius:20,
          background:'linear-gradient(135deg,#3B82F6,#1D4ED8)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 8px 32px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
          animation:'lsPulse 2s ease-in-out infinite',
          marginBottom:20,
        }}>
          <Wifi size={34} color="#fff" strokeWidth={1.5} />
        </div>
      </div>

      {/* Nama app */}
      <div className="ls-name" style={{
        fontFamily:"'Syne',sans-serif",
        fontWeight:800,
        fontSize:26,
        letterSpacing:'-0.03em',
        color:'var(--txt)',
        marginBottom:4,
      }}>
        WiFi Pay
      </div>

      {/* Sub */}
      <div className="ls-sub" style={{
        fontSize:10,
        color:'var(--txt4)',
        letterSpacing:'.14em',
        textTransform:'uppercase',
        marginBottom:40,
      }}>
        Sistem Iuran Bulanan
      </div>

      {/* Progress bar */}
      <div className="ls-bar" style={{ width:120, height:3, background:'var(--bg3)', borderRadius:'var(--r-full)', overflow:'hidden', marginBottom:20 }}>
        <div className="ls-fill" style={{
          height:'100%',
          background:'linear-gradient(90deg,#3B82F6,#60A5FA)',
          borderRadius:'var(--r-full)',
          animation:'lsBar 1.8s var(--ease-smooth) infinite',
        }} />
      </div>

      {/* Dots */}
      <div className="ls-dots" style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:5, height:5, borderRadius:'50%',
            background:'#3B82F6',
            animation:`lsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity:.3,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes lsPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 32px rgba(59,130,246,0.4); }
          50%       { transform: scale(1.04); box-shadow: 0 12px 40px rgba(59,130,246,0.6); }
        }
        @keyframes lsBar {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 80%;  margin-left: 0; }
          100% { width: 0%;   margin-left: 100%; }
        }
        @keyframes lsDot {
          0%, 100% { opacity: .3; transform: translateY(0); }
          50%       { opacity: 1;  transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
