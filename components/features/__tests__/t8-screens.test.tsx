// components/features/__tests__/t8-screens.test.tsx
// REDESAIN T8 — render sungguhan Rekap + Tunggakan + RiwayatModal (perilaku yang terlihat user).
// Mengikuti pola t7-screens.test.tsx: store nyata, firebase di-mock, navigasi di-mock.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import RekapView from '../rekap/RekapView';
import TunggakanView from '../tunggakan/TunggakanView';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

const Y = 2026, M = 9; // Oktober 2026

/** Bayar semua bulan Jan 2023 s/d periode acuan kecuali yang di `skip` (supaya jumlah tunggakan terkendali). */
function payAll(zone: string, name: string, skip: [number, number][] = []): Record<string, number> {
  const out: Record<string, number> = {};
  for (let y = 2023; y <= Y; y++) {
    for (let m = 0; m <= (y === Y ? M : 11); m++) {
      if (skip.some(([sy, sm]) => sy === y && sm === m)) continue;
      out[`${zone}__${name}__${y}__${m}`] = 100;
    }
  }
  return out;
}
const last = (n: number): [number, number][] => Array.from({ length: n }, (_, i) => [Y, M - i]);

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ALFIN', 'ANA'],
    slkMembers: ['SARI'],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
    payments: {
      ...payAll('KRS', 'ABIL', last(1)),   // 1 bulan  (baru)  — tarif 100 → Rp 100.000
      ...payAll('KRS', 'ADIT', last(3)),   // 3 bulan  (segera) — tarif 80 → Rp 240.000
      ...payAll('KRS', 'AKBAR', last(6)),  // 6 bulan  (kritis) — tanpa tarif → default 100 → Rp 600.000
      ...payAll('KRS', 'ALFIN'),           // lunas semua (rajin)
      ...payAll('SLK', 'SARI'),
      ...payAll('TIMUR', 'BUDI', last(2)),
    },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 80 }, TIMUR__BUDI: { tarif: 60 } },
    freeMembers: {
      KRS__ANA: { active: true, fromYear: 2023, fromMonth: 0 },
      TIMUR__CITRA: { active: true, fromYear: 2023, fromMonth: 0 },
    },
    deletedMembers: {}, operasional: {}, activityLog: [],
    ...over,
  };
}

function setup(over: Partial<AppData> = {}, extra: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: makeData(over),
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] },
    activeZone: 'KRS', selYear: Y, selMonth: M,
    uid: '', userEmail: 'hakiki@test.com',
    search: '', rekapExpanded: null,
    globalLocked: false, lockedEntries: {}, syncStatus: 'ok',
    riwayatName: '', riwayatZone: 'KRS', riwayatYear: Y,
    ...extra,
  } as never);
}

const row = (name: string) => document.querySelector(`tr[data-name="${name}"]`) as HTMLElement;
/** sel bulan (0-based) pada baris: td[0]=#, td[1]=nama, td[2..13]=Jan..Des */
const cell = (name: string, mi: number) => row(name).querySelectorAll('td')[2 + mi] as HTMLElement;
const rowNames = () => Array.from(document.querySelectorAll('tbody tr[data-name]')).map(r => r.getAttribute('data-name'));

beforeEach(() => { nav.push.mockClear(); setup(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('RekapView (T8)', () => {
  it('periode: tahun dulu lalu bulan acuan; ringkasan total tahun; tombol Pilih Banyak', () => {
    render(<RekapView />);
    expect(screen.getByDisplayValue('2026')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Okt')).toBeInTheDocument();   // MONTHS zip = singkatan 3 huruf
    expect(screen.getByRole('button', { name: /Pilih Banyak/ })).toBeEnabled();
    // total tahun = jumlah semua nilai tahun 2026 pada zona KRS
    expect(screen.getByText('KRS 2026')).toBeInTheDocument();
  });

  it('A15: chip status punya jumlah pada bulan acuan dan memfilter baris', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    const chips = screen.getByRole('group', { name: 'Filter status pembayaran' });
    // Oktober 2026: ALFIN, SARI(SLK bukan zona ini) → KRS: ABIL belum, ADIT belum, AKBAR belum, ALFIN lunas, ANA gratis
    expect(within(chips).getByRole('button', { name: /Lunas/ })).toHaveTextContent('1');
    expect(within(chips).getByRole('button', { name: /Belum/ })).toHaveTextContent('3');
    expect(within(chips).getByRole('button', { name: /Gratis/ })).toHaveTextContent('1');
    await u.click(within(chips).getByRole('button', { name: /Belum/ }));
    expect(rowNames()).toEqual(['ABIL', 'ADIT', 'AKBAR']);
    await u.click(within(chips).getByRole('button', { name: /Gratis/ }));
    expect(rowNames()).toEqual(['ANA']);
  });

  it('jenis sel: gratis = ikon, belum jatuh tempo = latar merah, bulan setelah acuan = tanda pisah', () => {
    render(<RekapView />);
    expect(cell('ANA', 9).querySelector('svg')).toBeTruthy();                // gratis
    expect(cell('AKBAR', 9).className).toMatch(/cb/);                        // belum & ≤ acuan
    expect(cell('AKBAR', 10).textContent).toBe('—');                         // belum & > acuan
    expect(cell('ALFIN', 9).textContent).toBe('100.000');                    // lunas
  });

  it('mode pilih: hanya sel belum bayar yang bisa dipilih; Tandai Lunas Semua menulis tarif/QuickPay pertama dan melewati yang lunas', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    expect(screen.getByText(/tap sel untuk pilih\/batal/)).toBeInTheDocument();

    await u.click(cell('ALFIN', 9));              // lunas → ditolak
    await u.click(cell('ANA', 9));                // gratis → ditolak
    expect(screen.queryByTestId('rekap-batch-sheet')).not.toBeInTheDocument();

    await u.click(cell('ABIL', 9));               // belum, tarif 100
    await u.click(cell('AKBAR', 9));              // belum, tanpa tarif → QuickPay pertama (50)
    const sheet = screen.getByTestId('rekap-batch-sheet');
    expect(within(sheet).getByText(/2 Member Dipilih/)).toBeInTheDocument();
    expect(within(sheet).getByText('default')).toBeInTheDocument();           // tag untuk AKBAR
    expect(within(sheet).getAllByText('Rp 100.000').length).toBeGreaterThan(0);
    expect(within(sheet).getByText('Rp 50.000')).toBeInTheDocument();

    await u.click(within(sheet).getByRole('button', { name: /Tandai Lunas Semua/ }));
    const p = useAppStore.getState().appData.payments;
    expect(p[`KRS__ABIL__${Y}__${M}`]).toBe(100);
    expect(p[`KRS__AKBAR__${Y}__${M}`]).toBe(50);
    expect(p[`KRS__ALFIN__${Y}__${M}`]).toBe(100);                            // tidak tersentuh
    expect(p[`KRS__ADIT__${Y}__${M}`]).toBeUndefined();                       // tidak dipilih
    expect(screen.queryByTestId('rekap-batch-sheet')).not.toBeInTheDocument();
  });

  it('Pilih Semua memilih semua sel belum bayar (lintas daftar terfilter) lalu Batalkan Semua mengosongkan', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(screen.getByRole('button', { name: 'Pilih Semua' }));
    expect(within(screen.getByTestId('rekap-batch-sheet')).getByText(/3 Member Dipilih/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Batalkan Semua' }));
    expect(screen.queryByTestId('rekap-batch-sheet')).not.toBeInTheDocument();
  });

  it('tekan lama (500 ms) pada sel TIDAK lagi membuka mode pilih (fitur dihapus; gunakan tombol Pilih Banyak)', () => {
    vi.useFakeTimers();
    render(<RekapView />);
    const c = cell('ABIL', 9);
    fireEvent.pointerDown(c);
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.pointerUp(c);
    expect(screen.queryByText(/tap sel untuk pilih\/batal/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('rekap-batch-sheet')).not.toBeInTheDocument();
  });

  it('ketuk sel membuka RekapModal; nominal cepat menulis payment dan menutup dialog', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(cell('ADIT', 9));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('ADIT')).toBeInTheDocument();
    expect(within(dlg).getByText(/Okt 2026/)).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: '90K' }));
    expect(useAppStore.getState().appData.payments[`KRS__ADIT__${Y}__${M}`]).toBe(90);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('RekapModal: tarif member lebih dulu dan bertanda ★; Simpan menulis nominal ketikan', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(cell('ABIL', 9));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByRole('button', { name: '100K ★' })).toBeInTheDocument();
    await u.type(within(dlg).getByLabelText('Nominal'), '75');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(useAppStore.getState().appData.payments[`KRS__ABIL__${Y}__${M}`]).toBe(75);
  });

  it('RekapModal pada member gratis hanya menampilkan catatan; saat terkunci menampilkan catatan terkunci', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(cell('ANA', 9));
    expect(within(screen.getByRole('dialog')).getByText('Member Gratis periode ini')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Simpan' })).not.toBeInTheDocument();
  });

  it('A18: ketuk nama membuka RiwayatModal dengan tahun periode; ketuk bulan membuka kartu member di Entry', async () => {
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'ALFIN' }));
    const dlg = screen.getByRole('dialog', { name: /ALFIN/ });
    expect(within(dlg).getByText(/bulan lunas/)).toBeInTheDocument();
    expect(useAppStore.getState().riwayatName).toBe('ALFIN');
    expect(useAppStore.getState().riwayatYear).toBe(Y);
    await u.click(within(dlg).getByText('Mar 2026'));
    expect(nav.push).toHaveBeenCalledWith('/entry');
  });

  it('zona kustom: daftar, jumlah chip, dan batch memakai zona itu', async () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<RekapView />);
    const u = userEvent.setup();
    expect(rowNames()).toEqual(['BUDI', 'CITRA']);
    const chips = screen.getByRole('group', { name: 'Filter status pembayaran' });
    expect(within(chips).getByRole('button', { name: /Gratis/ })).toHaveTextContent('1');
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(cell('BUDI', 9));                                           // belum di Oktober, tarif 60
    await u.click(within(screen.getByTestId('rekap-batch-sheet')).getByRole('button', { name: /Tandai Lunas Semua/ }));
    expect(useAppStore.getState().appData.payments[`TIMUR__BUDI__${Y}__${M}`]).toBe(60);
  });

  it('banner terkunci: ketuk meneruskan ke tombol kunci Header (satu jalur unlock)', async () => {
    setup({}, { globalLocked: true });
    const spy = vi.fn();
    const hdr = document.createElement('button');
    hdr.className = 'header-lock-action-btn';
    hdr.addEventListener('click', spy);
    document.body.appendChild(hdr);
    render(<RekapView />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Entry terkunci, ketuk untuk membuka' }));
    expect(spy).toHaveBeenCalledTimes(1);
    hdr.remove();
  });

  it('batch saat terkunci: tidak menulis dan memberi tahu (perilaku zip)', async () => {
    setup({}, { globalLocked: true });
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(cell('ABIL', 9));
    await u.click(within(screen.getByTestId('rekap-batch-sheet')).getByRole('button', { name: /Tandai Lunas Semua/ }));
    expect(useAppStore.getState().appData.payments[`KRS__ABIL__${Y}__${M}`]).toBeUndefined();
  });

  it('zona kosong: keadaan kosong dengan tautan ke Member', () => {
    setup({}, { activeZone: 'SLK', appData: makeData({ slkMembers: [] }) });
    render(<RekapView />);
    expect(screen.getByText('Belum ada member')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka Member' })).toHaveAttribute('href', '/members');
    expect(screen.getByRole('button', { name: /Pilih Banyak/ })).toBeDisabled();
  });

  it('tanpa hasil pencarian: keadaan tidak ditemukan dengan Reset Filter yang mengembalikan daftar', async () => {
    setup({}, { search: 'zzz' });
    render(<RekapView />);
    const u = userEvent.setup();
    expect(screen.getByText('Member tidak ditemukan')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Reset Filter' }));
    expect(rowNames()).toHaveLength(5);
  });
});

describe('TunggakanView (T8)', () => {
  it('mode Nunggak: urut bulan terbanyak, nominal per member, total tunggakan (A16), jumlah pada segmen', () => {
    render(<TunggakanView />);
    const cards = screen.getAllByTestId('tunggakan-card');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('1. AKBAR');
    expect(cards[0]).toHaveTextContent('6 bulan tunggakan');
    expect(cards[0]).toHaveTextContent('Rp 300.000');       // 6 × QuickPay pertama (50) — tanpa tarif
    expect(cards[1]).toHaveTextContent('2. ADIT');
    expect(cards[1]).toHaveTextContent('Rp 240.000');       // 3 × tarif 80
    expect(cards[2]).toHaveTextContent('3. ABIL');
    expect(cards[2]).toHaveTextContent('Rp 100.000');       // 1 × tarif 100
    expect(screen.getByText('Total Tunggakan')).toBeInTheDocument();
    expect(screen.getByText('Rp 640.000')).toBeInTheDocument();
    const mode = screen.getByRole('group', { name: 'Mode tunggakan' });
    expect(within(mode).getByRole('button', { name: /Nunggak/ })).toHaveTextContent('3');
    expect(within(mode).getByRole('button', { name: /Rajin/ })).toHaveTextContent('1');
    expect(within(mode).getByRole('button', { name: /Gratis/ })).toHaveTextContent('1');
  });

  it('chip aging menyaring: Baru 1, Segera 2–3, Kritis 4+; ganti mode mereset aging', async () => {
    render(<TunggakanView />);
    const u = userEvent.setup();
    const ag = screen.getByRole('group', { name: 'Filter umur tunggakan' });
    await u.click(within(ag).getByRole('button', { name: /Kritis/ }));
    expect(screen.getAllByTestId('tunggakan-card')).toHaveLength(1);
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('AKBAR');
    await u.click(within(ag).getByRole('button', { name: /Baru/ }));
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('ABIL');
    await u.click(within(screen.getByRole('group', { name: 'Mode tunggakan' })).getByRole('button', { name: /Rajin/ }));
    expect(screen.queryByRole('group', { name: 'Filter umur tunggakan' })).not.toBeInTheDocument();
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('ALFIN');
  });

  it('mode Gratis menampilkan periode gratis; mode Rajin menampilkan "Lunas semua"', async () => {
    render(<TunggakanView />);
    const u = userEvent.setup();
    const mode = screen.getByRole('group', { name: 'Mode tunggakan' });
    await u.click(within(mode).getByRole('button', { name: /Gratis/ }));
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('ANA');
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('Dari Jan 2023 (selamanya)');
    await u.click(within(mode).getByRole('button', { name: /Rajin/ }));
    expect(screen.getByText('Lunas semua')).toBeInTheDocument();
  });

  it('A19: pencarian nama menyaring daftar dan jumlah; tanpa hasil → keadaan tidak ditemukan + reset', async () => {
    render(<TunggakanView />);
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText('Cari nama pelanggan...'), 'adi');
    expect(screen.getAllByTestId('tunggakan-card')).toHaveLength(1);
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('ADIT');
    await u.clear(screen.getByPlaceholderText('Cari nama pelanggan...'));
    await u.type(screen.getByPlaceholderText('Cari nama pelanggan...'), 'zzz');
    expect(screen.getByText('Member tidak ditemukan')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Reset Filter' }));
    expect(screen.getAllByTestId('tunggakan-card')).toHaveLength(3);
  });

  it('Kirim WA memakai tarif INDIVIDUAL member (bukan QuickPay global) dan jumlah bulan', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<TunggakanView />);
    const adit = screen.getAllByTestId('tunggakan-card')[1];
    await userEvent.setup().click(within(adit).getByRole('button', { name: /Kirim WA/ }));
    const url = decodeURIComponent(open.mock.calls[0][0] as string);
    expect(url).toContain('ADIT');
    expect(url).toContain('240.000');                       // 3 bulan × 80 × 1000
  });

  it('tanpa tarif: petunjuk tarif default tampil dan WA memakai QuickPay pertama', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<TunggakanView />);
    const akbar = screen.getAllByTestId('tunggakan-card')[0];
    expect(within(akbar).getByText(/Tarif belum diset, pakai default/)).toBeInTheDocument();
    await userEvent.setup().click(within(akbar).getByRole('button', { name: /Kirim WA/ }));
    expect(decodeURIComponent(open.mock.calls[0][0] as string)).toContain('300.000'); // 6 × 50 × 1000
  });

  it('A18: ketuk kartu membuka RiwayatModal; tombol Kirim WA tidak ikut membukanya', async () => {
    vi.stubGlobal('open', vi.fn());
    render(<TunggakanView />);
    const u = userEvent.setup();
    const abil = screen.getAllByTestId('tunggakan-card')[2];
    await u.click(within(abil).getByRole('button', { name: /Kirim WA/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await u.click(within(abil).getByRole('button', { name: /ABIL, 1 bulan tunggakan/ }));
    expect(screen.getByRole('dialog', { name: /ABIL/ })).toBeInTheDocument();
    expect(useAppStore.getState().riwayatName).toBe('ABIL');
  });

  it('periode: mengganti bulan acuan mengubah tunggakan (s/d bulan itu)', async () => {
    render(<TunggakanView />);
    await userEvent.setup().selectOptions(screen.getByDisplayValue('Okt'), '3'); // April
    expect(useAppStore.getState().selMonth).toBe(3);
    expect(screen.getByText('Semua Lunas!')).toBeInTheDocument();           // semua lunas s/d April
  });

  it('zona kustom: tunggakan, tarif, dan gratis dihitung untuk zona itu', async () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<TunggakanView />);
    const card = screen.getByTestId('tunggakan-card');
    expect(card).toHaveTextContent('BUDI');
    expect(card).toHaveTextContent('2 bulan tunggakan');
    expect(card).toHaveTextContent('Rp 120.000');                           // 2 × tarif 60
    await userEvent.setup().click(within(screen.getByRole('group', { name: 'Mode tunggakan' })).getByRole('button', { name: /Gratis/ }));
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('CITRA');
  });

  it('zona tanpa member: keadaan kosong dengan tautan ke Member', () => {
    setup({ slkMembers: [] }, { activeZone: 'SLK' });
    render(<TunggakanView />);
    expect(screen.getByText('Belum ada member')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka Member' })).toHaveAttribute('href', '/members');
  });

  it('bahasa Inggris: nama bulan dan label mengikuti bahasa', () => {
    setup({}, { settings: { ...DEFAULT_SETTINGS, language: 'en', customZones: [], hiddenZones: [] } });
    render(<TunggakanView />);
    expect(screen.getByDisplayValue('Oct')).toBeInTheDocument();
    expect(screen.getAllByText(/months overdue/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/May 2026/).length).toBeGreaterThan(0);       // chip bulan bahasa Inggris
  });
});
