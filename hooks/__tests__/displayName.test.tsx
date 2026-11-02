// hooks/__tests__/displayName.test.tsx — v11.11.0: nama tampilan akun (Pengaturan) + TANPA fallback awalan email.
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({
  authStateCb: null as null | ((u: unknown) => void),
  updateProfile: vi.fn(),
  currentUser: null as null | { uid: string; email: string; displayName: string | null },
}));

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(), deleteApp: vi.fn(), getApps: vi.fn(() => []), getApp: vi.fn() }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_a: unknown, cb: (u: unknown) => void) => { h.authStateCb = cb; return () => {}; }),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(), signInWithPopup: vi.fn(), linkWithPopup: vi.fn(),
  GoogleAuthProvider: class { setCustomParameters() {} }, verifyBeforeUpdateEmail: vi.fn(), sendPasswordResetEmail: vi.fn(),
  updateProfile: h.updateProfile, signOut: vi.fn(), browserLocalPersistence: {}, setPersistence: vi.fn(),
  AuthErrorCodes: { POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user' }, getAuth: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  get auth() { return { get currentUser() { return h.currentUser; } }; },
  firebaseConfig: {}, db: {}, default: {},
}));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_SETTINGS } from '@/types';
import { doUpdateDisplayName, getRememberedCred, useAuth } from '../useAuth';
import { getInitials } from '@/components/layout/userInitials';

beforeEach(() => {
  localStorage.clear();
  h.updateProfile.mockReset();
  h.currentUser = { uid: 'u1', email: 'budi.santoso@example.com', displayName: null };
  useAppStore.setState({ uid: 'u1', userEmail: 'budi.santoso@example.com', userName: '', settings: { ...DEFAULT_SETTINGS, language: 'id' } } as never);
});

describe('doUpdateDisplayName', () => {
  it('menyimpan ke profil akun (rapi: spasi dirapikan), dan store langsung ikut berubah', async () => {
    h.updateProfile.mockResolvedValue(undefined);
    const res = await doUpdateDisplayName('   Budi    Santoso  ');
    expect(res).toEqual({ name: 'Budi Santoso' });
    expect(h.updateProfile).toHaveBeenCalledWith(h.currentUser, { displayName: 'Budi Santoso' });
    expect(useAppStore.getState().userName).toBe('Budi Santoso');
  });

  it('dibatasi 30 karakter', async () => {
    h.updateProfile.mockResolvedValue(undefined);
    const res = await doUpdateDisplayName('A'.repeat(80));
    expect(res.name).toHaveLength(30);
  });

  it('kosong = hapus nama (displayName null), bukan jatuh ke awalan email', async () => {
    h.updateProfile.mockResolvedValue(undefined);
    useAppStore.setState({ userName: 'Budi' } as never);
    const res = await doUpdateDisplayName('   ');
    expect(res).toEqual({ name: '' });
    expect(h.updateProfile).toHaveBeenCalledWith(h.currentUser, { displayName: null });
    expect(useAppStore.getState().userName).toBe('');
  });

  it('gagal (mis. jaringan) → pesan galat, nama di store TIDAK berubah', async () => {
    h.updateProfile.mockRejectedValue({ code: 'auth/network-request-failed' });
    useAppStore.setState({ userName: 'Lama' } as never);
    const res = await doUpdateDisplayName('Baru');
    expect(res.error).toBeTruthy();
    expect(useAppStore.getState().userName).toBe('Lama');
  });

  it('tanpa sesi aktif → galat, tanpa memanggil Firebase', async () => {
    h.currentUser = null;
    const res = await doUpdateDisplayName('Budi');
    expect(res.error).toMatch(/sesi/i);
    expect(h.updateProfile).not.toHaveBeenCalled();
  });

  it('kartu "akun tersimpan" di layar masuk ikut nama baru (akun yang sama saja)', async () => {
    h.updateProfile.mockResolvedValue(undefined);
    localStorage.setItem('wp_remember_email', 'budi.santoso@example.com');
    localStorage.setItem('wp_remember_pass', 'x');
    await doUpdateDisplayName('Budi');
    expect(getRememberedCred()?.name).toBe('Budi');
    localStorage.setItem('wp_remember_email', 'lain@example.com');
    await doUpdateDisplayName('Budi Baru');
    expect(getRememberedCred()?.name).toBe('Budi');   // akun lain tidak tersentuh
  });
});

describe('nama TIDAK diambil dari awalan email', () => {
  it('masuk tanpa displayName → nama kosong (bukan "budi.santoso")', () => {
    renderHook(() => useAuth());
    act(() => { h.authStateCb!({ uid: 'u1', email: 'budi.santoso@example.com', displayName: null }); });
    expect(useAppStore.getState().userName).toBe('');
    expect(useAppStore.getState().userEmail).toBe('budi.santoso@example.com');
  });

  it('masuk dengan displayName (mis. akun Google) → memakai displayName itu', () => {
    renderHook(() => useAuth());
    act(() => { h.authStateCb!({ uid: 'u1', email: 'x@example.com', displayName: 'Budi Santoso' }); });
    expect(useAppStore.getState().userName).toBe('Budi Santoso');
  });

  it('akun tersimpan tanpa nama → nama kosong, bukan awalan email', () => {
    localStorage.setItem('wp_remember_email', 'budi.santoso@example.com');
    localStorage.setItem('wp_remember_pass', 'x');
    expect(getRememberedCred()).toEqual({ email: 'budi.santoso@example.com', name: '', pass: 'x' });
  });
});

describe('getInitials (avatar)', () => {
  it('dari nama tampilan; tanpa nama → kosong (avatar memakai ikon)', () => {
    expect(getInitials('Budi Santoso')).toBe('BS');
    expect(getInitials('budi')).toBe('BU');
    expect(getInitials('  ')).toBe('');
    expect(getInitials(null)).toBe('');
  });
});
