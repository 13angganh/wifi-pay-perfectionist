// app/(app)/error.tsx — Error boundary page
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[WiFi-Pay Error]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1.5rem',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--r-lg)',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <AlertTriangle size={32} strokeWidth={1.5} style={{ color: 'var(--c-belum)' }} />
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 280 }}>
        <p
          style={{
            fontSize: 'var(--fs-heading)',
            fontWeight: 700,
            color: 'var(--txt1)',
            margin: 0,
          }}
        >
          Terjadi Kesalahan
        </p>
        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--txt3)',
            lineHeight: 'var(--lh-caption)',
            margin: 0,
          }}
        >
          {error.message || 'Halaman ini mengalami error. Coba muat ulang atau kembali ke dashboard.'}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg3)',
            color: 'var(--txt2)',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
        >
          <RotateCcw size={14} />
          Coba Lagi
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--r-md)',
            border: 'none',
            background: 'var(--zc)',
            color: '#fff',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
        >
          <Home size={14} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
