// components/layout/LoadingScreen.tsx — Fase 4: logo baru, hapus subtitle, delay lebih lama
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
export default function LoadingScreen() {
  // Minimum 1.8 detik supaya tidak terlalu cepat
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      zIndex:9999,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
    }}>
      {/* Logo gambar nyata */}
      <div style={{
        width:96, height:96,
        borderRadius:24,
        overflow:'hidden',
        marginBottom:20,
        boxShadow:'0 8px 40px rgba(201,149,42,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
        animation:'lsPulse 2s ease-in-out infinite',
      }}>
        <Image
          src="/icon-512.png"
          alt="WiFi Pay"
          width={512}
          height={512}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          priority
        />
      </div>

      {/* Nama app saja, tanpa subtitle */}
      <div style={{
        fontFamily:"var(--font-sans),sans-serif",
        fontWeight:800,
        fontSize:26,
        letterSpacing:'-0.03em',
        color:'var(--txt)',
        marginBottom:40,
      }}>
        WiFi Pay
      </div>

      {/* Progress bar */}
      <div style={{
        width:120, height:3,
        background:'var(--bg3)',
        borderRadius:'var(--r-full)',
        overflow:'hidden',
        marginBottom:20,
      }}>
        <div style={{
          height:'100%',
          background:'linear-gradient(90deg,#C9952A,#E8B84B)',
          borderRadius:'var(--r-full)',
          animation:'lsBar 1.8s var(--ease-smooth) forwards',
        }} />
      </div>

      {/* Dots */}
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:5, height:5, borderRadius:'50%',
            background:'#C9952A',
            animation:`lsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity:.3,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes lsPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 40px rgba(201,149,42,0.25); }
          50%       { transform: scale(1.04); box-shadow: 0 12px 48px rgba(201,149,42,0.4); }
        }
        @keyframes lsBar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes lsDot {
          0%, 100% { opacity: .3; transform: translateY(0); }
          50%       { opacity: 1;  transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
