// components/features/__tests__/v11-10-2-screens.test.tsx
// v11.10.2 — render sungguhan: (1) chip "Semua" Entri memakai jumlah seperti Rekap, (2) grafik batang pendapatan Beranda interaktif.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import DashboardView from '../dashboard/DashboardView';
import EntryView from '../entry/EntryView';
import RekapView from '../rekap/RekapView';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

const Y = 2026, M = 9;

function makeData(): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ALFIN', 'ANA'],
    slkMembers: ['SARI'],
    zoneMembers: {},
    payments: {
      [`KRS__ADIT__${Y}__${M}`]: 100,
      [`SLK__SARI__${Y}__${M}`]: 80,
      [`KRS__ADIT__${Y}__${M - 1}`]: 100,
    },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 100 }, KRS__AKBAR: { tarif: 150 } },
    freeMembers: {}, deletedMembers: {}, operasional: {}, activityLog: [],
  };
}

function setup() {
  useAppStore.setState({
    appData: makeData(),
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [] },
    activeZone: 'KRS', selYear: Y, selMonth: M,
    uid: '', userEmail: 'hakiki@test.com', userName: 'Hakiki',
    search: '', filterStatus: 'all', batchMode: false, batchSelected: [], expandedCard: null,
    globalLocked: false, lockedEntries: {}, syncStatus: 'ok',
  } as never);
}

const chipTexts = (c: HTMLElement) =>
  [...c.querySelectorAll('.wp-fchips button')].map(b => (b.textContent || '').replace(/\s+/g, ' ').trim());

beforeEach(() => { nav.push.mockClear(); setup(); });

describe('v11.10.2 #1 — chip filter konsisten Entri vs Rekap', () => {
  it('chip "Semua" di Entri menampilkan jumlah (sama persis dengan Rekap)', () => {
    const entry = render(<EntryView />);
    const entryChips = chipTexts(entry.container);
    entry.unmount();
    const rekap = render(<RekapView />);
    const rekapChips = chipTexts(rekap.container);
    expect(entryChips[0]).toMatch(/^Semua\s*5$/);
    expect(rekapChips[0]).toBe(entryChips[0]);
    // seluruh baris chip (Semua/Lunas/Belum/Gratis) identik di kedua layar
    expect(entryChips).toEqual(rekapChips);
  });
});

describe('v11.10.2 #6 — grafik pendapatan Beranda bisa diketuk', () => {
  it('6 batang = tombol; ketuk menampilkan bulan + nominal, ketuk lagi menutup', async () => {
    render(<DashboardView />);
    const group = screen.getByRole('group', { name: 'Pendapatan 6 bulan terakhir' });
    const bars = Array.from(group.querySelectorAll('button'));
    expect(bars).toHaveLength(6);
    const readout = group.nextElementSibling as HTMLElement;
    expect(readout).toHaveTextContent('Ketuk batang untuk melihat pendapatan tiap bulan');

    const last = bars[5];
    expect(last).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(last);
    expect(last).toHaveAttribute('aria-pressed', 'true');
    expect(readout).toHaveTextContent('Okt 2026');
    expect(readout).toHaveTextContent('Rp 180.000');        // 100 (KRS) + 80 (SLK)
    expect(readout).toHaveTextContent('+80%');              // vs batang sebelumnya (Rp 100.000)
    expect(readout).not.toHaveTextContent('Ketuk batang');

    // batang bulan sebelumnya (hanya KRS ADIT 100); batang sebelumnya lagi kosong → tanpa persen
    await userEvent.click(bars[4]);
    expect(bars[4]).toHaveAttribute('aria-pressed', 'true');
    expect(last).toHaveAttribute('aria-pressed', 'false');
    expect(readout).toHaveTextContent('Sep 2026');
    expect(readout).toHaveTextContent('Rp 100.000');

    await userEvent.click(bars[4]);                         // ketuk lagi = tutup
    expect(bars[4]).toHaveAttribute('aria-pressed', 'false');
    expect(readout).toHaveTextContent('Ketuk batang');
  });

  it('batang punya label aksesibel "Bln Tahun: Rp ..."', () => {
    render(<DashboardView />);
    expect(screen.getByRole('button', { name: 'Okt 2026: Rp 180.000' })).toBeInTheDocument();
  });
});
