/**
 * lib/design-tokens.ts
 * JS mirror dari CSS custom properties yang relevan di runtime.
 *
 * SOURCE OF TRUTH tetap di styles/tokens.css.
 * Gunakan file ini untuk:
 *   - chart theming (Chart.js dataset colors, gridColor, dll)
 *   - programmatic style calculations
 *   - export PDF / share image colors
 *   - warna zona dinamis (KRS, SLK, zona kustom) — SATU helper, tanpa percabangan KRS/SLK
 *
 * PENTING: Jika mengubah nilai token, update KEDUANYA —
 * styles/tokens.css (untuk CSS) DAN file ini (untuk JS).
 *
 * REDESAIN T6: nilai disamakan dengan CORE BLOCK v3 (dark navy, aksen per tema),
 * zoneColor() menerima zona kustom (perbaikan percabangan KRS/SLK, serah-terima T4
 * bagian 3 butir 4 dan T5 bagian 3).
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

/** Zona kustom (bentuk sama dengan CustomZone di types/index.ts, hanya field yang dipakai di sini). */
export interface ZoneColorSource { key: string; color: string }

/** Palet cadangan bila zona kustom belum punya warna valid — deterministik per kunci zona. */
export const ZONE_FALLBACK_PALETTE = [
  '#8B5CF6', '#EC4899', '#14B8A6', '#EAB308',
  '#06B6D4', '#F43F5E', '#84CC16', '#A855F7',
] as const;

// ── Status colors ────────────────────────────────────────
export const C_LUNAS = '#22C55E';
export const C_BELUM = '#EF4444';
export const C_FREE  = '#3B82F6';
export const C_WARN  = '#F59E0B';
export const C_INFO  = '#3B82F6';

// ── Aksen tema (tombol utama + elemen aktif; BUKAN warna zona) ──
export const THEME_ACCENT = {
  dark : '#3B82F6',
  light: '#2563EB',
  gold : '#C9952A',
} as const;

// ── Surface colors (dark, default) ──────────────────────
export const SURFACE = {
  bg : '#0B1020',
  bg2: '#131A2D',
  bg3: '#1A2238',
  bg4: '#242E4A',
  border: '#222B45',
} as const;

// ── Surface colors (light) ───────────────────────────────
export const SURFACE_LIGHT = {
  bg : '#F8FAFC',
  bg2: '#FFFFFF',
  bg3: '#F0F4F8',
  bg4: '#E4EAF0',
  border: '#E4EAF0',
} as const;

// ── Surface colors (gold) ────────────────────────────────
export const SURFACE_GOLD = {
  bg : '#0C0A06',
  bg2: '#141008',
  bg3: '#1C1610',
  bg4: '#241D12',
  border: 'rgba(201,149,42,0.15)',
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

// ── Typography colors (gold) ─────────────────────────────
export const TEXT_GOLD = {
  txt : '#F5EAD6',
  txt2: '#C4AA80',
  txt3: '#8A7055',
  txt4: '#5A4830',
  txt5: '#2E2218',
} as const;

// ── Runtime helpers ──────────────────────────────────────

/** Parse '#RRGGBB' → [r,g,b]; null bila bukan hex 6 digit valid. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Kembalikan warna zona (hex).
 *  - KRS / SLK / TOTAL → konstanta di atas
 *  - zona kustom       → CustomZone.color bila valid, selain itu palet cadangan (deterministik)
 * Tidak ada percabangan KRS/SLK tersembunyi: zona tak dikenal TIDAK jatuh ke warna KRS.
 */
export function zoneColor(zone: string, customZones: readonly ZoneColorSource[] = []): string {
  const fixed = ZC[zone];
  if (fixed) return fixed;
  const custom = customZones.find(c => c.key === zone);
  if (custom && hexToRgb(custom.color)) return custom.color;
  return ZONE_FALLBACK_PALETTE[hashKey(zone) % ZONE_FALLBACK_PALETTE.length];
}

/** CSS variable tema untuk zona bawaan (ikut tema Terang/Gelap/Emas). Data, bukan percabangan. */
export const ZONE_CSS_VAR: Record<string, string> = {
  KRS: 'var(--zc-krs)',
  SLK: 'var(--zc-slk)',
};

/** Warna zona untuk dipakai di CSS: var(--zc-*) untuk zona bawaan, hex untuk zona kustom. */
export function zoneCssColor(zone: string, customZones: readonly ZoneColorSource[] = []): string {
  return ZONE_CSS_VAR[zone] ?? zoneColor(zone, customZones);
}

/**
 * CSS variable zona aktif untuk ditulis ke <body>.
 * KRS/SLK memakai var(--zc-krs|slk) supaya ikut tema (Terang/Gelap/Emas);
 * zona kustom memakai hex-nya. `rgb` dipertahankan untuk pemakai lama `rgba(var(--zc-rgb),a)`.
 */
export function zoneCssVars(zone: string, customZones: readonly ZoneColorSource[] = []) {
  const hex = zoneColor(zone, customZones);          // untuk komponen RGB (pemakai lama rgba(var(--zc-rgb),a))
  const [r, g, b] = hexToRgb(hex) ?? [139, 92, 246];
  const zc = zoneCssColor(zone, customZones);
  return {
    zc,
    zcdim: ZONE_CSS_VAR[zone] ? `color-mix(in srgb, ${zc} 14%, transparent)` : `rgba(${r},${g},${b},0.14)`,
    rgb  : `${r},${g},${b}`,
  };
}

/** Chart grid/tick colors berdasar mode. `theme` opsional untuk membedakan Emas dari Gelap. */
export function chartTheme(darkMode: boolean, theme?: 'dark' | 'light' | 'gold') {
  const isGold = theme === 'gold';
  const surf = isGold ? SURFACE_GOLD : darkMode ? SURFACE : SURFACE_LIGHT;
  const text = isGold ? TEXT_GOLD    : darkMode ? TEXT    : TEXT_LIGHT;
  return {
    gridColor    : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    tickColor    : text.txt3,
    legendColor  : text.txt2,
    tooltipBg    : surf.bg2,
    tooltipBorder: isGold ? 'rgba(201,149,42,0.25)' : darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.1)',
    titleColor   : text.txt2,
    bodyColor    : text.txt,
  };
}
