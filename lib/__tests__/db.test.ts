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
import type { ActivityLog, AppData } from '@/types';
import type { buildGranularPaymentPatch as BuildGranularPaymentPatchType } from '@/lib/db';
import type { normalizeImportedData as NormalizeImportedDataType } from '@/lib/db';

let buildGranularPaymentPatch: typeof BuildGranularPaymentPatchType;
let normalizeImportedData: typeof NormalizeImportedDataType;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  ({ buildGranularPaymentPatch, normalizeImportedData } = await import('@/lib/db'));
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
