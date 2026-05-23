// ══════════════════════════════════════════
// lib/env.ts — Zod env validation
// PENTING: throw hanya di runtime (server), TIDAK saat build time static analysis
// ══════════════════════════════════════════

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY:             z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:         z.string().min(1),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:        z.string().url(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:          z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:      z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID:              z.string().min(1),
  NEXT_PUBLIC_APP_URL:                      z.string().url().optional(),
});

// Jangan throw di build time — hanya validasi saat server runtime
// Build time: NEXT_PHASE === 'phase-production-build'
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success && !isBuildTime && typeof window === 'undefined') {
  const missing = _parsed.error.errors.map((e: { path: (string | number)[]; message: string }) =>
    `  - ${e.path.join('.')}: ${e.message}`
  ).join('\n');
  console.error('[WiFi Pay] ❌ Environment variables tidak lengkap:\n' + missing);
  // Hanya warn, tidak throw — biarkan Firebase sendiri yang error dengan pesan jelas
}

export const env = {
  NEXT_PUBLIC_FIREBASE_API_KEY:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY             ?? '',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? '',
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL        ?? '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID          ?? '',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? '',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  NEXT_PUBLIC_FIREBASE_APP_ID:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? '',
  NEXT_PUBLIC_APP_URL:                      process.env.NEXT_PUBLIC_APP_URL                      ?? 'http://localhost:3000',
} as const;
