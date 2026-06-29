// lib/__tests__/i18n.test.ts
// v11.5.1 — test integritas sistem terjemahan.
//
// Konteks bug yang memicu test ini: createTranslator()/t() mengembalikan KEY ITU SENDIRI
// (bukan string kosong/falsy) untuk key yang tidak terdaftar di locale — lihat lib/i18n.ts
// baris `locale[key] ?? locales['id'][key] ?? key`. Akibatnya, pola `t('some.key') || 'fallback'`
// yang terlihat aman di banyak tempat di kode TIDAK PERNAH benar-benar memakai fallback-nya,
// karena t() selalu mengembalikan truthy value (key string itu sendiri jika tidak ditemukan).
//
// Ini menyebabkan raw key string seperti "settings.ip.zoneLabel" muncul apa adanya di UI
// (dengan titik literal yang terlihat aneh) — dilaporkan user sebagai bug #3 di v11.5.
// Audit menyeluruh juga menemukan bug serupa yang sudah lama ada (pre-existing) di PIN
// settings, search placeholder, dan free member modal.
//
// Test paling penting di file ini adalah "setiap t('key') yang dipakai di source code harus
// terdaftar di KEDUA locale" — ini men-scan source tree secara statis, sehingga regresi
// serupa di masa depan akan tertangkap otomatis oleh test suite, bukan harus ditemukan
// manual oleh pengguna di produksi.

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { t, createTranslator } from '@/lib/i18n';
import id from '@/lib/locales/id';
import en from '@/lib/locales/en';

// ── t() / createTranslator() behavior ───────────────────────────────────────

describe('i18n — t() fallback behavior (root cause dokumentasi)', () => {
  beforeEach(() => {
    // Pastikan default ke 'id' (tidak ada localStorage di environment test)
  });

  it('key yang TERDAFTAR mengembalikan teks terjemahan', () => {
    expect(t('nav.dashboard', 'id')).toBe(id['nav.dashboard']);
  });

  it('PERINGATAN: key yang TIDAK terdaftar mengembalikan KEY ITU SENDIRI (bukan falsy)', () => {
    // Ini bukan test "perilaku yang diinginkan" — ini dokumentasi eksplisit bahwa
    // pola `t('missing.key') || 'fallback'` TIDAK AKAN PERNAH memakai 'fallback',
    // karena nilai kembalian selalu truthy. Siapa pun yang membaca test ini akan
    // langsung paham mengapa pola tersebut berbahaya dan dilarang dipakai di kode.
    const result = t('this.key.does.not.exist.anywhere', 'id');
    expect(result).toBe('this.key.does.not.exist.anywhere');
    expect(result).toBeTruthy(); // <- inilah sebabnya `|| 'fallback'` tidak pernah tercapai
  });

  it('createTranslator juga mengembalikan key itu sendiri untuk key yang hilang', () => {
    const translate = createTranslator('id');
    expect(translate('another.missing.key')).toBe('another.missing.key');
  });

  it('locale "en" fallback ke "id" jika key hanya ada di id (bukan ke raw key)', () => {
    // Pastikan urutan fallback locale[key] ?? locales['id'][key] ?? key berfungsi benar
    const idOnlyKey = Object.keys(id).find(k => !(k in en));
    if (idOnlyKey) {
      const translate = createTranslator('en');
      expect(translate(idOnlyKey)).toBe(id[idOnlyKey]);
    }
  });
});

// ── Static scan: setiap t('literal.key') di source code harus terdaftar ────

describe('i18n — static key coverage (mencegah regresi seperti v11.5 bug #3)', () => {
  const SRC_DIRS = ['components', 'hooks', 'app', 'store'];
  const ROOT = path.resolve(__dirname, '../..');

  function walk(dir: string, exts = ['.tsx', '.ts']): string[] {
    let results: string[] = [];
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return results;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walk(full, exts));
      } else if (exts.some(e => entry.name.endsWith(e)) && !entry.name.includes('.test.')) {
        results.push(full);
      }
    }
    return results;
  }

  function extractKeys(content: string): string[] {
    // Cocokkan t('literal.key') — hanya literal string statis (bukan variabel/template)
    const matches = content.matchAll(/\bt\('([a-zA-Z0-9_.]+)'\)/g);
    return Array.from(matches, m => m[1]).filter(k => k.includes('.'));
  }

  it('semua key t(\'...\') literal yang dipakai di source code terdaftar di id.ts', () => {
    const files = SRC_DIRS.flatMap(d => walk(path.join(ROOT, d)));
    const allUsedKeys = new Set<string>();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const k of extractKeys(content)) allUsedKeys.add(k);
    }

    const missing = Array.from(allUsedKeys).filter(k => !(k in id)).sort();

    expect(files.length).toBeGreaterThan(10); // sanity check: scan benar-benar jalan
    expect(allUsedKeys.size).toBeGreaterThan(50); // sanity check: key benar-benar terkumpul
    expect(missing).toEqual([]);
  });

  it('semua key t(\'...\') literal yang dipakai di source code terdaftar di en.ts', () => {
    const files = SRC_DIRS.flatMap(d => walk(path.join(ROOT, d)));
    const allUsedKeys = new Set<string>();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const k of extractKeys(content)) allUsedKeys.add(k);
    }

    const missing = Array.from(allUsedKeys).filter(k => !(k in en)).sort();
    expect(missing).toEqual([]);
  });

  it('id.ts dan en.ts punya key set yang identik (tidak ada yang hanya di satu sisi)', () => {
    const idKeys = new Set(Object.keys(id));
    const enKeys = new Set(Object.keys(en));
    const onlyInId = [...idKeys].filter(k => !enKeys.has(k)).sort();
    const onlyInEn = [...enKeys].filter(k => !idKeys.has(k)).sort();
    expect(onlyInId).toEqual([]);
    expect(onlyInEn).toEqual([]);
  });
});

// ── Konvensi warna kunci/buka (bug #2 v11.5.1: warna terbalik di Members) ──

describe('Konvensi warna lock/unlock — Header vs Members harus konsisten', () => {
  const ROOT = path.resolve(__dirname, '../..');

  it('Header: globalLocked=true (terkunci) harus pakai warna MERAH (c-belum)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'components/layout/Header.tsx'), 'utf8');
    // Pola: color: globalLocked ? 'var(--c-belum)' : 'var(--c-lunas)'
    expect(content).toMatch(/globalLocked\s*\?\s*'var\(--c-belum\)'\s*:\s*'var\(--c-lunas\)'/);
  });

  it('MembersView: membersLocked=true (terkunci) harus pakai warna MERAH (c-belum), BUKAN hijau', () => {
    const content = fs.readFileSync(path.join(ROOT, 'components/features/members/MembersView.tsx'), 'utf8');
    // Sebelum fix v11.5.1, ini ditulis terbalik: membersLocked ? 'var(--c-lunas)' : 'var(--c-belum)'
    // (terkunci=hijau, terbuka=merah) — kebalikan dari konvensi Header.
    expect(content).toMatch(/membersLocked\s*\?\s*'var\(--c-belum\)'\s*:\s*'var\(--c-lunas\)'/);
    // Pastikan pola TERBALIK (bug lama) benar-benar tidak ada lagi
    expect(content).not.toMatch(/color:membersLocked\?'var\(--c-lunas\)':'var\(--c-belum\)'/);
  });
});

// ── Badge status di Settings — semua harus konsisten hijau saat "aktif" ────

describe('Settings badge — semua badge status harus hijau (var(--c-lunas)) saat aktif', () => {
  it('Tema Tampilan dan Bahasa diberi badgeColor hijau (permintaan eksplisit user v11.5.1)', () => {
    const ROOT = path.resolve(__dirname, '../..');
    const content = fs.readFileSync(path.join(ROOT, 'components/features/settings/SettingsView.tsx'), 'utf8');
    // Hitung badgeColor="var(--c-lunas)" literal (untuk Tema & Bahasa yang bukan boolean toggle)
    const literalGreenBadges = (content.match(/badgeColor="var\(--c-lunas\)"/g) || []).length;
    expect(literalGreenBadges).toBeGreaterThanOrEqual(2); // Tema Tampilan + Bahasa
  });
});

describe('i18n — deteksi pola fallback yang menyesatkan', () => {
  const ROOT = path.resolve(__dirname, '../..');

  function walk(dir: string): string[] {
    let results: string[] = [];
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return results;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walk(full));
      } else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !entry.name.includes('.test.')) {
        results.push(full);
      }
    }
    return results;
  }

  it('tidak ada lagi pola t(\'key\') || \'fallback\' di components — karena tidak pernah benar-benar bekerja sebagai fallback', () => {
    const files = ['components', 'hooks', 'app'].flatMap(d => walk(path.join(ROOT, d)));
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      // Pola: t('...') diikuti ' || ' dan sebuah string literal
      const re = /t\('[a-zA-Z0-9_.]+'\)\s*\|\|\s*'[^']*'/g;
      if (re.test(content)) offenders.push(path.relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });
});
