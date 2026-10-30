// lib/__tests__/redesign-t10-guard.test.ts — pagar mutu file milik T10 (kontrak bagian 1 + 4, serah-terima T5 bagian 3)
//  • tanpa emoji   • tanpa lucide-react / framer-motion   • tanpa percabangan zona tertanam (zona kustom = zona dasar)
//  • daftar member HANYA lewat getMembersForZone   • showConfirm memakai kunci semantik
//  • file yatim dihapus / dipakai   • key i18n ada di id DAN en   • penulisan data tidak dilemahkan
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

const LOG = ls('components/features/log', /\.(tsx|ts|css)$/);
const OPS = ls('components/features/operasional', /\.(tsx|ts|css)$/);
const SETTINGS = ls('components/features/settings', /\.(tsx|ts|css)$/);
const NOTIF = ls('components/features/notifications', /\.(tsx|ts|css)$/);
const OTHER = [
  'components/modals/AccountModal.tsx', 'components/modals/ImportModal.tsx',
  'components/ui/PinLock.tsx', 'components/ui/OnboardingHint.tsx',
];
const OWNED = [...LOG, ...OPS, ...SETTINGS, ...NOTIF, ...OTHER];
const CODE = OWNED.filter(f => /\.(tsx|ts)$/.test(f));
// File lib yang diperbaiki T10 (perbaikan zona kustom): diperiksa untuk percabangan zona saja.
const LIB_FIXED = ['lib/export.excel.ts', 'lib/export.wa.ts'];

describe('File milik T10', () => {
  it('daftar tidak kosong dan semua file ada', () => {
    expect(OWNED.length).toBeGreaterThanOrEqual(30);
    OWNED.forEach(f => expect(exists(f), f).toBe(true));
  });

  it('tanpa emoji (kontrak bagian 1 butir 5)', () => {
    expect(OWNED.filter(f => /\p{Extended_Pictographic}/u.test(read(f)))).toEqual([]);
  });

  it('tanpa import lucide-react (ikon resmi = Phosphor) dan tanpa framer-motion (sheet = primitive Sheet)', () => {
    expect(CODE.filter(f => /from ['"](lucide-react|framer-motion)['"]/.test(read(f)))).toEqual([]);
  });

  it('tanpa percabangan zona tertanam (zona kustom = zona dasar) — termasuk lib yang diperbaiki', () => {
    const bad = [...CODE, ...LIB_FIXED].filter(f => {
      const src = read(f);
      return /(===?|!==?)\s*'(KRS|SLK)'/.test(src)
        || /\[\s*'KRS'\s*,\s*'SLK'\s*\]/.test(src)
        || /\?\s*'var\(--zc-krs\)'\s*:\s*'var\(--zc-slk\)'/.test(src);
    });
    expect(bad).toEqual([]);
  });

  it('daftar member dibaca hanya lewat getMembersForZone (tanpa krsMembers/slkMembers di layar)', () => {
    expect(CODE.filter(f => /\b(krsMembers|slkMembers)\b/.test(read(f)))).toEqual([]);
    expect(read('components/features/settings/SettingsTenantSection.tsx')).toMatch(/getMembersForZone/);
    expect(read('components/features/settings/SettingsZoneSection.tsx')).toMatch(/getMembersForZone/);
    expect(read('lib/export.excel.ts')).toMatch(/getMembersForZone/);
    expect(read('lib/export.wa.ts')).toMatch(/getMembersForZone/);
    expect(read('components/features/operasional/operasional.logic.ts')).toMatch(/getAllActiveZones/);
  });

  it('showConfirm memakai kunci semantik (kontrak bagian 4)', () => {
    const allowed = new Set(['trash', 'lock', 'warning', 'switch', 'signout', 'question', 'info']);
    const keys: string[] = [];
    for (const f of CODE) for (const m of read(f).matchAll(/showConfirm\(\s*'([^']*)'/g)) keys.push(m[1]);
    expect(keys.length).toBeGreaterThanOrEqual(10);
    expect(keys.filter(k => !allowed.has(k))).toEqual([]);
  });

  it('tanpa warna literal di CSS modul (hanya token)', () => {
    const css = OWNED.filter(f => f.endsWith('.css'));
    expect(css.length).toBe(4); // log, operasional, settings, notifications
    const bad = css.filter(f => /#[0-9a-fA-F]{3,8}\b/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(bad).toEqual([]);
  });

  it('tanpa warna hex literal di kode layar', () => {
    expect(CODE.filter(f => /['"`]#[0-9a-fA-F]{3,8}['"`]/.test(read(f)))).toEqual([]);
  });

  it('tanpa teks sebagai kunci i18n (t("Aktif — ...")) dan tanpa SVG inline', () => {
    expect(CODE.filter(f => /\bt\(\s*'[A-Z][^']*\s[^']*'\s*\)/.test(read(f)))).toEqual([]);
    expect(CODE.filter(f => /<svg\b/.test(read(f)))).toEqual([]);
  });
});

describe('Nasib file yatim (serah-terima T5 bagian 3)', () => {
  it('berkas yatim dihapus', () => {
    for (const f of [
      'components/features/operasional/OperasionalView.Form.tsx',
      'components/features/settings/CollapsibleGroup.tsx',
      'components/features/settings/CollapsibleSection.tsx',
      'components/features/settings/SettingsPinSection.Setup.tsx',
      'components/features/settings/SettingsPinSection.Change.tsx',
      'components/features/settings/SettingsTarifSection.Form.tsx',
      'components/features/settings/SettingsTarifSection.List.tsx',
      'components/features/settings/SettingsZoneSection.Form.tsx',
      'components/features/settings/SettingsZoneSection.List.tsx',
      'components/modals/ExportModal.tsx',
      'components/modals/ShareModal.tsx',
      'components/ui/PinLock.Numpad.tsx',
      'lib/onboardingSteps.tsx',
    ]) expect(exists(f), f).toBe(false);
  });

  it('tidak ada file kode T10 yang tidak diimpor siapa pun (selain halaman rute)', () => {
    const everything = [
      ...CODE,
      'components/layout/Header.tsx', 'components/layout/AppShell.tsx',
      ...ls('components/features/__tests__', /\.tsx?$/),
      ...ls('components/features/log/__tests__', /\.tsx?$/),
      ...ls('components/features/operasional/__tests__', /\.tsx?$/),
      ...ls('components/features/notifications/__tests__', /\.tsx?$/),
      'app/(app)/log/page.tsx', 'app/(app)/operasional/page.tsx', 'app/(app)/settings/page.tsx',
    ];
    const orphans = CODE.filter(f => {
      const base = path.basename(f).replace(/\.(tsx|ts)$/, '');
      const re = new RegExp(`from ['"][^'"]*/${base.replace(/\./g, '\\.')}['"]|import\\(['"][^'"]*/${base.replace(/\./g, '\\.')}['"]\\)`);
      return !everything.some(o => o !== f && re.test(read(o)));
    });
    expect(orphans).toEqual([]);
  });

  it('halaman rute memakai LogView, OperasionalView, SettingsView', () => {
    expect(read('app/(app)/log/page.tsx')).toMatch(/LogView/);
    expect(read('app/(app)/operasional/page.tsx')).toMatch(/OperasionalView/);
    expect(read('app/(app)/settings/page.tsx')).toMatch(/SettingsView/);
  });

  it('Header memasang NotificationCenter (bukan kerangka kosong)', () => {
    expect(read('components/layout/Header.tsx')).toMatch(/NotificationCenter/);
    expect(read('components/layout/Header.tsx')).not.toMatch(/<HeaderNotifications\s*\/>/);
  });

  it('LogView memakai ulang aturan ikon/ringkasan Dashboard (satu sumber)', () => {
    expect(read('components/features/log/LogView.tsx')).toMatch(/DashboardView\.RecentActivity/);
  });
});

describe('Penulisan data tidak diduplikasi / tidak dilemahkan', () => {
  it('OperasionalView menulis lewat persistPayment + selectiveRollback + penjaga klik ganda', () => {
    const src = read('components/features/operasional/OperasionalView.tsx');
    expect(src).toMatch(/persistPayment/);
    expect(src).toMatch(/selectiveRollback/);
    expect(src).toMatch(/isSavingRef/);
  });
  it('Zona menulis lewat saveDB + selectiveRollback; IP lewat persistPayment + selectiveRollback', () => {
    const z = read('components/features/settings/SettingsZoneSection.tsx');
    expect(z).toMatch(/saveDB/); expect(z).toMatch(/selectiveRollback/);
    const ip = read('components/features/settings/SettingsIPSection.tsx');
    expect(ip).toMatch(/persistPayment/); expect(ip).toMatch(/selectiveRollback/);
  });
  it('Import menulis lewat importToDB dan mendaftarkan zona kustom; db.importToDB menulis zoneMembers', () => {
    expect(read('components/modals/ImportModal.tsx')).toMatch(/importToDB/);
    expect(read('components/modals/ImportModal.tsx')).toMatch(/zonesToRegister/);
    expect(read('lib/db.ts')).toMatch(/zoneMembers:\s+normalized\.zoneMembers/);
  });
  it('Log tidak menulis data (hanya membaca activityLog)', () => {
    const bad = LOG.filter(f => /\b(persistPayment|saveDB|setAppData|updateSettings)\b/.test(read(f)));
    expect(bad).toEqual([]);
  });
  it('hash PIN di PinLock identik dengan Pengaturan (PIN tersimpan tetap valid)', () => {
    const fn = (f: string) => read(f).match(/function simpleHash[\s\S]*?\n}\n/)?.[0].replace(/\s+/g, ' ');
    expect(fn('components/ui/PinLock.tsx')).toBe(fn('components/features/settings/SettingsPinSection.tsx'));
  });
  it('PinLock mempertahankan 6 input tersembunyi maxLength=1 dan reset 600ms', () => {
    const src = read('components/ui/PinLock.tsx');
    expect(src).toMatch(/maxLength=\{1\}/);
    expect(src).toMatch(/\}, 600\)/);
  });
});

describe('i18n — key yang dipakai file T10 ada di id DAN en', () => {
  const ids = id as Record<string, string>;
  const ens = en as Record<string, string>;
  const used = new Set<string>();
  for (const f of CODE) {
    for (const m of read(f).matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) used.add(m[1]);
    for (const m of read(f).matchAll(/\b(?:title|desc|key): '([a-z]+\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]);
  }

  it('ada key yang dipindai', () => { expect(used.size).toBeGreaterThan(150); });
  it('semua key terdefinisi di id dan en', () => {
    const missing = [...used].sort().flatMap(k => [
      ...(ids[k] ? [] : [`id:${k}`]),
      ...(ens[k] ? [] : [`en:${k}`]),
    ]);
    expect(missing).toEqual([]);
  });
  it('blok "REDESAIN T10": id dan en memuat key yang sama (append-only)', () => {
    const block = (f: string) => {
      const src = read(f);
      const i = src.indexOf('REDESAIN T10');
      expect(i).toBeGreaterThan(-1);
      return [...src.slice(i).matchAll(/^\s*'([a-zA-Z0-9_.]+)'\s*:/gm)].map(m => m[1]).sort();
    };
    const a = block('lib/locales/id.ts'), b = block('lib/locales/en.ts');
    expect(a.length).toBeGreaterThanOrEqual(90);
    expect(a).toEqual(b);
  });
  it('nilai kamus Pengaturan/Akun tidak lagi memuat emoji/simbol dekoratif (D14)', () => {
    for (const k of ['account.badgeEmail', 'account.switchAccount', 'account.googleLinked', 'account.googleLinkedToast',
      'biometric.verifySuccess', 'biometric.enablePinWarning', 'emailSection.sendResetBtn', 'emailSection.resetSentDesc']) {
      expect(/\p{Extended_Pictographic}|[\u2190-\u21FF\u2713\u2714\u2709]/u.test(ids[k]), `id ${k}`).toBe(false);
      expect(/\p{Extended_Pictographic}|[\u2190-\u21FF\u2713\u2714\u2709]/u.test(ens[k]), `en ${k}`).toBe(false);
    }
  });
});
