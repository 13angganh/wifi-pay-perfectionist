// T13 — tes layar tambahan (T13-02 FAB di layar, T13-03 period bar, T13-04 Entry, T13-06 ikon Operasional,
// T13-07 Atur Tampilan per layar, T13-10 template.tsx). Pola: store nyata, firebase/db di-mock.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';

const toast = vi.hoisted(() => ({ show: vi.fn(), undo: vi.fn() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const db = vi.hoisted(() => ({ persistPayment: vi.fn(), saveDB: vi.fn() }));

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/dashboard' }));
vi.mock('@/components/ui/Toast', () => ({ showToast: toast.show, showToastUndo: toast.undo, default: () => null }));
vi.mock('@/lib/db', async (orig) => ({ ...(await orig<typeof import('@/lib/db')>()), persistPayment: db.persistPayment, saveDB: db.saveDB }));
vi.mock('react-chartjs-2', () => {
  const mk = (kind: string) => function Mock(props: { data: unknown }) { return <div data-testid={`chart-${kind}`} data-chart={JSON.stringify(props.data)} />; };
  return { Bar: mk('bar'), Line: mk('line'), Doughnut: mk('doughnut') };
});

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import DashboardView from '../dashboard/DashboardView';
import EntryView from '../entry/EntryView';
import RekapView from '../rekap/RekapView';
import TunggakanView from '../tunggakan/TunggakanView';
import GrafikView from '../grafik/GrafikView';
import LogView from '../log/LogView';
import MembersView from '../members/MembersView';
import OperasionalView from '../operasional/OperasionalView';

const Y = 2026, M = 9;

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR'],
    slkMembers: ['SARI'],
    zoneMembers: {},
    payments: { [`KRS__ADIT__${Y}__${M}`]: 100, [`SLK__SARI__${Y}__${M}`]: 80 },
    memberInfo: {
      KRS__ABIL: { id: 'KRS-001', ip: '192.168.1.10', tarif: 100 },
      KRS__ADIT: { id: 'KRS-002', tarif: 100 },
      KRS__AKBAR: { id: 'KRS-003', tarif: 150 },
    },
    freeMembers: {}, deletedMembers: {},
    operasional: { [`${Y}_${M}`]: { items: [{ label: 'Listrik', nominal: 45 }, { label: 'Kontrakan', nominal: 30, icon: 'rent' }] } },
    activityLog: [{ action: '[PAY] Quick Pay Entry KRS - ADIT', detail: 'Oktober 2026: Rp 100.000', ts: new Date(Y, M, 14, 10).getTime(), user: 'a@b.c' }],
    ...over,
  };
}

function setup(over: Partial<AppData> = {}, extra: Record<string, unknown> = {}) {
  localStorage.clear();
  useAppStore.setState({
    appData: makeData(over), uid: 'u1', userEmail: 'a@b.c', userName: 'Hakiki',
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [] },
    activeZone: 'KRS', selYear: Y, selMonth: M, opsYear: Y, opsMonth: M,
    search: '', filterStatus: 'all', batchMode: false, batchSelected: [], expandedCard: null,
    newMemberZone: 'KRS', memberTab: 'active', membersLocked: false,
    globalLocked: false, lockedEntries: {}, syncStatus: 'ok', theme: 'dark',
    hiddenCards: {}, textSize: 'normal', logSearch: '', logType: 'all',
    confirmDialog: { open: false, icon: '', title: '', yesLabel: '', cb: null },
    ...extra,
  } as never);
}

beforeEach(() => {
  toast.show.mockClear(); nav.push.mockClear();
  db.persistPayment.mockReset(); db.persistPayment.mockResolvedValue(undefined);
  db.saveDB.mockReset(); db.saveDB.mockResolvedValue(undefined);
  setup();
});
afterEach(cleanup);

/** aria-label tiap <select> di dalam period bar, berurutan. */
const pbarSelects = (c: HTMLElement) => Array.from(c.querySelectorAll('.wp-pbar select')).map(s => s.getAttribute('aria-label') ?? '');
const before = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('T13-03 Period bar standar', () => {
  const cases: [string, () => React.ReactElement][] = [
    ['Dashboard', () => <DashboardView />], ['Entry', () => <EntryView />], ['Rekap', () => <RekapView />],
    ['Tunggakan', () => <TunggakanView />], ['Operasional', () => <OperasionalView />],
  ];
  it.each(cases)('%s: tepat satu .wp-pbar, urutan Tahun → Bulan → Atur Tampilan', (_n, el) => {
    const { container } = render(el());
    expect(container.querySelectorAll('.wp-pbar')).toHaveLength(1);
    const labels = pbarSelects(container);
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/tahun/i);
    expect(labels[1]).toMatch(/bulan/i);
    const bar = container.querySelector('.wp-pbar') as HTMLElement;
    const last = bar.lastElementChild as HTMLElement;
    expect(last.getAttribute('aria-label')).toBe('Atur kartu yang ditampilkan');   // ikon aksi di ujung kanan
  });

  it('Log: period bar di ATAS Segmented; ikon Reset (bukan tombol berteks)', () => {
    const { container } = render(<LogView />);
    expect(container.querySelectorAll('.wp-pbar')).toHaveLength(1);
    const labels = pbarSelects(container);
    expect(labels[0]).toMatch(/tahun/i);
    expect(labels[1]).toMatch(/bulan/i);
    const bar = container.querySelector('.wp-pbar') as HTMLElement;
    const seg = container.querySelector('.wp-sg') as HTMLElement;
    expect(before(bar, seg)).toBe(true);
    expect(within(bar).getByRole('button', { name: 'Reset filter log' })).toBeInTheDocument();
  });

  it('Grafik: [Tahun] saja di tab Pendapatan; selektor Bulan hanya di tab Pembayaran dan Pelanggan; chip zona + ikon di bar yang sama', async () => {
    const { container } = render(<GrafikView />);
    const u = userEvent.setup();
    expect(container.querySelectorAll('.wp-pbar')).toHaveLength(1);
    expect(screen.queryByTestId('grafik-month')).not.toBeInTheDocument();
    expect(pbarSelects(container)).toHaveLength(1);
    await u.click(screen.getByRole('tab', { name: /Pembayaran/ }));
    expect(screen.getByTestId('grafik-month')).toBeInTheDocument();
    expect(pbarSelects(container)).toHaveLength(2);
    await u.click(screen.getByRole('tab', { name: /Pelanggan/ }));
    expect(screen.getByTestId('grafik-month')).toBeInTheDocument();
    const bar = container.querySelector('.wp-pbar') as HTMLElement;
    expect(bar.querySelector('.wp-pbar__fix')).not.toBeNull();
    expect(within(bar).getByRole('button', { name: 'Atur kartu yang ditampilkan' })).toBeInTheDocument();
  });

  it('Member: tidak punya periode (tanpa .wp-pbar); ikon Atur Tampilan ada di baris pencarian', () => {
    const { container } = render(<MembersView />);
    expect(container.querySelectorAll('.wp-pbar')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Atur kartu yang ditampilkan' })).toBeInTheDocument();
  });
});

describe('T13-04 Entry: urutan blok, Pilih Banyak, sheet', () => {
  it('urutan: period bar → pencarian → chips → kartu ringkasan (berisi Pilih Banyak) → Potensi Belum Masuk', () => {
    const { container } = render(<EntryView />);
    const bar = container.querySelector('.wp-pbar') as HTMLElement;
    const search = screen.getByTestId('entry-search');
    const chip = screen.getAllByRole('button').find(b => b.hasAttribute('aria-pressed') && /Lunas/.test(b.textContent ?? ''))!;
    const pick = screen.getByRole('button', { name: /Pilih Banyak/ });
    const pot = screen.getByText('Potensi Belum Masuk');
    expect(before(bar, search)).toBe(true);
    expect(before(search, chip)).toBe(true);
    expect(before(chip, pick)).toBe(true);
    expect(before(pick, pot)).toBe(true);
  });

  it('kartu ringkasan tidak lagi memuat hitungan lunas/belum/gratis (E5); angka itu hanya di chips', () => {
    render(<EntryView />);
    const card = screen.getByRole('button', { name: /Pilih Banyak/ }).closest('.wp-card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(within(card).queryByText(/Lunas|Belum|Gratis/)).not.toBeInTheDocument();
    expect(within(card).getByLabelText(/total/i)).toBeInTheDocument();
  });

  it('mode pilih: BatchBar menggantikan period bar, pencarian tetap; sheet memuat nama terpilih dan "Bayar (n)"', async () => {
    const { container } = render(<EntryView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    expect(container.querySelector('.wp-pbar')).toBeNull();
    expect(screen.getByTestId('entry-search')).toBeInTheDocument();
    expect(screen.queryByText('Potensi Belum Masuk')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Pilih Semua/ }));
    expect(screen.getByRole('button', { name: /ABIL, AKBAR/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bayar \(2\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ABIL, AKBAR/ })).toHaveAttribute('aria-expanded', 'false');
    await u.click(screen.getByRole('button', { name: /ABIL, AKBAR/ }));
    expect(screen.getByRole('button', { name: /ABIL, AKBAR/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('offset sticky sheet = var(--sp-2) (tinggi nav tidak dihitung dua kali; lihat uji CSS di laporan)', () => {
    for (const f of ['components/features/entry/EntryView.Batch.tsx', 'components/features/rekap/RekapView.Batch.tsx']) {
      const src = readFileSync(f, 'utf8');
      expect(src).toMatch(/const bottom = 'var\(--sp-2\)'/);
      expect(src).not.toMatch(/--bnav-h/);
    }
  });
});

describe('T13-07 Atur Tampilan: kartu yang disembunyikan benar-benar hilang', () => {
  it('Entry: cardinfo menghilangkan baris ID + tarif di kartu member; sum/pot/chips juga', () => {
    setup({}, { hiddenCards: { entry: ['cardinfo'] } });
    const { unmount } = render(<EntryView />);
    expect(screen.queryByText(/Tarif:/)).not.toBeInTheDocument();
    expect(screen.queryByText('KRS-001')).not.toBeInTheDocument();
    unmount();
    setup({}, { hiddenCards: {} });
    render(<EntryView />);
    expect(screen.getAllByText(/Tarif:/).length).toBeGreaterThan(0);
  });

  it('Entry: menyembunyikan sum, pot, dan chips menghilangkan elemennya; lencana jumlah di tombol filter', () => {
    setup({}, { hiddenCards: { entry: ['sum', 'pot', 'chips'] } });
    render(<EntryView />);
    expect(screen.queryByRole('button', { name: /Pilih Banyak/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Potensi Belum Masuk')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button').find(b => b.hasAttribute('aria-pressed') && /Lunas/.test(b.textContent ?? ''))).toBeUndefined();
    expect(within(screen.getByRole('button', { name: 'Atur kartu yang ditampilkan' })).getByText('3')).toBeInTheDocument();
  });

  it('Tunggakan: months menghilangkan lencana bulan; wa menghilangkan tombol Kirim WA', () => {
    setup({}, { hiddenCards: { tunggakan: ['months'] } });
    const a = render(<TunggakanView />);
    expect(screen.getAllByRole('button', { name: /Kirim WA/ }).length).toBeGreaterThan(0);
    expect(a.container.querySelectorAll('[class*="hist"]')).toHaveLength(0);
    a.unmount();
    setup({}, { hiddenCards: { tunggakan: ['wa'] } });
    const b = render(<TunggakanView />);
    expect(screen.queryByRole('button', { name: /Kirim WA/ })).not.toBeInTheDocument();
    expect(b.container.querySelectorAll('[class*="hist"]').length).toBeGreaterThan(0);
  });

  it('Member: ip menyembunyikan tautan IP dan tombol Salin IP', () => {
    setup({}, { hiddenCards: {} });
    const a = render(<MembersView />);
    expect(screen.getAllByText('192.168.1.10').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Salin IP/ }).length).toBeGreaterThan(0);
    a.unmount();
    setup({}, { hiddenCards: { members: ['ip'] } });
    render(<MembersView />);
    expect(screen.queryByText('192.168.1.10')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salin IP/ })).not.toBeInTheDocument();
  });

  it('Operasional: zones menghilangkan ringkasan per zona; item tetap tampil', () => {
    setup({}, { hiddenCards: { operasional: ['zones'] } });
    const a = render(<OperasionalView />);
    expect(screen.getByDisplayValue('Listrik')).toBeInTheDocument();   // item inline tetap ada
    const withoutZones = a.container.innerHTML.length;
    a.unmount();
    setup({}, { hiddenCards: {} });
    const b = render(<OperasionalView />);
    expect(b.container.innerHTML.length).toBeGreaterThan(withoutZones);
  });

  it('Tombol "Tampilkan semua" memulihkan kartu (Dashboard)', async () => {
    setup({}, { hiddenCards: { dashboard: ['stat', 'recent'] } });
    render(<DashboardView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Atur kartu yang ditampilkan' }));
    await u.click(screen.getByRole('button', { name: 'Tampilkan semua' }));
    expect(useAppStore.getState().hiddenCards.dashboard).toEqual([]);
  });
});

describe('T13-02 FAB di layar', () => {
  it('Member: FAB "Tambah Member" ada saat terbuka, hilang saat kunci Member terkunci (dan FabSpace ikut hilang)', () => {
    const a = render(<MembersView />);
    expect(screen.getByRole('button', { name: 'Tambah Member' })).toHaveClass('wp-fab');
    expect(a.container.querySelector('.wp-fab-space')).not.toBeNull();
    a.unmount();
    setup({}, { membersLocked: true });
    const b = render(<MembersView />);
    expect(screen.queryByRole('button', { name: 'Tambah Member' })).not.toBeInTheDocument();
    expect(b.container.querySelector('.wp-fab-space')).toBeNull();
  });

  it('Member: mengetuk FAB membuka sheet Tambah Member', async () => {
    render(<MembersView />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tambah Member' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Operasional: FAB "Tambah Item" membuka sheet; ada FabSpace', async () => {
    const { container } = render(<OperasionalView />);
    const fab = screen.getByRole('button', { name: 'Tambah Item' });
    expect(fab).toHaveClass('wp-fab');
    expect(container.querySelector('.wp-fab-space')).not.toBeNull();
    await userEvent.setup().click(fab);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('T13-06 Operasional: ikon item', () => {
  const savedItems = () => db.persistPayment.mock.calls[0][1].operasional[`${Y}_${M}`].items;

  it('memilih ikon di sheet → item tersimpan membawa icon; radiogroup mengikuti pilihan', async () => {
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Tambah Item' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByRole('radio', { name: /Otomatis/ })).toHaveAttribute('aria-checked', 'true');
    await u.type(within(dlg).getByLabelText('Keterangan'), 'Bensin');
    await u.click(within(dlg).getByRole('radio', { name: /Transport/ }));
    expect(within(dlg).getByRole('radio', { name: /Transport/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(dlg).getByRole('radio', { name: /Otomatis/ })).toHaveAttribute('aria-checked', 'false');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(savedItems()[2]).toEqual({ label: 'Bensin', nominal: 0, icon: 'transport' });
  });

  it('Otomatis → item tersimpan TANPA kunci icon (Firebase menolak undefined)', async () => {
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Tambah Item' }));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Keterangan'), 'Bensin');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    const item = savedItems()[2];
    expect(item).toEqual({ label: 'Bensin', nominal: 0 });
    expect(Object.prototype.hasOwnProperty.call(item, 'icon')).toBe(false);
  });

  it('mengubah item mempertahankan icon-nya; form edit mengisi pilihan awal', async () => {
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: 'Menu item Kontrakan' }));
    await u.click(screen.getByRole('menuitem', { name: 'Edit' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByRole('radio', { name: /Sewa/ })).toHaveAttribute('aria-checked', 'true');
    await u.clear(within(dlg).getByLabelText('Keterangan'));
    await u.type(within(dlg).getByLabelText('Keterangan'), 'Kontrakan Baru');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(savedItems()[1]).toEqual({ label: 'Kontrakan Baru', nominal: 30, icon: 'rent' });
  });
});

describe('T13-10 template.tsx', () => {
  it('memakai minHeight (bukan height: 100%) supaya isi tidak tertutup nav saat scroll ke bawah', () => {
    const src = readFileSync('app/(app)/template.tsx', 'utf8');
    expect(src).toMatch(/minHeight:\s*'100%'/);
    expect(src).not.toMatch(/[^n]height:\s*'100%'/);   // "[^n]" agar minHeight tidak ikut tertangkap
  });
});
