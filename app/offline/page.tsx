'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg)',
        gap: 24,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 'var(--r-xl, 20px)',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'offlinePulse 2.4s ease-in-out infinite',
        }}
      >
        <WifiOff size={36} style={{ color: 'var(--c-belum, #EF4444)' }} />
      </div>

      {/* Teks */}
      <div>
        <div
          style={{
            fontSize: 'var(--fs-display, 20px)',
            fontWeight: 800,
            color: 'var(--txt)',
            marginBottom: 10,
            letterSpacing: '-0.02em',
          }}
        >
          Tidak Ada Akses Internet
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--txt3)',
            maxWidth: 280,
            lineHeight: 1.7,
            margin: '0 auto',
          }}
        >
          WiFi Pay memerlukan koneksi internet untuk mengakses data.
          Aktifkan WiFi atau paket data, lalu coba lagi.
        </p>
      </div>

      {/* Tips */}
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md, 12px)',
          padding: '14px 18px',
          width: '100%',
          maxWidth: 290,
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', color: 'var(--zc)', marginBottom: 10 }}>
          YANG BISA DILAKUKAN
        </div>
        {[
          ['📶', 'Aktifkan WiFi atau paket data'],
          ['✈️', 'Pastikan mode pesawat tidak aktif'],
          ['🔄', 'Muat ulang setelah internet aktif'],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12, color: 'var(--txt2)' }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Tombol */}
      <button
        className="lf-btn"
        onClick={() => window.location.reload()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: 220 }}
      >
        <RefreshCw size={15} />
        Coba Lagi
      </button>

      {/* Versi */}
      <div style={{ fontSize: 10, color: 'var(--txt5)', letterSpacing: '.06em' }}>
        WiFi Pay v11.3 Next
      </div>

      <style>{`
        @keyframes offlinePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.6; transform:scale(.94); }
        }
      `}</style>
    </div>
  );
}
