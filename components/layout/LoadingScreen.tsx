// components/layout/LoadingScreen.tsx
// FIX: Hilangkan logo & nama app — langsung loading minimalis
// Parent (AppLayout) yang kontrol kapan unmount (berdasarkan authChecked + uid)
'use client';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      zIndex:9999,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      gap:16,
    }}>
      {/* Progress bar animasi */}
      <div style={{
        width:100, height:3,
        background:'var(--bg3)',
        borderRadius:'var(--r-full)',
        overflow:'hidden',
      }}>
        <div style={{
          height:'100%',
          background:'linear-gradient(90deg,#C9952A,#E8B84B)',
          borderRadius:'var(--r-full)',
          animation:'lsBar 1.8s var(--ease-smooth,ease) forwards',
        }} />
      </div>

      {/* Dots */}
      <div style={{ display:'flex', gap:5 }}>
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
