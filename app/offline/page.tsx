'use client';

import { WifiOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setRetrying(true);
      setTimeout(() => window.location.reload(), 1200);
    };

    window.addEventListener('online', onOnline);

    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (navigator.onLine) {
            window.location.reload();
          }
          return 5;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return (
    <main className="offline-root">
      <div className="offline-bg offline-bg-1" />
      <div className="offline-bg offline-bg-2" />

      <section className="offline-card">
        <div className="offline-chip">
          <span className="offline-dot" /> Offline Cache Active
        </div>

        <div className="wifi-wrap" aria-hidden="true">
          <div className="wifi-pulse" />
          <WifiOff size={42} />
        </div>

        <div className="signal-bars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <h1>Koneksi Terputus</h1>

        <p>
          Beberapa data masih bisa diakses secara offline. Aplikasi akan otomatis
          tersambung kembali saat internet tersedia.
        </p>

        <div className="offline-status">
          <ShieldCheck size={16} />
          Session dan cache lokal tetap aman.
        </div>

        <button
          aria-label="Coba sambungkan ulang aplikasi"
          className="retry-btn"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            window.location.reload();
          }}
        >
          <RefreshCw size={16} className={retrying ? 'spin' : ''} />
          {online ? 'Menyambungkan...' : `Coba Lagi (${seconds})`}
        </button>
      </section>

      <style jsx>{`
        .offline-root {
          min-height: 100dvh;
          overflow: hidden;
          background:
            radial-gradient(circle at top, rgba(59,130,246,.25), transparent 40%),
            linear-gradient(180deg,#07111f,#091423 60%,#050816);
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          padding:24px;
          color:white;
          font-family:Inter,sans-serif;
        }
        .offline-bg {
          position:absolute;
          border-radius:999px;
          filter:blur(80px);
          opacity:.45;
          animation:float 8s ease-in-out infinite;
        }
        .offline-bg-1 {
          width:280px;height:280px;
          background:#2563eb;
          top:-80px;left:-50px;
        }
        .offline-bg-2 {
          width:220px;height:220px;
          background:#06b6d4;
          bottom:-60px;right:-30px;
          animation-delay:2s;
        }
        .offline-card {
          width:min(100%,420px);
          position:relative;
          z-index:2;
          backdrop-filter:blur(22px);
          background:rgba(15,23,42,.55);
          border:1px solid rgba(255,255,255,.08);
          border-radius:28px;
          padding:28px;
          box-shadow:0 10px 40px rgba(0,0,0,.35);
          text-align:center;
        }
        .offline-chip {
          display:inline-flex;
          align-items:center;
          gap:8px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.08);
          border-radius:999px;
          padding:8px 14px;
          font-size:12px;
          margin-bottom:24px;
        }
        .offline-dot {
          width:8px;height:8px;border-radius:50%;background:#22c55e;
          box-shadow:0 0 12px #22c55e;
        }
        .wifi-wrap {
          width:110px;height:110px;border-radius:50%;
          margin:0 auto 16px;
          position:relative;
          display:flex;align-items:center;justify-content:center;
          background:rgba(37,99,235,.12);
        }
        .wifi-pulse {
          position:absolute;inset:0;border-radius:50%;
          border:2px solid rgba(96,165,250,.5);
          animation:pulse 2s infinite;
        }
        .signal-bars {
          display:flex;gap:6px;justify-content:center;
          margin-bottom:18px;
        }
        .signal-bars span {
          width:8px;border-radius:999px;background:#60a5fa;
          animation:bars 1.2s infinite ease-in-out;
        }
        .signal-bars span:nth-child(1){height:10px}
        .signal-bars span:nth-child(2){height:18px;animation-delay:.15s}
        .signal-bars span:nth-child(3){height:26px;animation-delay:.3s}
        .signal-bars span:nth-child(4){height:34px;animation-delay:.45s}
        h1 {font-size:32px;line-height:1.1;margin:0 0 14px;font-weight:800}
        p {
          color:rgba(255,255,255,.72);
          line-height:1.7;
          font-size:15px;
          margin:0 auto 20px;
        }
        .offline-status {
          display:flex;align-items:center;justify-content:center;gap:8px;
          font-size:13px;color:#cbd5e1;
          margin-bottom:22px;
        }
        .retry-btn {
          width:100%;border:none;cursor:pointer;
          border-radius:16px;padding:15px 18px;
          background:linear-gradient(135deg,#2563eb,#0891b2);
          color:white;font-size:15px;font-weight:700;
          display:flex;align-items:center;justify-content:center;gap:10px;
        }
        .retry-btn:disabled {opacity:.8}
        .spin {animation:spin 1s linear infinite}
        @keyframes pulse {
          0%{transform:scale(.9);opacity:1}
          100%{transform:scale(1.4);opacity:0}
        }
        @keyframes bars {
          50%{opacity:.3;transform:translateY(3px)}
        }
        @keyframes float {
          50%{transform:translateY(20px)}
        }
        @keyframes spin {
          to {transform:rotate(360deg)}
        }
        @media (prefers-reduced-motion: reduce) {
          * {animation:none !important;transition:none !important}
        }
      `}</style>
    </main>
  );
}
