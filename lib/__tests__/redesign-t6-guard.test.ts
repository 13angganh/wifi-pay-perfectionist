// lib/__tests__/redesign-t6-guard.test.ts — pagar mutu file milik T6 (kontrak bagian 1 + 4)
//  • tanpa emoji           • tanpa lucide-react (ikon resmi = Phosphor)
//  • tanpa percabangan KRS/SLK di file shell milik T6
//  • semua key i18n yang dipakai ada di id DAN en
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const list = (dir: string, filter: (f: string) => boolean) =>
  fs.readdirSync(path.join(ROOT, dir)).filter(filter).map(f => `${dir}/${f}`);

// File ui/ yang dimiliki T10 (PinLock, OnboardingHint) tidak termasuk.
const T10_UI = new Set(['PinLock.tsx', 'PinLock.Numpad.tsx', 'OnboardingHint.tsx']);
const UI_FILES = list('components/ui', f => f.endsWith('.tsx') && !T10_UI.has(f));
const LAYOUT_FILES = list('components/layout', f => f.endsWith('.tsx') || f.endsWith('.ts'));
const AUTH_FILES = list('components/features/auth', f => f.endsWith('.tsx'));
const OWNED = [
  ...UI_FILES, ...LAYOUT_FILES, ...AUTH_FILES,
  'app/login/page.tsx', 'app/offline/page.tsx', 'app/offline/ReloadButton.tsx',
  'lib/navItems.tsx', 'lib/design-tokens.ts',
  'styles/tokens.css', 'styles/ui.css', 'styles/layout.css', 'styles/components.header.css',
  'public/offline.html',
];

describe('File milik T6', () => {
  it('daftar tidak kosong dan file ada', () => {
    expect(OWNED.length).toBeGreaterThan(40);
    OWNED.forEach(f => expect(fs.existsSync(path.join(ROOT, f)), f).toBe(true));
  });

  it('tanpa emoji (kontrak bagian 1 butir 5)', () => {
    const bad = OWNED.filter(f => /\p{Extended_Pictographic}/u.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('tanpa import lucide-react (ikon resmi = Phosphor)', () => {
    const bad = OWNED.filter(f => /from ['"]lucide-react['"]/.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('tanpa percabangan KRS/SLK di Header*.tsx, ZoneTabs, design-tokens (T4 §3, T5 §3)', () => {
    const files = [...LAYOUT_FILES.filter(f => /Header[^/]*\.tsx$/.test(f)), 'lib/design-tokens.ts'];
    const bad = files.filter(f => /(===?|!==?)\s*'(KRS|SLK)'/.test(read(f)));
    expect(bad).toEqual([]);
  });
});

describe('i18n — key yang dipakai file T6 ada di id DAN en', () => {
  const ids = id as Record<string, string>;
  const ens = en as Record<string, string>;
  const used = new Set<string>();
  for (const f of OWNED.filter(x => x.endsWith('.tsx') || x.endsWith('.ts'))) {
    const src = read(f);
    for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) used.add(m[1]);
    for (const m of src.matchAll(/labelKey:\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1]);
  }
  it('ada key yang dipindai', () => { expect(used.size).toBeGreaterThan(40); });
  // Satu test (bukan it.each per key) agar jumlah test tidak naik-turun mengikuti jumlah key.
  it('semua key terdefinisi di id dan en', () => {
    const missing = [...used].sort().flatMap(k => [
      ...(ids[k] ? [] : [`id:${k}`]),
      ...(ens[k] ? [] : [`en:${k}`]),
    ]);
    expect(missing).toEqual([]);
  });
});
