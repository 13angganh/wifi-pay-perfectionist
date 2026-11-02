// lib/__tests__/v11-11-guard.test.ts — penjaga regresi level sumber v11.11.0 (nama tampilan + sapaan dinamis).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(join(root, dir))) {
    if (['node_modules', '.next', '.git', '__tests__'].includes(f)) continue;
    const p = join(dir, f);
    if (statSync(join(root, p)).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) out.push(p);
  }
  return out;
}

describe('v11.11.0 — nama tidak diambil dari email', () => {
  it("tidak ada kode yang memotong email di '@' untuk dijadikan nama", () => {
    const offenders = ['app', 'components', 'hooks', 'lib', 'store'].flatMap(d => walk(d)).filter(f => /split\(['"]@['"]\)/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('layar masuk memakai hanya nama akun tersimpan', () => {
    expect(read('app/login/page.tsx')).toContain('remembered?.name || null');
  });

  it('kamus: key sapaan lama dihapus; key nama tampilan ada di id & en', () => {
    for (const loc of [id, en] as Record<string, string>[]) {
      expect(loc).not.toHaveProperty('dashboard.greeting');
      for (const k of ['settings.nameSectionTitle', 'nameSection.save', 'nameSection.notSet', 'sidebar.noName', 'account.changeName']) expect(loc, k).toHaveProperty(k);
    }
  });
});

describe('v11.11.0 — sapaan Beranda', () => {
  it('DashboardView memakai useGreeting (bukan teks tetap) dan tidak memuat nama dari email', () => {
    const src = read('components/features/dashboard/DashboardView.tsx');
    expect(src).toContain('useGreeting(stats)');
    expect(src).not.toMatch(/dashboard\.greeting|HandWaving|split\(/);
  });

  it('CSS sapaan boleh membungkus (tanpa nowrap) agar kalimat konteks tidak terpotong', () => {
    const css = read('components/features/dashboard/dashboard.module.css').split('\n').filter(l => /^\.greet/.test(l)).join('\n');
    expect(css).not.toMatch(/white-space:\s*nowrap/);
    expect(css).toContain('flex-direction: column');
  });

  it('sesi sapaan: riwayat disimpan per perangkat dan jeda buka ulang 2 menit', () => {
    const s = read('lib/greetingSession.ts');
    expect(s).toContain("'wp_greet_recent'");
    expect(s).toContain('2 * 60 * 1000');
  });
});
