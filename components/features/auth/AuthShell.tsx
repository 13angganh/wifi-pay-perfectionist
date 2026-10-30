// ══════════════════════════════════════════
// components/features/auth/AuthShell.tsx — kerangka layar Login (REDESAIN T6)
// Logo asli (AppLogo l), nama aplikasi, versi, lalu kartu form (children).
// ══════════════════════════════════════════
'use client';

import type { ReactNode } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <AppLogo size="l" priority />
      <h1 className="auth-title">{APP_NAME}</h1>
      <span className="auth-ver">{APP_VERSION_FULL}</span>
      <div className="auth-card">{children}</div>
    </main>
  );
}
