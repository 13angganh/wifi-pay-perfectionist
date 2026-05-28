'use client';

import { WifiOff, RefreshCw, Wifi, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [countdown, setCountdown] = useState(8);
  const [checking, setChecking] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setChecking(true);
      setTimeout(() => window.location.reload(), 1200);
    };

    window.addEventListener('online', onOnline);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (navigator.onLine) {
            onOnline();
          }
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return (
    <main className="offline-shell">
      <div className="offline-ambient offline-ambient-1" />
      <div className="offline-ambient offline-ambient-2" />

      <section className="offline-card" aria-live="polite">
        <div className="offline-chip">
          <span className="offline-chip-dot" />
          Mode Offline
        </div>

        <div className="wifi-wrap" aria-hidden="true">
          <div className="wifi-glow" />
          <WifiOff size={44} />
          <div className="signal-bars">
            <span />
            <span />
            <span />
          </div>
        </div>

        <h1>Koneksi Terputus</h1>
        <p className="offline-subtitle">
          Beberapa data masih bisa diakses secara offline sementara aplikasi mencoba menyambungkan ulang jaringan.
        </p>

        <div className="offline-status">
          <Wifi size={16} />
          {online ? 'Koneksi ditemukan' : 'Menunggu jaringan tersedia'}
        </div>

        <button
          aria-label="Periksa ulang koneksi internet"
          disabled={checking}
          className="offline-button"
          onClick={() => {
            setChecking(true);
            setTimeout(() => window.location.reload(), 800);
          }}
        >
          <RefreshCw size={16} className={checking ? 'spin' : ''} />
          {checking ? 'Menyambungkan...' : 'Perbarui Sekarang'}
        </button>

        <div className="offline-footer">
          <div>
            Reconnect otomatis dalam <strong>{countdown}s</strong>
          </div>
          <div className="cache-info">
            <CheckCircle2 size={14} />
            Cache offline aktif
          </div>
        </div>
      </section>

      <style jsx>{`
        .offline-shell {
          min-height: 100dvh;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(59,130,246,.22), transparent 40%),
            linear-gradient(180deg,#07111f 0%,#081827 45%,#020617 100%);
        }

        .offline-ambient {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          opacity: .5;
          animation: float 10s ease-in-out infinite;
        }

        .offline-ambient-1 {
          width: 240px;
          height: 240px;
          background: #2563eb;
          top: -40px;
          left: -80px;
        }

        .offline-ambient-2 {
          width: 280px;
          height: 280px;
          background: #0ea5e9;
          bottom: -80px;
          right: -100px;
          animation-delay: 2s;
        }

        .offline-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(15,23,42,.72);
          backdrop-filter: blur(18px);
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 10px 50px rgba(0,0,0,.45);
          text-align: center;
        }

        .offline-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
          color: #dbeafe;
          font-size: 12px;
          margin-bottom: 22px;
        }

        .offline-chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #38bdf8;
          box-shadow: 0 0 12px #38bdf8;
        }

        .wifi-wrap {
          position: relative;
          width: 110px;
          height: 110px;
          margin: 0 auto 24px;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(37,99,235,.22), rgba(14,165,233,.08));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .wifi-glow {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(59,130,246,.35), transparent 70%);
          animation: pulse 2.8s infinite;
        }

        .signal-bars {
          position: absolute;
          bottom: 16px;
          display: flex;
          gap: 4px;
        }

        .signal-bars span {
          width: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,.8);
          animation: bars 1.2s infinite ease-in-out;
        }

        .signal-bars span:nth-child(1){height:10px}
        .signal-bars span:nth-child(2){height:16px;animation-delay:.2s}
        .signal-bars span:nth-child(3){height:22px;animation-delay:.4s}

        h1 {
          color: white;
          font-size: 30px;
          line-height: 1.1;
          margin: 0 0 12px;
        }

        .offline-subtitle {
          color: rgba(255,255,255,.72);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .offline-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.05);
          color: #bfdbfe;
          font-size: 14px;
          margin-bottom: 18px;
        }

        .offline-button {
          width: 100%;
          border: 0;
          border-radius: 18px;
          padding: 16px;
          font-size: 15px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg,#2563eb,#0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .offline-button:disabled {opacity:.7}

        .offline-footer {
          margin-top: 18px;
          color: rgba(255,255,255,.7);
          font-size: 13px;
          display: grid;
          gap: 10px;
        }

        .cache-info {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .spin {animation: spin 1s linear infinite}

        @keyframes spin {to{transform:rotate(360deg)}}
        @keyframes pulse {
          0%,100%{transform:scale(1);opacity:.6}
          50%{transform:scale(1.08);opacity:1}
        }
        @keyframes float {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(20px)}
        }
        @keyframes bars {
          0%,100%{opacity:.35}
          50%{opacity:1}
        }

        @media (prefers-reduced-motion: reduce) {
          *, *:before, *:after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
