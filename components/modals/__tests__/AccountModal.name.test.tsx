// v11.11.0 — AccountModal: nama tampilan + pintasan "Ubah nama" ke Pengaturan.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }), usePathname: () => '/dashboard' }));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_SETTINGS } from '@/types';
import AccountModal from '../AccountModal';

beforeEach(() => { nav.push.mockClear(); });

describe('AccountModal — nama tampilan', () => {
  it('tanpa nama: "Belum diatur" (bukan awalan email) + tombol Ubah nama → Pengaturan', async () => {
    useAppStore.setState({ userName: '', userEmail: 'budi.santoso@example.com', currentView: 'dashboard', settings: { ...DEFAULT_SETTINGS, language: 'id' } } as never);
    const onClose = vi.fn();
    render(<AccountModal open onClose={onClose} />);
    expect(screen.getByText('Belum diatur')).toBeInTheDocument();
    expect(screen.queryByText('budi.santoso')).toBeNull();
    expect(screen.getByText('budi.santoso@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ubah nama' }));
    expect(onClose).toHaveBeenCalled();
    expect(nav.push).toHaveBeenCalledWith('/settings');
    expect(useAppStore.getState().currentView).toBe('settings');
  });

  it('dengan nama: nama tampil', () => {
    useAppStore.setState({ userName: 'Budi', userEmail: 'budi@example.com', settings: { ...DEFAULT_SETTINGS, language: 'id' } } as never);
    render(<AccountModal open onClose={() => {}} />);
    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.queryByText('Belum diatur')).toBeNull();
  });
});
