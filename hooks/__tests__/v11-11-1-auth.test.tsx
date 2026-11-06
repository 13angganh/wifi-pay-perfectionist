// hooks/__tests__/v11-11-1-auth.test.tsx — v11.11.1: alur akun
//   - ganti akun / keluar: salinan data di memori dikosongkan + penulisan ditahan sampai data akun baru termuat;
//     akun yang SAMA tidak dimuat ulang/direset
//   - cookie sesi berumur 1 tahun
//   - Daftar: nama (dirapikan, maks. 30) langsung tampil di store
//   - lupa kata sandi: galat nyata dikembalikan (hanya "akun tidak ditemukan" yang disamarkan)
//   - pesan galat mengikuti bahasa app
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({
  authStateCb: null as null | ((u: unknown) => void),
  updateProfile: vi.fn(),
  createUser: vi.fn(),
  sendReset: vi.fn(),
  currentUser: null as null | { uid: string; email: string; displayName: string | null },
}));

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(), deleteApp: vi.fn(), getApps: vi.fn(() => []), getApp: vi.fn() }));
vi.mock('firebase/database', () => ({
  ref: vi.fn(), onValue: vi.fn(), off: vi.fn(), set: vi.fn(() => Promise.resolve()), update: vi.fn(() => Promise.resolve()), getDatabase: vi.fn(() => ({})),
}));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_a: unknown, cb: (u: unknown) => void) => { h.authStateCb = cb; return () => {}; }),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: (...a: unknown[]) => h.createUser(...a),
  signInWithPopup: vi.fn(), linkWithPopup: vi.fn(),
  GoogleAuthProvider: class { setCustomParameters() {} }, verifyBeforeUpdateEmail: vi.fn(),
  sendPasswordResetEmail: (...a: unknown[]) => h.sendReset(...a),
  updateProfile: (...a: unknown[]) => h.updateProfile(...a), signOut: vi.fn(), browserLocalPersistence: {}, setPersistence: vi.fn(),
  AuthErrorCodes: { POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user' }, getAuth: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  get auth() { return { get currentUser() { return h.currentUser; } }; },
  firebaseConfig: {}, db: {}, default: {},
}));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_SETTINGS } from '@/types';
import { isWriteBlocked, resetDataLoad, emptyAppData } from '@/lib/db';
import { friendlyAuthError } from '@/lib/helpers';
import { doRegister, doResetPassword, doLinkGoogle, useAuth } from '../useAuth';

const fakeUser = (uid: string, name: string | null = null) => ({ uid, email: `${uid}@example.com`, displayName: name });
const withData = () => ({ ...emptyAppData(), krsMembers: ['AA', 'BB'], slkMembers: ['CC'] });

beforeEach(() => {
  localStorage.clear(); resetDataLoad();
  h.updateProfile.mockReset(); h.createUser.mockReset(); h.sendReset.mockReset();
  h.currentUser = null;
  useAppStore.setState({ uid: null, userEmail: null, userName: '', appData: emptyAppData(), syncStatus: 'loading', settings: { ...DEFAULT_SETTINGS, language: 'id' } } as never);
});
afterEach(() => { vi.restoreAllMocks(); });

describe('ganti akun / keluar', () => {
  it('ganti ke akun LAIN: memori dikosongkan, status memuat, dan penulisan ditahan sampai datanya termuat', () => {
    renderHook(() => useAuth());
    act(() => h.authStateCb?.(fakeUser('pemilik')));
    useAppStore.setState({ appData: withData(), syncStatus: 'ok' } as never);   // data pemilik sudah termuat
    act(() => h.authStateCb?.(fakeUser('penagih')));                              // akun berganti (tanpa muat ulang halaman)
    const st = useAppStore.getState();
    expect(st.uid).toBe('penagih');
    expect(st.appData.krsMembers).toEqual([]);
    expect(st.appData.slkMembers).toEqual([]);
    expect(st.syncStatus).toBe('loading');
    expect(isWriteBlocked('penagih')).toBe(true);
  });

  it('akun yang SAMA (callback ulang) TIDAK mengosongkan memori dan tidak menahan penulisan', () => {
    renderHook(() => useAuth());
    act(() => h.authStateCb?.(fakeUser('pemilik')));
    useAppStore.setState({ appData: withData(), syncStatus: 'ok' } as never);
    act(() => h.authStateCb?.(fakeUser('pemilik')));
    expect(useAppStore.getState().appData.krsMembers).toEqual(['AA', 'BB']);
    expect(useAppStore.getState().syncStatus).toBe('ok');
  });

  it('keluar: tidak ada data akun tersisa di memori, penjaga tulis dibersihkan', () => {
    renderHook(() => useAuth());
    act(() => h.authStateCb?.(fakeUser('pemilik')));
    useAppStore.setState({ appData: withData(), syncStatus: 'ok' } as never);
    act(() => h.authStateCb?.(null));
    const st = useAppStore.getState();
    expect(st.uid).toBeNull();
    expect(st.appData.krsMembers).toEqual([]);
    expect(isWriteBlocked('pemilik')).toBe(false);
  });

  it('cookie sesi berumur 1 tahun (31536000 detik)', () => {
    const spy = vi.spyOn(document, 'cookie', 'set');
    renderHook(() => useAuth());
    act(() => h.authStateCb?.(fakeUser('pemilik')));
    expect(spy.mock.calls.some(c => String(c[0]).includes('wp_session') && String(c[0]).includes('max-age=31536000'))).toBe(true);
  });
});

describe('Daftar — nama langsung tampil', () => {
  it('nama dirapikan, disimpan ke profil, dan langsung ada di store (onAuthStateChanged tidak menyala lagi sesudah updateProfile)', async () => {
    h.createUser.mockResolvedValue({ user: { uid: 'baru', email: 'a@b.co' } });
    h.updateProfile.mockResolvedValue(undefined);
    const res = await doRegister('a@b.co', 'rahasia1', '   Budi    Santoso  ');
    expect(res).toEqual({});
    expect(h.updateProfile).toHaveBeenCalledWith({ uid: 'baru', email: 'a@b.co' }, { displayName: 'Budi Santoso' });
    expect(useAppStore.getState().userName).toBe('Budi Santoso');
    expect(localStorage.getItem('wp_remember_name')).toBe('Budi Santoso');
  });

  it('nama panjang dipotong 30 karakter', async () => {
    h.createUser.mockResolvedValue({ user: { uid: 'baru', email: 'a@b.co' } });
    h.updateProfile.mockResolvedValue(undefined);
    await doRegister('a@b.co', 'rahasia1', 'X'.repeat(90));
    expect(useAppStore.getState().userName).toHaveLength(30);
  });
});

describe('lupa kata sandi — galat nyata', () => {
  it('berhasil → {}', async () => {
    h.sendReset.mockResolvedValue(undefined);
    expect(await doResetPassword('a@b.co')).toEqual({});
  });
  it('akun tidak ditemukan → disamarkan ({}), agar tidak membocorkan siapa yang terdaftar', async () => {
    h.sendReset.mockRejectedValue({ code: 'auth/user-not-found' });
    expect(await doResetPassword('a@b.co')).toEqual({});
  });
  it('format email salah → galat ditampilkan (dulu ikut disamarkan)', async () => {
    h.sendReset.mockRejectedValue({ code: 'auth/invalid-email' });
    expect((await doResetPassword('a@b')).error).toBe('Format email tidak valid.');
  });
  it('jaringan putus / terlalu sering → galat ditampilkan', async () => {
    h.sendReset.mockRejectedValue({ code: 'auth/network-request-failed' });
    expect((await doResetPassword('a@b.co')).error).toBe('Gagal terhubung ke jaringan');
    h.sendReset.mockRejectedValue({ code: 'auth/too-many-requests' });
    expect((await doResetPassword('a@b.co')).error).toBe('Terlalu banyak percobaan, coba lagi nanti');
  });
  it('email kosong → galat', async () => {
    expect((await doResetPassword('')).error).toBe('Masukkan email akun.');
    expect(h.sendReset).not.toHaveBeenCalled();
  });
});

describe('pesan galat mengikuti bahasa app', () => {
  it('bahasa Inggris', async () => {
    useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, language: 'en' } } as never);
    localStorage.setItem('wp_settings', JSON.stringify({ language: 'en' })); // bahasa global app (dibaca di luar React)
    expect(friendlyAuthError('auth/wrong-password')).toBe('Incorrect password');
    expect(friendlyAuthError('auth/xyz')).toBe('Something went wrong (auth/xyz)');
    expect((await doResetPassword('')).error).toBe('Enter the account email.');
    expect((await doLinkGoogle()).error).toBe('No active session. Sign in with email first.');
  });
  it('bahasa Indonesia memakai kata "Masuk/Keluar" (bukan Login/Logout)', async () => {
    h.currentUser = null;
    const msg = (await doLinkGoogle()).error || '';
    expect(msg).toBe('Tidak ada sesi aktif. Masuk dengan email dulu.');
    expect(msg).not.toMatch(/login|logout/i);
  });
});
