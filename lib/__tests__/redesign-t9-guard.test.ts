// lib/__tests__/redesign-t9-guard.test.ts — pagar mutu file milik T9 (kontrak bagian 1 + 4, serah-terima T4 bagian 3)
//  • tanpa emoji   • tanpa lucide-react / framer-motion   • tanpa percabangan KRS/SLK (zona kustom = KRS/SLK)
//  • daftar member HANYA lewat getMembersForZone/setMembersForZone   • showConfirm memakai kunci semantik
//  • file yatim dihapus / dipakai, tidak ada duplikasi   • key i18n ada di id DAN en
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

// MemberCard.tsx / MemberCard.module.css milik T7 (Entry), bukan T9.
const MEMBERS = ls('components/features/members', /^(MembersView.*\.tsx|members\.logic\.ts|members\.module\.css)$/);
const GRAFIK = ls('components/features/grafik', /\.(tsx|ts|css)$/);
const FREE = ls('components/modals', /^(FreeMemberModal.*\.tsx|freeMember\.module\.css)$/);
const OWNED = [...MEMBERS, ...GRAFIK, ...FREE, 'app/(app)/grafik/page.tsx', 'app/(app)/members/page.tsx'];
const CODE = OWNED.filter(f => /\.(tsx|ts)$/.test(f));

describe('File milik T9', () => {
  it('daftar tidak kosong dan semua file ada', () => {
    expect(OWNED.length).toBeGreaterThanOrEqual(19);
    OWNED.forEach(f => expect(exists(f), f).toBe(true));
  });

  it('tanpa emoji (kontrak bagian 1 butir 5)', () => {
    expect(OWNED.filter(f => /\p{Extended_Pictographic}/u.test(read(f)))).toEqual([]);
  });

  it('tanpa import lucide-react (ikon resmi = Phosphor) dan tanpa framer-motion (sheet = primitive Sheet)', () => {
    expect(CODE.filter(f => /from ['"](lucide-react|framer-motion)['"]/.test(read(f)))).toEqual([]);
  });

  it('tanpa percabangan KRS/SLK dan tanpa daftar zona tertanam (zona kustom = KRS/SLK)', () => {
    const bad = CODE.filter(f => {
      const src = read(f);
      return /(===?|!==?)\s*'(KRS|SLK)'/.test(src)
        || /\[\s*'KRS'\s*,\s*'SLK'\s*\]/.test(src)
        || /\?\s*'var\(--zc-krs\)'\s*:\s*'var\(--zc-slk\)'/.test(src);
    });
    expect(bad).toEqual([]);
  });

  it('daftar member dibaca/ditulis hanya lewat getMembersForZone/setMembersForZone (tanpa krsMembers/slkMembers)', () => {
    const bad = CODE.filter(f => /\b(krsMembers|slkMembers)\b/.test(read(f)));
    expect(bad).toEqual([]);
    expect(read('components/features/members/members.logic.ts')).toMatch(/setMembersForZone/);
    expect(read('components/features/members/members.logic.ts')).toMatch(/getMembersForZone/);
    expect(read('components/features/grafik/grafik.logic.ts')).toMatch(/getMembersForZone/);
    expect(read('lib/payment.ts')).toMatch(/getMembersForZone\(zone, data\)/);
  });

  it('showConfirm memakai kunci semantik (kontrak bagian 4)', () => {
    const allowed = new Set(['trash', 'lock', 'warning', 'switch', 'signout', 'question', 'info']);
    const keys: string[] = [];
    for (const f of CODE) for (const m of read(f).matchAll(/showConfirm\(\s*'([^']*)'/g)) keys.push(m[1]);
    expect(keys.length).toBeGreaterThanOrEqual(3);
    expect(keys.filter(k => !allowed.has(k))).toEqual([]);
  });

  it('tanpa warna literal di CSS modul (hanya token)', () => {
    const css = OWNED.filter(f => f.endsWith('.css'));
    expect(css.length).toBe(3); // members, grafik, freeMember
    const bad = css.filter(f => /#[0-9a-fA-F]{3,8}\b/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(bad).toEqual([]);
  });

  it('tanpa warna hex literal di kode layar (warna kanvas dari lib/design-tokens)', () => {
    const bad = CODE.filter(f => /['"`]#[0-9a-fA-F]{3,8}['"`]/.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('Chart.js hanya dipakai di folder grafik', () => {
    const outside = [...MEMBERS, ...FREE].filter(f => /from ['"](react-chartjs-2|chart\.js)['"]/.test(read(f)));
    expect(outside).toEqual([]);
  });
});

describe('Nasib file yatim (serah-terima T4 bagian 3)', () => {
  it('ComplianceChart, IncomeChart, ZoneChart, lib/chartConfigs, useMembersFilter, FreeMemberModal.List dihapus', () => {
    for (const f of [
      'components/features/grafik/GrafikView.ComplianceChart.tsx',
      'components/features/grafik/GrafikView.IncomeChart.tsx',
      'components/features/grafik/GrafikView.ZoneChart.tsx',
      'lib/chartConfigs.ts',
      'hooks/useMembersFilter.ts',
      'components/modals/FreeMemberModal.List.tsx',
    ]) expect(exists(f), f).toBe(false);
  });

  it('FreeMemberModal.Form dipakai FreeMemberModal (bukan yatim)', () => {
    expect(read('components/modals/FreeMemberModal.tsx')).toMatch(/from '\.\/FreeMemberModal\.Form'/);
  });

  it('tidak ada file kode T9 yang tidak diimpor siapa pun', () => {
    const all = [
      ...CODE,
      'components/features/members/MemberCard.tsx',
      ...ls('components/features/__tests__', /\.tsx?$/),
      ...ls('components/features/members/__tests__', /\.tsx?$/),
      ...ls('components/features/grafik/__tests__', /\.tsx?$/),
    ];
    const candidates = CODE.filter(f => !/page\.tsx$/.test(f));
    const orphans = candidates.filter(f => {
      const base = path.basename(f).replace(/\.(tsx|ts)$/, '');
      if (base === 'MembersView' || base === 'GrafikView' || base === 'FreeMemberModal') {
        // diimpor halaman rute / MembersView (FreeMemberModal)
        const users = [...all, 'app/(app)/members/page.tsx', 'app/(app)/grafik/page.tsx'];
        return !users.some(o => o !== f && new RegExp(`from ['"][^'"]*/${base}['"]|import\\(['"][^'"]*/${base}['"]\\)`).test(read(o)));
      }
      return !all.some(o => o !== f && new RegExp(`from ['"][^'"]*/${base.replace(/\./g, '\\.')}['"]`).test(read(o)));
    });
    expect(orphans).toEqual([]);
  });

  it('halaman rute memakai MembersView dan GrafikView', () => {
    expect(read('app/(app)/members/page.tsx')).toMatch(/MembersView/);
    expect(read('app/(app)/grafik/page.tsx')).toMatch(/GrafikView/);
  });

  it('RiwayatModal satu-satunya (dipakai MembersView, tanpa salinan)', () => {
    expect(read('components/features/members/MembersView.tsx')).toMatch(/@\/components\/modals\/RiwayatModal/);
  });
});

describe('Penulisan data tidak diduplikasi / tidak dilemahkan', () => {
  it('MembersView menulis lewat persistPayment + selectiveRollback + penjaga klik ganda', () => {
    const src = read('components/features/members/MembersView.tsx');
    expect(src).toMatch(/persistPayment/);
    expect(src).toMatch(/selectiveRollback/);
    expect(src).toMatch(/isSavingRef/);
  });
  it('FreeMemberModal menulis lewat saveDB + selectiveRollback', () => {
    const src = read('components/modals/FreeMemberModal.tsx');
    expect(src).toMatch(/saveDB/);
    expect(src).toMatch(/selectiveRollback/);
  });
  it('status & filter Member memakai fungsi milik Rekap (satu sumber aturan)', () => {
    expect(read('components/features/members/MembersView.tsx')).toMatch(/from '\.\.\/rekap\/rekap\.logic'/);
  });
  it('MembersView mempertahankan pola kunci Header (status + tombol aksi, merah=terkunci hijau=terbuka)', () => {
    const src = read('components/features/members/MembersView.tsx');
    expect(src).toMatch(/header-lock-action-btn/);
    expect(src).toMatch(/membersLocked\s*\?\s*'var\(--c-belum\)'\s*:\s*'var\(--c-lunas\)'/);
  });
});

describe('i18n — key yang dipakai file T9 ada di id DAN en', () => {
  const ids = id as Record<string, string>;
  const ens = en as Record<string, string>;
  const used = new Set<string>();
  for (const f of CODE) {
    for (const m of read(f).matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) used.add(m[1]);
  }

  it('ada key yang dipindai', () => { expect(used.size).toBeGreaterThan(50); });
  it('semua key terdefinisi di id dan en', () => {
    const missing = [...used].sort().flatMap(k => [
      ...(ids[k] ? [] : [`id:${k}`]),
      ...(ens[k] ? [] : [`en:${k}`]),
    ]);
    expect(missing).toEqual([]);
  });
  it('blok "REDESAIN T9": id dan en memuat key yang sama (append-only)', () => {
    const block = (f: string) => {
      const src = read(f);
      const i = src.indexOf('REDESAIN T9');
      expect(i).toBeGreaterThan(-1);
      return [...src.slice(i).matchAll(/^\s*'([a-zA-Z0-9_.]+)'\s*:/gm)].map(m => m[1]).sort();
    };
    const a = block('lib/locales/id.ts'), b = block('lib/locales/en.ts');
    expect(a.length).toBeGreaterThanOrEqual(30);
    expect(a).toEqual(b);
  });
});
