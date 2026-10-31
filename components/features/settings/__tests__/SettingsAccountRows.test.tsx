// components/features/settings/__tests__/SettingsAccountRows.test.tsx — REDESAIN T11
// Grup "Akun" memakai NAMA zip: baris "Akun Saya" (isi: Email & Atur Ulang Kata Sandi) dan "Akun Penagih" (isi: Buat Akun Penagih),
// sesuai prototype T5. Sebelumnya judul baris hanya memuat nama seksi, sehingga "Akun Saya"/"Akun Penagih" tidak tampil.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => '/settings' }));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import SettingsView from '@/components/features/settings/SettingsView';

function setup(language: 'id' | 'en') {
  useAppStore.setState({
    appData: { ...DEFAULT_APP_DATA }, uid: '', userEmail: 'a@b.c', userName: 'Owner',
    settings: { ...DEFAULT_SETTINGS, language, customZones: [], hiddenZones: [], pinEnabled: false, pin: '' },
    syncStatus: 'ok', theme: 'dark',
  } as never);
}

beforeEach(() => { localStorage.clear(); });

describe('Pengaturan — grup Akun memakai nama zip', () => {
  it('Indonesia: "Akun Saya" + deskripsi seksi, "Akun Penagih" + deskripsi seksi', async () => {
    setup('id');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /^Akun/ }));
    const saya = screen.getByRole('button', { name: /Akun Saya/ });
    expect(within(saya).getByText('Akun Saya')).toBeInTheDocument();
    expect(within(saya).getByText('Email & Atur Ulang Kata Sandi')).toBeInTheDocument();
    const penagih = screen.getByRole('button', { name: /Akun Penagih/ });
    expect(within(penagih).getByText('Akun Penagih')).toBeInTheDocument();
    expect(within(penagih).getByText('Buat Akun Penagih')).toBeInTheDocument();
  });

  it('baris tetap membuka halaman seksinya (judul halaman = nama seksi)', async () => {
    setup('id');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /^Akun/ }));
    await userEvent.click(screen.getByRole('button', { name: /Akun Saya/ }));
    expect(screen.getByRole('heading', { name: 'Email & Atur Ulang Kata Sandi' })).toBeInTheDocument();
  });

  it('English memakai kamus en', async () => {
    setup('en');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /^Account/ }));
    expect(screen.getByRole('button', { name: /My Account/ })).toBeInTheDocument();
  });
});
