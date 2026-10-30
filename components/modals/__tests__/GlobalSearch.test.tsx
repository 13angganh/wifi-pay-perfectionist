// components/modals/__tests__/GlobalSearch.test.tsx — REDESAIN T11
// GlobalSearch: logika zip utuh + PERBAIKAN ZONA KUSTOM (lencana zona kustom memakai warna zonanya, bukan gaya SLK)
// + primitive Sheet (dialog ber-judul, Esc menutup) + hasil berupa <button> yang bisa difokus keyboard.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/dashboard' }));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import GlobalSearch from '@/components/modals/GlobalSearch';

const Y = 2026, M = 9;

function setup(settings: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: {
      ...DEFAULT_APP_DATA,
      krsMembers: ['ABIL', 'ADIT'], slkMembers: ['SARI'], zoneMembers: { PRM: ['ZAKI', 'ZULAIKHA'] },
      payments: { [`KRS__ABIL__${Y}__${M}`]: 100, [`PRM__ZAKI__${Y}__${M}`]: 150 },
      freeMembers: { 'SLK__SARI': { active: true, fromYear: Y, fromMonth: 0 } },
      memberInfo: { 'PRM__ZAKI': { id: 'PRM-001', ip: '10.1.1.5', tarif: 150 } },
      deletedMembers: {},
    },
    settings: {
      ...DEFAULT_SETTINGS, language: 'id', hiddenZones: [],
      customZones: [{ key: 'PRM', name: 'Prima', color: '#10B981' }], ...settings,
    },
    selYear: Y, selMonth: M, activeZone: 'KRS', expandedCard: null,
  } as never);
}

const open = (onClose = vi.fn()) => { render(<GlobalSearch open onClose={onClose} />); return onClose; };
const box = () => screen.getByRole('textbox', { name: 'Cari member' });

beforeEach(() => { nav.push.mockClear(); setup(); });

describe('GlobalSearch — dialog (primitive Sheet)', () => {
  it('tidak merender apa pun saat tertutup', () => {
    render(<GlobalSearch open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dialog ber-judul "Cari Member" + petunjuk awal; Esc menutup', async () => {
    const onClose = open();
    const dlg = screen.getByRole('dialog', { name: 'Cari Member' });
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(within(dlg).getByText('Ketik nama member untuk mencari di semua zona')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('GlobalSearch — pencarian lintas zona (zona kustom = KRS/SLK)', () => {
  it('menemukan member zona kustom dan memberi lencana ber-warna zona itu', async () => {
    open();
    await userEvent.type(box(), 'zak');
    const row = screen.getByRole('button', { name: /ZAKI/ });
    const badge = within(row).getByText('PRM');
    expect(badge.style.color).toBe('rgb(16, 185, 129)'); // #10B981 = warna zona kustom (dulu jatuh ke gaya SLK)
    expect(within(row).getByText('PRM-001 · 10.1.1.5')).toBeInTheDocument();
  });

  it('zona bawaan tetap memakai warna tema, bukan warna zona kustom', async () => {
    open();
    await userEvent.type(box(), 'abil');
    const badge = within(screen.getByRole('button', { name: /ABIL/ })).getByText('KRS');
    expect(badge.style.color).not.toBe('rgb(16, 185, 129)');
  });

  it('status periode terpilih: nominal / Belum / Gratis', async () => {
    open();
    await userEvent.type(box(), 'a'); // ABIL (lunas 100), ADIT (belum), SARI (gratis), ZAKI (150), ZULAIKHA (belum)
    expect(within(screen.getByRole('button', { name: /ABIL/ })).getByText('100')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /ADIT/ })).getByText('Belum')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /SARI/ })).getByText('Gratis')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /ZAKI/ })).getByText('150')).toBeInTheDocument();
  });

  it('zona kustom yang disembunyikan tidak ikut dicari (sama dengan v11.7.1)', async () => {
    setup({ hiddenZones: ['PRM'] });
    open();
    await userEvent.type(box(), 'zak');
    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
  });

  it('tidak ada hasil → pesan + kata kunci; tombol hapus mengosongkan dan mengembalikan fokus ke kotak cari', async () => {
    open();
    await userEvent.type(box(), 'xyz');
    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada member dengan nama "xyz"')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));
    expect(box()).toHaveValue('');
    expect(box()).toHaveFocus();
    expect(screen.getByText('Ketik nama member untuk mencari di semua zona')).toBeInTheDocument();
  });

  it('ketuk hasil → zona aktif + Entry + kartu terbuka + tutup', async () => {
    const onClose = open();
    await userEvent.type(box(), 'zak');
    await userEvent.click(screen.getByRole('button', { name: /ZAKI/ }));
    const st = useAppStore.getState();
    expect(st.activeZone).toBe('PRM');
    expect(st.currentView).toBe('entry');
    expect(st.expandedCard).toBe('ZAKI');
    expect(nav.push).toHaveBeenCalledWith('/entry');
    expect(onClose).toHaveBeenCalled();
  });
});
