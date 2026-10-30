// lib/__tests__/redesign-t11-guard.test.ts — REDESAIN T11: penjaga mutu SELURUH kode produksi (bukan hanya berkas milik satu tahap).
//  • tanpa emoji di UI   • tanpa lucide-react / framer-motion   • tanpa percabangan zona tertanam
//  • aksesibilitas statis (tombol ikon bernama, role=button dapat difokus)   • tanpa kelas CSS global yang mati   • tanpa berkas yatim
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.next', '.git', '__tests__', 'e2e', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(ROOT, p).replaceAll('\\', '/');
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, m => '\n'.repeat(m.split('\n').length - 1)).replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const SRC = ['app', 'components', 'hooks', 'lib', 'store', 'types']
  .flatMap(d => walk(join(ROOT, d)))
  .map(rel)
  .filter(f => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.tsx?$/.test(f));
const TSX = SRC.filter(f => f.endsWith('.tsx'));

describe('T11 — tanpa emoji', () => {
  it('UI (app/ dan components/) bebas emoji', () => {
    const bad = SRC.filter(f => /^(app|components)\//.test(f) && /\p{Extended_Pictographic}/u.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('lib/: emoji hanya di pesan WA (keluar aplikasi), log console, dan komentar', () => {
    const allowed = new Set(['lib/export.wa.ts', 'lib/logger.ts', 'lib/env.ts', 'lib/rollback.ts']);
    const bad = SRC.filter(f => /^(lib|hooks|store)\//.test(f) && !allowed.has(f) && /\p{Extended_Pictographic}/u.test(stripComments(read(f))));
    expect(bad).toEqual([]);
  });
});

describe('T11 — dependensi visual', () => {
  it('tanpa import lucide-react / framer-motion di seluruh kode produksi (ikon resmi = Phosphor)', () => {
    const bad = SRC.filter(f => /from ['"](lucide-react|framer-motion)['"]/.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('ekspor mati yang dibersihkan tidak kembali', () => {
    expect(existsSync(join(ROOT, 'hooks/useEntry.ts'))).toBe(false);
    const c = stripComments(read('lib/constants.ts'));
    expect(c).not.toMatch(/PAGE_ICON_MAP|PAGE_TITLES|lucide/);
  });
});

describe('T11 — zona kustom = KRS/SLK (tanpa percabangan tertanam)', () => {
  // Satu-satunya tempat yang BOLEH menyebut zona dasar: akses data, default, token warna, tab zona yang menghormati zona tersembunyi.
  const ALLOWED = new Set([
    'lib/member.ts', 'lib/db.ts', 'lib/design-tokens.ts', 'store/slices/viewSlice.ts', 'types/index.ts',
    'components/layout/Header.ZoneTabs.tsx',
  ]);
  const PATTERNS: [string, RegExp][] = [
    ['=== / !== KRS|SLK', /(?:===|!==)\s*['"](?:KRS|SLK)['"]|['"](?:KRS|SLK)['"]\s*(?:===|!==)/],
    ['daftar zona literal', /\[\s*['"]KRS['"]\s*,\s*['"]SLK['"]/],
    ['krsMembers / slkMembers', /\b(?:krsMembers|slkMembers)\b/],
    ['ZC_KRS / ZC_SLK langsung', /\bZC_(?:KRS|SLK)\b/],
  ];
  it.each(PATTERNS)('%s hanya di berkas akses-data/default', (_name, rx) => {
    const bad = SRC.filter(f => !ALLOWED.has(f) && rx.test(stripComments(read(f))));
    expect(bad).toEqual([]);
  });
});

/* ── aksesibilitas statis ── */
function tagEnd(s: string, i: number): number {
  let depth = 0; let q = ''; let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (q) { if (c === '\\') { j += 2; continue; } if (c === q) q = ''; }
    else if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return j + 1;
    j++;
  }
  return -1;
}

describe('T11 — aksesibilitas statis', () => {
  it('setiap <button> berisi ikon saja punya nama (aria-label / aria-labelledby / title)', () => {
    const bad: string[] = [];
    for (const f of TSX) {
      const s = stripComments(read(f));
      for (const m of s.matchAll(/<button\b/g)) {
        const e = tagEnd(s, m.index!);
        if (e < 0) continue;
        const tag = s.slice(m.index!, e);
        if (tag.endsWith('/>')) continue;
        const k = s.indexOf('</button>', e);
        if (k < 0) continue;
        const named = /aria-label(?:ledby)?\s*=|\btitle\s*=/.test(tag);
        const text = s.slice(e, k).replace(/<[^<>]*(?:\{[^{}]*\}[^<>]*)*>/g, '');
        const hasText = /[A-Za-z0-9\u00C0-\u024F]/.test(text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')) || text.includes('{');
        if (!named && !hasText) bad.push(`${f}:${s.slice(0, m.index!).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('role="button" pada elemen non-<button> wajib tabIndex + penangan keyboard', () => {
    const bad: string[] = [];
    for (const f of TSX) {
      const s = stripComments(read(f));
      for (const m of s.matchAll(/<(?!button\b)[A-Za-z][\w.]*\b/g)) {
        const e = tagEnd(s, m.index!);
        if (e < 0) continue;
        const tag = s.slice(m.index!, e);
        if (/\brole\s*=\s*["']button["']/.test(tag) && !(/\btabIndex\s*=/.test(tag) && /\bonKeyDown\s*=/.test(tag))) {
          bad.push(`${f}:${s.slice(0, m.index!).split('\n').length}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('onClick pada elemen non-interaktif hanya untuk latar (backdrop) / sel tabel yang sudah dicatat', () => {
    const ALLOWED = new Set([
      'components/layout/AppShell.tsx',            // latar drawer Sidebar (Esc juga menutup — useEscapeClose)
      'components/ui/Confirm.tsx',                 // latar dialog konfirmasi (Esc menutup)
      'components/ui/Sheet.tsx',                   // latar sheet (Esc menutup)
      'components/features/rekap/RekapView.Table.tsx', // sel tabel Rekap: sama seperti zip (catatan a11y laporan T11)
    ]);
    const bad: string[] = [];
    for (const f of TSX) {
      if (ALLOWED.has(f)) continue;
      const s = stripComments(read(f));
      for (const m of s.matchAll(/<(div|span|li|td|tr|p|section|article|header|footer|label)\b/g)) {
        const e = tagEnd(s, m.index!);
        if (e < 0) continue;
        const tag = s.slice(m.index!, e);
        if (/\bonClick\b/.test(tag) && !/\brole\s*=/.test(tag)) bad.push(`${f}:${s.slice(0, m.index!).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

/* ── CSS global tanpa kelas mati ── */
describe('T11 — CSS global', () => {
  const CSS = [...walk(join(ROOT, 'styles')).filter(f => f.endsWith('.css')).map(rel), 'app/globals.css'];
  // kelas varian yang dirangkai dinamis (`wp-tile--${tone}` dst.)
  const DYNAMIC = ['wp-tile--', 'wp-logo--', 'wp-toast--', 'wp-notice--', 'wp-pct--'];

  function usedTokens(): Set<string> {
    const tokens = new Set<string>();
    const lit = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    for (const f of SRC) {
      const s = stripComments(read(f));
      for (const m of s.matchAll(lit)) {
        const seg = m[1] ?? m[2] ?? m[3] ?? '';
        for (const tk of seg.split(/[\s,;:()[\]{}$`"'=<>/+?|&!*]+/)) if (tk) tokens.add(tk);
      }
    }
    return tokens;
  }

  it('setiap kelas di styles/*.css dan app/globals.css masih dipakai kode produksi', () => {
    const tokens = usedTokens();
    const dead: string[] = [];
    for (const f of CSS) {
      const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      const seen = new Set<string>();
      for (const m of css.matchAll(/([^{}]+)\{/g)) {
        const pre = m[1].trim();
        if (pre.startsWith('@')) continue;
        for (const c of pre.replace(/:not\([^)]*\)/g, '').matchAll(/(?<![\w-])\.(-?[A-Za-z_][\w-]*)/g)) seen.add(c[1]);
      }
      for (const c of seen) if (!tokens.has(c) && !DYNAMIC.some(p => c.startsWith(p))) dead.push(`${f} .${c}`);
    }
    expect(dead).toEqual([]);
  });

  it('setiap @keyframes dirujuk oleh sebuah animation', () => {
    const all = [...CSS, ...walk(join(ROOT, 'components')).filter(f => f.endsWith('.css')).map(rel)].map(f => read(f)).join('\n');
    const names = [...all.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map(m => m[1]);
    const srcAll = SRC.map(f => read(f)).join('\n');
    const dead = names.filter(n => {
      const rx = new RegExp(`(?<![\\w-])${n}(?![\\w-])`, 'g');
      const refs = (all.match(rx)?.length ?? 0) + (srcAll.match(rx)?.length ?? 0);
      return refs < 2; // 1 = hanya definisinya sendiri
    });
    expect(dead).toEqual([]);
  });
});
