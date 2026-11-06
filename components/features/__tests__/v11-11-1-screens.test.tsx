// v11.11.1 — layar: Beranda sebelum data termuat / akun kosong, label Bayar Cepat, bintang tarif,
// lupa kata sandi (halaman Masuk + Pengaturan), Hubungkan Google, kolom nama.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/useAppStore';
import { emptyAppData } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import DashboardView from '../dashboard/DashboardView';
import { QuickPayGrid } from '@/components/ui/QuickPayGrid';
import LoginForm from '../auth/LoginForm';

vi.mock('@/lib/firebase', () => ({ auth: { currentUser: null }, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const auth = vi.hoisted(() => ({
  doResetPassword: vi.fn(), doLinkGoogle: vi.fn(), doUpdateEmail: vi.fn(),
  providers: ['password'] as string[],
}));
vi.mock('@/hooks/useAuth', () => ({
  doResetPassword: (...a: unknown[]) => auth.doResetPassword(...a),
  doLinkGoogle: (...a: unknown[]) => auth.doLinkGoogle(...a),
  doUpdateEmail: (...a: unknown[]) => auth.doUpdateEmail(...a),
  getLinkedProviders: () => auth.providers,
}));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('@/components/ui/Toast', () => ({ showToast: toast.showToast, default: () => null }));

import SettingsEmailSection from '../settings/SettingsEmailSection';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  auth.providers = ['password'];
  useAppStore.setState({
    appData: emptyAppData(), syncStatus: 'loading',
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [] },
    uid: 'u1', userEmail: 'penagih@gmail.com', userName: '', selYear: 2026, selMonth: 9,
    globalLocked: false, lockedEntries: {},
  } as never);
});

describe('Beranda — data belum termuat / akun kosong', () => {
  it('sebelum data akun tiba: kerangka muat (skeleton), TIDAK ada daftar/angka dari nama bawaan', () => {
    const { container } = render(<DashboardView />);
    expect(container.querySelectorAll('.wp-skel').length).toBeGreaterThan(0);
    expect(screen.queryByText('Belum ada pelanggan')).not.toBeInTheDocument();
  });

  it('setelah termuat dan akunnya memang kosong: keadaan kosong (bukan data bawaan)', () => {
    useAppStore.setState({ syncStatus: 'ok' } as never);
    const { container } = render(<DashboardView />);
    expect(screen.getByText('Belum ada pelanggan')).toBeInTheDocument();
    expect(container.querySelectorAll('.wp-skel').length).toBe(0);
  });
});

describe('QuickPayGrid — bintang tarif berupa ikon', () => {
  it('nominal tarif punya ikon bintang (bukan karakter teks) dan nama aksesibel "…, tarif"', () => {
    render(<QuickPayGrid amounts={[50, 100, 150]} tarif={100} onPick={() => {}} formatLabel={a => `${a}K`} tarifLabel="tarif" ariaLabel="Nominal cepat" />);
    const btn = screen.getByRole('button', { name: '100K, tarif' });
    expect(btn.querySelector('svg.wp-qk__star')).not.toBeNull();
    expect(btn.textContent).toBe('100K');          // tidak ada karakter ★ di teks
    expect(screen.getByRole('button', { name: '50K' }).querySelector('svg')).toBeNull();
  });
});

describe('halaman Masuk — lupa kata sandi', () => {
  const base = {
    email: 'penagih@gmail.com', pass: '', remember: true, greeterName: null as string | null, loading: false, googleLoading: false, error: '',
    onEmail: vi.fn(), onPass: vi.fn(), onRemember: vi.fn(), onSubmit: vi.fn(), onGoogle: vi.fn(), onReset: vi.fn(), onSwitch: vi.fn(),
    resetSent: false, resetLoading: false, resetCooldown: 0,
  } as unknown as ComponentProps<typeof LoginForm>;
  it('setelah terkirim: teks jujur "Jika … terdaftar" + petunjuk Google, dan tombol dijeda dengan hitung mundur', () => {
    render(<LoginForm {...base} resetSent resetCooldown={42} />);
    expect(screen.getByText(/Jika penagih@gmail\.com terdaftar, tautan atur ulang dikirim\. Periksa Kotak Masuk dan folder Spam\./)).toBeInTheDocument();
    expect(screen.getByText(/Masuk dengan Google/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: 'Kirim ulang dalam 42 dtk' });
    expect(btn).toBeDisabled();
  });
  it('sebelum dikirim: tombol "Lupa kata sandi" aktif, tanpa pesan terkirim', () => {
    render(<LoginForm {...base} />);
    expect(screen.queryByText(/tautan atur ulang dikirim/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lupa kata sandi?' })).toBeEnabled();
  });
});

describe('Pengaturan → Email: reset sandi + Masuk dengan Google', () => {
  it('akun bersandi: galat NYATA ditampilkan (tidak pura-pura terkirim)', async () => {
    auth.doResetPassword.mockResolvedValue({ error: 'Gagal terhubung ke jaringan' });
    render(<SettingsEmailSection />);
    await userEvent.click(screen.getByRole('button', { name: /Kirim Tautan Atur Ulang Kata Sandi/ }));
    expect(toast.showToast).toHaveBeenCalledWith('Gagal terhubung ke jaringan', 'err');
    expect(screen.queryByText(/tautan atur ulang dikirim/)).not.toBeInTheDocument();
  });

  it('akun bersandi: berhasil → teks jujur tampil dan tombol dijeda 60 dtk', async () => {
    auth.doResetPassword.mockResolvedValue({});
    render(<SettingsEmailSection />);
    await userEvent.click(screen.getByRole('button', { name: /Kirim Tautan Atur Ulang Kata Sandi/ }));
    expect(await screen.findByText(/Jika penagih@gmail\.com terdaftar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirim ulang dalam 60 dtk' })).toBeDisabled();
  });

  it('akun bersandi tanpa Google: ada tombol Hubungkan Google; berhasil → toast', async () => {
    auth.doLinkGoogle.mockImplementation(async () => { auth.providers = ['password', 'google.com']; return {}; });
    render(<SettingsEmailSection />);
    await userEvent.click(screen.getByRole('button', { name: /Hubungkan Akun Google/ }));
    expect(auth.doLinkGoogle).toHaveBeenCalledTimes(1);
    expect(toast.showToast).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Hubungkan Akun Google/ })).not.toBeInTheDocument();   // sudah terhubung
  });

  it('akun khusus Google: TIDAK ada kartu reset sandi, hanya catatan', () => {
    auth.providers = ['google.com'];
    render(<SettingsEmailSection />);
    expect(screen.getByText(/Akun ini masuk dengan Google, jadi tidak memakai kata sandi/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kirim Tautan Atur Ulang Kata Sandi/ })).not.toBeInTheDocument();
  });
});
