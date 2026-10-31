// components/layout/__tests__/shell.test.tsx — shell REDESAIN T6:
// tab zona dinamis, Bottom Nav + sheet Lainnya (A1), kerangka Pusat Notifikasi (A3), pemilih tampilan.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { useAppStore } from '@/store/useAppStore';
import HeaderZoneTabs, { visibleZoneKeys } from '@/components/layout/Header.ZoneTabs';
import HeaderNotifications from '@/components/layout/Header.Notifications';
import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import { NavModePicker, ToastPositionPicker } from '@/components/layout/DisplayPrefs';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS, MORE_NAV_ITEMS, SETTINGS_ITEM } from '@/lib/navItems';

function setSettings(patch: Record<string, unknown>) {
  const s = useAppStore.getState().settings;
  useAppStore.setState({ settings: { ...s, ...patch } });
}

describe('lib/navItems — satu sumber untuk Sidebar, Bottom Nav, sheet Lainnya', () => {
  it('Bottom Nav = 4 tab pertama; Lainnya = sisa menu + Pengaturan; tidak ada yang hilang/ganda', () => {
    expect(BOTTOM_NAV_ITEMS.map(i => i.v)).toEqual(['dashboard', 'entry', 'rekap', 'tunggakan']);
    expect(MORE_NAV_ITEMS.map(i => i.v)).toEqual(['grafik', 'log', 'members', 'operasional', 'settings']);
    const all = [...BOTTOM_NAV_ITEMS, ...MORE_NAV_ITEMS].map(i => i.v);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(NAV_ITEMS.length + 1);
    expect(MORE_NAV_ITEMS.at(-1)).toBe(SETTINGS_ITEM);
  });
});

describe('Header.ZoneTabs — dinamis (tanpa percabangan KRS/SLK)', () => {
  beforeEach(() => { useAppStore.setState({ activeZone: 'KRS' }); setSettings({ customZones: [], hiddenZones: [] }); });

  it('visibleZoneKeys: KRS, SLK, zona kustom; zona tersembunyi dibuang', () => {
    expect(visibleZoneKeys([{ key: 'ABC' }], [])).toEqual(['KRS', 'SLK', 'ABC']);
    expect(visibleZoneKeys([{ key: 'ABC' }], ['SLK'])).toEqual(['KRS', 'ABC']);
  });

  it('merender tab zona kustom dengan warna kustom dan memanggil onZoneChange', async () => {
    setSettings({ customZones: [{ key: 'ABC', name: 'Abc', color: '#10B981' }] });
    useAppStore.setState({ activeZone: 'ABC' });
    const onZoneChange = vi.fn();
    render(<HeaderZoneTabs onZoneChange={onZoneChange} />);
    const abc = screen.getByRole('button', { name: /ABC/ });
    expect(abc).toHaveAttribute('aria-pressed', 'true');
    expect(abc.style.getPropertyValue('--zbc')).toBe('#10B981');
    await userEvent.click(screen.getByRole('button', { name: /KRS/ }));
    expect(onZoneChange).toHaveBeenCalledWith('KRS');
  });

  it('zona bawaan memakai var() tema', () => {
    render(<HeaderZoneTabs onZoneChange={() => {}} />);
    expect(screen.getByRole('button', { name: /KRS/ }).style.getPropertyValue('--zbc')).toBe('var(--zc-krs)');
  });
});

describe('BottomNav (A1)', () => {
  beforeEach(() => { useAppStore.setState({ currentView: 'dashboard' }); });

  it('4 tab + Lainnya; tab aktif memakai aria-current', () => {
    render(<BottomNav onNavigate={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' });
    expect(within(nav).getAllByRole('button')).toHaveLength(5);
    expect(within(nav).getByRole('button', { name: /Beranda/ })).toHaveAttribute('aria-current', 'page');
  });

  it('tab memanggil onNavigate', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /Entri/ }));
    expect(onNavigate).toHaveBeenCalledWith('entry');
  });

  it('Lainnya membuka sheet berisi 5 menu; memilih menu menutup sheet dan navigasi', async () => {
    const onNavigate = vi.fn();
    render(<BottomNav onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /Lainnya/ }));
    const dlg = screen.getByRole('dialog', { name: 'Lainnya' });
    expect(within(dlg).getAllByRole('button').filter(b => b.classList.contains('more-item'))).toHaveLength(5);
    await userEvent.click(within(dlg).getByRole('button', { name: /Member/ }));
    expect(onNavigate).toHaveBeenCalledWith('members');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Lainnya ditandai aktif bila halaman saat ini ada di dalam sheet', () => {
    useAppStore.setState({ currentView: 'grafik' });
    render(<BottomNav onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /Lainnya/ })).toHaveClass('on');
  });
});

describe('Sidebar', () => {
  it('8 menu + Pengaturan; kartu akun memanggil onOpenAccount', async () => {
    const onOpenAccount = vi.fn(), onNavigate = vi.fn();
    useAppStore.setState({ currentView: 'rekap', userName: 'Angga Nur Hakiki', userEmail: 'a@b.c' });
    render(<Sidebar onNavigate={onNavigate} onOpenAccount={onOpenAccount} />);
    expect(document.querySelectorAll('.sb-item')).toHaveLength(9);
    expect(screen.getByRole('button', { name: /Rekap/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: /Tunggakan/ }));
    expect(onNavigate).toHaveBeenCalledWith('tunggakan');
    await userEvent.click(document.querySelector('.sb-user-card') as HTMLElement);
    expect(onOpenAccount).toHaveBeenCalled();
  });
});

describe('Pusat Notifikasi — kerangka (A3)', () => {
  it('lonceng membuka panel kosong; Esc menutup; lencana hanya bila unreadCount > 0', async () => {
    const { rerender } = render(<HeaderNotifications />);
    expect(document.querySelector('.hdr-bdg')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Notifikasi' }));
    const panel = screen.getByRole('dialog', { name: 'Notifikasi' });
    expect(within(panel).getByText('Belum ada notifikasi')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<HeaderNotifications unreadCount={12} />);
    expect(document.querySelector('.hdr-bdg')).toHaveTextContent('9+');
  });
  it('slot children menggantikan status kosong (dipakai T10)', async () => {
    render(<HeaderNotifications><p>Pembayaran ABIL</p></HeaderNotifications>);
    await userEvent.click(screen.getByRole('button', { name: 'Notifikasi' }));
    expect(screen.getByText('Pembayaran ABIL')).toBeInTheDocument();
    expect(screen.queryByText('Belum ada notifikasi')).toBeNull();
  });
});

describe('DisplayPrefs — pemilih Mode Navigasi (A1) & Posisi Toast (A2)', () => {
  beforeEach(() => { localStorage.clear(); useAppStore.setState({ navMode: 'bottom', toastPosition: 'top' }); });

  it('NavModePicker mengubah store', async () => {
    render(<NavModePicker />);
    expect(screen.getByRole('radio', { name: /Navigasi Bawah/ })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: /Bilah Samping/ }));
    expect(useAppStore.getState().navMode).toBe('sidebar');
  });
  it('ToastPositionPicker mengubah store', async () => {
    render(<ToastPositionPicker />);
    await userEvent.click(screen.getByRole('radio', { name: /Bawah/ }));
    expect(useAppStore.getState().toastPosition).toBe('bottom');
  });
});
