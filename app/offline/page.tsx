'use client';

import { WifiOff, RefreshCw, ShieldCheck, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [retryIn, setRetryIn] = useState(8);
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
      setRetryIn((v) => {
        if (v <= 1) {
          if (navigator.onLine) {
            setChecking(true);
            window.location.reload();
          }
          return 8;
        }
        return v - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return (
    <main className="offline-shell">
      <div className="offline-ambient offline-ambient-a" />
      <div className="offline-ambient offline-ambient-b" />

      <section className="offline-card" aria-live="polite">
        <div className="offline-chip">
          <Radio size={14} />
          Mode Offline Aktif
        </div>

        <div className="offline-signal-wrap">
          <div className="offline-glow" />
          <div className="offline-signal">
            <WifiOff size={38} />
          </div>
        </div>

        <div className="offline-copy">
          <h1>Koneksi Terputus</h1>
          <p>
            Beberapa data masih bisa diakses secara offline.
            Aplikasi akan otomatis menyambung ulang saat internet kembali.
          </p>
        </div>

        <div className="offline-status-grid">
          <div className="offline-status-box">
            <ShieldCheck size={16} />
            Session & cache lokal tetap aman
          </div>

          <div className="offline-status-box">
            <RefreshCw size={16} className={checking ? 'spin' : ''} />
            {online ? 'Menyambungkan ulang...' : `Auto reconnect ${retryIn} detik`}
          </div>
        </div>

        <button
          aria-label="Coba sambungkan ulang aplikasi"
          className="offline-button"
          disabled={checking}
          onClick={() => {
            setChecking(true);
            window.location.reload();
          }}
        >
          <RefreshCw size={16} className={checking ? 'spin' : ''} />
          {checking ? 'Memeriksa koneksi...' : 'Perbarui Sekarang'}
        </button>

        <div className="offline-footer">
          WiFi Pay akan memakai soft refresh saat versi baru tersedia.
        </div>
      </section>
    </main>
  );
}
