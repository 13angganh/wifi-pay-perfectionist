// components/features/__tests__/t7-screens.test.tsx
// REDESAIN T7 — render sungguhan Dashboard + Entry (smoke + perilaku yang terlihat user).
// Mengikuti pola RekapView.pagination.test.tsx: store nyata, firebase di-mock.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import DashboardView from '../dashboard/DashboardView';
import EntryView from '../entry/EntryView';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

const Y = 2026, M = 9;

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR'],
    slkMembers: ['SARI'],
    zoneMembers: { TIMUR: ['BUDI'] },
    payments: {
      [`KRS__ADIT__${Y}__${M}`]: 100,        // lunas
      [`SLK__SARI__${Y}__${M}`]: 80,
      [`TIMUR__BUDI__${Y}__${M}`]: 90,
    },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 100 }, KRS__AKBAR: { tarif: 150 } },
    freeMembers: {}, deletedMembers: {}, operasional: {},
    activityLog: [
      { action: '[PAY] Quick Pay Entry KRS - ADIT', detail: `Oktober 2026: Rp 100.000`, ts: new Date(2026, 9, 14, 10, 24).getTime(), user: 'a@b.c' },
      ...Array.from({ length: 6 }, (_, i) => ({ action: `Login ${i}`, detail: '', ts: new Date(2026, 9, 1 + i).getTime(), user: 'a@b.c' })),
    ],
    ...over,
  };
}

function setup(over: Partial<AppData> = {}, extra: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: makeData(over),
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] },
    activeZone: 'KRS', selYear: Y, selMonth: M,
    uid: '', userEmail: 'hakiki@test.com', userName: 'Hakiki',
    search: '', filterStatus: 'all', batchMode: false, batchSelected: [], expandedCard: null,
    globalLocked: false, lockedEntries: {}, syncStatus: 'ok',
    ...extra,
  } as never);
}

beforeEach(() => { nav.push.mockClear(); setup(); });

describe('DashboardView (T7)', () => {
  it('sapaan memakai nama pengguna; tiga stat; periode terpilih', () => {
    render(<DashboardView />);
    expect(screen.getByText('Selamat datang,')).toBeInTheDocument();
    expect(screen.getByText(/Hakiki/)).toBeInTheDocument();
    expect(screen.getByText('Lunas')).toBeInTheDocument();
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('kartu zona: zona kustom tampil dengan totalnya sendiri (bukan total SLK)', () => {
    render(<DashboardView />);
    // nama zona juga muncul sebagai chip di Tunggakan Terbanyak → ambil judul kartu zona (<b>)
    const zoneCard = (z: string) => screen.getAllByText(z).find(el => el.tagName === 'B')!.closest('.wp-card') as HTMLElement;
    expect(within(zoneCard('TIMUR')).getByText('Rp 90.000')).toBeInTheDocument();
    expect(within(zoneCard('SLK')).getByText('Rp 80.000')).toBeInTheDocument();
  });

  it('A12: Aktivitas Terbaru memuat maksimal 5 entri terbaru + Lihat Semua → /log', async () => {
    render(<DashboardView />);
    expect(screen.getByText('Aktivitas Terbaru')).toBeInTheDocument();
    expect(screen.getByText('Quick Pay Entry KRS - ADIT')).toBeInTheDocument(); // tag [PAY] dibuang
    expect(screen.getAllByText(/^Login \d$/)).toHaveLength(4);                  // 1 pay + 4 login = 5
    await userEvent.setup().click(screen.getByRole('button', { name: /Lihat Semua/ }));
    expect(nav.push).toHaveBeenCalledWith('/log');
  });

  it('Input Bayar membawa ke Entry; Aksi Cepat bernavigasi', async () => {
    render(<DashboardView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Input Bayar/ }));
    expect(nav.push).toHaveBeenCalledWith('/entry');
    await u.click(screen.getByRole('button', { name: 'Rekap' }));
    expect(nav.push).toHaveBeenCalledWith('/rekap');
  });

  it('tanpa member: state kosong dengan tombol ke Member', async () => {
    setup({ krsMembers: [], slkMembers: [], zoneMembers: {}, payments: {} });
    render(<DashboardView />);
    expect(screen.getByText('Belum ada member')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Buka Member' }));
    expect(nav.push).toHaveBeenCalledWith('/members');
  });

  it('memuat: skeleton, tanpa kartu data', () => {
    setup({ krsMembers: [], slkMembers: [], zoneMembers: {}, payments: {} }, { syncStatus: 'loading' });
    render(<DashboardView />);
    expect(screen.queryByText('Aktivitas Terbaru')).not.toBeInTheDocument();
  });
});

describe('EntryView (T7)', () => {
  it('menampilkan kartu member zona aktif, ringkasan, dan Potensi Belum Masuk', () => {
    render(<EntryView />);
    expect(screen.getAllByTestId('member-card')).toHaveLength(3);
    expect(screen.getByText('Potensi Belum Masuk')).toBeInTheDocument();
    expect(screen.getByText('Rp 250.000')).toBeInTheDocument(); // ABIL 100 + AKBAR 150
  });

  it('zona kustom: daftar mengikuti zona aktif', () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<EntryView />);
    expect(screen.getAllByTestId('member-card')).toHaveLength(1);
    expect(screen.getByText('BUDI')).toBeInTheDocument();
  });

  it('Pilih Banyak: masuk mode pilih tanpa pilihan awal; Pilih Semua memilih HANYA member belum bayar (guard 8b)', async () => {
    render(<EntryView />);
    const u0 = userEvent.setup();
    await u0.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    expect(useAppStore.getState().batchMode).toBe(true);
    expect(useAppStore.getState().batchSelected).toEqual([]);
    await u0.click(screen.getByRole('button', { name: /Pilih Semua/ }));
    expect(useAppStore.getState().batchSelected.sort()).toEqual(['ABIL', 'AKBAR']);
    expect(screen.getByRole('button', { name: /ABIL, AKBAR/ })).toBeInTheDocument();   // nama terpilih tampil di sheet
    // kartu lunas: kotak centang nonaktif dan tidak bisa dipilih
    const lunasBox = screen.getByRole('checkbox', { name: /ADIT/ });
    expect(lunasBox).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Pilih member ABIL/ })).toBeChecked();
  });

  it('mode pilih: mengetuk kartu lunas tidak menambah pilihan; mengetuk kartu belum bayar men-toggle', async () => {
    render(<EntryView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    const cards = screen.getAllByTestId('member-card');
    const adit = cards.find(c => within(c).queryByText('ADIT'))!;
    await u.click(within(adit).getByRole('button', { name: /ADIT/ }));
    expect(useAppStore.getState().batchSelected).not.toContain('ADIT');
    const abil = cards.find(c => within(c).queryByText('ABIL'))!;
    await u.click(within(abil).getByRole('button', { name: /ABIL/ }));
    expect(useAppStore.getState().batchSelected).toEqual(['ABIL']);
  });

  it('terkunci: banner tampil dan Pilih Banyak ditolak (mode pilih tidak terbuka)', async () => {
    setup({}, { globalLocked: true });
    render(<EntryView />);
    expect(screen.getByRole('button', { name: /Entry terkunci/ })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    expect(useAppStore.getState().batchMode).toBe(false);
  });

  it('pencarian tanpa hasil: state kosong + Reset Pencarian mengosongkan query', async () => {
    setup({}, { search: 'ZZZ' });
    render(<EntryView />);
    expect(screen.getByText('Member tidak ditemukan')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reset Pencarian' }));
    expect(useAppStore.getState().search).toBe('');
  });

  it('kartu dibuka: nominal, quick pay kustom (settings.quickAmounts), tanggal terkunci saat autoDate', async () => {
    setup({}, {
      settings: { ...DEFAULT_SETTINGS, language: 'id', quickAmounts: [60, 120], autoDate: true, customZones: [], hiddenZones: [] },
    });
    render(<EntryView />);
    const abil = screen.getAllByTestId('member-card').find(c => within(c).queryByText('ABIL'))!;
    await userEvent.setup().click(within(abil).getByRole('button', { name: /ABIL/ }));
    expect(within(abil).getByRole('button', { name: '100K' })).toBeInTheDocument(); // tarif diurutkan pertama
    expect(within(abil).getByRole('button', { name: '60K' })).toBeInTheDocument();
    expect(within(abil).getByRole('button', { name: '120K' })).toBeInTheDocument();
    expect(within(abil).queryByRole('button', { name: '50K' })).not.toBeInTheDocument(); // bukan nominal default
    expect(abil.querySelector('input[type="date"]')).toBeDisabled();
  });
});
