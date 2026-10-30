// lib/__tests__/redesign-t7-guard.test.ts — pagar mutu file milik T7 (kontrak bagian 1 + 4, serah-terima T2 bagian 3)
//  • tanpa emoji   • tanpa lucide-react   • tanpa percabangan KRS/SLK (T4 §3 butir 6, T5 §3)
//  • showConfirm memakai kunci semantik   • tidak ada file yatim   • key i18n ada di id DAN en
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ls = (dir: string, ext: RegExp) =>
  fs.readdirSync(path.join(ROOT, dir)).filter(f => ext.test(f)).map(f => `${dir}/${f}`);

const DASH = ls('components/features/dashboard', /\.(tsx|ts|css)$/);
const ENTRY = ls('components/features/entry', /\.(tsx|ts|css)$/);
const OWNED = [
  ...DASH, ...ENTRY,
  'components/features/members/MemberCard.tsx', 'components/features/members/MemberCard.module.css',
  'hooks/useDashboard.ts',
  'app/(app)/dashboard/page.tsx', 'app/(app)/entry/page.tsx',
];
const CODE = OWNED.filter(f => /\.(tsx|ts)$/.test(f));

describe('File milik T7', () => {
  it('daftar tidak kosong dan semua file ada', () => {
    expect(OWNED.length).toBeGreaterThan(15);
    OWNED.forEach(f => expect(fs.existsSync(path.join(ROOT, f)), f).toBe(true));
  });

  it('tanpa emoji (kontrak bagian 1 butir 5)', () => {
    expect(OWNED.filter(f => /\p{Extended_Pictographic}/u.test(read(f)))).toEqual([]);
  });

  it('tanpa import lucide-react (ikon resmi = Phosphor)', () => {
    expect(CODE.filter(f => /from ['"]lucide-react['"]/.test(read(f)))).toEqual([]);
  });

  it('tanpa percabangan KRS/SLK dan tanpa daftar zona tertanam (T4 §3 butir 6, T5 §3)', () => {
    const bad = CODE.filter(f => {
      const src = read(f);
      return /(===?|!==?)\s*'(KRS|SLK)'/.test(src)
        || /\[\s*'KRS'\s*,\s*'SLK'\s*\]/.test(src)
        || /\?\s*'var\(--zc-krs\)'\s*:\s*'var\(--zc-slk\)'/.test(src);
    });
    expect(bad).toEqual([]);
  });

  it('showConfirm memakai kunci semantik (kontrak bagian 4)', () => {
    const allowed = new Set(['trash', 'lock', 'warning', 'switch', 'signout', 'question', 'info']);
    const keys: string[] = [];
    for (const f of CODE) for (const m of read(f).matchAll(/showConfirm\(\s*'([^']*)'/g)) keys.push(m[1]);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter(k => !allowed.has(k))).toEqual([]);
  });

  it('tanpa warna literal tersisa di CSS modul (hanya token)', () => {
    const css = OWNED.filter(f => f.endsWith('.css'));
    const bad = css.filter(f => /#[0-9a-fA-F]{3,8}\b/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(bad).toEqual([]);
  });
});

describe('Nasib file yatim (T2 bagian 3)', () => {
  it('EntryView.QuickPay dihapus (tombolnya tidak terhubung ke apa pun)', () => {
    expect(fs.existsSync(path.join(ROOT, 'components/features/entry/EntryView.QuickPay.tsx'))).toBe(false);
  });
  it('tidak ada file layar T7 yang tidak diimpor siapa pun', () => {
    const all = [...CODE, ...ls('components/features/__tests__', /\.tsx?$/)];
    const orphans = [...DASH, ...ENTRY]
      .filter(f => /\.tsx$/.test(f))
      .filter(f => {
        const base = path.basename(f).replace(/\.tsx$/, '');
        if (base === 'DashboardView' || base === 'EntryView') return false; // diimpor halaman rute
        return !all.some(o => o !== f && new RegExp(`from ['"][^'"]*/${base.replace(/\./g, '\\.')}['"]`).test(read(o)));
      });
    expect(orphans).toEqual([]);
  });
  it('halaman rute memakai DashboardView dan EntryView', () => {
    expect(read('app/(app)/dashboard/page.tsx')).toMatch(/DashboardView/);
    expect(read('app/(app)/entry/page.tsx')).toMatch(/EntryView/);
  });
});

describe('i18n — key yang dipakai file T7 ada di id DAN en', () => {
  const ids = id as Record<string, string>;
  const ens = en as Record<string, string>;
  const used = new Set<string>();
  for (const f of CODE) {
    const src = read(f);
    for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) used.add(m[1]);
    for (const m of src.matchAll(/labelKey:\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
  }
  ['status.lunas', 'status.belum', 'status.free'].forEach(k => used.add(k)); // t(`status.${status}`) di MemberCard

  it('ada key yang dipindai', () => { expect(used.size).toBeGreaterThan(50); });
  it('semua key terdefinisi di id dan en', () => {
    const missing = [...used].sort().flatMap(k => [
      ...(ids[k] ? [] : [`id:${k}`]),
      ...(ens[k] ? [] : [`en:${k}`]),
    ]);
    expect(missing).toEqual([]);
  });
  it('blok "REDESAIN T7": id dan en memuat key yang sama (append-only)', () => {
    const block = (f: string) => {
      const src = read(f);
      const i = src.indexOf('REDESAIN T7');
      expect(i).toBeGreaterThan(-1);
      return [...src.slice(i).matchAll(/^\s*'([a-zA-Z0-9_.]+)'\s*:/gm)].map(m => m[1]).sort();
    };
    const a = block('lib/locales/id.ts'), b = block('lib/locales/en.ts');
    expect(a.length).toBeGreaterThan(30);
    expect(a).toEqual(b);
  });
});
