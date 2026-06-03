// components/layout/LoadingScreen.tsx
// FIX 5: Loading screen dengan logo WiFi Pay + nama + animasi loading di bawah
'use client';

import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0,
      background:'var(--bg)',
      zIndex:9999,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:0,
    }}>
      {/* Logo */}
      <div style={{
        width:72, height:72,
        borderRadius:20,
        overflow:'hidden',
        border:'1px solid rgba(201,149,42,0.25)',
        boxShadow:'0 4px 24px rgba(201,149,42,0.18)',
        marginBottom:14,
        animation:'lsLogo 0.5s ease-out both',
      }}>
        <Image
          src="/icon-192.png"
          alt="WiFi Pay"
          width={192}
          height={192}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
          priority
        />
      </div>

      {/* App name */}
      <div style={{
        fontFamily:'var(--font-sans),sans-serif',
        fontWeight:800,
        fontSize:22,
        color:'var(--txt)',
        letterSpacing:'.02em',
        animation:'lsFade 0.5s 0.1s ease-out both',
        opacity:0,
      }}>
        WiFi Pay
      </div>

      {/* Tagline */}
      <div style={{
        fontSize:11,
        color:'var(--txt4)',
        marginTop:4,
        marginBottom:32,
        letterSpacing:'.06em',
        animation:'lsFade 0.5s 0.2s ease-out both',
        opacity:0,
      }}>
        v11.3 Next
      </div>

      {/* Progress bar */}
      <div style={{
        width:96, height:3,
        background:'var(--bg3)',
        borderRadius:'var(--r-full)',
        overflow:'hidden',
        animation:'lsFade 0.4s 0.3s ease-out both',
        opacity:0,
      }}>
        <div style={{
          height:'100%',
          background:'linear-gradient(90deg,#C9952A,#E8B84B)',
          borderRadius:'var(--r-full)',
          animation:'lsBar 1.8s 0.4s var(--ease-smooth,ease) forwards',
          width:0,
        }} />
      </div>

      {/* Dots */}
      <div style={{ display:'flex', gap:5, marginTop:12, animation:'lsFade 0.4s 0.4s ease-out both', opacity:0 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:4, height:4, borderRadius:'50%',
            background:'#C9952A',
            animation:`lsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity:.3,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes lsLogo {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes lsFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lsBar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes lsDot {
          0%, 100% { opacity: .3; transform: translateY(0); }
          50%       { opacity: 1;  transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
