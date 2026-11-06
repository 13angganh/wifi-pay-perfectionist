// ══════════════════════════════════════════
// app/layout.tsx — Root layout
// task 3.01: Ganti Google Fonts <link> manual → next/font/google
//            Inter (sans) + JetBrains Mono (mono) sesuai spec prompt-personal.md
// Sesi Fix: Tambah Analytics + SpeedInsights + anti-FOUC script (v11.10.4: dipindah ke awal <body>, lihat lib/theme.ts)
// ══════════════════════════════════════════
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { THEME_BG, themeBootScript } from '@/lib/theme';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';

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
  themeColor: THEME_BG.dark, // default gelap; skrip tema (body) & AppShell menyesuaikan dengan tema aktif
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        {/* Tema (anti-flash): HARUS skrip pertama di <body> — di <head> document.body masih null sehingga tidak pernah bekerja */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
