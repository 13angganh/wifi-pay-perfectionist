// lib/__tests__/theme.test.ts — v11.10.4: Splash/Login mengikuti tema aktif sejak frame pertama.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_BG, applyTheme, themeBootScript } from '@/lib/theme';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const metaColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
const bodyTheme = () => ['light', 'gold'].find(c => document.body.classList.contains(c)) ?? 'dark';
const boot = () => new Function(themeBootScript)();

beforeEach(() => {
  localStorage.clear();
  document.body.className = '';
  document.head.innerHTML = '<meta name="theme-color" content="#0B1020">';
});
afterEach(() => { vi.restoreAllMocks(); });

describe('applyTheme', () => {
  it('memasang class body + theme-color untuk tiap tema, dan membersihkan tema sebelumnya', () => {
    applyTheme('light');
    expect(bodyTheme()).toBe('light'); expect(metaColor()).toBe(THEME_BG.light);
    applyTheme('gold');
    expect(bodyTheme()).toBe('gold'); expect(document.body.classList.contains('light')).toBe(false); expect(metaColor()).toBe(THEME_BG.gold);
    applyTheme('dark');
    expect(bodyTheme()).toBe('dark'); expect(document.body.className).toBe(''); expect(metaColor()).toBe(THEME_BG.dark);
  });
});

describe('themeBootScript (skrip pertama di <body>)', () => {
  it.each([['light'], ['gold']] as const)('wp_theme=%s → body + theme-color langsung bertema', (t) => {
    localStorage.setItem('wp_theme', t);
    boot();
    expect(bodyTheme()).toBe(t);
    expect(metaColor()).toBe(THEME_BG[t]);
  });

  it('gelap / kosong / nilai asing → tanpa class (default gelap)', () => {
    document.body.classList.add('gold');
    localStorage.setItem('wp_theme', 'dark');
    boot();
    expect(document.body.className).toBe('');
    localStorage.setItem('wp_theme', 'ungu');
    boot();
    expect(document.body.className).toBe('');
    expect(metaColor()).toBe(THEME_BG.dark);
  });

  it('migrasi lama wp_dark_mode=0 → terang (sama dengan loadTheme di uiSlice)', () => {
    localStorage.setItem('wp_dark_mode', '0');
    boot();
    expect(bodyTheme()).toBe('light');
  });

  it('localStorage tidak tersedia → diam-diam gagal, tidak melempar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => boot()).not.toThrow();
  });
});

describe('v11.10.4 — konsistensi sumber', () => {
  it('THEME_BG = nilai --bg tiap tema di styles/tokens.css', () => {
    const css = read('styles/tokens.css');
    const bgOf = (sel: RegExp) => css.match(new RegExp(sel.source + '\\s*\\{[^}]*?--bg\\s*:\\s*(#[0-9A-Fa-f]{6})', 'm'))?.[1]?.toUpperCase();
    expect(bgOf(/^:root/m)).toBe(THEME_BG.dark.toUpperCase());
    expect(bgOf(/^body\.light/m)).toBe(THEME_BG.light.toUpperCase());
    expect(bgOf(/^body\.gold/m)).toBe(THEME_BG.gold.toUpperCase());
  });

  it('skrip tema ada di DALAM <body> sebelum {children}, bukan di <head> (di head document.body masih null)', () => {
    const layout = read('app/layout.tsx');
    const head = layout.slice(layout.indexOf('<head>'), layout.indexOf('</head>'));
    const body = layout.slice(layout.indexOf('<body'), layout.indexOf('</body>'));
    expect(head).not.toContain('themeBootScript');
    expect(body.indexOf('themeBootScript')).toBeGreaterThan(-1);
    expect(body.indexOf('themeBootScript')).toBeLessThan(body.indexOf('{children}'));
    expect(layout).toMatch(/themeColor: THEME_BG\.dark/);
  });

  it('AppShell memakai applyTheme (satu sumber, termasuk theme-color)', () => {
    expect(read('components/layout/AppShell.tsx')).toMatch(/applyTheme\(theme\)/);
  });

  it('CSS splash hanya memakai token tema (tanpa warna hex/rgb yang di-hardcode)', () => {
    const splash = read('styles/components.misc.css').split('\n').filter(l => /^\.splash/.test(l)).join('\n');
    expect(splash).toContain('var(--bg)');
    expect(splash).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});

describe('v11.10.4 — istilah "pelanggan" seragam (member → pelanggan / customer)', () => {
  it('tidak ada kata "member" tersisa di teks Indonesia maupun Inggris', () => {
    const sisa = (loc: Record<string, string>) => Object.entries(loc).filter(([, v]) => /\bmembers?\b/i.test(v)).map(([k, v]) => `${k} = ${v}`);
    expect(sisa(id)).toEqual([]);
    expect(sisa(en)).toEqual([]);
  });

  it('nama menu: Pelanggan (id) / Customers (en)', () => {
    expect(id['nav.members']).toBe('Pelanggan');
    expect(en['nav.members']).toBe('Customers');
    expect(id['common.searchMemberIn']).toBe('Cari nama pelanggan di');
  });
});
