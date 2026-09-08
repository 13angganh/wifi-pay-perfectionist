// lib/__tests__/listenDB.test.ts
// v11.6.4 — Test regresi untuk bug: listenDB() tidak pernah memetakan
// field `tenants` dari payload Firebase kembali ke AppData yang dipakai
// aplikasi.
//
// KONTEKS BUG: DEFAULT_APP_DATA (lib/db.ts) sudah punya `tenants: {}`
// sejak v11.6 (fitur Penagih), dan registerTenant() menulis data tenant
// dengan benar ke path Firebase terpisah (users/{uid}/data/tenants/{tid}) —
// diverifikasi oleh tenantRegistry.test.ts. TAPI listenDB() (fungsi yang
// membangun objek `raw: AppData` dari payload onValue) tidak pernah
// menyertakan `tenants` saat merekonstruksi objek itu — satu-satunya field
// AppData yang terlewat dari 11 field yang ada. Efeknya: appData.tenants
// SELALU undefined di seluruh aplikasi meski data tenants tersimpan
// sempurna di Firebase — SettingsTenantSection.tsx (appData.tenants ?? {})
// akan selalu menampilkan daftar penagih kosong setelah reload/refresh,
// walau owner sudah membuat beberapa akun penagih sebelumnya.
//
// Root cause lolos tsc: AppData.tenants bertipe optional (tenants?:), jadi
// TypeScript tidak menganggap objek literal yang tidak menyertakan field
// itu sebagai error.
//
// KENAPA FILE TERPISAH dari db.test.ts / tenantRegistry.test.ts: perlu
// mock onValue yang BENAR-BENAR memanggil callback-nya dengan payload
// palsu (bukan vi.fn() kosong seperti di tenantRegistry.test.ts, yang
// tidak pernah menguji listener-nya sendiri).

import { vi, describe, it, expect, beforeAll } from 'vitest';
import type { listenDB as ListenDBType } from '@/lib/db';

// ── Mock firebase/database: onValue memanggil callback-nya sendiri
// dengan snapshot palsu yang bisa dikontrol per-test via let terakhir ──
let mockSnapshotValue: Record<string, unknown> | null = null;

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  onValue: vi.fn((_ref: unknown, callback: (snap: { val: () => unknown }) => void) => {
    callback({ val: () => mockSnapshotValue });
    return () => {}; // unsubscribe no-op
  }),
  off: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  getDatabase: vi.fn(() => ({})),
}));

let listenDB: typeof ListenDBType;

beforeAll(async () => {
  // Pola sama seperti db.test.ts / tenantRegistry.test.ts — lib/db.ts
  // mengimpor lib/firebase.ts yang memanggil getAuth()/getDatabase() saat
  // modul di-import.
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  ({ listenDB } = await import('@/lib/db'));
});

describe('listenDB — pemetaan field tenants (regresi v11.6.4)', () => {
  it('tenants dari payload Firebase HARUS masuk ke AppData yang diteruskan ke onData', () => {
    mockSnapshotValue = {
      krsMembers: ['Budi'],
      payments: {},
      tenants: {
        'uid-penagih-1': { uid: 'uid-penagih-1', email: 'penagih1@test.com', memberCount: 5, createdAt: 123 },
      },
    };

    let received: unknown = null;
    listenDB('test-uid', (data) => { received = data; }, () => {});

    expect(received).not.toBeNull();
    expect((received as { tenants?: unknown }).tenants).toEqual({
      'uid-penagih-1': { uid: 'uid-penagih-1', email: 'penagih1@test.com', memberCount: 5, createdAt: 123 },
    });
  });

  it('tanpa tenants di payload Firebase → default ke objek kosong (BUKAN undefined)', () => {
    mockSnapshotValue = {
      krsMembers: ['Budi'],
      payments: {},
      // tenants sengaja tidak ada di payload — skenario user lama yang
      // belum pernah pakai fitur Penagih sama sekali
    };

    let received: unknown = null;
    listenDB('test-uid', (data) => { received = data; }, () => {});

    expect((received as { tenants?: unknown }).tenants).toEqual({});
    expect((received as { tenants?: unknown }).tenants).not.toBeUndefined();
  });

  it('field AppData lain tetap terpetakan dengan benar (tidak ada regresi dari perubahan ini)', () => {
    mockSnapshotValue = {
      krsMembers: ['Budi', 'Citra'],
      slkMembers: ['Andi'],
      payments: { 'KRS__Budi__2026__0': 100 },
      memberInfo: { 'KRS__Budi': { tarif: 100 } },
      freeMembers: { 'KRS__Andi': true },
      tenants: { 'uid-x': { uid: 'uid-x', email: 'x@test.com', memberCount: 1, createdAt: 1 } },
    };

    let received: unknown = null;
    listenDB('test-uid', (data) => { received = data; }, () => {});

    const r = received as Record<string, unknown>;
    expect(r.krsMembers).toEqual(['Budi', 'Citra']);
    expect(r.slkMembers).toEqual(['Andi']);
    expect(r.payments).toEqual({ 'KRS__Budi__2026__0': 100 });
    expect(r.memberInfo).toEqual({ 'KRS__Budi': { tarif: 100 } });
    expect(r.freeMembers).toEqual({ 'KRS__Andi': true });
  });
});
