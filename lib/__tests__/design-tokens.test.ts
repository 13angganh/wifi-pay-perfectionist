// lib/__tests__/design-tokens.test.ts — zoneColor/zoneCssVars (perbaikan percabangan KRS/SLK, T4 §3 + T5 §3)
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ZC_KRS, ZC_SLK, ZC_TOT, ZONE_FALLBACK_PALETTE, THEME_ACCENT, SURFACE,
  hexToRgb, zoneColor, zoneCssColor, zoneCssVars,
} from '@/lib/design-tokens';

const custom = [{ key: 'ABC', color: '#10B981' }, { key: 'BAD', color: 'not-a-color' }];

describe('zoneColor', () => {
  it('zona bawaan: KRS / SLK / TOTAL', () => {
    expect(zoneColor('KRS')).toBe(ZC_KRS);
    expect(zoneColor('SLK')).toBe(ZC_SLK);
    expect(zoneColor('TOTAL')).toBe(ZC_TOT);
  });
  it('zona kustom memakai warna dari CustomZone (bukan jatuh ke KRS)', () => {
    expect(zoneColor('ABC', custom)).toBe('#10B981');
    expect(zoneColor('ABC', custom)).not.toBe(ZC_KRS);
  });
  it('warna kustom tidak valid / zona tak dikenal → palet cadangan deterministik', () => {
    const a = zoneColor('BAD', custom);
    expect(ZONE_FALLBACK_PALETTE).toContain(a as (typeof ZONE_FALLBACK_PALETTE)[number]);
    expect(zoneColor('BAD', custom)).toBe(a);
    expect(zoneColor('XYZ')).not.toBe(ZC_KRS);
  });
});

describe('zoneCssColor / zoneCssVars', () => {
  it('zona bawaan memakai var() tema (ikut Terang/Gelap/Emas)', () => {
    expect(zoneCssColor('KRS')).toBe('var(--zc-krs)');
    expect(zoneCssColor('SLK')).toBe('var(--zc-slk)');
  });
  it('zona kustom memakai hex-nya', () => {
    expect(zoneCssColor('ABC', custom)).toBe('#10B981');
  });
  it('zoneCssVars: zc, zcdim, rgb konsisten', () => {
    const k = zoneCssVars('KRS');
    expect(k.zc).toBe('var(--zc-krs)');
    expect(k.zcdim).toContain('color-mix');
    expect(k.rgb).toBe('59,130,246');
    const c = zoneCssVars('ABC', custom);
    expect(c.zc).toBe('#10B981');
    expect(c.zcdim).toBe('rgba(16,185,129,0.14)');
    expect(c.rgb).toBe('16,185,129');
  });
});

describe('hexToRgb', () => {
  it('parse hex 6 digit; null untuk selain itu', () => {
    expect(hexToRgb('#3B82F6')).toEqual([59, 130, 246]);
    expect(hexToRgb('3B82F6')).toBeNull();
    expect(hexToRgb('#FFF')).toBeNull();
  });
});

describe('cermin token JS ↔ styles/tokens.css (tidak boleh melenceng)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../styles/tokens.css'), 'utf8');
  it('surface gelap + aksen 3 tema sama dengan tokens.css', () => {
    expect(css).toContain(`--bg  : ${SURFACE.bg};`);
    expect(css).toContain(`--bg2 : ${SURFACE.bg2};`);
    expect(css).toContain(`--accent    : ${THEME_ACCENT.light};`);
    expect(css).toContain(`--accent    : ${THEME_ACCENT.gold};`);
  });
});
