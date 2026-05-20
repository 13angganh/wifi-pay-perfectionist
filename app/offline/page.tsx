// ══════════════════════════════════════════
// app/offline/page.tsx — Halaman offline PWA (Server Component)
// Ditampilkan oleh Service Worker saat navigasi gagal & tidak ada cache.
// Tombol reload ada di ReloadButton.tsx (Client Component terpisah).
// ══════════════════════════════════════════

import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import ReloadButton from './ReloadButton';

export const metadata: Metadata = {
  title: 'Offline — WiFi Pay',
  description: 'Tidak ada koneksi internet',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 16,
      padding: 24,
      background: 'var(--bg, #0F1117)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 'var(--r-xl, 20px)',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <WifiOff size={28} color="#EF4444" strokeWidth={1.5} />
      </div>

      <div style={{
        fontFamily: 'var(--font-sans, system-ui), sans-serif',
        fontWeight: 800,
        fontSize: 20,
        color: 'var(--txt, #fff)',
        letterSpacing: '-0.02em',
      }}>
        Tidak Ada Koneksi
      </div>

      <div style={{
        fontFamily: 'var(--font-sans, system-ui), sans-serif',
        fontSize: 13,
        color: 'var(--txt2, #A1A8C1)',
        maxWidth: 280,
        lineHeight: 1.6,
      }}>
        Periksa koneksi internet kamu, lalu muat ulang halaman.
      </div>

      <ReloadButton />
    </div>
  );
}
