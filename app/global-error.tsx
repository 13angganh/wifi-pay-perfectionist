'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Bug } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    logger.error('GlobalError boundary caught:', error);
  }, [error]);

  useEffect(() => {
    if (countdown <= 0) {
      reset();
      return;
    }

    const t = setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, reset]);

  return (
    <html lang="id">
      <body className="global-error-body">
        <div className="global-error-light" />

        <main className="global-error-card">
          <div className="global-error-icon">
            <AlertTriangle size={34} />
          </div>

          <div className="global-error-content">
            <div className="global-error-badge">WiFi Pay Recovery Mode</div>
            <h1>Terjadi Gangguan Sistem</h1>
            <p>
              Session Anda tetap aman. Aplikasi akan mencoba memulihkan halaman secara otomatis.
            </p>
          </div>

          <div className="global-error-actions">
            <button aria-label="Muat ulang aplikasi" onClick={reset} className="global-primary-btn">
              <RefreshCw size={16} />
              Coba Lagi ({countdown})
            </button>

            <button
              aria-label="Laporkan masalah aplikasi"
              className="global-secondary-btn"
              onClick={() => window.location.href = 'mailto:support@wifi-pay.local'}
            >
              <Bug size={16} />
              Report Issue
            </button>
          </div>

          <div className="global-safe-box">
            <ShieldCheck size={16} />
            Tidak perlu clear cache atau install ulang aplikasi.
          </div>
        </main>
      </body>
    </html>
  );
}
