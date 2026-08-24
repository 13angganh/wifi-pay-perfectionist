// lib/__tests__/tenantRegistry.test.ts
// Fitur Penagih (v11.6) — unit test untuk registerTenant() dan
// removeTenantFromList() di lib/db.ts.
//
// KENAPA FILE TERPISAH dari lib/__tests__/db.test.ts: file itu sengaja
// TIDAK memock firebase/database sama sekali (lihat catatan di kepala
// file itu) — semua fungsi yang diuji di sana (buildGranularPaymentPatch,
// normalizeImportedData, buildClonePatch) adalah pure function yang tidak
// pernah benar-benar memanggil Firebase, cukup stub env vars supaya modul
// bisa di-import. registerTenant/removeTenantFromList BERBEDA — mereka
// MEMANG memanggil set() sungguhan ke RTDB, jadi butuh mock firebase/database
// yang melacak panggilan (path + value), bukan cuma stub kosong. Memisah
// ke file sendiri supaya mock ini tidak numpang bocor ke test pure-function
// di db.test.ts yang sengaja didesain tanpa mock sama sekali.

import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { TenantInfo } from '@/types';
import type { registerTenant as RegisterTenantType } from '@/lib/db';
import type { removeTenantFromList as RemoveTenantFromListType } from '@/lib/db';

// ── Mock firebase/database: lacak setiap ref() dan set() call ──
//
// Path DAN value dilacak eksplisit — properti paling kritis yang harus
// dibuktikan (bukan diasumsikan): registerTenant menulis ke path
// `users/{ownerUid}/data/tenants/{tenantUid}` dengan OBJEK TenantInfo
// utuh, sedangkan removeTenantFromList menulis `null` (konvensi hapus
// RTDB) ke path yang SAMA persis. Kalau path-nya salah sedikit saja
// (typo, urutan segment tertukar), data akan tersimpan di tempat yang
// salah tanpa error apapun — RTDB tidak menolak path yang "salah" secara
// business logic, hanya path yang tidak valid secara sintaks.

interface MockDbRef { path: string }

const refCalls: string[] = [];
const setCalls: { path: string; value: unknown }[] = [];

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => {
    refCalls.push(path);
    return { path } as MockDbRef;
  }),
  set: vi.fn((refObj: MockDbRef, value: unknown) => {
    setCalls.push({ path: refObj.path, value });
    return Promise.resolve();
  }),
  getDatabase: vi.fn(() => ({})),
  onValue: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
}));

let registerTenant: typeof RegisterTenantType;
let removeTenantFromList: typeof RemoveTenantFromListType;

beforeAll(async () => {
  // Pola sama seperti db.test.ts — lib/db.ts mengimpor lib/firebase.ts
  // yang memanggil getAuth()/getDatabase() saat modul di-import.
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  ({ registerTenant, removeTenantFromList } = await import('@/lib/db'));
});

beforeEach(() => {
  refCalls.length = 0;
  setCalls.length = 0;
  vi.clearAllMocks();
});

function makeTenant(overrides: Partial<TenantInfo> = {}): TenantInfo {
  return {
    uid: 'tenant-uid-abc123',
    email: 'penagih@test.com',
    memberCount: 5,
    createdAt: 1735000000000,
    ...overrides,
  };
}

describe('registerTenant', () => {
  it('menulis ke path users/{ownerUid}/data/tenants/{tenantUid} — bukan path lain', async () => {
    const tenant = makeTenant({ uid: 'tenant-xyz' });
    await registerTenant('owner-uid-1', tenant);
    expect(refCalls).toEqual(['users/owner-uid-1/data/tenants/tenant-xyz']);
  });

  it('menulis OBJEK TenantInfo UTUH sebagai value — bukan sebagian field saja', async () => {
    const tenant = makeTenant({ uid: 'tenant-xyz', email: 'budi@test.com', label: 'Budi - Zona Timur', memberCount: 12, createdAt: 1735000000000 });
    await registerTenant('owner-uid-1', tenant);
    expect(setCalls).toHaveLength(1);
    expect(setCalls[0].value).toEqual(tenant);
  });

  it('label opsional (undefined) tetap tersimpan apa adanya — tidak dipaksa jadi string kosong', async () => {
    const tenant = makeTenant({ uid: 'tenant-no-label' }); // tidak set label sama sekali
    await registerTenant('owner-uid-1', tenant);
    expect(setCalls[0].value).toEqual(expect.objectContaining({ uid: 'tenant-no-label' }));
    expect((setCalls[0].value as TenantInfo).label).toBeUndefined();
  });

  it('ownerUid yang berbeda menghasilkan path berbeda — tidak ada kebocoran path antar owner', async () => {
    await registerTenant('owner-A', makeTenant({ uid: 'tenant-1' }));
    await registerTenant('owner-B', makeTenant({ uid: 'tenant-1' })); // uid tenant SAMA, owner beda
    expect(refCalls).toEqual([
      'users/owner-A/data/tenants/tenant-1',
      'users/owner-B/data/tenants/tenant-1',
    ]);
  });

  it('dua penagih berbeda untuk owner yang sama menghasilkan dua entry terpisah (path berbeda)', async () => {
    await registerTenant('owner-1', makeTenant({ uid: 'tenant-A' }));
    await registerTenant('owner-1', makeTenant({ uid: 'tenant-B' }));
    expect(refCalls).toEqual([
      'users/owner-1/data/tenants/tenant-A',
      'users/owner-1/data/tenants/tenant-B',
    ]);
    expect(setCalls).toHaveLength(2);
  });
});

describe('removeTenantFromList', () => {
  it('menulis null ke path users/{ownerUid}/data/tenants/{tenantUid} (konvensi hapus RTDB)', async () => {
    await removeTenantFromList('owner-uid-1', 'tenant-xyz');
    expect(refCalls).toEqual(['users/owner-uid-1/data/tenants/tenant-xyz']);
    expect(setCalls).toEqual([{ path: 'users/owner-uid-1/data/tenants/tenant-xyz', value: null }]);
  });

  it('path hapus PERSIS SAMA dengan path tulis untuk uid yang sama (konsistensi register↔remove)', async () => {
    await registerTenant('owner-1', makeTenant({ uid: 'tenant-Z' }));
    const registerPath = refCalls[0];
    refCalls.length = 0;

    await removeTenantFromList('owner-1', 'tenant-Z');
    const removePath = refCalls[0];

    expect(removePath).toBe(registerPath); // kalau beda, hapus akan menyasar entry yang salah
  });

  it('TIDAK memanggil apapun selain ref+set — tidak menyentuh firebase/auth atau path lain', async () => {
    await removeTenantFromList('owner-uid-1', 'tenant-xyz');
    // Hanya 1 ref() dan 1 set() — tidak ada operasi tambahan yang mungkin
    // secara tidak sengaja menyentuh akun Auth penagih (di luar scope
    // fungsi ini sama sekali, lihat komentar di lib/db.ts).
    expect(refCalls).toHaveLength(1);
    expect(setCalls).toHaveLength(1);
  });

  it('bisa dipanggil berkali-kali untuk uid yang sama tanpa error (idempotent secara efek — RTDB set(null) pada path kosong tidak error)', async () => {
    await removeTenantFromList('owner-1', 'tenant-sudah-dihapus');
    await removeTenantFromList('owner-1', 'tenant-sudah-dihapus'); // panggilan kedua, mis. klik tombol 2×
    expect(setCalls).toHaveLength(2);
    expect(setCalls[0]).toEqual(setCalls[1]); // efek sama persis, tidak ada state tersembunyi
  });
});
