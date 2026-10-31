// lib/__tests__/v11-10-2-guard.test.ts
// v11.10.2 — penjaga regresi level sumber untuk perbaikan: splash, animasi loading, tabel Rekap, navigasi, bahasa baku.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('v11.10.2 — splash & animasi loading', () => {
  it('tagline dihapus: tidak ada elemen splash__tag maupun key splash.tagline', () => {
    expect(read('components/layout/LoadingScreen.tsx')).not.toMatch(/splash__tag|splash\.tagline/);
    expect(read('styles/components.misc.css')).not.toMatch(/splash__tag/);
    expect(id).not.toHaveProperty('splash.tagline');
    expect(en).not.toHaveProperty('splash.tagline');
  });

  it('batang progres meluncur SATU arah (tanpa infinite alternate / animasi width yang bolak-balik)', () => {
    const css = read('styles/ui.css');
    const rule = css.split('\n').find(l => l.startsWith('.wp-prog i {')) ?? '';
    expect(rule).toContain('animation: wpbar');
    expect(rule).not.toMatch(/alternate/);
    const frames = css.split('\n').find(l => l.startsWith('@keyframes wpbar')) ?? '';
    expect(frames).toMatch(/translateX\(-100%\)/);
    expect(frames).toMatch(/translateX\(250%\)/);
    expect(frames).not.toMatch(/width/);
  });
});

describe('v11.10.2 — tabel Rekap tanpa getar di ujung', () => {
  it('.rwc: overscroll-behavior none (bukan contain) + touch-action pan-x pan-y', () => {
    const rule = read('components/features/rekap/rekap.module.css').split('\n').find(l => l.startsWith('.rwc {')) ?? '';
    expect(rule).toContain('overscroll-behavior: none');
    expect(rule).not.toMatch(/overscroll-behavior(-x)?: contain/);
    expect(rule).toContain('touch-action: pan-x pan-y');
  });
});

describe('v11.10.2 — navigasi menu tidak lag', () => {
  const pagesDir = join(root, 'app', '(app)');
  const pages = readdirSync(pagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(pagesDir, d.name, 'page.tsx')))
    .map(d => join('app', '(app)', d.name, 'page.tsx'));

  it('ada 9 halaman menu', () => { expect(pages.length).toBe(9); });

  it('tidak ada page.tsx yang memanggil setView (AppShell sudah menyinkronkan dari pathname; navigate() sudah mengatur)', () => {
    for (const p of pages) expect(read(p), p).not.toMatch(/setView|useAppStore/);
  });

  it('AppShell memakai useRoutePrefetch', () => {
    expect(read('components/layout/AppShell.tsx')).toMatch(/useRoutePrefetch\(\)/);
  });

  it('tombol bottom nav bebas jeda ketuk (touch-action: manipulation)', () => {
    const rule = read('styles/layout.css').split('\n').find(l => l.startsWith('.nb {')) ?? '';
    expect(rule).toContain('touch-action: manipulation');
  });
});

describe('v11.10.2 — bahasa Indonesia baku (id.ts)', () => {
  const asing = /\b(Dashboard|dashboard|Password|password|Export|Import|Backup|backup|Download|download|didownload|Reset|reset|Update|update|diupdate|Offline|offline|online|kamu|Kamu|Recycle|clipboard|inbox|Free|free|Edit|edit|Entry|entry|Link|link|File|file|field|Share|share|error|Oops|App|app|header|Header|toast|Toast|Sidebar|Insight|Custom|Batch|batch|Restore|default|Default|sync|Sync|tap|Tap|klik|Klik|Unlock|Ops|Net|pp)\b/;

  it('tidak ada kata asing / tidak baku yang sudah dibakukan di nilai teks Indonesia', () => {
    const bocor = Object.entries(id).filter(([, v]) => asing.test(v)).map(([k, v]) => `${k} = ${v}`);
    expect(bocor).toEqual([]);
  });

  it('Dashboard → Beranda di Indonesia; Inggris tetap Dashboard', () => {
    expect(id['nav.dashboard']).toBe('Beranda');
    expect(id['dashboard.title']).toBe('Beranda');
    expect(id['notfound.toDashboard']).toBe('Ke Beranda');
    expect(en['nav.dashboard']).toBe('Dashboard');
  });

  it('sapaan seragam "Anda" (tidak ada "kamu")', () => {
    expect(Object.values(id).some(v => /\bkamu\b/i.test(v))).toBe(false);
  });
});
