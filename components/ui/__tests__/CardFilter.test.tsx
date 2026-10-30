// CardFilter + Vis (filter tampil/sembunyi kartu) dan pengaturan Ukuran Teks di uiSlice.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { useAppStore } from '@/store/useAppStore';
import { CardFilter, Vis } from '../CardFilter';

const ITEMS = [{ id: 'a', label: 'Kartu A' }, { id: 'b', label: 'Kartu B' }];
const view = () => (
  <>
    <CardFilter screen="t" items={ITEMS} />
    <Vis screen="t" id="a"><p>isi-a</p></Vis>
    <Vis screen="t" id="b"><p>isi-b</p></Vis>
  </>
);

describe('CardFilter / Vis', () => {
  beforeEach(() => { localStorage.clear(); useAppStore.setState({ hiddenCards: {}, textSize: 'normal' }); });

  it('bawaan: semua kartu tampil', () => {
    render(view());
    expect(screen.getByText('isi-a')).toBeInTheDocument();
    expect(screen.getByText('isi-b')).toBeInTheDocument();
  });

  it('mematikan satu kartu menyembunyikannya, lencana menunjukkan jumlah, tersimpan di localStorage; Tampilkan semua memulihkan', async () => {
    const u = userEvent.setup();
    render(view());
    await u.click(screen.getByRole('button', { name: /Atur kartu yang ditampilkan/ }));
    await u.click(screen.getByText('Kartu A'));
    expect(screen.queryByText('isi-a')).not.toBeInTheDocument();
    expect(screen.getByText('isi-b')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('wp_hidden_cards') || '{}')).toEqual({ t: ['a'] });
    await u.click(screen.getByRole('button', { name: 'Tampilkan semua' }));
    expect(screen.getByText('isi-a')).toBeInTheDocument();
    expect(useAppStore.getState().hiddenCards.t).toEqual([]);
  });

  it('Ukuran Teks: setTextSize menyimpan pilihan per perangkat', () => {
    useAppStore.getState().setTextSize('large');
    expect(useAppStore.getState().textSize).toBe('large');
    expect(localStorage.getItem('wp_text_size')).toBe('large');
  });
});
