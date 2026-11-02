// components/features/settings/__tests__/SettingsNameSection.test.tsx — v11.11.0: Pengaturan → Akun → Nama Tampilan.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => '/settings' }));
const upd = vi.hoisted(() => ({ doUpdateDisplayName: vi.fn() }));
vi.mock('@/hooks/useAuth', async (orig) => ({ ...(await orig<typeof import('@/hooks/useAuth')>()), doUpdateDisplayName: upd.doUpdateDisplayName }));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import SettingsNameSection from '../SettingsNameSection';
import SettingsView from '../SettingsView';
import SidebarUserSection from '@/components/layout/Sidebar.UserSection';
import { getInitials } from '@/components/layout/userInitials';

function setup(userName: string | null, language: 'id' | 'en' = 'id') {
  useAppStore.setState({
    appData: { ...DEFAULT_APP_DATA }, uid: 'u1', userEmail: 'budi.santoso@example.com', userName,
    settings: { ...DEFAULT_SETTINGS, language, customZones: [], hiddenZones: [], pinEnabled: false, pin: '' },
    syncStatus: 'ok', theme: 'dark',
  } as never);
}
beforeEach(() => { localStorage.clear(); upd.doUpdateDisplayName.mockReset(); });

describe('SettingsNameSection', () => {
  it('belum ada nama: "Belum diatur", tombol simpan nonaktif, tanpa tombol hapus', () => {
    setup('');
    render(<SettingsNameSection />);
    expect(screen.getByText('Belum diatur')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simpan Nama/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Hapus Nama/ })).toBeNull();
    // kolom TIDAK terisi dari awalan email
    expect(screen.getByRole('textbox', { name: /Nama yang ditampilkan/ })).toHaveValue('');
  });

  it('mengetik nama → pratinjau sapaan memakai nama itu; simpan memanggil doUpdateDisplayName dengan nama rapi', async () => {
    setup('');
    upd.doUpdateDisplayName.mockResolvedValue({ name: 'Budi Santoso' });
    render(<SettingsNameSection />);
    await userEvent.type(screen.getByRole('textbox', { name: /Nama yang ditampilkan/ }), '  Budi   Santoso ');
    expect(screen.getByTestId('name-preview')).toHaveTextContent('Budi Santoso');
    const save = screen.getByRole('button', { name: /Simpan Nama/ });
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(upd.doUpdateDisplayName).toHaveBeenCalledWith('Budi Santoso');
  });

  it('sudah ada nama: tampil di "Saat ini", simpan nonaktif sampai berubah, hapus mengirim string kosong', async () => {
    setup('Budi');
    upd.doUpdateDisplayName.mockResolvedValue({ name: '' });
    render(<SettingsNameSection />);
    expect(screen.getByRole('textbox', { name: /Nama yang ditampilkan/ })).toHaveValue('Budi');
    expect(screen.getByRole('button', { name: /Simpan Nama/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Hapus Nama/ }));
    expect(upd.doUpdateDisplayName).toHaveBeenCalledWith('');
  });

  it('gagal menyimpan → tidak melempar, kolom tetap bisa diedit', async () => {
    setup('Budi');
    upd.doUpdateDisplayName.mockResolvedValue({ error: 'Gagal terhubung' });
    render(<SettingsNameSection />);
    const box = screen.getByRole('textbox', { name: /Nama yang ditampilkan/ });
    await userEvent.clear(box); await userEvent.type(box, 'Baru');
    await userEvent.click(screen.getByRole('button', { name: /Simpan Nama/ }));
    expect(upd.doUpdateDisplayName).toHaveBeenCalledWith('Baru');
    expect(screen.getByRole('textbox', { name: /Nama yang ditampilkan/ })).toBeEnabled();
  });

  it('English memakai kamus en', () => {
    setup('', 'en');
    render(<SettingsNameSection />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Name/ })).toBeInTheDocument();
  });
});

describe('Pengaturan → grup Akun', () => {
  it('baris "Nama Tampilan" ada (badge = nama / "Belum diatur") dan membuka halaman seksinya', async () => {
    setup('');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /^Akun/ }));
    const row = screen.getByRole('button', { name: /Nama Tampilan/ });
    expect(within(row).getByText('Belum diatur')).toBeInTheDocument();
    await userEvent.click(row);
    expect(screen.getByRole('heading', { name: 'Nama Tampilan' })).toBeInTheDocument();
  });

  it('badge menampilkan nama yang sudah diatur', async () => {
    setup('Budi');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /^Akun/ }));
    expect(within(screen.getByRole('button', { name: /Nama Tampilan/ })).getByText('Budi')).toBeInTheDocument();
  });
});

describe('avatar tanpa nama = ikon (bukan awalan email)', () => {
  it('kartu akun Sidebar: nama kosong → ikon pengguna, tanpa teks inisial', () => {
    setup('');
    const { container } = render(<SidebarUserSection initials={getInitials('')} displayName="Pengguna" onOpenAccount={() => {}} />);
    const av = container.querySelector('.hdr-av')!;
    expect(av.textContent).toBe('');
    expect(av.querySelector('svg')).not.toBeNull();
  });
  it('dengan nama → inisial', () => {
    setup('Budi Santoso');
    const { container } = render(<SidebarUserSection initials={getInitials('Budi Santoso')} displayName="Budi Santoso" onOpenAccount={() => {}} />);
    expect(container.querySelector('.hdr-av')!.textContent).toBe('BS');
  });
});
