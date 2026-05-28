// ══════════════════════════════════════════
// app/layout.tsx — Root layout
// task 3.01: Ganti Google Fonts <link> manual → next/font/google
//            Inter (sans) + JetBrains Mono (mono) sesuai spec prompt-personal.md
// Sesi Fix: Tambah Analytics + SpeedInsights + anti-FOUC script
// ══════════════════════════════════════════
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WiFi Pay',
  description: 'Sistem Manajemen Iuran WiFi Bulanan',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'WiFi Pay' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // task 1.07: dihapus maximumScale + userScalable — pelanggaran WCAG 1.4.4
  themeColor: '#121212',
};

// Anti-FOUC: baca preferensi tema dari localStorage SEBELUM hydration
// Mencegah flash warna dari dark → light (atau sebaliknya) saat load
const antiFOUC = `
(function() {
  try {
    var t = localStorage.getItem('wp_theme');
    document.body.classList.remove('light','gold');
    if (t === 'light') document.body.classList.add('light');
    else if (t === 'gold') document.body.classList.add('gold');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Anti-FOUC: jalankan sebelum render body */}
        <script dangerouslySetInnerHTML={{ __html: antiFOUC }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
