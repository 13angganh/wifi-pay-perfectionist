// sentry.client.config.ts — task 3.03
// Sentry SDK initialization untuk browser/client-side.
// File ini di-load otomatis oleh @sentry/nextjs sebelum Next.js app init.
// Isi NEXT_PUBLIC_SENTRY_DSN di .env.local sebelum deploy.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Hanya aktifkan di production — matikan saat dev agar tidak banjir event
  enabled: process.env.NODE_ENV === 'production',

  // Kirim 10% dari transactions sebagai performance sample
  tracesSampleRate: 0.1,

  // Kirim 100% error — tidak ada sampling pada error
  // (default sudah 1.0, tapi eksplisit lebih jelas)
  sampleRate: 1.0,

  // Tambahkan context WiFi Pay
  initialScope: {
    tags: {
      app: 'wifi-pay',
      version: '11.2',
    },
  },
});
