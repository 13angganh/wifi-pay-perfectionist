// ══════════════════════════════════════════
// app/global-error.tsx — Global error boundary (Root level)
// Menangkap error yang lolos dari semua boundary lain.
// Harus 'use client' dan memiliki html+body tag sendiri.
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    logger.error('GlobalError boundary caught:', error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{
        margin: 0,
        background: '#0F1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
          Terjadi Kesalahan
        </div>
        <div style={{ fontSize: 13, color: '#A1A8C1', maxWidth: 300, lineHeight: 1.6 }}>
          Aplikasi mengalami error yang tidak terduga. Coba muat ulang halaman.
        </div>
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            background: '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 28px',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Coba Lagi
        </button>
      </body>
    </html>
  );
}
