// lib/__tests__/redesign-t8-guard.test.ts — pagar mutu file milik T8 (kontrak bagian 1 + 4, serah-terima T3 bagian 3)
//  • tanpa emoji   • tanpa lucide-react   • tanpa percabangan KRS/SLK (T4 §3 butir 6, T5 §3)
//  • showConfirm memakai kunci semantik   • tidak ada file yatim   • key i18n ada di id DAN en
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));
const ls = (dir: string, ext: RegExp) =>
  fs.readdirSync(path.join(ROOT, dir)).filter(f => ext.test(f)).map(f => `${dir}/${f}`);

const REKAP = ls('components/features/rekap', /\.(tsx|ts|css)$/);
const TUNG = ls('components/features/tunggakan', /\.(tsx|ts|css)$/);
const RIWAYAT = ls('components/modals', /^(RiwayatModal.*\.tsx|riwayat\.module\.css)$/);
const OWNED = [
  ...REKAP, ...TUNG, ...RIWAYAT,
  'hooks/useTunggakan.ts',
  'app/(app)/rekap/page.tsx', 'app/(app)/tunggakan/page.tsx',
];
const CODE = OWNED.filter(f => /\.(tsx|ts)$/.test(f));

describe('File milik T8', () => {
  it('daftar tidak kosong dan semua file ada', () => {
    expect(OWNED.length).toBeGreaterThanOrEqual(18);
    OWNED.forEach(f => expect(exists(f), f).toBe(true));
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

  it('tanpa warna literal di CSS modul (hanya token)', () => {
    const css = OWNED.filter(f => f.endsWith('.css'));
    expect(css.length).toBe(3); // rekap, tunggakan, riwayat
    const bad = css.filter(f => /#[0-9a-fA-F]{3,8}\b/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(bad).toEqual([]);
  });

  it('tanpa warna hex literal di kode layar (zona/aging lewat token atau var CSS)', () => {
    const bad = CODE.filter(f => /['"`]#[0-9a-fA-F]{3,8}['"`]/.test(read(f)));
    expect(bad).toEqual([]);
  });
});

describe('Nasib file yatim (T3 bagian 3)', () => {
  it('hooks/useRekap.ts dihapus (duplikat logika RekapView, tidak diimpor siapa pun)', () => {
    expect(exists('hooks/useRekap.ts')).toBe(false);
  });

  it('hooks/useTunggakan.ts dipakai TunggakanView (bukan yatim) dan tanpa zona tertanam', () => {
    expect(read('components/features/tunggakan/TunggakanView.tsx')).toMatch(/from '@\/hooks\/useTunggakan'/);
    expect(read('hooks/useTunggakan.ts')).toMatch(/getAllActiveZones/);
    expect(read('hooks/useTunggakan.ts')).not.toMatch(/'KRS'|'SLK'/);
  });

  it('tidak ada file layar T8 yang tidak diimpor siapa pun', () => {
    const all = [
      ...CODE,
      'components/features/members/MemberCard.tsx', 'components/features/members/MembersView.tsx',
      ...ls('components/features/__tests__', /\.tsx?$/),
    ];
    const candidates = [...REKAP, ...TUNG, ...RIWAYAT].filter(f => /\.(tsx|ts)$/.test(f));
    const orphans = candidates.filter(f => {
      const base = path.basename(f).replace(/\.(tsx|ts)$/, '');
      if (base === 'RekapView' || base === 'TunggakanView') return false; // diimpor halaman rute
      return !all.some(o => o !== f && new RegExp(`from ['"][^'"]*/${base.replace(/\./g, '\\.')}['"]`).test(read(o)));
    });
    expect(orphans).toEqual([]);
  });

  it('halaman rute memakai RekapView dan TunggakanView', () => {
    expect(read('app/(app)/rekap/page.tsx')).toMatch(/RekapView/);
    expect(read('app/(app)/tunggakan/page.tsx')).toMatch(/TunggakanView/);
  });

  it('RiwayatModal satu-satunya: dipakai Member, Rekap, dan Tunggakan (tanpa duplikasi)', () => {
    for (const f of ['components/features/members/MemberCard.tsx', 'components/features/members/MembersView.tsx',
      'components/features/rekap/RekapView.tsx', 'components/features/tunggakan/TunggakanView.tsx']) {
      expect(read(f), f).toMatch(/@\/components\/modals\/RiwayatModal/);
    }
  });
});

describe('Pengaman batch Rekap dan penulisan data tidak diduplikasi', () => {
  it('batch Rekap memakai isBatchEligible/toggleBatchSelection milik Entry (satu sumber aturan)', () => {
    const src = read('components/features/rekap/RekapView.tsx') + read('components/features/rekap/rekap.logic.ts');
    expect(src).toMatch(/from '\.\.\/entry\/batch'/);
  });
  it('RekapView menulis lewat persistPayment + selectiveRollback (bukan set langsung ke RTDB)', () => {
    const src = read('components/features/rekap/RekapView.tsx');
    expect(src).toMatch(/persistPayment/);
    expect(src).toMatch(/selectiveRollback/);
  });
});

describe('i18n — key yang dipakai file T8 ada di id DAN en', () => {
  const ids = id as Record<string, string>;
  const ens = en as Record<string, string>;
  const used = new Set<string>();
  for (const f of CODE) {
    const src = read(f);
    for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) used.add(m[1]);
  }

  it('ada key yang dipindai', () => { expect(used.size).toBeGreaterThan(40); });
  it('semua key terdefinisi di id dan en', () => {
    const missing = [...used].sort().flatMap(k => [
      ...(ids[k] ? [] : [`id:${k}`]),
      ...(ens[k] ? [] : [`en:${k}`]),
    ]);
    expect(missing).toEqual([]);
  });
  it('blok "REDESAIN T8": id dan en memuat key yang sama (append-only)', () => {
    const block = (f: string) => {
      const src = read(f);
      const i = src.indexOf('REDESAIN T8');
      expect(i).toBeGreaterThan(-1);
      return [...src.slice(i).matchAll(/^\s*'([a-zA-Z0-9_.]+)'\s*:/gm)].map(m => m[1]).sort();
    };
    const a = block('lib/locales/id.ts'), b = block('lib/locales/en.ts');
    expect(a.length).toBeGreaterThan(15);
    expect(a).toEqual(b);
  });
});
