// ══════════════════════════════════════════
// constants/routes.ts — SATU-SATUNYA sumber kebenaran semua route
// Gunakan ROUTES.* di seluruh project — tidak pernah string literal path.
// ══════════════════════════════════════════

export const ROUTES = {
  // Public
  LOGIN:       '/login',

  // Protected
  DASHBOARD:   '/dashboard',
  ENTRY:       '/entry',
  REKAP:       '/rekap',
  TUNGGAKAN:   '/tunggakan',
  MEMBERS:     '/members',
  GRAFIK:      '/grafik',
  LOG:         '/log',
  OPERASIONAL: '/operasional',
  SETTINGS:    '/settings',

  // PWA
  OFFLINE:     '/offline',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
