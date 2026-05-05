// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fase 2: reactStrictMode diaktifkan kembali
  // Firebase listener sudah idempotent — cleanup unsub() ada di semua useEffect
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
