// app/(app)/not-found.tsx — 404 page
import Link from 'next/link';
import { SearchX, Home } from 'lucide-react';

export default function NotFound() {
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
          background: 'var(--bg3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
        }}
      >
        <SearchX size={32} strokeWidth={1.5} style={{ color: 'var(--txt4)' }} />
      </div>

      {/* 404 label */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: 'var(--bg3)',
          lineHeight: 1,
          userSelect: 'none',
          letterSpacing: '-2px',
        }}
      >
        404
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 260 }}>
        <p
          style={{
            fontSize: 'var(--fs-heading)',
            fontWeight: 700,
            color: 'var(--txt1)',
            margin: 0,
          }}
        >
          Halaman Tidak Ditemukan
        </p>
        <p
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--txt3)',
            lineHeight: 'var(--lh-caption)',
            margin: 0,
          }}
        >
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
      </div>

      {/* Action */}
      <Link
        href="/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 20px',
          borderRadius: 'var(--r-md)',
          border: 'none',
          background: 'var(--zc)',
          color: '#fff',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'none',
          transition: 'all var(--t-fast)',
        }}
      >
        <Home size={14} />
        Ke Dashboard
      </Link>
    </div>
  );
}
