// ══════════════════════════════════════════
// proxy.ts — Soft session guard (Edge Runtime)
// (renamed dari middleware.ts → Next.js 16+ convention)
// 
// KEPUTUSAN TEKNIKAL: Middleware ini "soft" (tidak redirect ke /login
// jika cookie tidak ada) untuk menghindari redirect loop dengan
// Firebase browserLocalPersistence.
//
// Alasan: Firebase menyimpan sesi di IndexedDB (tidak bisa dibaca
// Edge Runtime). Jika middleware redirect ke /login saat cookie
// tidak ada, dan Firebase punya sesi yang valid → redirect loop.
//
// Yang dilakukan middleware ini:
// - Jika ada cookie wp_session + akses /login → redirect ke /dashboard
//   (skip layar login untuk user yang sudah login)
// - Semua kasus lain → pass through ke client
// - Client-side auth di app/(app)/layout.tsx tetap jadi guard utama.
// ══════════════════════════════════════════

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';

const SESSION_COOKIE = 'wp_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession   = request.cookies.has(SESSION_COOKIE);

  // Optimization: user sudah punya sesi → skip halaman login
  if (hasSession && pathname === ROUTES.LOGIN) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware di semua route kecuali static files & API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png|manifest.json|sw.js|icons|api).*)',
  ],
};
