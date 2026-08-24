// lib/__tests__/db.test.ts
// v11.5.7 — unit tests untuk buildGranularPaymentPatch: fix bug "delay saat mengetik/
// menyimpan nominal" via granular Firebase write (hanya payments/{key} + activityLog +
// lock state, bukan seluruh AppData ~50KB+).
//
// CATATAN: lib/db.ts mengimpor lib/firebase.ts, yang memanggil getAuth()/getDatabase()
// pada saat MODULE DI-IMPORT (bukan di dalam function) — tanpa config asli ini throw
// auth/invalid-api-key. Belum pernah ada test yang mengimpor lib/db.ts sebelumnya (semua
// test lib/ lain hanya menyentuh payment.ts/format.ts/dst yang tidak menyentuh Firebase
// sama sekali). Env var di-stub HANYA untuk keperluan import di test process ini
// (vi.stubEnv, di-scope ke file test ini) — tidak mengubah kode produksi atau config
// apapun. Nilainya sengaja placeholder karena buildGranularPaymentPatch adalah pure
// function murni yang tidak pernah benar-benar memanggil Firebase.
//
// PENTING: `import` statement di-hoist ke atas modul oleh JS/TS — vi.stubEnv() yang
// ditulis "sebelum" import secara tekstual tetap akan jalan SETELAH import ter-resolve.
// Import lib/db.ts harus dilakukan secara dynamic (di dalam beforeAll) SETELAH stub env,
// agar urutan eksekusi benar-benar terjamin.
import { vi, describe, it, expect, beforeAll } from 'vitest';
import type { ActivityLog, AppData, FreeMember } from '@/types';
import type { buildGranularPaymentPatch as BuildGranularPaymentPatchType } from '@/lib/db';
import type { normalizeImportedData as NormalizeImportedDataType } from '@/lib/db';
import type { buildClonePatch as BuildClonePatchType } from '@/lib/db';
import type { MemberRef } from '@/lib/db';

let buildGranularPaymentPatch: typeof BuildGranularPaymentPatchType;
let normalizeImportedData: typeof NormalizeImportedDataType;
let buildClonePatch: typeof BuildClonePatchType;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  ({ buildGranularPaymentPatch, normalizeImportedData, buildClonePatch } = await import('@/lib/db'));
});

const FIXED_TS = 1752600000000; // waktu tetap agar test deterministik

function makeLog(action: string, ts: number): ActivityLog {
  return { action, ts, user: 'test@example.com' };
}

describe('buildGranularPaymentPatch', () => {
  it('menghasilkan patch dengan hanya payments/{key} — BUKAN seluruh objek payments', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      [], { action: '[PAY] Bayar', detail: 'April 2026: 100.000' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    // Key path harus granular: 'payments/KRS__BUDI__2026__3', bukan 'payments' utuh
    expect(patch['payments/KRS__BUDI__2026__3']).toBe(100);
    expect(patch['payments']).toBeUndefined(); // TIDAK ada key 'payments' generik di patch
  });

  it('paymentValue null → key tetap ditulis dengan nilai null (Firebase menghapus key ini)', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', null,
      [], { action: '[DEL] Hapus' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    expect(patch['payments/KRS__BUDI__2026__3']).toBeNull();
  });

  it('activityLog di-prepend (entry baru di index 0), bukan di-append', () => {
    const existing = [makeLog('[PAY] Lama 1', FIXED_TS - 1000), makeLog('[PAY] Lama 2', FIXED_TS - 2000)];
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      existing, { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const log = patch['activityLog'] as ActivityLog[];
    expect(log[0].action).toBe('[PAY] Baru'); // entry baru di paling depan
    expect(log[0].ts).toBe(FIXED_TS);
    expect(log[1].action).toBe('[PAY] Lama 1');
    expect(log[2].action).toBe('[PAY] Lama 2');
    expect(log.length).toBe(3);
  });

  it('activityLog di-slice ke 200 entries maksimum — konsisten dengan saveDB()', () => {
    const existing: ActivityLog[] = Array.from({ length: 250 }, (_, i) => makeLog(`Lama ${i}`, FIXED_TS - i));
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      existing, { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const log = patch['activityLog'] as ActivityLog[];
    expect(log.length).toBe(200); // 1 baru + 199 lama, entry ke-200+ terpotong
  });

  it('activityLog kosong/undefined tidak menyebabkan crash', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      [], { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const log = patch['activityLog'] as ActivityLog[];
    expect(log.length).toBe(1);
  });

  it('userEmail kosong → fallback ke "—" (konsisten dengan saveDB())', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      [], { action: '[PAY] Baru' }, '',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const log = patch['activityLog'] as ActivityLog[];
    expect(log[0].user).toBe('—');
  });

  it('lock state ikut disertakan di patch — mencegah stale _globalLocked (BUG-001)', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      [], { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: true, lockedEntries: { 'KRS__BUDI': true } }, FIXED_TS,
    );
    expect(patch['_globalLocked']).toBe(true);
    expect(patch['_lockedEntries']).toEqual({ 'KRS__BUDI': true });
  });

  it('paymentKey mengandung "/" → throw eksplisit (defense-in-depth terhadap path Firebase yang salah)', () => {
    expect(() => buildGranularPaymentPatch(
      'KRS__BU/DI__2026__3', 100, // '/' tidak seharusnya lolos dari fbKey(), tapi diuji eksplisit
      [], { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    )).toThrow(/paymentKey mengandung/);
  });

  it('patch TIDAK mengandung field besar (krsMembers/memberInfo/dst) — hanya 4 key di top-level', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100,
      [], { action: '[PAY] Baru' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const topLevelKeys = Object.keys(patch);
    expect(topLevelKeys).toEqual(
      expect.arrayContaining(['payments/KRS__BUDI__2026__3', 'activityLog', '_globalLocked', '_lockedEntries'])
    );
    expect(topLevelKeys.length).toBe(4); // TIDAK ada krsMembers, slkMembers, memberInfo, dst
  });

  // ── Validasi terhadap POLA DATA PRODUKSI NYATA (dari export RTDB Hakiki) ──
  // Bukan sekadar fixture sintetis: nama member dengan hasil sanitasi fbKey() sungguhan
  // ('H.ZAINI' → 'H-ZAINI', kasus yang disebut di komentar hasInvalidFirebaseKeyChars),
  // dan bentuk activityLog persis 200 entries seperti kondisi nyata setelah berbulan-bulan
  // pemakaian (payments 5.815 entries, activityLog di-cap 200, riwayat 2023–2026).
  it('nama member hasil sanitasi fbKey() (mis. H-ZAINI dari H.ZAINI) diterima tanpa masalah', () => {
    const patch = buildGranularPaymentPatch(
      'KRS__H-ZAINI__2026__6', 150,
      [], { action: '[PAY] Bayar KRS - H-ZAINI', detail: 'Jul 2026: Rp 150.000' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    expect(patch['payments/KRS__H-ZAINI__2026__6']).toBe(150);
  });

  it('nama member dengan spasi (mis. "AYU NANDA" — data produksi nyata) diterima tanpa masalah', () => {
    // Spasi BUKAN salah satu karakter yang di-strip fbKey() (. # $ [ ]  /), jadi legal
    // muncul apa adanya di payment key — dikonfirmasi dari export RTDB produksi Hakiki.
    const patch = buildGranularPaymentPatch(
      'KRS__AYU NANDA__2026__3', 100,
      [], { action: '[PAY] Bayar KRS - AYU NANDA' }, 'user@test.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    expect(patch['payments/KRS__AYU NANDA__2026__3']).toBe(100);
  });

  it('activityLog SUDAH persis 200 entries (kondisi nyata setelah pemakaian lama) → tetap 200 setelah prepend, bukan 201', () => {
    const realisticLog: ActivityLog[] = Array.from({ length: 200 }, (_, i) =>
      makeLog(`[PAY] Bayar Rekap KRS - MEMBER${i}`, FIXED_TS - i * 1000),
    );
    const patch = buildGranularPaymentPatch(
      'KRS__IMAM__2026__3', 0,
      realisticLog, { action: '[PAY] Bayar Rekap KRS - IMAM', detail: 'Apr 2026 → Rp 0' }, '13angganh@gmail.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const log = patch['activityLog'] as ActivityLog[];
    expect(log.length).toBe(200);
    expect(log[0].action).toBe('[PAY] Bayar Rekap KRS - IMAM'); // entry baru tetap di depan
    expect(log[199].action).toBe('[PAY] Bayar Rekap KRS - MEMBER198'); // entry terlama (index 199 asli) terpotong
  });

  it('ukuran patch granular jauh lebih kecil dari full-payload untuk dataset skala produksi', () => {
    // Simulasi kasar skala data Hakiki: activityLog 200 entries realistis.
    const realisticLog: ActivityLog[] = Array.from({ length: 200 }, (_, i) =>
      makeLog(`[PAY] Bayar Rekap KRS - MEMBER${i} bulan ${i % 12}`, FIXED_TS - i * 1000),
    );
    const patch = buildGranularPaymentPatch(
      'KRS__BUDI__2026__3', 100000,
      realisticLog, { action: '[PAY] Bayar', detail: 'Apr 2026: Rp 100.000' }, '13angganh@gmail.com',
      { globalLocked: false, lockedEntries: {} }, FIXED_TS,
    );
    const patchSizeBytes = new TextEncoder().encode(JSON.stringify(patch)).length;
    // Payload penuh AppData produksi Hakiki terukur ~201KB (lihat riwayat sesi — payments
    // sendiri ~154KB dari 5.815 entries, memberInfo ~16KB, krsMembers+slkMembers ~1.4KB).
    // Patch granular TIDAK menyertakan payments lain, memberInfo, ataupun krsMembers/slkMembers
    // sama sekali — hanya harus jauh di bawah itu.
    expect(patchSizeBytes).toBeLessThan(50 * 1024); // jauh di bawah 201KB payload penuh
  });
});

// ── normalizeImportedData (v11.5.13 — fix fitur Import yang sebelumnya tidak bisa diakses) ──

describe('normalizeImportedData', () => {
  it('data valid lengkap → dikembalikan apa adanya (semua field sesuai)', () => {
    const input = {
      krsMembers: ['ABIL', 'ADIT'],
      slkMembers: ['SIFA'],
      payments: { 'KRS__ABIL__2026__0': 100 },
      memberInfo: { 'KRS__ABIL': { id: 'KRS01' } },
      activityLog: [{ action: 'lama', ts: 1, user: 'x' }], // akan dikosongkan, lihat test terpisah
      freeMembers: { 'KRS__ADIT': { active: true, fromYear: 2026, fromMonth: 0 } },
      deletedMembers: {},
      operasional: { '2026_0': { modem: 100000 } },
    };
    const result = normalizeImportedData(input);
    expect(result).not.toBeNull();
    expect(result!.krsMembers).toEqual(['ABIL', 'ADIT']);
    expect(result!.slkMembers).toEqual(['SIFA']);
    expect(result!.payments).toEqual({ 'KRS__ABIL__2026__0': 100 });
    expect(result!.memberInfo).toEqual({ 'KRS__ABIL': { id: 'KRS01' } });
    expect(result!.freeMembers).toEqual({ 'KRS__ADIT': { active: true, fromYear: 2026, fromMonth: 0 } });
    expect(result!.operasional).toEqual({ '2026_0': { modem: 100000 } });
  });

  it('null/undefined → null (bukan dianggap valid dengan default kosong)', () => {
    expect(normalizeImportedData(null)).toBeNull();
    expect(normalizeImportedData(undefined)).toBeNull();
  });

  it('bukan objek (string, angka, array) → null', () => {
    expect(normalizeImportedData('not an object')).toBeNull();
    expect(normalizeImportedData(42)).toBeNull();
    expect(normalizeImportedData([1, 2, 3])).toBeNull();
  });

  it('objek tanpa krsMembers MAUPUN payments → null (bukan file backup WiFi Pay)', () => {
    expect(normalizeImportedData({ foo: 'bar' })).toBeNull();
    expect(normalizeImportedData({})).toBeNull();
  });

  it('punya krsMembers TAPI tidak punya payments → tetap valid (salah satu cukup)', () => {
    const result = normalizeImportedData({ krsMembers: ['ABIL'] });
    expect(result).not.toBeNull();
    expect(result!.krsMembers).toEqual(['ABIL']);
    expect(result!.payments).toEqual({});
  });

  it('punya payments TAPI tidak punya krsMembers → tetap valid (salah satu cukup)', () => {
    const result = normalizeImportedData({ payments: { 'KRS__ABIL__2026__0': 100 } });
    expect(result).not.toBeNull();
    expect(result!.payments).toEqual({ 'KRS__ABIL__2026__0': 100 });
    expect(result!.krsMembers).toEqual([]);
  });

  it('field individual salah tipe → di-default kosong, TIDAK menggagalkan seluruh import', () => {
    // File backup lama/parsial/rusak sebagian tetap bisa diimpor sebisanya.
    const result = normalizeImportedData({
      krsMembers: 'bukan array', // salah tipe
      payments: { 'KRS__ABIL__2026__0': 100 }, // ini valid, jadi lolos syarat minimal
      memberInfo: 'bukan objek', // salah tipe
      freeMembers: 123, // salah tipe
    });
    expect(result).not.toBeNull();
    expect(result!.krsMembers).toEqual([]); // fallback kosong, bukan crash
    expect(result!.payments).toEqual({ 'KRS__ABIL__2026__0': 100 }); // yang valid tetap masuk
    expect(result!.memberInfo).toEqual({});
    expect(result!.freeMembers).toEqual({});
  });

  it('activityLog SELALU dikosongkan, apapun isinya di file sumber (disengaja, bukan bug)', () => {
    // Log historis dari device/waktu lain tidak relevan untuk di-restore — activityLog
    // baru akan terisi lagi secara alami begitu user melakukan aksi setelah import.
    const withLog = normalizeImportedData({
      krsMembers: ['ABIL'],
      activityLog: [{ action: 'A', ts: 1, user: 'x' }, { action: 'B', ts: 2, user: 'y' }],
    });
    expect(withLog!.activityLog).toEqual([]);
  });

  it('data berskala realistis (mirip pola produksi nyata) dinormalisasi dengan benar', () => {
    // Nama member persis DEFAULT_KRS (lib/constants.ts) — pola nyata, bukan fixture generik.
    const input: Partial<AppData> = {
      krsMembers: ['ABIL', 'ADIT', 'AJI', 'AKBAR', 'ALFIN'],
      slkMembers: [],
      payments: {
        'KRS__ABIL__2026__0': 100000,
        'KRS__ABIL__2026__1': 100000,
        'KRS__ADIT__2026__0': 200000,
      },
      memberInfo: { 'KRS__ABIL': { id: 'KRS55', ip: '10.90.202.55' } },
    };
    const result = normalizeImportedData(input);
    expect(result).not.toBeNull();
    expect(result!.krsMembers).toHaveLength(5);
    expect(Object.keys(result!.payments)).toHaveLength(3);
    expect(result!.deletedMembers).toEqual({});
    expect(result!.operasional).toEqual({});
  });
});

// ── buildClonePatch (fitur Penagih — clone member terpilih ke akun baru) ──
//
// Fungsi ini menentukan apa yang boleh dan tidak boleh ikut ke akun
// penagih. Kegagalan di sini punya 2 arah risiko yang sama seriusnya:
// (a) histori pembayaran owner bocor ke penagih (bocor privasi/kerancuan
// data), (b) data referensi (tarif, ID pelanggan) TIDAK ikut padahal
// seharusnya (penagih tidak bisa kerja tanpa itu). Test di bawah menguji
// kedua arah secara eksplisit, bukan cuma "hasilnya ada isinya".

function makeSourceData(overrides: Partial<AppData> = {}): AppData {
  return {
    krsMembers: [],
    slkMembers: [],
    payments: {},
    memberInfo: {},
    activityLog: [],
    freeMembers: {},
    deletedMembers: {},
    operasional: {},
    ...overrides,
  };
}

describe('buildClonePatch', () => {
  it('member zona KRS masuk ke krsMembers', () => {
    const source = makeSourceData({ krsMembers: ['ABIL', 'ADIT', 'AJI'] });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['ABIL']);
    expect(patch.slkMembers).toBeUndefined();
  });

  it('member zona SLK masuk ke slkMembers', () => {
    const source = makeSourceData({ slkMembers: ['SIFA'] });
    const selected: MemberRef[] = [{ zone: 'SLK', name: 'SIFA' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.slkMembers).toEqual(['SIFA']);
    expect(patch.krsMembers).toBeUndefined();
  });

  it('member zona custom (bukan KRS/SLK) masuk ke zoneMembers, bukan krsMembers/slkMembers', () => {
    const source = makeSourceData();
    const selected: MemberRef[] = [{ zone: 'TIMUR', name: 'BUDI' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.zoneMembers).toEqual({ TIMUR: ['BUDI'] });
    expect(patch.krsMembers).toBeUndefined();
    expect(patch.slkMembers).toBeUndefined();
  });

  it('campuran KRS + SLK + zona custom dalam satu pemanggilan terpisah dengan benar', () => {
    const source = makeSourceData();
    const selected: MemberRef[] = [
      { zone: 'KRS', name: 'ABIL' },
      { zone: 'SLK', name: 'SIFA' },
      { zone: 'TIMUR', name: 'BUDI' },
      { zone: 'TIMUR', name: 'CITRA' },
    ];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['ABIL']);
    expect(patch.slkMembers).toEqual(['SIFA']);
    expect(patch.zoneMembers).toEqual({ TIMUR: ['BUDI', 'CITRA'] });
  });

  // ── Kasus paling kritis: field date_* (histori bayar) TIDAK BOLEH ikut ──

  it('field date_YYYY_M di memberInfo TIDAK ikut ter-clone (histori bayar milik owner)', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL'],
      memberInfo: {
        'KRS__ABIL': {
          id: 'KRS55',
          tarif: 100000,
          date_2026_0: '2026-01-05', // histori: tanggal owner mencatat bayar Januari
          date_2026_1: '2026-02-03',
        },
      },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    const info = patch.memberInfo!['KRS__ABIL'];
    expect(info.id).toBe('KRS55');
    expect(info.tarif).toBe(100000);
    expect(info.date_2026_0).toBeUndefined();
    expect(info.date_2026_1).toBeUndefined();
    expect(Object.keys(info)).toEqual(['id', 'tarif']); // TIDAK ada field lain nyelip
  });

  it('member tanpa field referensi sama sekali (cuma punya date_*) → tidak bikin key memberInfo kosong', () => {
    const source = makeSourceData({
      krsMembers: ['ADIT'],
      memberInfo: {
        'KRS__ADIT': { date_2026_0: '2026-01-10' }, // cuma histori, tidak ada id/ip/tarif/notes
      },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ADIT' }];
    const patch = buildClonePatch(source, selected);
    // Tidak ada key 'KRS__ADIT' di memberInfo sama sekali — bukan {} kosong
    expect(patch.memberInfo?.['KRS__ADIT']).toBeUndefined();
  });

  it('notes ikut ter-clone (field referensi ke-4 selain id/ip/tarif)', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL'],
      memberInfo: { 'KRS__ABIL': { notes: 'Pindah rumah bulan depan' } },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.memberInfo!['KRS__ABIL'].notes).toBe('Pindah rumah bulan depan');
  });

  // ── payments TIDAK PERNAH ikut, apapun kondisinya ──

  it('payments TIDAK PERNAH muncul di patch — bahkan tidak ada key "payments" sama sekali', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL'],
      payments: {
        'KRS__ABIL__2026__0': 100000,
        'KRS__ABIL__2026__1': 100000,
        'KRS__ADIT__2026__0': 200000,
      },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.payments).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(patch, 'payments')).toBe(false);
  });

  it('deletedMembers, activityLog, operasional TIDAK PERNAH muncul di patch', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL'],
      deletedMembers: { 'KRS__LAMA': { zone: 'KRS', name: 'LAMA', deletedAt: 1, payments: {} } },
      activityLog: [{ action: '[PAY] Bayar', ts: 1, user: 'owner@test.com' }],
      operasional: { '2026_0': { items: [{ label: 'Modem', nominal: 100000 }] } },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.deletedMembers).toBeUndefined();
    expect(patch.activityLog).toBeUndefined();
    expect(patch.operasional).toBeUndefined();
  });

  // ── freeMembers IKUT utuh (dikonfirmasi user: penagih perlu tahu status gratis) ──

  it('freeMembers member terpilih ikut ter-clone UTUH (bukan histori — status berlaku, dikonfirmasi user)', () => {
    const freeStatus: FreeMember = { active: true, fromYear: 2026, fromMonth: 6, toYear: 2026, toMonth: 8 };
    const source = makeSourceData({
      krsMembers: ['ABIL'],
      freeMembers: { 'KRS__ABIL': freeStatus },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.freeMembers!['KRS__ABIL']).toEqual(freeStatus);
  });

  it('freeMembers member yang TIDAK dipilih tidak ikut, meski ada di sumber', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL', 'ADIT'],
      freeMembers: {
        'KRS__ABIL': { active: true, fromYear: 2026, fromMonth: 0 },
        'KRS__ADIT': { active: true, fromYear: 2026, fromMonth: 0 },
      },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }]; // ADIT tidak dipilih
    const patch = buildClonePatch(source, selected);
    expect(patch.freeMembers!['KRS__ABIL']).toBeDefined();
    expect(patch.freeMembers!['KRS__ADIT']).toBeUndefined();
  });

  // ── Kasus tepi ──

  it('selected kosong → patch kosong total (tidak ada key apapun)', () => {
    const source = makeSourceData({ krsMembers: ['ABIL'] });
    const patch = buildClonePatch(source, []);
    expect(Object.keys(patch)).toEqual([]);
  });

  it('nama member duplikat di selected (sama zone+name 2×) tidak menghasilkan duplikat di krsMembers', () => {
    const source = makeSourceData({ krsMembers: ['ABIL'] });
    const selected: MemberRef[] = [
      { zone: 'KRS', name: 'ABIL' },
      { zone: 'KRS', name: 'ABIL' }, // duplikat, mis. dari bug UI checkbox
    ];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['ABIL']); // bukan ['ABIL', 'ABIL']
  });

  it('member dipilih tapi tidak ada memberInfo/freeMembers untuk dia di sumber → tidak crash, cuma tidak masuk', () => {
    const source = makeSourceData({ krsMembers: ['ABIL'] }); // tidak ada memberInfo/freeMembers sama sekali
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'ABIL' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['ABIL']);
    expect(patch.memberInfo).toBeUndefined();
    expect(patch.freeMembers).toBeUndefined();
  });

  // ── Nama dengan karakter khusus (pola data produksi nyata, konsisten dengan test payment key di atas) ──

  it('nama member dengan titik (mis. H.ZAINI — data produksi nyata) diproses tanpa masalah', () => {
    const source = makeSourceData({
      krsMembers: ['H.ZAINI'],
      memberInfo: { 'KRS__H.ZAINI': { id: 'KRS12', tarif: 100000, date_2026_5: '2026-06-01' } },
    });
    const selected: MemberRef[] = [{ zone: 'KRS', name: 'H.ZAINI' }];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['H.ZAINI']);
    expect(patch.memberInfo!['KRS__H.ZAINI']).toEqual({ id: 'KRS12', tarif: 100000 });
  });

  it('subset kecil dari member banyak (skenario nyata: penagih pegang sebagian pelanggan) — hanya yang dipilih yang masuk', () => {
    const source = makeSourceData({
      krsMembers: ['ABIL', 'ADIT', 'AJI', 'AKBAR', 'ALFIN', 'AMIR', 'ANDI'],
    });
    // Penagih ini cuma pegang 3 dari 7 member
    const selected: MemberRef[] = [
      { zone: 'KRS', name: 'ADIT' },
      { zone: 'KRS', name: 'AKBAR' },
      { zone: 'KRS', name: 'ANDI' },
    ];
    const patch = buildClonePatch(source, selected);
    expect(patch.krsMembers).toEqual(['ADIT', 'AKBAR', 'ANDI']);
    expect(patch.krsMembers).not.toContain('ABIL');
    expect(patch.krsMembers).not.toContain('AJI');
  });
});
