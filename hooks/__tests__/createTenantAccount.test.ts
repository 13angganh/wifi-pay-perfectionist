// hooks/__tests__/createTenantAccount.test.ts
// Fitur Penagih — unit test untuk createTenantAccount() di useAuth.ts.
//
// KENAPA FILE TERPISAH dari useAuth.test.ts: file itu murni menguji
// friendlyAuthError() (fungsi pure, tanpa Firebase). createTenantAccount()
// butuh mock penuh firebase/app + firebase/auth untuk diuji — memisahkan
// supaya file lama tetap ringan/cepat dan mock di sini tidak numpang
// bocor ke test lain yang tidak butuh.
//
// PROPERTI PALING KRITIS yang diuji: instance Firebase App KEDUA yang
// dibuat untuk createUserWithEmailAndPassword() TIDAK BOLEH menyentuh
// instance `auth` UTAMA (yang dipakai owner login) — inilah alasan
// fungsi ini ada sama sekali. Mock di bawah didesain untuk BISA
// membuktikan (bukan cuma mengasumsikan) klaim itu: initializeApp()
// dilacak per-nama, createUserWithEmailAndPassword() dilacak instance
// auth mana yang jadi argumennya.
//
// Tidak memakai Firebase emulator (butuh Java runtime + binary download,
// tidak tersedia di sandbox ini, dan di luar cakupan wajar untuk satu
// fungsi) — mock ini didesain meniru STRUKTUR nyata SDK (identitas objek
// App berbeda per initializeApp() call dengan nama berbeda), bukan
// sekadar stub yang selalu return sukses.

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock firebase/app: lacak setiap initializeApp() dan deleteApp() call ──

interface MockFirebaseApp {
  name: string;
  __mockId: number;
}

let appMockCounter = 0;
const initializeAppCalls: { config: unknown; name?: string }[] = [];
const deleteAppCalls: MockFirebaseApp[] = [];

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn((config: unknown, name?: string) => {
    appMockCounter += 1;
    initializeAppCalls.push({ config, name });
    // __mockId unik per panggilan — identitas objek App berbeda,
    // meniru bagaimana Firebase SDK asli mengembalikan instance App
    // yang benar-benar terpisah untuk nama yang berbeda.
    return { name: name ?? '[DEFAULT]', __mockId: appMockCounter } as MockFirebaseApp;
  }),
  deleteApp: vi.fn((app: MockFirebaseApp) => {
    deleteAppCalls.push(app);
    return Promise.resolve();
  }),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]', __mockId: 0 }) as MockFirebaseApp),
}));

// ── Mock firebase/auth: lacak instance `auth` mana yang dipakai tiap call ──

interface MockAuth {
  __appRef: MockFirebaseApp;
}

const getAuthCalls: MockFirebaseApp[] = [];
const createUserCalls: { authInstance: MockAuth; email: string; pass: string }[] = [];
const signOutCalls: MockAuth[] = [];

// Kontrol skenario sukses/gagal dari dalam test — direset di beforeEach.
let createUserShouldFail = false;
let createUserFailCode = 'auth/email-already-in-use';
let createdUid = 'mock-tenant-uid-123';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn((app: MockFirebaseApp) => {
    getAuthCalls.push(app);
    return { __appRef: app } as MockAuth;
  }),
  createUserWithEmailAndPassword: vi.fn(
    (authInstance: MockAuth, email: string, pass: string) => {
      createUserCalls.push({ authInstance, email, pass });
      if (createUserShouldFail) {
        return Promise.reject({ code: createUserFailCode });
      }
      return Promise.resolve({ user: { uid: createdUid } });
    },
  ),
  signOut: vi.fn((authInstance: MockAuth) => {
    signOutCalls.push(authInstance);
    return Promise.resolve();
  }),
  // Simbol-simbol lain yang diimpor useAuth.ts tapi tidak relevan untuk
  // test ini — stub minimal supaya modul tetap bisa di-import tanpa error.
  onAuthStateChanged: vi.fn(() => () => {}),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  linkWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider(this: { setCustomParameters: () => void }) {
    this.setCustomParameters = vi.fn();
  }),
  verifyBeforeUpdateEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  browserLocalPersistence: {},
  setPersistence: vi.fn(),
  AuthErrorCodes: {},
}));

// lib/firebase.ts memanggil getAuth()/getDatabase() saat modul di-import
// (bukan di dalam function) — perlu di-mock juga, bukan cuma di-stub-env
// seperti pola lib/db.ts, karena useAuth.ts meng-import `auth` sebagai
// instance langsung (named export), bukan lewat fungsi getter.
vi.mock('@/lib/firebase', () => ({
  auth: { __appRef: { name: '[DEFAULT]', __mockId: 0 } },
  firebaseConfig: { apiKey: 'mock-api-key', projectId: 'mock-project' },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  set: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
}));

import { createTenantAccount } from '@/hooks/useAuth';

beforeEach(() => {
  vi.clearAllMocks();
  initializeAppCalls.length = 0;
  deleteAppCalls.length = 0;
  getAuthCalls.length = 0;
  createUserCalls.length = 0;
  signOutCalls.length = 0;
  appMockCounter = 0;
  createUserShouldFail = false;
  createUserFailCode = 'auth/email-already-in-use';
  createdUid = 'mock-tenant-uid-123';
});

describe('createTenantAccount', () => {
  it('membuat instance Firebase App BARU dengan nama BERBEDA dari app utama ("[DEFAULT]")', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(initializeAppCalls.length).toBe(1);
    expect(initializeAppCalls[0].name).toBeDefined();
    expect(initializeAppCalls[0].name).not.toBe('[DEFAULT]');
  });

  it('instance App yang dibuat memakai firebaseConfig yang sama dengan app utama (config diteruskan apa adanya)', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(initializeAppCalls[0].config).toEqual({ apiKey: 'mock-api-key', projectId: 'mock-project' });
  });

  // ── Properti paling kritis: createUserWithEmailAndPassword() dipanggil ──
  // ── dengan instance auth dari App KEDUA, BUKAN dari App utama ──────────

  it('createUserWithEmailAndPassword dipanggil dengan instance auth dari App KEDUA (tenant), bukan App utama', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(createUserCalls.length).toBe(1);
    const authUsedForCreate = createUserCalls[0].authInstance;
    // authUsedForCreate harus berasal dari getAuth(tempApp) — App yang
    // __mockId-nya BUKAN 0 (App utama selalu __mockId 0 di mock ini).
    expect(authUsedForCreate.__appRef.__mockId).not.toBe(0);
    expect(authUsedForCreate.__appRef.__mockId).toBe(initializeAppCalls.length > 0 ? 1 : -1);
  });

  it('getAuth dipanggil dengan App instance yang PERSIS SAMA dengan hasil initializeApp (identitas objek, bukan cuma tipe)', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(getAuthCalls.length).toBe(1);
    // __mockId harus match — membuktikan ini App instance yang sama
    // persis, bukan instance App LAIN yang kebetulan mirip.
    expect(getAuthCalls[0].__mockId).toBe(1);
  });

  it('email dan password diteruskan apa adanya ke createUserWithEmailAndPassword', async () => {
    await createTenantAccount('penagih-baru@wifipay.test', 'RahasiaPenagih99');
    expect(createUserCalls[0].email).toBe('penagih-baru@wifipay.test');
    expect(createUserCalls[0].pass).toBe('RahasiaPenagih99');
  });

  // ── Cleanup: signOut + deleteApp harus SELALU dipanggil ──

  it('signOut dipanggil pada instance auth tenant setelah user berhasil dibuat', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(signOutCalls.length).toBe(1);
    expect(signOutCalls[0].__appRef.__mockId).toBe(1); // instance tenant, bukan utama
  });

  it('deleteApp dipanggil pada instance App tenant setelah SUKSES — tidak menumpuk instance', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    expect(deleteAppCalls.length).toBe(1);
    expect(deleteAppCalls[0].__mockId).toBe(1);
  });

  it('deleteApp TETAP dipanggil meski createUserWithEmailAndPassword GAGAL (mis. email sudah terdaftar) — via finally', async () => {
    createUserShouldFail = true;
    createUserFailCode = 'auth/email-already-in-use';
    await createTenantAccount('sudah-ada@test.com', 'password123');
    expect(deleteAppCalls.length).toBe(1); // TETAP dibuang, tidak menumpuk
  });

  // ── Hasil sukses: uid dikembalikan, error tidak ada ──

  it('sukses → mengembalikan { uid } tanpa error, uid persis dari result.user.uid', async () => {
    createdUid = 'firebase-generated-uid-abc123';
    const result = await createTenantAccount('penagih@test.com', 'password123');
    expect(result.uid).toBe('firebase-generated-uid-abc123');
    expect(result.error).toBeUndefined();
  });

  // ── Hasil gagal: error terjemahan bahasa Indonesia, uid tidak ada ──

  it('gagal (email sudah terdaftar) → mengembalikan { error } terjemahan, uid tidak ada', async () => {
    createUserShouldFail = true;
    createUserFailCode = 'auth/email-already-in-use';
    const result = await createTenantAccount('sudah-ada@test.com', 'password123');
    expect(result.uid).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Email sudah terdaftar'); // dari friendlyAuthError, konsisten dgn fungsi auth lain
  });

  it('gagal (password lemah) → error message sesuai kode itu, bukan pesan generik', async () => {
    createUserShouldFail = true;
    createUserFailCode = 'auth/weak-password';
    const result = await createTenantAccount('penagih@test.com', '123');
    expect(result.error).toContain('Password terlalu lemah');
  });

  // ── Tidak menyentuh sesi/store owner sama sekali ──

  it('TIDAK memanggil signOut/getAuth pada instance App utama (__mockId 0) sama sekali', async () => {
    await createTenantAccount('penagih@test.com', 'password123');
    const touchedMainApp = [...getAuthCalls, ...signOutCalls.map(s => s.__appRef)]
      .some(app => app.__mockId === 0);
    expect(touchedMainApp).toBe(false);
  });

  // ── Panggilan berulang (owner buat beberapa penagih berturut-turut) ──

  it('dua panggilan berturut-turut menghasilkan DUA instance App terpisah dengan nama berbeda satu sama lain', async () => {
    await createTenantAccount('penagih1@test.com', 'password123');
    createdUid = 'uid-penagih-2';
    await createTenantAccount('penagih2@test.com', 'password456');
    expect(initializeAppCalls.length).toBe(2);
    expect(initializeAppCalls[0].name).not.toBe(initializeAppCalls[1].name); // nama harus unik tiap panggilan
    expect(deleteAppCalls.length).toBe(2); // keduanya dibuang, tidak ada yang menumpuk
  });
});
