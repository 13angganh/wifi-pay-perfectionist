// components/ui/__tests__/Toast.test.tsx — Toast global + Register Tambahan A2 (posisi)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import Toast, { showToast, showToastUndo } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

describe('Toast', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ toastPosition: 'top', navMode: 'bottom' });
  });

  it('API lama tetap jalan: showToast(msg) → tipe ok, role status', () => {
    render(<Toast />);
    act(() => { showToast('Tersimpan'); });
    const el = screen.getByRole('status');
    expect(el).toHaveClass('wp-toast--ok');
    expect(el).toHaveTextContent('Tersimpan');
  });

  it('tipe err → role alert; warn dan info tersedia; deskripsi opsional', () => {
    render(<Toast />);
    act(() => { showToast('Gagal', 'err', 'Periksa koneksi'); });
    expect(screen.getByRole('alert')).toHaveClass('wp-toast--err');
    expect(screen.getByText('Periksa koneksi')).toBeInTheDocument();
    act(() => { showToast('Perhatian', 'warn'); showToast('Info', 'info'); });
    expect(screen.getAllByRole('status').map(e => e.className).join(' ')).toMatch(/wp-toast--warn/);
  });

  it('A2: posisi mengikuti store (top → bottom) dan membawa mode navigasi untuk offset', () => {
    render(<Toast />);
    act(() => { showToast('x'); });
    const wrap = () => document.querySelector('.wp-toast-wrap') as HTMLElement;
    expect(wrap().dataset.pos).toBe('top');
    act(() => { useAppStore.setState({ toastPosition: 'bottom' }); });
    expect(wrap().dataset.pos).toBe('bottom');
    expect(wrap().dataset.nav).toBe('bottom');
    act(() => { useAppStore.setState({ navMode: 'sidebar' }); });
    expect(wrap().dataset.nav).toBe('sidebar');
  });

  it('maksimal 3 toast sekaligus (yang tertua dibuang)', () => {
    render(<Toast />);
    act(() => { ['a', 'b', 'c', 'd'].forEach(m => showToast(m)); });
    expect(document.querySelectorAll('.wp-toast')).toHaveLength(3);
    expect(screen.queryByText('a')).toBeNull();
  });

  it('undo: tombol Batalkan memanggil callback dan menutup toast', async () => {
    const onUndo = vi.fn();
    render(<Toast />);
    act(() => { showToastUndo('Dihapus', onUndo); });
    await userEvent.click(screen.getByRole('button', { name: /Batalkan/ }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('tombol tutup (X) tersedia dengan nama aksesibel', () => {
    render(<Toast />);
    act(() => { showToast('x'); });
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeInTheDocument();
  });
});
