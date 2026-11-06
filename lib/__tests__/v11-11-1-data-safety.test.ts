// lib/__tests__/v11-11-1-data-safety.test.ts
// v11.11.1 — pengaman data:
//   (1) listenDB meneruskan SETIAP ruang kerja yang ada (dulu hanya yang punya krsMembers/payments, sehingga akun
//       yang isinya hanya SLK/zona kustom tidak pernah dianggap termuat),
//   (2) akun kosong = keadaan kosong, TANPA daftar nama pelanggan bawaan,
//   (3) PENJAGA TULIS: selama snapshot pertama akun belum tiba, semua penulisan ke ruang kerja akun itu ditolak
//       (memori bisa kosong/berisi sisa akun lain) — dan listener/penjaga tidak pernah menulis sendiri ke Firebase.
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type * as DB from '@/lib/db';
import type { AppData } from '@/types';

type Cb = (snap: { val: () => unknown }) => void;
const listeners: Cb[] = [];
const setMock    = vi.fn(() => Promise.resolve());
const updateMock = vi.fn(() => Promise.resolve());

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  onValue: vi.fn((_r: unknown, cb: Cb) => { listeners.push(cb); return () => {}; }),
  off: vi.fn(),
  set: (...a: unknown[]) => (setMock as unknown as (...x: unknown[]) => Promise<void>)(...a),
  update: (...a: unknown[]) => (updateMock as unknown as (...x: unknown[]) => Promise<void>)(...a),
  getDatabase: vi.fn(() => ({})),
}));

let db: typeof DB;
beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  db = await import('@/lib/db');
});
beforeEach(() => { listeners.length = 0; setMock.mockClear(); updateMock.mockClear(); db.resetDataLoad(); });

const fire = (val: unknown, i = listeners.length - 1) => listeners[i]({ val: () => val });

describe('listenDB — setiap ruang kerja yang ada diteruskan', () => {
  it('ruang kerja yang hanya berisi SLK (tanpa krsMembers/payments) tetap sampai ke app', () => {
    const onData = vi.fn();
    db.listenDB('uid-slk', onData, vi.fn());
    fire({ slkMembers: ['AA', 'BB'] });
    expect(onData).toHaveBeenCalledTimes(1);
    const got = onData.mock.calls[0][0] as AppData;
    expect(got.slkMembers).toEqual(['AA', 'BB']);
    expect(got.krsMembers).toEqual([]);
  });

  it('ruang kerja yang hanya berisi zona kustom juga sampai ke app', () => {
    const onData = vi.fn();
    db.listenDB('uid-zk', onData, vi.fn());
    fire({ zoneMembers: { ZK1: ['X'] } });
    expect((onData.mock.calls[0][0] as AppData).zoneMembers).toEqual({ ZK1: ['X'] });
  });

  it('akun kosong (null) = keadaan kosong, TANPA nama pelanggan bawaan, dan state kunci dibersihkan', () => {
    const onData = vi.fn(); const onLock = vi.fn();
    db.listenDB('uid-baru', onData, vi.fn(), onLock);
    fire(null);
    const got = onData.mock.calls[0][0] as AppData;
    expect(got.krsMembers).toEqual([]);
    expect(got.slkMembers).toEqual([]);
    expect(onLock).toHaveBeenCalledWith(false, {});
  });

  it('listener tidak pernah menulis ke Firebase', () => {
    db.listenDB('uid-x', vi.fn(), vi.fn());
    fire(null);
    expect(setMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe('emptyAppData / DEFAULT_APP_DATA — tanpa nama bawaan', () => {
  it('kosong, dan tiap panggilan menghasilkan objek BARU (tidak berbagi array)', () => {
    const a = db.emptyAppData(); const b = db.emptyAppData();
    expect(a.krsMembers).toEqual([]); expect(a.slkMembers).toEqual([]);
    expect(a.krsMembers).not.toBe(b.krsMembers);
    expect(db.DEFAULT_APP_DATA.krsMembers).toEqual([]);
  });
});

describe('penjaga tulis — ditolak sampai snapshot pertama akun tiba', () => {
  const data = (): AppData => db.emptyAppData();

  it('semua jalur tulis ke ruang kerja akun ditolak sebelum termuat, dan Firebase tidak disentuh', async () => {
    db.listenDB('uid-A', vi.fn(), vi.fn()); // snapshot pertama BELUM tiba
    expect(db.isWriteBlocked('uid-A')).toBe(true);
    await expect(db.saveDB('uid-A', data())).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.updatePayment('uid-A', 'k', 100)).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.persistPaymentGranular('uid-A', 'k', 100, [], { action: '[PAY] x', detail: '' }, 'a@b.c', () => ({ globalLocked: false, lockedEntries: {} }))).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.updateLockState('uid-A', true, {})).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.importToDB('uid-A', data())).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.registerTenant('uid-A', { uid: 't', email: 'a@b.c', memberCount: 1, createdAt: 1 })).rejects.toBeInstanceOf(db.DataNotLoadedError);
    await expect(db.removeTenantFromList('uid-A', 't')).rejects.toBeInstanceOf(db.DataNotLoadedError);
    expect(setMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('setelah snapshot pertama tiba, penulisan boleh; dan tidak diblokir lagi (tanpa muat ulang)', async () => {
    db.listenDB('uid-A', vi.fn(), vi.fn());
    fire({ krsMembers: ['AA'] });
    expect(db.isWriteBlocked('uid-A')).toBe(false);
    await expect(db.saveDB('uid-A', data())).resolves.toBeUndefined();
    expect(setMock).toHaveBeenCalledTimes(1);
    // snapshot berikutnya / pemasangan listener ulang untuk akun yang SAMA tidak memblokir lagi
    db.beginDataLoad('uid-A');
    expect(db.isWriteBlocked('uid-A')).toBe(false);
    fire({ krsMembers: ['AA', 'BB'] });
    await expect(db.saveDB('uid-A', data())).resolves.toBeUndefined();
  });

  it('ganti akun: ruang kerja akun baru ditahan sampai datanya termuat; akun sebelumnya tidak ikut ditulis', async () => {
    db.listenDB('uid-A', vi.fn(), vi.fn()); fire({ krsMembers: ['AA'] });
    db.beginDataLoad('uid-B'); db.listenDB('uid-B', vi.fn(), vi.fn());
    expect(db.isWriteBlocked('uid-B')).toBe(true);
    await expect(db.saveDB('uid-B', data())).rejects.toBeInstanceOf(db.DataNotLoadedError);
    expect(setMock).not.toHaveBeenCalled();
    fire({ slkMembers: ['ZZ'] });                     // data akun B tiba
    await expect(db.saveDB('uid-B', data())).resolves.toBeUndefined();
  });

  it('keluar (resetDataLoad) menghapus penanda; tanpa beginDataLoad tidak ada yang diblokir', async () => {
    db.beginDataLoad('uid-A');
    expect(db.isWriteBlocked('uid-A')).toBe(true);
    db.resetDataLoad();
    expect(db.isWriteBlocked('uid-A')).toBe(false);
  });

  it('menyalin ke ruang kerja akun LAIN (clone penagih) tidak ikut diblokir oleh akun pemilik yang sedang memuat', async () => {
    db.beginDataLoad('uid-pemilik');
    await expect(db.cloneMembersToUser('uid-penagih', db.emptyAppData(), [])).resolves.not.toThrow();
  });

  it('galat snapshot (mis. izin ditolak/jaringan) → penulisan TETAP ditahan (tidak menulis dari memori yang tak terverifikasi)', async () => {
    const onError = vi.fn();
    db.listenDB('uid-E', vi.fn(), onError);
    expect(db.isWriteBlocked('uid-E')).toBe(true);
    await expect(db.saveDB('uid-E', data())).rejects.toBeInstanceOf(db.DataNotLoadedError);
  });
});
