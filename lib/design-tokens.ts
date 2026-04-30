/**
 * lib/design-tokens.ts
 * JS mirror dari CSS custom properties yang relevan di runtime.
 *
 * SOURCE OF TRUTH tetap di styles/tokens.css.
 * Gunakan file ini untuk:
 *   - chart theming (Chart.js dataset colors, gridColor, dll)
 *   - programmatic style calculations
 *   - export PDF / share image colors
 *
 * PENTING: Jika mengubah nilai token, update KEDUANYA —
 * styles/tokens.css (untuk CSS) DAN file ini (untuk JS).
 */

// ── Zone colors ─────────────────────────────────────────
export const ZC_KRS  = '#3B82F6';
export const ZC_SLK  = '#F97316';
export const ZC_TOT  = '#22C55E';

export const ZC: Record<string, string> = {
  KRS  : ZC_KRS,
  SLK  : ZC_SLK,
  TOTAL: ZC_TOT,
};

// ── Status colors ────────────────────────────────────────
export const C_LUNAS = '#22C55E';
export const C_BELUM = '#EF4444';
export const C_FREE  = '#3B82F6';

// ── Surface colors (dark, default) ──────────────────────
export const SURFACE = {
  bg : '#0F1117',
  bg2: '#181C27',
  bg3: '#1E2235',
  bg4: '#252B40',
  border: '#252B40',
} as const;

// ── Surface colors (light) ───────────────────────────────
export const SURFACE_LIGHT = {
  bg : '#F8FAFC',
  bg2: '#FFFFFF',
  bg3: '#F0F4F8',
  bg4: '#E4EAF0',
  border: '#E4EAF0',
} as const;

// ── Typography colors (dark) ─────────────────────────────
export const TEXT = {
  txt : '#FFFFFF',
  txt2: '#A1A8C1',
  txt3: '#6B7494',
  txt4: '#4A5270',
  txt5: '#2D3452',
} as const;

// ── Typography colors (light) ────────────────────────────
export const TEXT_LIGHT = {
  txt : '#0F1117',
  txt2: '#374151',
  txt3: '#6B7280',
  txt4: '#9CA3AF',
  txt5: '#D1D5DB',
} as const;

// ── Runtime helpers ──────────────────────────────────────
/** Kembalikan warna zona. */
export function zoneColor(zone: string): string {
  return ZC[zone] ?? ZC_KRS;
}

/** Chart grid/tick colors berdasar mode. */
export function chartTheme(darkMode: boolean) {
  const surf = darkMode ? SURFACE    : SURFACE_LIGHT;
  const text = darkMode ? TEXT       : TEXT_LIGHT;
  return {
    gridColor    : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    tickColor    : text.txt3,
    legendColor  : text.txt2,
    tooltipBg    : surf.bg2,
    tooltipBorder: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.1)',
    titleColor   : text.txt2,
    bodyColor    : text.txt,
  };
}
