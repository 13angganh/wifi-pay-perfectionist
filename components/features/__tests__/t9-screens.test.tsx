// components/features/__tests__/t9-screens.test.tsx — REDESAIN T9 (Member + Grafik + FreeMemberModal)
// Render nyata layar produksi: semua perilaku zip + A20–A26 + PERBAIKAN ZONA KUSTOM (zona kustom = KRS/SLK).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const toast = vi.hoisted(() => ({ show: vi.fn(), undo: vi.fn() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const db = vi.hoisted(() => ({ persistPayment: vi.fn(), saveDB: vi.fn() }));

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({
  useRouter: () => nav,
  usePathname: () => '/members',
}));
vi.mock('@/components/ui/Toast', () => ({ showToast: toast.show, showToastUndo: toast.undo, default: () => null }));
vi.mock('@/lib/db', async (orig) => ({ ...(await orig<typeof import('@/lib/db')>()), persistPayment: db.persistPayment, saveDB: db.saveDB }));
vi.mock('react-chartjs-2', () => {
  const mk = (kind: string) => function Mock(props: { data: unknown }) {
    return <div data-testid={`chart-${kind}`} data-chart={JSON.stringify(props.data)} />;
  };
  return { Bar: mk('bar'), Line: mk('line'), Doughnut: mk('doughnut') };
});

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { rp } from '@/lib/helpers';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import MembersView from '@/components/features/members/MembersView';
import GrafikView from '@/components/features/grafik/GrafikView';

const Y = 2026;
const M = 9; // Oktober

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ANA'],
    slkMembers: ['SARI'],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
    memberInfo: {
      KRS__ABIL: { id: 'KRS-001', ip: '192.168.1.10', tarif: 100 },
      KRS__ADIT: { id: 'KRS-002', ip: 'http://10.0.0.2', notes: 'catatan' },
      KRS__AKBAR: { id: 'KRS-003' },
      TIMUR__BUDI: { id: 'TMR-001', ip: '192.168.9.1', tarif: 60 },
    },
    payments: {
      [`KRS__ABIL__${Y}__${M}`]: 100, [`KRS__ABIL__${Y}__${M - 1}`]: 100,
      [`TIMUR__BUDI__${Y}__${M}`]: 60,
    },
    freeMembers: { KRS__ANA: { active: true, fromYear: 2023, fromMonth: 0 } },
    deletedMembers: {},
    ...over,
  };
}

function setup(data: Partial<AppData> = {}, state: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: makeData(data),
    uid: '', userEmail: 'a@b.c',
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] },
    newMemberZone: 'KRS', memberTab: 'active', search: '', membersLocked: false,
    selYear: Y, selMonth: M, syncStatus: 'ok', activeZone: 'KRS', theme: 'dark',
    globalLocked: false, lockedEntries: {},
    ...state,
  } as never);
}

const rows = () => screen.getAllByTestId('member-row').map(r => r.getAttribute('data-name'));
const rowOf = (n: string) => screen.getAllByTestId('member-row').find(r => r.getAttribute('data-name') === n)!;
const btn = (name: string | RegExp) => screen.getByRole('button', { name });

beforeEach(() => { toast.show.mockClear(); db.persistPayment.mockReset(); db.persistPayment.mockResolvedValue(undefined); db.saveDB.mockReset(); db.saveDB.mockResolvedValue(undefined); nav.push.mockClear(); });
afterEach(cleanup);

// ══════════════════════════════════════════════════════════════
describe('Member — tampilan', () => {
  it('zona mengikuti tab Header (tanpa tab zona ganda di halaman); daftar zona aktif terurut nama; nomor urut', () => {
    setup();
    render(<MembersView />);
    expect(screen.queryByRole('tab', { name: /KRS/ })).not.toBeInTheDocument();
    expect(rows()).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
    expect(within(rowOf('ADIT')).getByText('2. ADIT')).toBeInTheDocument();
  });

  it('A20: badge status bulan acuan + chip filter dengan hitungan', async () => {
    setup();
    render(<MembersView />);
    expect(within(rowOf('ABIL')).getByText('Lunas')).toBeInTheDocument();
    expect(within(rowOf('ADIT')).getByText('Belum')).toBeInTheDocument();
    expect(within(rowOf('ANA')).getByText('Gratis')).toBeInTheDocument();
    const chips = screen.getByRole('group', { name: 'Filter status pembayaran' });
    expect(within(chips).getByRole('button', { name: /Semua/ })).toHaveTextContent('4');
    expect(within(chips).getByRole('button', { name: /Lunas/ })).toHaveTextContent('1');
    expect(within(chips).getByRole('button', { name: /Belum/ })).toHaveTextContent('2');
    expect(within(chips).getByRole('button', { name: /Gratis/ })).toHaveTextContent('1');
    await userEvent.setup().click(within(chips).getByRole('button', { name: /Belum/ }));
    expect(rows()).toEqual(['ADIT', 'AKBAR']);
  });

  it('A21: cari lewat nama, ID, dan IP', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    const q = screen.getByTestId('members-search');
    await u.type(q, 'krs-003');
    expect(rows()).toEqual(['AKBAR']);
    await u.clear(q); await u.type(q, '10.0.0.2');
    expect(rows()).toEqual(['ADIT']);
    await u.clear(q); await u.type(q, 'ana');
    expect(rows()).toEqual(['ANA']);
    expect(useAppStore.getState().search).toBe('ana');
  });

  it('hitungan memuat nama zona dan bulan acuan; urutkan 6 mode', async () => {
    setup();
    render(<MembersView />);
    expect(screen.getByTestId('members-count')).toHaveTextContent('4 pelanggan · KRS · Okt 2026');
    await userEvent.setup().selectOptions(screen.getByLabelText('Urutkan'), 'name-desc');
    expect(rows()).toEqual(['ANA', 'AKBAR', 'ADIT', 'ABIL']);
    await userEvent.setup().selectOptions(screen.getByLabelText('Urutkan'), 'id-desc');
    expect(rows()[0]).toBe('AKBAR'); // KRS-003 terbesar
  });

  it('kartu: chip ID, tarif, ikon catatan (A23 indikator), tautan IP http dipertahankan dan IP biasa diberi http://', () => {
    setup();
    render(<MembersView />);
    expect(within(rowOf('ABIL')).getByText('KRS-001')).toBeInTheDocument();
    expect(within(rowOf('ABIL')).getByText(/100/)).toBeInTheDocument();
    expect(within(rowOf('ADIT')).getByLabelText('Member ini punya catatan')).toBeInTheDocument();
    expect(within(rowOf('ABIL')).getByRole('link')).toHaveAttribute('href', 'http://192.168.1.10');
    expect(within(rowOf('ADIT')).getByRole('link')).toHaveAttribute('href', 'http://10.0.0.2');
    expect(within(rowOf('AKBAR')).queryByRole('link')).not.toBeInTheDocument();
  });

  it('A22: salin IP menulis ke clipboard + toast; clipboard gagal = toast galat', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Salin IP: ABIL' }));
    expect(await navigator.clipboard.readText()).toBe('192.168.1.10');
    expect(toast.show).toHaveBeenCalledWith('IP disalin');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('x')) }, configurable: true });
    fireEvent.click(within(rowOf('ABIL')).getByRole('button', { name: 'Salin IP: ABIL' }));
    await act(async () => { await Promise.resolve(); });
    expect(toast.show).toHaveBeenCalledWith('Gagal menyalin IP', 'err');
  });

  it('ketuk bagian atas kartu membuka RiwayatModal untuk member itu', async () => {
    setup();
    render(<MembersView />);
    await userEvent.setup().click(within(rowOf('ABIL')).getByRole('button', { name: /Lihat riwayat: ABIL/ }));
    expect(useAppStore.getState().riwayatName).toBe('ABIL');
    expect(useAppStore.getState().riwayatZone).toBe('KRS');
    expect(screen.getByRole('dialog', { name: /ABIL/ })).toBeInTheDocument();
  });

  it('keadaan: kosong (+tombol tambah), tidak ditemukan (+reset), memuat, gagal', async () => {
    setup({ zoneMembers: { TIMUR: [] } }, { activeZone: 'TIMUR' });
    const { unmount } = render(<MembersView />);
    expect(screen.getByText('Belum ada member')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tambah Member' }).length).toBeGreaterThanOrEqual(1);
    unmount();

    setup({}, { search: 'zzzz' });
    const r2 = render(<MembersView />);
    expect(screen.getByText('Member tidak ditemukan')).toBeInTheDocument();
    await userEvent.setup().click(btn('Atur Ulang Filter'));
    expect(rows()).toHaveLength(4);
    r2.unmount();

    setup({ krsMembers: [], slkMembers: [], zoneMembers: {} }, { syncStatus: 'loading' });
    const r3 = render(<MembersView />);
    expect(screen.queryByText('Belum ada member')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-row')).not.toBeInTheDocument();
    r3.unmount();

    setup({ krsMembers: [], slkMembers: [], zoneMembers: {} }, { syncStatus: 'err' });
    render(<MembersView />);
    expect(screen.getByText('Gagal memuat data')).toBeInTheDocument();
    expect(btn('Coba Lagi')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════
describe('Member — kunci, zona, tab', () => {
  it('kunci: status + tombol aksi mengikuti pola Header; terkunci menyembunyikan tambah dan semua aksi', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    expect(screen.getByText('Terbuka')).toBeInTheDocument();
    expect(btn('Tambah Member')).toBeInTheDocument();
    expect(within(rowOf('ABIL')).getByRole('button', { name: 'Ubah member: ABIL' })).toBeInTheDocument();
    await u.click(btn('Daftar member sedang terbuka. Ketuk untuk mengunci.'));
    expect(useAppStore.getState().membersLocked).toBe(true);
    expect(screen.getByText('Terkunci')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah Member' })).not.toBeInTheDocument();
    expect(within(rowOf('ABIL')).queryByRole('button', { name: /Ubah member/ })).not.toBeInTheDocument();
    expect(within(rowOf('ABIL')).queryByRole('button', { name: /Hapus member/ })).not.toBeInTheDocument();
    expect(within(rowOf('ABIL')).queryByRole('button', { name: /member gratis/ })).not.toBeInTheDocument();
  });

  it('ganti zona di Header (termasuk kustom) mereset cari + tab ke Aktif dan memakai daftar zona itu', async () => {
    setup({}, { search: 'ab', memberTab: 'deleted' });
    render(<MembersView />);
    act(() => { useAppStore.setState({ activeZone: 'TIMUR' }); });
    expect(useAppStore.getState().search).toBe('');
    expect(useAppStore.getState().memberTab).toBe('active');
    expect(rows()).toEqual(['BUDI', 'CITRA']);
    expect(within(rowOf('BUDI')).getByText('TMR-001')).toBeInTheDocument();
  });

  it('zona yang sudah disembunyikan jatuh ke zona pertama yang tampil', () => {
    setup({}, { activeZone: 'TIMUR', settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: ['TIMUR'] } });
    render(<MembersView />);
    expect(rows()).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
  });
});

// ══════════════════════════════════════════════════════════════
describe('Member — Tambah / Edit (sheet)', () => {
  it('Tambah: sheet bertanda zona; nama otomatis huruf besar; ID/IP/tarif/catatan (A23) tersimpan; sheet menutup', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('KRS')).toBeInTheDocument();
    await u.type(within(dlg).getByLabelText('Nama'), 'budi baru');
    await u.type(within(dlg).getByLabelText('ID Pelanggan'), 'KRS-099');
    await u.type(within(dlg).getByLabelText(/Tarif/), '120');
    await u.type(within(dlg).getByLabelText('IP / Tautan Router'), '10.9.9.9');
    await u.type(within(dlg).getByLabelText('Catatan'), 'pindahan');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    const s = useAppStore.getState().appData;
    expect(s.krsMembers).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA', 'BUDI BARU']);
    expect(s.memberInfo!['KRS__BUDI BARU']).toEqual({ id: 'KRS-099', ip: '10.9.9.9', tarif: 120, notes: 'pindahan' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toast.show).toHaveBeenCalledWith('BUDI BARU ditambahkan!');
  });

  it('Tambah: Enter di kolom nama menyimpan; kosong/duplikat/karakter terlarang menahan sheet dengan galat inline + toast', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    const nm = within(dlg).getByLabelText('Nama');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(toast.show).toHaveBeenLastCalledWith('Nama wajib diisi', 'err');
    await u.type(nm, 'abil');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useAppStore.getState().appData.krsMembers).toHaveLength(4);
    await u.clear(nm); await u.type(nm, 'a/b');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(useAppStore.getState().appData.krsMembers).toHaveLength(4);
    await u.clear(nm); await u.type(nm, 'zaki{Enter}');
    expect(useAppStore.getState().appData.krsMembers).toContain('ZAKI');
  });

  it('PERBAIKAN ZONA KUSTOM: tambah di TIMUR hanya menulis zoneMembers.TIMUR (KRS/SLK utuh)', async () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Nama'), 'dewi');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke TIMUR/ }));
    const s = useAppStore.getState().appData;
    expect(s.zoneMembers!.TIMUR).toEqual(['BUDI', 'CITRA', 'DEWI']);
    expect(s.krsMembers).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
    expect(s.slkMembers).toEqual(['SARI']);
    expect(s.memberInfo!.TIMUR__DEWI).toBeDefined();
  });

  it('Edit: sheet terisi data; ganti nama memindahkan data bayar; kosongkan tarif/catatan = dihapus (nama sama)', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ADIT')).getByRole('button', { name: 'Ubah member: ADIT' }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByLabelText('Nama')).toHaveValue('ADIT');
    expect(within(dlg).getByLabelText('Catatan')).toHaveValue('catatan');
    await u.clear(within(dlg).getByLabelText('Catatan'));
    await u.click(within(dlg).getByRole('button', { name: /Simpan Perubahan/ }));
    expect(useAppStore.getState().appData.memberInfo!.KRS__ADIT).toEqual({ id: 'KRS-002', ip: 'http://10.0.0.2' });

    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Ubah member: ABIL' }));
    const d2 = screen.getByRole('dialog');
    await u.clear(within(d2).getByLabelText('Nama')); await u.type(within(d2).getByLabelText('Nama'), 'zaki');
    await u.click(within(d2).getByRole('button', { name: /Simpan Perubahan/ }));
    const s = useAppStore.getState().appData;
    expect(s.krsMembers).toEqual(['ADIT', 'AKBAR', 'ANA', 'ZAKI']);
    expect(s.payments[`KRS__ZAKI__${Y}__${M}`]).toBe(100);
    expect(s.payments[`KRS__ABIL__${Y}__${M}`]).toBeUndefined();
  });

  it('PERBAIKAN ZONA KUSTOM: edit/rename di TIMUR memindahkan data bayar dan tidak menyentuh KRS/SLK', async () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('BUDI')).getByRole('button', { name: 'Ubah member: BUDI' }));
    const dlg = screen.getByRole('dialog');
    await u.clear(within(dlg).getByLabelText('Nama')); await u.type(within(dlg).getByLabelText('Nama'), 'budiman');
    await u.click(within(dlg).getByRole('button', { name: /Simpan Perubahan/ }));
    const s = useAppStore.getState().appData;
    expect(s.zoneMembers!.TIMUR).toEqual(['BUDIMAN', 'CITRA']);
    expect(s.payments[`TIMUR__BUDIMAN__${Y}__${M}`]).toBe(60);
    expect(s.krsMembers).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
    expect(s.slkMembers).toEqual(['SARI']);
  });

  it('gagal simpan ke server: sheet tetap terbuka, data dikembalikan (rollback), toast galat', async () => {
    db.persistPayment.mockRejectedValueOnce(new Error('PERMISSION_DENIED'));
    setup({}, { uid: 'u1' });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Member'));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Nama'), 'gagal');
    await u.click(within(dlg).getByRole('button', { name: /Tambah ke KRS/ }));
    expect(db.persistPayment).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(useAppStore.getState().appData.krsMembers).not.toContain('GAGAL');
    expect(toast.show).toHaveBeenLastCalledWith('Gagal tersimpan ke server, periksa koneksi', 'err');
    expect(useAppStore.getState().syncStatus).toBe('err');
  });
});

// ══════════════════════════════════════════════════════════════
describe('Member — hapus, Recycle Bin, pulihkan', () => {
  it('hapus lewat Confirm (ikon trash) → masuk Recycle Bin dengan pembayarannya; tab Terhapus menampilkan; Pulihkan mengembalikan', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ABIL')).getByRole('button', { name: 'Hapus member: ABIL' }));
    const cd = useAppStore.getState().confirmDialog;
    expect(cd.open).toBe(true);
    expect(cd.icon).toBe('trash');
    await act(async () => { cd.cb?.(); await Promise.resolve(); });
    let s = useAppStore.getState().appData;
    expect(s.krsMembers).toEqual(['ADIT', 'AKBAR', 'ANA']);
    expect(s.deletedMembers.KRS__ABIL.payments[`KRS__ABIL__${Y}__${M}`]).toBe(100);
    expect(s.payments[`KRS__ABIL__${Y}__${M}`]).toBeUndefined();
    expect(toast.show).toHaveBeenLastCalledWith('ABIL dihapus', 'err');

    await u.click(screen.getByRole('tab', { name: /Hapus/ }));
    expect(screen.getByTestId('deleted-row')).toHaveTextContent('ABIL');
    await u.click(btn('Pulihkan'));
    s = useAppStore.getState().appData;
    expect(s.krsMembers).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
    expect(s.payments[`KRS__ABIL__${Y}__${M}`]).toBe(100);
    expect(s.deletedMembers).toEqual({});
    expect(screen.getByText('Tempat Sampah Kosong')).toBeInTheDocument();
  });

  it('hapus permanen: Confirm (trash) lalu entri bin hilang', async () => {
    setup({ deletedMembers: { KRS__LAMA: { zone: 'KRS', name: 'LAMA', deletedAt: 1700000000000, payments: { a: 1, b: 2 } } } }, { memberTab: 'deleted' });
    render(<MembersView />);
    expect(screen.getByTestId('deleted-row')).toHaveTextContent('2 data');
    await userEvent.setup().click(btn('Hapus permanen LAMA'));
    expect(useAppStore.getState().confirmDialog.icon).toBe('trash');
    await act(async () => { useAppStore.getState().confirmDialog.cb?.(); await Promise.resolve(); });
    expect(useAppStore.getState().appData.deletedMembers).toEqual({});
  });

  it('PERBAIKAN ZONA KUSTOM: hapus dan pulihkan member TIMUR hanya mengubah zoneMembers.TIMUR', async () => {
    setup({}, { activeZone: 'TIMUR' });
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('CITRA')).getByRole('button', { name: 'Hapus member: CITRA' }));
    await act(async () => { useAppStore.getState().confirmDialog.cb?.(); await Promise.resolve(); });
    let s = useAppStore.getState().appData;
    expect(s.zoneMembers!.TIMUR).toEqual(['BUDI']);
    expect(s.slkMembers).toEqual(['SARI']);
    expect(s.deletedMembers.TIMUR__CITRA.zone).toBe('TIMUR');
    await u.click(screen.getByRole('tab', { name: /Hapus/ }));
    await u.click(btn('Pulihkan'));
    s = useAppStore.getState().appData;
    expect(s.zoneMembers!.TIMUR).toEqual(['BUDI', 'CITRA']);
    expect(s.krsMembers).toEqual(['ABIL', 'ADIT', 'AKBAR', 'ANA']);
  });
});

// ══════════════════════════════════════════════════════════════
describe('FreeMemberModal — sheet', () => {
  // REDESAIN T12 (D1, D7): modal Free diperluas menjadi SATU sheet "Status & Periode" (Free multi-periode + Nonaktif).
  // Dua test di bawah adalah test T9 yang SAMA (Set Free / validasi tanggal / Kembalikan Berbayar lewat Confirm) dengan
  // jalur yang disesuaikan: pintu = ikon hadiah → sheet → "Tambah/Ubah periode Free"; data kini di memberPeriods
  // (freeMembers lama dimigrasikan dan tidak ditulis lagi). Kekuatan asersi tidak dikurangi.
  it('Set Free: judul "Status & Periode: nama"; Simpan menulis memberPeriods[zona__nama].free (bukan freeMembers); tombol kembalikan hanya bila mengubah periode yang sudah ada', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('ADIT')).getByRole('button', { name: 'Status & Periode: ADIT' }));
    const dlg = screen.getByRole('dialog', { name: 'Status & Periode: ADIT' });
    await u.click(within(dlg).getByRole('button', { name: /Tambah periode Gratis/ }));
    expect(within(dlg).queryByRole('button', { name: /Kembalikan Berbayar/ })).not.toBeInTheDocument();
    await u.click(within(dlg).getByRole('checkbox', { name: /selamanya/i }));
    await u.click(within(dlg).getByRole('button', { name: 'Simpan Member Gratis' }));
    const st = useAppStore.getState().appData;
    const f = st.memberPeriods!.KRS__ADIT.free!;
    expect(f).toHaveLength(1);
    expect(f[0]).toEqual({ fromY: Y, fromM: M });          // terbuka: tanpa toY/toM
    expect(st.freeMembers!.KRS__ADIT).toBeUndefined();     // rekaman lama tidak ditulis lagi
    // sheet kembali ke daftar dan memperlihatkan periode yang baru disimpan
    expect(within(screen.getByRole('dialog')).getByText(/selamanya/)).toBeInTheDocument();
  });

  it('tanggal selesai sebelum mulai ditolak; periode Free yang ada: Kembalikan Berbayar lewat Confirm (question)', async () => {
    setup();
    render(<MembersView />);
    const u = userEvent.setup();
    await u.click(within(rowOf('AKBAR')).getByRole('button', { name: 'Status & Periode: AKBAR' }));
    let dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: /Tambah periode Gratis/ }));
    await u.selectOptions(within(dlg).getByLabelText(/Mulai gratis dari — Tahun/), '2025');
    await u.selectOptions(within(dlg).getByLabelText(/Sampai dengan — Tahun/), '2024');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan Member Gratis' }));
    expect(toast.show).toHaveBeenLastCalledWith('Tanggal selesai harus setelah tanggal mulai', 'err');
    expect(useAppStore.getState().appData.memberPeriods!.KRS__AKBAR).toBeUndefined();
    await u.click(within(dlg).getByRole('button', { name: 'Batal' }));
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tutup' }));

    await u.click(within(rowOf('ANA')).getByRole('button', { name: 'Status & Periode: ANA' }));
    dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: /Ubah periode Gratis/ }));
    await u.click(within(dlg).getByRole('button', { name: /Kembalikan Berbayar/ }));
    expect(useAppStore.getState().confirmDialog.icon).toBe('question');
    await act(async () => { useAppStore.getState().confirmDialog.cb?.(); await Promise.resolve(); });
    const st = useAppStore.getState().appData;
    expect(st.memberPeriods!.KRS__ANA).toBeUndefined();
    expect(st.freeMembers!.KRS__ANA).toBeUndefined();      // rekaman lama dikonsumsi, tidak bisa hidup lagi lewat migrasi
  });
});

// ══════════════════════════════════════════════════════════════
// GRAFIK
// ══════════════════════════════════════════════════════════════
function grafikData(over: Partial<AppData> = {}): AppData {
  const payments: Record<string, number> = {};
  for (let m = 0; m <= 9; m++) payments[`KRS__A__${Y}__${m}`] = 100;       // KRS: A 10 bln × 100
  payments[`KRS__B__${Y}__8`] = 50; payments[`KRS__B__${Y}__9`] = 50;       // KRS: B 2 bln × 50
  payments[`SLK__S__${Y}__8`] = 70; payments[`SLK__S__${Y}__9`] = 70;       // SLK 2 × 70
  payments[`TIMUR__T__${Y}__9`] = 60;                                       // TIMUR
  for (let m = 0; m < 3; m++) payments[`KRS__A__${Y - 1}__${m}`] = 100;     // KRS tahun lalu 300
  return makeData({
    krsMembers: ['A', 'B'], slkMembers: ['S'], zoneMembers: { TIMUR: ['T'] },
    memberInfo: {}, freeMembers: {}, payments, ...over,
  });
}

const chartsIn = (testId: string) => within(screen.getByTestId(testId)).getAllByTestId(/^chart-/);
const chartJson = (el: HTMLElement) => JSON.parse(el.getAttribute('data-chart') || '{}');

describe('Grafik — tab Pendapatan (A24)', () => {
  it('3 tab; kartu Total tahun + rata-rata + persen VS tahun lalu (sama di kedua kartu)', () => {
    setup(grafikData() as never);
    useAppStore.setState({ appData: grafikData() });
    render(<GrafikView />);
    expect(screen.getByRole('tab', { name: /Pendapatan/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Pembayaran/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Pelanggan/ })).toBeInTheDocument();
    expect(screen.getByText(rp(1100))).toBeInTheDocument();                    // total KRS 2026
    expect(screen.getByText(rp(300))).toBeInTheDocument();                     // VS tahun lalu = total 2025 KRS
    expect(screen.getAllByText(/267%/)).toHaveLength(2);                       // (1100-300)/300 muncul di KEDUA kartu
  });

  it('grafik perbandingan = SATU garis per zona aktif (bawaan + kustom) + TOTAL, judul dinamis', () => {
    useAppStore.setState({ appData: grafikData() }); setup(grafikData());
    render(<GrafikView />);
    const compare = chartJson(chartsIn('chart-compare')[0]);
    expect(compare.datasets.map((d: { label: string }) => d.label)).toEqual(['KRS', 'SLK', 'TIMUR', 'TOTAL']);
    expect(compare.datasets[0].data[9]).toBe(150);
    expect(compare.datasets[1].data[9]).toBe(70);
    expect(compare.datasets[2].data[9]).toBe(60);
    expect(compare.datasets[3].data[9]).toBe(280);
    expect(screen.getByText('KRS vs SLK vs TIMUR 2026')).toBeInTheDocument();
  });

  it('PERBAIKAN ZONA KUSTOM: zona terpilih TIMUR memakai total anggota TIMUR (bukan SLK); bulanan + proyeksi', () => {
    setup(grafikData(), { activeZone: 'TIMUR' });
    render(<GrafikView />);
    expect(screen.getAllByText(rp(60)).length).toBeGreaterThan(0);
    const monthly = chartJson(chartsIn('chart-monthly')[0]);
    expect(monthly.datasets[0].data).toHaveLength(13);
    expect(monthly.datasets[0].data[9]).toBe(60);
    expect(screen.getByText(/BULANAN.*TIMUR|Bulanan.*TIMUR/i)).toBeInTheDocument();
  });

  it('proyeksi = rata-rata 3 bulan terakhir terisi; batang ke-13 = proyeksi', () => {
    setup(grafikData());
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(Y, M, 15));
    render(<GrafikView />);
    const monthly = chartJson(chartsIn('chart-monthly')[0]);
    // KRS Jul 100, Agu 150, Sep 150 → bulan Okt (9): 100+... rata-rata 3 terakhir terisi sampai Okt = (150+150+150)/3? hitung dari data nyata
    const last3 = monthly.datasets[0].data.slice(0, 10).filter((v: number) => v > 0).slice(-3);
    expect(monthly.datasets[0].data[12]).toBe(Math.round(last3.reduce((a: number, b: number) => a + b, 0) / 3));
    expect(screen.getByTestId('card-projection')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('dua periode: pilih periode mengubah total dan persen selisih', async () => {
    setup(grafikData());
    render(<GrafikView />);
    const u = userEvent.setup();
    await u.selectOptions(screen.getByLabelText('Periode 1 — Tahun'), String(Y));
    await u.selectOptions(screen.getByLabelText('Periode 1 — Bulan'), '9');
    await u.selectOptions(screen.getByLabelText('Periode 2 — Tahun'), String(Y));
    await u.selectOptions(screen.getByLabelText('Periode 2 — Bulan'), '8');
    expect(screen.getByTestId('period1-total')).toHaveTextContent(rp(150));
    expect(screen.getByTestId('period2-total')).toHaveTextContent(rp(150));
    await u.selectOptions(screen.getByLabelText('Periode 2 — Bulan'), '0');
    expect(screen.getByTestId('period2-total')).toHaveTextContent(rp(100));
    expect(screen.getByTestId('period-diff')).toHaveTextContent('50%');
  });

  it('2 sampai 5 zona: jumlah garis perbandingan = zona aktif + TOTAL', () => {
    for (let n = 1; n <= 3; n++) {
      const custom = Array.from({ length: n }, (_, i) => ({ key: `Z${i + 3}`, name: `Zona ${i + 3}`, color: '#10B981' }));
      const zoneMembers = Object.fromEntries(custom.map(c => [c.key, [`${c.key}-m`]]));
      setup(grafikData({ zoneMembers }), {
        settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: custom, hiddenZones: [] },
      });
      const { unmount } = render(<GrafikView />);
      expect(chartJson(chartsIn('chart-compare')[0]).datasets).toHaveLength(2 + n + 1);
      unmount();
    }
  });

  it('kosong → EmptyState; gagal tanpa data → Coba Lagi', () => {
    setup(grafikData({ zoneMembers: { TIMUR: [] } }), { activeZone: 'TIMUR' });
    const { unmount } = render(<GrafikView />);
    expect(screen.getByText('Belum Ada Data Grafik')).toBeInTheDocument();
    unmount();
    setup(grafikData({ krsMembers: [], slkMembers: [], zoneMembers: {} }), { syncStatus: 'err' });
    render(<GrafikView />);
    expect(screen.getByText('Gagal memuat data')).toBeInTheDocument();
  });
});

describe('Grafik — tab Pembayaran dan Pelanggan (A25, A26)', () => {
  it('Pembayaran: KPI Transaksi bulan terpilih + donat lunas/belum/gratis + Transaksi per Bulan', async () => {
    setup(grafikData({ freeMembers: { KRS__B: { active: true, fromYear: Y, fromMonth: 9 } } }));
    render(<GrafikView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: /Pembayaran/ }));
    await u.selectOptions(screen.getByLabelText('Bulan'), '9');
    expect(screen.getByText(/Transaksi · Okt 2026/)).toBeInTheDocument();
    const donut = chartJson(chartsIn('chart-composition')[0]);
    expect(donut.datasets[0].data).toEqual([1, 0, 1]);                          // A lunas, B gratis
    const bars = chartJson(chartsIn('chart-counts')[0]);
    expect(bars.datasets[0].data).toHaveLength(12);
    expect(bars.datasets[0].data[9]).toBe(1);                                   // B gratis tidak dihitung transaksi
    await u.selectOptions(screen.getByLabelText('Bulan'), '8');
    expect(chartJson(chartsIn('chart-composition')[0]).datasets[0].data).toEqual([2, 0, 0]);
  });

  it('Pelanggan: pelanggan aktif = lunas + gratis per bulan; total pelanggan terdaftar zona', async () => {
    setup(grafikData({ freeMembers: { KRS__B: { active: true, fromYear: Y, fromMonth: 9 } } }));
    render(<GrafikView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: /Pelanggan/ }));
    await u.selectOptions(screen.getByLabelText('Bulan'), '9');
    expect(screen.getByText(/Pelanggan Aktif · Okt 2026/)).toBeInTheDocument();
    expect(chartJson(chartsIn('chart-counts')[0]).datasets[0].data[9]).toBe(2);
    expect(screen.getByText('Total pelanggan')).toBeInTheDocument();
    expect(screen.getByText('terdaftar')).toBeInTheDocument();
  });

  it('PERBAIKAN ZONA KUSTOM: donat zona TIMUR dihitung dari anggota TIMUR', async () => {
    setup(grafikData(), { activeZone: 'TIMUR' });
    render(<GrafikView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: /Pembayaran/ }));
    await u.selectOptions(screen.getByLabelText('Bulan'), '9');
    expect(chartJson(chartsIn('chart-composition')[0]).datasets[0].data).toEqual([1, 0, 0]);
  });

  it('mode TOTAL menjumlah semua zona aktif', async () => {
    setup(grafikData(), { activeZone: 'TOTAL' });
    render(<GrafikView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('tab', { name: /Pembayaran/ }));
    await u.selectOptions(screen.getByLabelText('Bulan'), '9');
    expect(chartJson(chartsIn('chart-composition')[0]).datasets[0].data).toEqual([4, 0, 0]); // A, B, S, T
  });
});
