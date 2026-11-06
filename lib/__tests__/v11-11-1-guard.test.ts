// lib/__tests__/v11-11-1-guard.test.ts — pengawal v11.11.1 (pemindaian statis)
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import id from '@/lib/locales/id';

const ROOT = process.cwd();
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', '__tests__', 'e2e'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx|css)$/.test(n)) out.push(p);
  }
  return out;
}
const SRC = ['app', 'components', 'hooks', 'lib', 'store'].flatMap(d => walk(join(ROOT, d)));
const read = (p: string) => readFileSync(p, 'utf8');

describe('v11.11.1 — tanpa daftar nama pelanggan bawaan di kode', () => {
  it('DEFAULT_KRS / DEFAULT_SLK tidak ada lagi', () => {
    const bad = SRC.filter(f => /DEFAULT_KRS|DEFAULT_SLK/.test(read(f)));
    expect(bad).toEqual([]);
  });
  it('tidak ada deretan nama bawaan lama di source mana pun (privasi pelanggan)', () => {
    const bad = SRC.filter(f => read(f).includes('"ABIL","ADIT"'));
    expect(bad).toEqual([]);
  });
});

describe('v11.11.1 — satu Service Worker, didaftarkan', () => {
  it('route SW ganda dihapus; hanya yang dibuat tiap build (public/sw.template.js → public/sw.js)', () => {
    expect(existsSync(join(ROOT, 'app/sw.js'))).toBe(false);
    expect(existsSync(join(ROOT, 'public/sw.template.js'))).toBe(true);
    const tpl = read(join(ROOT, 'public/sw.template.js'));
    expect(tpl).toMatch(/skipWaiting\(\)/);
    expect(tpl).toMatch(/clients\.claim\(\)/);
  });
  it('root layout memasang ServiceWorkerRegister; public/sw.js hasil build tidak di-commit', () => {
    expect(read(join(ROOT, 'app/layout.tsx'))).toContain('<ServiceWorkerRegister />');
    expect(read(join(ROOT, '.gitignore'))).toMatch(/^public\/sw\.js$/m);
  });
});

describe('v11.11.1 — Bayar Cepat konsisten', () => {
  it('teks Indonesia tidak lagi memakai "Quick Pay"', () => {
    const bocor = Object.entries(id).filter(([, v]) => /quick pay/i.test(v)).map(([k]) => k);
    expect(bocor).toEqual([]);
  });
  it('tidak ada label QUICK yang ditulis langsung di komponen, dan tidak ada karakter ★', () => {
    const bad = SRC.filter(f => f.includes('components') && (/>\s*QUICK\s*</.test(read(f)) || /<\/(Lightning)>\s*QUICK/.test(read(f)) || /\/> QUICK</.test(read(f)) || read(f).includes('★')));
    expect(bad).toEqual([]);
  });
});

describe('v11.11.1 — pesan galat akun tidak ditulis langsung di kode', () => {
  it('hooks/useAuth.ts tidak memuat pesan Indonesia hardcoded (Login/Logout/Sesi kedaluwarsa)', () => {
    const src = read(join(ROOT, 'hooks/useAuth.ts')).split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    expect(src).not.toMatch(/error:\s*'[^']*(Login|Logout|Sesi|Tidak ada|Dibatalkan|Masukkan)/);
  });
  it('friendlyAuthError memakai kunci terjemahan', () => {
    expect(read(join(ROOT, 'lib/helpers.ts'))).toContain("'auth.err.wrongPassword'");
  });
});

describe('v11.11.1 — build memakai npm dengan lockfile', () => {
  it('package-lock.json ada, pnpm-lock.yaml tidak; Vercel memakai npm ci', () => {
    expect(existsSync(join(ROOT, 'package-lock.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'pnpm-lock.yaml'))).toBe(false);
    const v = JSON.parse(read(join(ROOT, 'vercel.json')));
    expect(v.installCommand).toBe('npm ci');
  });
  it('versi paket = APP_VERSION', () => {
    const pkg = JSON.parse(read(join(ROOT, 'package.json')));
    const m = read(join(ROOT, 'lib/constants.ts')).match(/APP_VERSION\s*=\s*'v?([\d.]+)'/);
    expect(pkg.version).toBe(m?.[1]);
  });
});
