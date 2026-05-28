'use client';

import { WifiOff, RefreshCw, Wifi, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [online, setOnline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setRetrying(true);
      setTimeout(() => window.location.reload(), 1200);
    };

    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (navigator.onLine) window.location.reload();
          return 8;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const reconnect = () => {
    setRetrying(true);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <main className="offline-root">
      <div className="offline-ambient offline-ambient-a" />
      <div className="offline-ambient offline-ambient-b" />

      <section className="offline-card" aria-label="Offline status">
        <div className="offline-chip">
          <span className={`offline-dot ${online ? 'online' : ''}`} />
          {online ? 'Koneksi kembali tersedia' : 'Mode Offline Aktif'}
        </div>

        <div className="offline-wifi-wrap">
          <div className="offline-ring" />
          <div className="offline-ring delay" />
          <div className="offline-icon">
            {online ? <Wifi size={38} /> : <WifiOff size={38} />}
          </div>
        </div>

        <h1>Koneksi Terputus</h1>

        <p className="offline-desc">
          Beberapa data masih bisa diakses secara offline. Aplikasi akan otomatis menyambung ulang saat internet kembali tersedia.
        </p>

        <div className="offline-status">
          <ShieldCheck size={16} />
          Cache aplikasi masih aktif dan aman digunakan.
        </div>

        <button
          aria-label="Coba sambungkan ulang aplikasi"
          className="offline-btn"
          onClick={reconnect}
          disabled={retrying}
        >
          <RefreshCw size={16} className={retrying ? 'spin' : ''} />
          {retrying ? 'Menyambungkan...' : 'Perbarui Sekarang'}
        </button>

        <div className="offline-footer">
          Auto reconnect dalam {countdown} detik
        </div>
      </section>

      <style jsx>{`
        .offline-root {
          min-height: 100dvh;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,.24), transparent 30%),
            radial-gradient(circle at bottom right, rgba(168,85,247,.18), transparent 35%),
            #07111f;
          color: white;
        }

        .offline-ambient {
          position: absolute;
          width: 340px;
          height: 340px;
          filter: blur(80px);
          opacity: .5;
          animation: float 12s ease-in-out infinite;
        }

        .offline-ambient-a {
          top: -120px;
          left: -80px;
          background: #2563eb;
        }

        .offline-ambient-b {
          bottom: -120px;
          right: -80px;
          background: #9333ea;
          animation-delay: -6s;
        }

        .offline-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          border-radius: 28px;
          padding: 32px 24px;
          backdrop-filter: blur(22px);
          background: rgba(10,16,30,.62);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 20px 60px rgba(0,0,0,.45);
          text-align: center;
        }

        .offline-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.08);
          font-size: 12px;
          margin-bottom: 26px;
        }

        .offline-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
        }

        .offline-dot.online {
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }

        .offline-wifi-wrap {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .offline-icon {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(59,130,246,.32), rgba(59,130,246,.08));
          border: 1px solid rgba(255,255,255,.1);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .offline-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.12);
          animation: pulse 3s infinite;
        }

        .offline-ring.delay { animation-delay: 1.5s; }

        h1 {
          font-size: 32px;
          line-height: 1.1;
          margin: 0 0 14px;
          font-weight: 800;
          letter-spacing: -.03em;
        }

        .offline-desc {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255,255,255,.76);
          margin: 0 auto 18px;
          max-width: 320px;
        }

        .offline-status {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          font-size:13px;
          color:#cbd5e1;
          margin-bottom:24px;
        }

        .offline-btn {
          width:100%;
          min-height:52px;
          border:none;
          border-radius:18px;
          font-size:15px;
          font-weight:700;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          cursor:pointer;
        }

        .offline-btn:disabled {
          opacity:.7;
          cursor:not-allowed;
        }

        .offline-footer {
          margin-top:16px;
          font-size:12px;
          color:rgba(255,255,255,.55);
        }

        .spin { animation: spin 1s linear infinite; }

        @keyframes pulse {
          0% { transform: scale(.8); opacity: 0; }
          70% { opacity: .5; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(18px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
