// ══════════════════════════════════════════
// lib/env.ts — Zod env validation
// Validasi semua env vars saat startup. Crash dengan pesan jelas
// jika ada yang kurang — lebih baik gagal tegas daripada silent error.
// ══════════════════════════════════════════

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY:             z.string().min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY wajib diisi'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:         z.string().min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN wajib diisi'),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:        z.string().url('NEXT_PUBLIC_FIREBASE_DATABASE_URL harus URL valid'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:          z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID wajib diisi'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:      z.string().min(1, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET wajib diisi'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID wajib diisi'),
  NEXT_PUBLIC_FIREBASE_APP_ID:              z.string().min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID wajib diisi'),
  NEXT_PUBLIC_APP_URL:                      z.string().url().optional(),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success && typeof window === 'undefined') {
  console.error('[WiFi Pay] ❌ Environment variables tidak lengkap:'); // reason: module-level, logger belum init
  _parsed.error.errors.forEach((e: { path: (string | number)[]; message: string }) => {
    console.error(`  - ${e.path.join('.')}: ${e.message}`); // reason: idem
  });
  throw new Error('[WiFi Pay] Missing required env vars. Cek .env.local.example untuk panduan.');
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
