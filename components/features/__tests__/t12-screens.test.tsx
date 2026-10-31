// components/features/__tests__/t12-screens.test.tsx — REDESAIN T12 (S2, S3, S4): layar sungguhan.
// Member (Terdaftar sejak · sheet Status & Periode · Nonaktif/Reaktivasi · chip/filter · hitungan), Entry (konfirmasi N/A,
// tanggal bayar tiap jalur), Rekap (sel N/A, modal, batch, tanggal bayar), Tunggakan (Free multi-periode), Riwayat.
// Store nyata; firebase dan lapisan db di-mock. "Sekarang" dibekukan lewat fake Date saja (timer tetap nyata).
process.env.TZ = 'Asia/Jakarta';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const toast = vi.hoisted(() => ({ show: vi.fn(), undo: vi.fn() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const db = vi.hoisted(() => ({ persistPayment: vi.fn(), saveDB: vi.fn(), granular: vi.fn() }));

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/members' }));
vi.mock('@/components/ui/Toast', () => ({ showToast: toast.show, showToastUndo: toast.undo, default: () => null }));
vi.mock('@/lib/db', async (orig) => ({
  ...(await orig<typeof import('@/lib/db')>()),
  persistPayment: db.persistPayment, saveDB: db.saveDB, persistPaymentGranular: db.granular,
}));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import MembersView from '@/components/features/members/MembersView';
import EntryView from '@/components/features/entry/EntryView';
import RekapView from '@/components/features/rekap/RekapView';
import TunggakanView from '@/components/features/tunggakan/TunggakanView';
import GlobalSearch from '@/components/modals/GlobalSearch';

const Y = 2026, M = 9; // Oktober 2026
const key = (n: string, y = Y, m = M) => `KRS__${n}__${y}__${m}`;

// ABIL biasa · ADIT nonaktif Okt · AKBAR belum terdaftar (mulai Nov) · ANA free (rekaman lama)
function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ANA'], slkMembers: [], zoneMembers: {},
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 100 }, KRS__AKBAR: { tarif: 100 } },
    payments: {},
    freeMembers: { KRS__ANA: { active: true, fromYear: 2023, fromMonth: 0 } },
    memberPeriods: {
      KRS__ADIT:  { inactive: [{ fromY: Y, fromM: M, toY: Y, toM: M }] },
      KRS__AKBAR: { joined: { y: Y, m: M + 1 } },
    },
    deletedMembers: {}, operasional: {}, activityLog: [],
    ...over,
  };
}

function setup(data: Partial<AppData> = {}, state: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: makeData(data),
    uid: '', userEmail: 'a@b.c',
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [], ...settings },
    newMemberZone: 'KRS', memberTab: 'active', search: '', membersLocked: false,
    selYear: Y, selMonth: M, syncStatus: 'ok', activeZone: 'KRS', theme: 'dark',
    globalLocked: false, lockedEntries: {},
    filterStatus: 'all', batchMode: false, batchSelected: [], expandedCard: null, rekapExpanded: null,
    riwayatName: '', riwayatZone: 'KRS', riwayatYear: Y,
    ...state,
  } as never);
}

const rows = () => screen.getAllByTestId('member-row').map(r => r.getAttribute('data-name'));
const rowOf = (n: string) => screen.getAllByTestId('member-row').find(r => r.getAttribute('data-name') === n)!;
const btn = (name: string | RegExp) => screen.getByRole('button', { name });
const cardOf = (n: string) => screen.getAllByTestId('member-card').find(c => within(c).queryByText(n))!;
const rekapRow = (n: string) => document.querySelector(`tr[data-name="${n}"]`) as HTMLElement;
const rekapCell = (n: string, mi: number) => rekapRow(n).querySelectorAll('td')[2 + mi] as HTMLElement;
const info = (n: string) => useAppStore.getState().appData.memberInfo?.[`KRS__${n}`] as Record<string, unknown> | undefined;
const entryBatchSheet = () => screen.getAllByRole('region').find(r => within(r).queryByText('Total'))!;
const runConfirm = async () => { await act(async () => { useAppStore.getState().confirmDialog.cb?.(); await Promise.resolve(); }); };
const freezeNow = (d = new Date(2026, 9, 22, 0, 30)) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(d); };

beforeEach(() => {
  // jsdom tidak punya scrollIntoView (dipanggil kartu Entry saat dibuka/ditutup)
  Element.prototype.scrollIntoView = vi.fn();
  toast.show.mockClear(); nav.push.mockClear();
  db.persistPayment.mockReset(); db.persistPayment.mockResolvedValue(undefined);
  db.saveDB.mockReset(); db.saveDB.mockResolvedValue(undefined);
  db.granular.mockReset(); db.granular.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

// ══════════════════════════════════════════════════════════════
describe('Member — status N/A, chip Nonaktif, hitungan header (D4, D8)', () => {
  it('badge Nonaktif / Belum terdaftar; hitungan memisahkan aktif/nonaktif; chip Nonaktif menyaring', async () => {
    setup({ payments: { [key('ABIL')]: 100 } });
    render(<MembersView />);
    expect(within(rowOf('ADIT')).getByText('Nonaktif')).toBeInTheDocument();
    expect(within(rowOf('AKBAR')).getByText('Belum terdaftar')).toBeInTheDocument();
    expect(screen.getByTestId('members-count')).toHaveTextContent('4 pelanggan · KRS · Okt 2026 · 2 aktif · 1 nonaktif · 1 belum terdaftar');
    const chips = screen.getByRole('group', { name: 'Filter status pembayaran' });
    expect(within(chips).getByRole('button', { name: /Nonaktif/ })).toHaveTextContent('1');
    expect(within(chips).getByRole('button', { name: /Belum/ })).toHaveTextContent('0');   // N/A bukan "Belum"
    await userEvent.setup().click(within(chips).getByRole('button', { name: /Nonaktif/ }));
    expect(rows()).toEqual(['ADIT']);
  });

  it('tanpa member N/A: header dan chip tidak berubah dari sebelum T12 (tidak ada teks aktif/nonaktif)', () => {
    setup({ memberPeriods: {} });
    render(<MembersView />);
    expect(screen.getByTestId('members-count')).toHaveTextContent(/^4 pelanggan · KRS · Okt 2026$/);
    expect(within(screen.getByRole('group', { name: 'Filter status pembayaran' })).getByRole('button', { name: /Nonaktif/ })).toHaveTextContent('0');
  });
});

// ══════════════════════════════════════════════════════════════
describe('Sheet "Status & Periode" — Nonaktif / Reaktivasi berulang (S3)', () => {
  it('Reaktivasi hanya muncul bila ada periode nonaktif terbuka; urutan Apr→Mei lalu Sep→Okt menghasilkan {Apr–Apr} dan {Sep–Sep}', async () => {
    setup({ memberPeriods: { KRS__ABIL: { joined: { y: 2026, m: 0 } } } }, { selMonth: 3 }); // Apr 2026
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Status & Periode: ABIL' }));
    const dlg = () => screen.getByRole('dialog', { name: 'Status & Periode: ABIL' });
    const periods = () => useAppStore.getState().appData.memberPeriods!.KRS__ABIL.inactive;

    expect(within(dlg()).getByRole('button', { name: /Nonaktifkan mulai/ })).toBeInTheDocument();
    expect(within(dlg()).queryByRole('button', { name: /Aktifkan kembali mulai/ })).not.toBeInTheDocument();

    await u.click(within(dlg()).getByRole('button', { name: /Nonaktifkan mulai/ }));
    await runConfirm();
    expect(periods()).toEqual([{ fromY: 2026, fromM: 3 }]);                     // terbuka
    expect(within(dlg()).queryByRole('button', { name: /Nonaktifkan mulai/ })).not.toBeInTheDocument();
    expect(within(dlg()).queryByRole('button', { name: /Aktifkan kembali mulai/ })).not.toBeInTheDocument(); // Apr = bulan mulai

    act(() => { useAppStore.setState({ selMonth: 4 } as never); });             // Mei
    await u.click(within(dlg()).getByRole('button', { name: /Aktifkan kembali mulai/ }));
    await runConfirm();
    expect(periods()).toEqual([{ fromY: 2026, fromM: 3, toY: 2026, toM: 3 }]);  // {Apr–Apr}
    expect(within(dlg()).queryByRole('button', { name: /Aktifkan kembali mulai/ })).not.toBeInTheDocument();

    act(() => { useAppStore.setState({ selMonth: 8 } as never); });             // Sep
    await u.click(within(dlg()).getByRole('button', { name: /Nonaktifkan mulai/ }));
    await runConfirm();
    act(() => { useAppStore.setState({ selMonth: 9 } as never); });             // Okt
    await u.click(within(dlg()).getByRole('button', { name: /Aktifkan kembali mulai/ }));
    await runConfirm();
    expect(periods()).toEqual([
      { fromY: 2026, fromM: 3, toY: 2026, toM: 3 },
      { fromY: 2026, fromM: 8, toY: 2026, toM: 8 },
    ]);
    expect(useAppStore.getState().appData.memberPeriods!.KRS__ABIL.joined).toEqual({ y: 2026, m: 0 });
    expect(toast.show).toHaveBeenCalledWith('ABIL dinonaktifkan');
    expect(toast.show).toHaveBeenCalledWith('ABIL diaktifkan kembali');
  });

  it('Free multi-periode: dua periode, tumpang tindih sejenis ditolak, Free vs Nonaktif boleh bertumpuk dengan peringatan', async () => {
    setup({ memberPeriods: {}, freeMembers: {} });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Status & Periode: ABIL' }));
    let dlg = screen.getByRole('dialog');
    const addFree = async (fy: string, fm: string, ty: string, tm: string) => {
      await u.click(within(dlg).getByRole('button', { name: /Tambah periode Gratis/ }));
      await u.selectOptions(within(dlg).getByLabelText(/Mulai gratis dari — Tahun/), fy);
      await u.selectOptions(within(dlg).getByLabelText(/Mulai gratis dari — Bulan/), fm);
      await u.selectOptions(within(dlg).getByLabelText(/Sampai dengan — Tahun/), ty);
      await u.selectOptions(within(dlg).getByLabelText(/Sampai dengan — Bulan/), tm);
      await u.click(within(dlg).getByRole('button', { name: 'Simpan Member Gratis' }));
    };
    await addFree('2023', '0', '2026', '3');   // Jan 2023 – Apr 2026
    await addFree('2026', '8', '2026', '9');   // Sep 2026 – Okt 2026
    const free = () => useAppStore.getState().appData.memberPeriods!.KRS__ABIL.free;
    expect(free()).toEqual([{ fromY: 2023, fromM: 0, toY: 2026, toM: 3 }, { fromY: 2026, fromM: 8, toY: 2026, toM: 9 }]);
    dlg = screen.getByRole('dialog');
    expect(within(dlg).getAllByRole('listitem')).toHaveLength(2);

    await addFree('2026', '3', '2026', '5');   // bertabrakan dengan Jan 2023–Apr 2026
    expect(toast.show).toHaveBeenLastCalledWith('Periode bertumpuk dengan periode lain yang sejenis', 'err');
    expect(free()).toHaveLength(2);
    await u.click(within(dlg).getByRole('button', { name: 'Batal' }));

    // Nonaktif bertumpuk dengan Free: diperbolehkan, tetapi ada peringatan
    await u.click(within(dlg).getByRole('button', { name: /Tambah periode Nonaktif/ }));
    await u.selectOptions(within(dlg).getByLabelText(/Nonaktif mulai — Tahun/), '2026');
    await u.selectOptions(within(dlg).getByLabelText(/Nonaktif mulai — Bulan/), '8');
    expect(within(dlg).getByRole('note')).toHaveTextContent(/bertumpuk dengan periode Gratis/);
    await u.click(within(dlg).getByRole('checkbox', { name: /Masih nonaktif/ }));
    await u.click(within(dlg).getByRole('button', { name: 'Simpan Periode Nonaktif' }));
    expect(useAppStore.getState().appData.memberPeriods!.KRS__ABIL.inactive).toEqual([{ fromY: 2026, fromM: 8 }]);
  });

  it('hapus periode Free lewat Confirm; legacy rekaman free dibaca sebagai satu periode (migrasi baca)', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ANA')).getByRole('button', { name: 'Status & Periode: ANA' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(/Jan 2023/)).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: /Hapus periode Gratis/ }));
    expect(useAppStore.getState().confirmDialog.icon).toBe('question');
    await runConfirm();
    const st = useAppStore.getState().appData;
    expect(st.memberPeriods!.KRS__ANA).toBeUndefined();
    expect(st.freeMembers!.KRS__ANA).toBeUndefined();
  });

  it('"Terdaftar sejak" hanya info di sheet; tombol Ubah membuka form Edit Member (satu-satunya editor)', async () => {
    setup({ memberPeriods: { KRS__ABIL: { joined: { y: 2026, m: 3 } } } });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Status & Periode: ABIL' }));
    const dlg = screen.getByRole('dialog', { name: 'Status & Periode: ABIL' });
    expect(within(dlg).getByText('Terdaftar sejak')).toBeInTheDocument();
    expect(within(dlg).getByText('Apr 2026')).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: 'Ubah' }));
    const edit = screen.getByRole('dialog');
    expect(within(edit).getByLabelText('Terdaftar sejak — Bulan')).toHaveValue('3');
  });
});

// ══════════════════════════════════════════════════════════════
describe('Form Tambah/Edit Member — "Terdaftar sejak" (F2, D6)', () => {
  it('member BARU: default bulan berjalan (boleh lebih awal) dan tersimpan di memberPeriods', async () => {
    freezeNow();
    setup({ memberPeriods: {} });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByLabelText('Terdaftar sejak — Bulan')).toHaveValue('9');
    expect(within(dlg).getByLabelText('Terdaftar sejak — Tahun')).toHaveValue('2026');
    await u.type(within(dlg).getByLabelText('Nama'), 'budi baru');
    await u.selectOptions(within(dlg).getByLabelText('Terdaftar sejak — Bulan'), '7');   // lebih awal: Agu
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(useAppStore.getState().appData.memberPeriods!['KRS__BUDI BARU']).toEqual({ joined: { y: 2026, m: 7 } });
  });

  it('pilih "Sejak awal" saat tambah → tidak ada entri periode (angka lama tidak berubah)', async () => {
    freezeNow();
    setup({ memberPeriods: {} });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Nama'), 'cici');
    await u.selectOptions(within(dlg).getByLabelText('Terdaftar sejak — Bulan'), '');
    expect(within(dlg).getByLabelText('Terdaftar sejak — Tahun')).toBeDisabled();
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(useAppStore.getState().appData.krsMembers).toContain('CICI');
    expect(useAppStore.getState().appData.memberPeriods!.KRS__CICI).toBeUndefined();
  });

  it('Edit: nilai tersimpan tampil; diganti → tersimpan; "Sejak awal" → dihapus; periode lain tetap utuh', async () => {
    setup({ memberPeriods: { KRS__ABIL: { joined: { y: 2026, m: 3 }, free: [{ fromY: 2023, fromM: 0, toY: 2023, toM: 5 }] } } });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: /Ubah member/ }));
    let dlg = screen.getByRole('dialog');
    expect(within(dlg).getByLabelText('Terdaftar sejak — Bulan')).toHaveValue('3');
    await u.selectOptions(within(dlg).getByLabelText('Terdaftar sejak — Bulan'), '5');
    await u.click(within(dlg).getByRole('button', { name: /Simpan/ }));
    expect(useAppStore.getState().appData.memberPeriods!.KRS__ABIL).toEqual({ joined: { y: 2026, m: 5 }, free: [{ fromY: 2023, fromM: 0, toY: 2023, toM: 5 }] });

    await u.click(within(rowOf('ABIL')).getByRole('button', { name: /Ubah member/ }));
    dlg = screen.getByRole('dialog');
    await u.selectOptions(within(dlg).getByLabelText('Terdaftar sejak — Bulan'), '');
    await u.click(within(dlg).getByRole('button', { name: /Simpan/ }));
    expect(useAppStore.getState().appData.memberPeriods!.KRS__ABIL).toEqual({ free: [{ fromY: 2023, fromM: 0, toY: 2023, toM: 5 }] });
  });
});

// ══════════════════════════════════════════════════════════════
describe('Entry — bulan N/A butuh konfirmasi; tanggal bayar tiap jalur (D3, D5, F4)', () => {
  it('kartu N/A: chip, redup, catatan + "Tetap catat"; setelah konfirmasi form bayar muncul dan pembayaran tercatat', async () => {
    freezeNow();
    setup();
    render(<EntryView />);
    const u = userEvent.setup();
    const adit = cardOf('ADIT');
    expect(within(adit).getByText('Nonaktif')).toBeInTheDocument();
    expect(within(cardOf('AKBAR')).getByText('Belum terdaftar')).toBeInTheDocument();
    await u.click(within(adit).getByRole('button', { name: /ADIT/ }));
    expect(within(adit).getByText(/nonaktif pada bulan ini/)).toBeInTheDocument();
    expect(within(adit).queryByRole('button', { name: '100K' })).not.toBeInTheDocument();
    await u.click(within(adit).getByRole('button', { name: 'Tetap catat' }));
    expect(useAppStore.getState().confirmDialog.icon).toBe('info');
    await runConfirm();
    await u.click(within(adit).getByRole('button', { name: '100K' }));
    expect(useAppStore.getState().appData.payments[key('ADIT')]).toBe(100);
    expect(info('ADIT')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
  });

  it('QuickPay (otomatis): tanggal = tanggal LOKAL (00:30 WIB), bukan tanggal UTC kemarin', async () => {
    freezeNow();
    setup();
    render(<EntryView />);
    const u = userEvent.setup();
    const abil = cardOf('ABIL');
    await u.click(within(abil).getByRole('button', { name: /ABIL/ }));
    await u.click(within(abil).getByRole('button', { name: '100K' }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
  });

  it('nominal diketik (otomatis): tanggal ikut tercatat — di state dan di patch granular yang dikirim ke Firebase', async () => {
    freezeNow();
    setup({}, { uid: 'u1' });
    render(<EntryView />);
    const u = userEvent.setup();
    const abil = cardOf('ABIL');
    await u.click(within(abil).getByRole('button', { name: /ABIL/ }));
    await u.type(within(abil).getByLabelText('NOMINAL'), '75{Enter}');
    expect(useAppStore.getState().appData.payments[key('ABIL')]).toBe(75);
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
    expect(db.granular).toHaveBeenCalledTimes(1);
    expect(db.granular.mock.calls[0][7]).toEqual({ infoKey: 'KRS__ABIL', dateKey: `date_${Y}_${M}`, date: '2026-10-22' });
  });

  it('batch (otomatis): semua member yang dibayar mendapat tanggal lokal; member N/A tidak ikut dipilih/dibayar', async () => {
    freezeNow();
    setup({ krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ANA', 'AYU'], memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__AYU: { tarif: 80 } } }, { uid: 'u1' });
    useAppStore.getState().setBatchPeriod(Y, M);
    render(<EntryView />);
    const u = userEvent.setup();
    await u.click(btn(/Pilih Banyak/));
    await u.click(btn(/Pilih Semua/));            // memilih semua yang layak: ABIL, AYU (ADIT/AKBAR N/A, ANA free)
    expect([...useAppStore.getState().batchSelected].sort()).toEqual(['ABIL', 'AYU']);
    await u.click(within(entryBatchSheet()).getByRole('button', { name: /^Bayar \(\d+\)/ }));
    const st = useAppStore.getState().appData;
    expect(st.payments[key('ABIL')]).toBe(100);
    expect(st.payments[key('AYU')]).toBe(80);
    expect(st.payments[key('ADIT')]).toBeUndefined();
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
    expect(info('AYU')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
    expect(info('ADIT')?.[`date_${Y}_${M}`]).toBeUndefined();
    const sent = db.persistPayment.mock.calls[0][1] as AppData;
    expect(sent.memberInfo!['KRS__ABIL'][`date_${Y}_${M}`]).toBe('2026-10-22');
  });

  it('manual: QuickPay Entry tidak menebak tanggal (kolom "Tgl Bayar" aktif); batch memakai pemilih tanggal (default hari ini)', async () => {
    freezeNow();
    setup({ krsMembers: ['ABIL', 'AYU'], memberPeriods: {}, memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__AYU: { tarif: 80 } } }, {}, { autoDate: false });
    useAppStore.getState().setBatchPeriod(Y, M);
    render(<EntryView />);
    const u = userEvent.setup();
    const abil = cardOf('ABIL');
    await u.click(within(abil).getByRole('button', { name: /ABIL/ }));
    expect(abil.querySelector('input[type="date"]')).toBeEnabled();
    await u.click(within(abil).getByRole('button', { name: '100K' }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBeUndefined();

    await u.click(btn(/Pilih Banyak/));
    await u.click(btn(/Pilih Semua/));            // AYU saja (ABIL sudah lunas)
    const picker = within(entryBatchSheet()).getByLabelText('Tgl Bayar') as HTMLInputElement;
    expect(picker.value).toBe('2026-10-22');
    fireEvent.change(picker, { target: { value: '2026-10-05' } });
    await u.click(within(entryBatchSheet()).getByRole('button', { name: /^Bayar \(\d+\)/ }));
    expect(info('AYU')?.[`date_${Y}_${M}`]).toBe('2026-10-05');
  });
});

// ══════════════════════════════════════════════════════════════
describe('Rekap — sel N/A, modal, batch, tanggal bayar', () => {
  it('sel N/A bertanda khusus (ikon + judul alasan); chip Belum tidak menghitung N/A; batch menolak sel N/A', async () => {
    setup();
    render(<RekapView />);
    const u = userEvent.setup();
    expect(rekapCell('ADIT', M).className).toMatch(/cna/);
    expect(rekapCell('ADIT', M).querySelector('svg')).toBeTruthy();
    expect(rekapCell('ADIT', M).getAttribute('title')).toMatch(/Nonaktif/);
    expect(rekapCell('AKBAR', M).getAttribute('title')).toMatch(/Belum terdaftar/);
    expect(rekapCell('ABIL', M).className).toMatch(/cb/);                     // belum biasa tetap merah
    const chips = screen.getByRole('group', { name: 'Filter status pembayaran' });
    expect(within(chips).getByRole('button', { name: /Belum/ })).toHaveTextContent('1');   // hanya ABIL
    expect(within(chips).getByRole('button', { name: /Semua/ })).toHaveTextContent('4');
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(rekapCell('ADIT', M));
    expect(screen.queryByTestId('rekap-batch-sheet')).not.toBeInTheDocument();
    await u.click(rekapCell('ABIL', M));
    expect(within(screen.getByTestId('rekap-batch-sheet')).getByText(/1 Member Dipilih/)).toBeInTheDocument();
  });

  it('total tahun dan kolom tetap jumlah pembayaran: pembayaran di bulan nonaktif tetap dihitung', () => {
    setup({ payments: { [key('ADIT')]: 90, [key('ABIL')]: 100 } });
    render(<RekapView />);
    expect(rekapCell('ADIT', M).textContent).toBe('90.000');                 // dibayar → sel bayar biasa (D3)
    expect(rekapCell('ADIT', M).className).not.toMatch(/cna/);
  });

  it('modal sel N/A: catatan + "Tetap catat" (Confirm) lalu QuickPay mencatat pembayaran + tanggal lokal', async () => {
    freezeNow();
    setup();
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(rekapCell('ADIT', M));
    let dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText(/nonaktif pada bulan ini/)).toBeInTheDocument();
    expect(within(dlg).queryByRole('button', { name: 'Simpan' })).not.toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: 'Tetap catat' }));
    await runConfirm();
    dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: '100K ★' }));
    expect(useAppStore.getState().appData.payments[key('ADIT')]).toBe(100);
    expect(info('ADIT')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
  });

  it('QuickPay Rekap (otomatis): tanggal LOKAL 00:30 WIB; nominal diketik juga mencatat tanggal (granular)', async () => {
    freezeNow();
    setup({}, { uid: 'u1' });
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(rekapCell('ABIL', M));
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: '100K ★' }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-22');

    await u.click(rekapCell('ABIL', M - 1));
    await u.type(within(screen.getByRole('dialog')).getByLabelText('Nominal'), '75');
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Simpan' }));
    expect(useAppStore.getState().appData.payments[key('ABIL', Y, M - 1)]).toBe(75);
    expect(info('ABIL')?.[`date_${Y}_${M - 1}`]).toBe('2026-10-22');
    const patchArg = db.granular.mock.calls.at(-1)![7];
    expect(patchArg).toEqual({ infoKey: 'KRS__ABIL', dateKey: `date_${Y}_${M - 1}`, date: '2026-10-22' });
  });

  it('mode manual: modal Rekap punya pemilih tanggal (default hari ini); QuickPay dan ketikan memakai tanggal pilihan', async () => {
    freezeNow();
    setup({}, {}, { autoDate: false });
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(rekapCell('ABIL', M));
    let dlg = screen.getByRole('dialog');
    const picker = within(dlg).getByLabelText('Tgl Bayar') as HTMLInputElement;
    expect(picker.value).toBe('2026-10-22');
    fireEvent.change(picker, { target: { value: '2026-10-05' } });
    await u.click(within(dlg).getByRole('button', { name: '100K ★' }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-05');

    await u.click(rekapCell('ABIL', M - 1));                                  // modal baru: kembali ke hari ini
    dlg = screen.getByRole('dialog');
    expect((within(dlg).getByLabelText('Tgl Bayar') as HTMLInputElement).value).toBe('2026-10-22');
  });

  it('batch Rekap: otomatis = tanggal lokal; manual = pemilih di sheet batch', async () => {
    freezeNow();
    setup({ krsMembers: ['ABIL', 'AYU'], memberPeriods: {}, memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__AYU: { tarif: 80 } } });
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(rekapCell('ABIL', M)); await u.click(rekapCell('AYU', M));
    await u.click(within(screen.getByTestId('rekap-batch-sheet')).getByRole('button', { name: /Tandai Lunas Semua/ }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
    expect(info('AYU')?.[`date_${Y}_${M}`]).toBe('2026-10-22');
  });

  it('batch Rekap manual: pemilih tanggal di sheet; tanggal yang dipilih ditulis untuk semua yang dibayar', async () => {
    freezeNow();
    setup({ krsMembers: ['ABIL', 'AYU'], memberPeriods: {}, memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__AYU: { tarif: 80 } } }, {}, { autoDate: false });
    render(<RekapView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Pilih Banyak/ }));
    await u.click(rekapCell('ABIL', M)); await u.click(rekapCell('AYU', M));
    const sheet = screen.getByTestId('rekap-batch-sheet');
    const picker = within(sheet).getByLabelText('Tgl Bayar') as HTMLInputElement;
    expect(picker.value).toBe('2026-10-22');
    fireEvent.change(picker, { target: { value: '2026-10-07' } });
    await u.click(within(sheet).getByRole('button', { name: /Tandai Lunas Semua/ }));
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBe('2026-10-07');
    expect(info('AYU')?.[`date_${Y}_${M}`]).toBe('2026-10-07');
  });

  it('Riwayat: bulan sebelum terdaftar tampil netral dan tidak masuk penyebut "x/n bulan lunas"', async () => {
    setup({ payments: { [key('ABIL')]: 100 } });
    render(<RekapView />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'AKBAR' }));
    const dlg = screen.getByRole('dialog', { name: /AKBAR/ });
    expect(within(dlg).getAllByText('Belum terdaftar')).toHaveLength(10);    // Jan–Okt 2026
    expect(within(dlg).getByText(/0\/2 bulan lunas/)).toBeInTheDocument();    // Nov–Des terhitung
  });
});

// ══════════════════════════════════════════════════════════════
describe('Tunggakan — Free multi-periode', () => {
  it('mode Gratis menampilkan periode Free yang mencakup bulan acuan', async () => {
    setup({
      freeMembers: {},
      memberPeriods: { KRS__ANA: { free: [{ fromY: 2023, fromM: 0, toY: 2026, toM: 3 }, { fromY: 2026, fromM: 8, toY: 2026, toM: 9 }] } },
    });
    render(<TunggakanView />);
    const u = userEvent.setup();
    await u.click(within(screen.getByRole('group', { name: 'Mode tunggakan' })).getByRole('button', { name: /Gratis/ }));
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('ANA');
    expect(screen.getByTestId('tunggakan-card')).toHaveTextContent('Dari Sep 2026 s/d Okt 2026');
  });
});

// ══════════════════════════════════════════════════════════════
describe('Entry (manual) nominal diketik dan GlobalSearch', () => {
  it('manual: nominal diketik tidak menulis tanggal otomatis (kolom "Tgl Bayar" yang menentukan)', async () => {
    freezeNow();
    setup({ memberPeriods: {} }, { uid: 'u1' }, { autoDate: false });
    render(<EntryView />);
    const u = userEvent.setup();
    const abil = cardOf('ABIL');
    await u.click(within(abil).getByRole('button', { name: /ABIL/ }));
    await u.type(within(abil).getByLabelText('NOMINAL'), '75{Enter}');
    expect(useAppStore.getState().appData.payments[key('ABIL')]).toBe(75);
    expect(info('ABIL')?.[`date_${Y}_${M}`]).toBeUndefined();
    expect(db.granular.mock.calls[0][7]).toBeUndefined();
  });

  it('GlobalSearch: member N/A tampil dengan labelnya (bukan "Belum")', async () => {
    setup();
    render(<GlobalSearch open onClose={() => {}} />);
    await userEvent.setup().type(screen.getByRole('textbox', { name: 'Cari member' }), 'ad');
    const dlg = screen.getByRole('dialog', { name: 'Cari Member' });
    expect(within(dlg).getByText('Nonaktif')).toBeInTheDocument();
    expect(within(dlg).queryByText('Belum')).not.toBeInTheDocument();
  });
});
