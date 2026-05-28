'use client';

import { useEffect, useMemo, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Radio } from 'lucide-react';

export default function OfflinePage() {
  const [online, setOnline] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setChecking(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    if (online) return;

    const interval = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) {
          if (navigator.onLine) {
            window.location.reload();
          }
          return 8;
        }
        return v - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [online]);

  const statusText = useMemo(() => {
    if (checking) return 'Menyambungkan ulang aplikasi...';
    return 'Beberapa data masih bisa diakses secara offline';
  }, [checking]);

  return (
    <main className="offline-root">
      <div className="offline-ambient offline-ambient-1" />
      <div className="offline-ambient offline-ambient-2" />
      <div className="offline-grid" />

      <section className="offline-card" aria-label="Status koneksi offline">
        <div className="offline-chip">
          <Radio size={14} />
          MODE OFFLINE
        </div>

        <div className="wifi-visual" aria-hidden="true">
          <div className="wifi-ring wifi-ring-1" />
          <div className="wifi-ring wifi-ring-2" />
          <div className="wifi-ring wifi-ring-3" />
          <div className="wifi-core">
            <WifiOff size={34} />
          </div>
        </div>

        <div className="offline-copy">
          <h1>Koneksi Terputus</h1>
          <p>{statusText}</p>
        </div>

        <div className="offline-status-box">
          <div>
            <span className="offline-label">CACHE STATUS</span>
            <strong>Halaman tersimpan tersedia</strong>
          </div>
          <CheckCircle2 size={18} />
        </div>

        <button
          aria-label="Coba sambungkan ulang aplikasi"
          disabled={checking}
          className="offline-button"
          onClick={() => {
            setChecking(true);
            setTimeout(() => {
              window.location.reload();
            }, 600);
          }}
        >
          <RefreshCw size={17} className={checking ? 'spin' : ''} />
          {checking ? 'Menyambungkan...' : 'Periksa Koneksi'}
        </button>

        <div className="offline-footer">
          <span>Auto reconnect dalam {countdown} detik</span>
          <span>WiFi Pay PWA</span>
        </div>
      </section>

      <style jsx>{`
        .offline-root {
          min-height: 100dvh;
          overflow: hidden;
          position: relative;
          background:
            radial-gradient(circle at top, rgba(37,99,235,.28), transparent 38%),
            radial-gradient(circle at bottom right, rgba(168,85,247,.18), transparent 30%),
            #07111f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: white;
        }

        .offline-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black, transparent 85%);
        }

        .offline-ambient {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          opacity: .55;
          animation: float 8s ease-in-out infinite;
        }

        .offline-ambient-1 {
          width: 240px;
          height: 240px;
          background: #2563eb;
          top: -40px;
          left: -30px;
        }

        .offline-ambient-2 {
          width: 260px;
          height: 260px;
          background: #9333ea;
          bottom: -70px;
          right: -50px;
          animation-delay: -4s;
        }

        .offline-card {
          width: min(100%, 420px);
          position: relative;
          z-index: 1;
          backdrop-filter: blur(22px);
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 32px;
          padding: 28px;
          box-shadow: 0 25px 80px rgba(0,0,0,.45);
        }

        .offline-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.06);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: .12em;
          margin-bottom: 24px;
        }

        .wifi-visual {
          position: relative;
          width: 180px;
          height: 180px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wifi-ring {
          position: absolute;
          border-radius: 999px;
          border: 2px solid rgba(96,165,250,.18);
          animation: pulse 3s infinite;
        }

        .wifi-ring-1 { width: 90px; height: 90px; }
        .wifi-ring-2 { width: 130px; height: 130px; animation-delay: .6s; }
        .wifi-ring-3 { width: 170px; height: 170px; animation-delay: 1.2s; }

        .wifi-core {
          width: 78px;
          height: 78px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 0 40px rgba(37,99,235,.55);
        }

        .offline-copy {
          text-align: center;
        }

        .offline-copy h1 {
          margin: 0 0 10px;
          font-size: clamp(32px, 7vw, 40px);
          line-height: 1;
        }

        .offline-copy p {
          margin: 0 auto;
          max-width: 320px;
          color: rgba(255,255,255,.72);
          font-size: 15px;
          line-height: 1.7;
        }

        .offline-status-box {
          margin-top: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          padding: 16px;
        }

        .offline-label {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          letter-spacing: .12em;
          color: rgba(255,255,255,.5);
        }

        .offline-button {
          margin-top: 22px;
          width: 100%;
          border: 0;
          border-radius: 18px;
          padding: 16px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .offline-button:disabled {
          opacity: .7;
        }

        .offline-footer {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
          color: rgba(255,255,255,.55);
        }

        .spin {
          animation: spin .9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { transform: scale(.82); opacity: .2; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.08); opacity: 0; }
        }

        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
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
