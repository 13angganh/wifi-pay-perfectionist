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

// ── Konvensi warna & struktur toggle kunci/buka (v11.5.1 → v11.6.9 → v11.7.0) ──
//
// v11.5.1: warna awalnya terbalik total di Members (membersLocked=true tampil hijau).
// v11.6.8: teks Members diubah dari label STATE ke label AKSI, warna lupa disesuaikan.
// v11.6.9: warna diuji berbasis KATA yang tertulis (KUNCI=merah, BUKA=hijau) — tapi ini
//   mengasumsikan tombol gabungan 1-elemen dengan teks pendek "KUNCI"/"BUKA" yg ambigu
//   antara status vs perintah (linter halus dari panduan UX yang diberikan user).
// v11.7.0: RESTRUKTURISASI TOTAL — tombol gabungan dipecah jadi 2 elemen terpisah,
//   konsisten di Header & Members: (1) badge STATUS (kata sifat "Terkunci"/"Terbuka",
//   tak bisa diklik, warna ikut kondisi) + (2) tombol AKSI ikon-saja tanpa teks (warna
//   solid class header-lock-action-btn, ikon menggambarkan HASIL aksi bukan status).
//   Test v11.6.9 di atas sudah tidak relevan (menguji tombol gabungan yg sudah tidak
//   ada) — diganti test di bawah yg menguji struktur baru.

describe('Toggle kunci/buka v11.7.0 — badge status + tombol aksi terpisah, konsisten Header/Members', () => {
  const ROOT = path.resolve(__dirname, '../..');
  const headerContent  = fs.readFileSync(path.join(ROOT, 'components/layout/Header.tsx'), 'utf8');
  const membersContent = fs.readFileSync(path.join(ROOT, 'components/features/members/MembersView.tsx'), 'utf8');

  it('Header & Members: badge status pakai kata sifat (statusLocked/statusUnlocked), BUKAN kata perintah lock/unlock', () => {
    // Badge status HARUS pakai key .statusLocked/.statusUnlocked (kata sifat "Terkunci"/
    // "Terbuka") — bukan .lock/.unlock (kata perintah "KUNCI"/"BUKA") yg sekarang khusus
    // aria-label tombol aksi. Mencampur keduanya di badge = regresi ambiguitas status-vs-
    // perintah yg jadi alasan utama restrukturisasi ini.
    expect(headerContent).toMatch(/globalLocked\s*\?\s*t\('header\.statusLocked'\)\s*:\s*t\('header\.statusUnlocked'\)/);
    expect(membersContent).toMatch(/membersLocked\s*\?\s*t\('members\.statusLocked'\)\s*:\s*t\('members\.statusUnlocked'\)/);
  });

  it('Header & Members: badge status — merah saat terkunci, hijau saat terbuka (konsisten satu sama lain)', () => {
    expect(headerContent).toMatch(/globalLocked\s*\?\s*'var\(--c-belum\)'\s*:\s*'var\(--c-lunas\)'/);
    expect(membersContent).toMatch(/membersLocked\s*\?\s*'var\(--c-belum\)'\s*:\s*'var\(--c-lunas\)'/);
  });

  it('Header & Members: tombol aksi pakai class header-lock-action-btn yang SAMA (bukan style ad-hoc terpisah)', () => {
    // Nama class tetap "header-" meski dipakai jg di Members — disengaja, supaya kedua
    // toggle "lock" di app ini benar2 pakai 1 sumber styling, bukan cuma warna yg kebetulan
    // sama. Lihat styles/components.header.css untuk definisi + override 3-tema.
    expect(headerContent).toContain('className="header-lock-action-btn"');
    expect(membersContent).toContain('className="header-lock-action-btn"');
  });

  it('Header & Members: ikon tombol aksi = HASIL aksi (LockOpen saat status terkunci, Lock saat status terbuka)', () => {
    // Tombol aksi saat status TERKUNCI menawarkan aksi "buka" → ikon LockOpen.
    // Tombol aksi saat status TERBUKA menawarkan aksi "kunci" → ikon Lock.
    expect(headerContent).toMatch(/globalLocked\s*\n?\s*\?\s*<LockOpen[^/]*\/>\s*\n?\s*:\s*<Lock[^O][^/]*\/>/);
    expect(membersContent).toMatch(/membersLocked\s*\n?\s*\?\s*<LockOpen[^/]*\/>\s*\n?\s*:\s*<Lock[^O][^/]*\/>/);
  });

  it('LockBanner sudah dihapus — tidak ada import atau pemakaian tersisa di AppShell', () => {
    const appShellContent = fs.readFileSync(path.join(ROOT, 'components/layout/AppShell.tsx'), 'utf8');
    expect(appShellContent).not.toMatch(/import LockBanner/);
    expect(appShellContent).not.toMatch(/<LockBanner\s*\/>/);
    expect(fs.existsSync(path.join(ROOT, 'components/layout/LockBanner.tsx'))).toBe(false);
  });
});

describe('3-tema warna tombol aksi kunci/buka (header-lock-action-btn)', () => {
  const ROOT = path.resolve(__dirname, '../..');
  const cssContent = fs.readFileSync(path.join(ROOT, 'styles/components.header.css'), 'utf8');

  it('Dark & Light (default): pakai --zc-krs (bukan hex biru literal, supaya ikut tema)', () => {
    expect(cssContent).toMatch(/\.header-lock-action-btn\s*\{[^}]*background:\s*var\(--zc-krs\)/);
  });

  it('Gold: override ke --gold dengan ikon --bg (bukan putih — kontras putih-di-atas-gold cuma 2.69:1, di bawah WCAG AA 3:1)', () => {
    expect(cssContent).toMatch(/body\.gold\s+\.header-lock-action-btn\s*\{[^}]*background:\s*var\(--gold\)/);
    expect(cssContent).toMatch(/body\.gold\s+\.header-lock-action-btn\s*\{[^}]*color:\s*var\(--bg\)/);
  });
});

// ── Konsistensi tampilan label versi (bug v11.6.7→v11.6.8: Sidebar lebih redup dr Header) ──

describe('Label versi APP_VERSION_FULL — Sidebar vs Header harus pakai fontSize+warna sama', () => {
  const ROOT = path.resolve(__dirname, '../..');

  it('Sidebar: label versi harus pakai var(--fs-micro) + var(--txt4), BUKAN fontSize:8 + txt5', () => {
    const content = fs.readFileSync(path.join(ROOT, 'components/layout/Sidebar.tsx'), 'utf8');
    // Sebelum fix v11.6.8, ini fontSize:8 (literal) + color:'var(--txt5)' — txt5 lebih redup
    // dari txt4 yang dipakai Header, menyebabkan versi Sidebar tampak lebih gelap meski teks
    // (APP_VERSION_FULL) sudah identik sejak awal — murni gap styling, bukan gap teks.
    expect(content).toMatch(/fontSize:\s*'var\(--fs-micro\)'\s*,\s*color:\s*'var\(--txt4\)'\s*\}\}>\{APP_VERSION_FULL\}/);
    expect(content).not.toMatch(/fontSize:\s*8\s*,\s*color:\s*'var\(--txt5\)'/);
  });

  it('Header: label versi tetap var(--fs-micro) + var(--txt4) (acuan yang disalin Sidebar)', () => {
    const content = fs.readFileSync(path.join(ROOT, 'components/layout/Header.tsx'), 'utf8');
    expect(content).toMatch(/fontSize:\s*'var\(--fs-micro\)'\s*,\s*color:\s*'var\(--txt4\)'\s*\}\}>\{APP_VERSION_FULL\}/);
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
