// sentry.server.config.ts — task 3.03
// Sentry SDK initialization untuk server-side (Node.js / Next.js SSR).
// File ini di-load otomatis oleh @sentry/nextjs sebelum Next.js server init.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  tracesSampleRate: 0.1,

  initialScope: {
    tags: {
      app: 'wifi-pay',
      version: '11.2',
    },
  },
});
