// components/features/__tests__/t10-screens.test.tsx — REDESAIN T10 (Log, Operasional, Pengaturan, Notifikasi, Akun, Import)
// Render nyata layar produksi: perilaku zip + A27–A29 + A3 + PERBAIKAN ZONA KUSTOM.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const toast = vi.hoisted(() => ({ show: vi.fn() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const db = vi.hoisted(() => ({ persistPayment: vi.fn(), saveDB: vi.fn(), importToDB: vi.fn() }));

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/settings' }));
vi.mock('@/components/ui/Toast', () => ({ showToast: toast.show, showToastUndo: vi.fn(), default: () => null }));
vi.mock('@/lib/db', async (orig) => ({
  ...(await orig<typeof import('@/lib/db')>()),
  persistPayment: db.persistPayment, saveDB: db.saveDB, importToDB: db.importToDB,
}));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { ActivityLog, AppData } from '@/types';
import LogView from '@/components/features/log/LogView';
import { requestLogDetail } from '@/components/features/log/logDetailBridge';
import OperasionalView from '@/components/features/operasional/OperasionalView';
import SettingsView from '@/components/features/settings/SettingsView';
import { requestSettingsPage } from '@/components/features/settings/settingsBridge';
import NotificationCenter from '@/components/features/notifications/NotificationCenter';
import OnboardingHint from '@/components/ui/OnboardingHint';
import ImportInput from '@/components/modals/ImportModal';
import { simpleHash as pinHash } from '@/components/ui/PinLock';
import { simpleHash as settingsHash } from '@/components/features/settings/SettingsPinSection';

const Y = 2026, M = 9;
const at = (d: number, h = 10, mo = M) => new Date(Y, mo, d, h).getTime();
const NOW = new Date(Y, M, 18, 12).getTime();

const LOGS: ActivityLog[] = [
  { action: '[PAY] Bayar ABIL', detail: 'Rp 100.000', user: 'owner', ts: at(18, 10) },
  { action: 'Tambah member BUDI', detail: 'TIMUR', user: 'owner', ts: at(18, 9) },
  { action: 'Login owner', detail: '', user: 'owner', ts: at(17, 8) },
  { action: '[OPS] Update operasional', detail: 'Oktober 2026', user: 'owner', ts: at(1, 8) },
];

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT'], slkMembers: ['SARI'], zoneMembers: { TIMUR: ['BUDI'] },
    payments: { [`KRS__ABIL__${Y}__${M}`]: 100, [`SLK__SARI__${Y}__${M}`]: 80, [`TIMUR__BUDI__${Y}__${M}`]: 60 },
    memberInfo: {}, freeMembers: {}, deletedMembers: {},
    operasional: { [`${Y}_${M}`]: { items: [{ label: 'Listrik', nominal: 45 }, { label: 'Internet', nominal: 30 }] } },
    activityLog: LOGS,
    ...over,
  };
}

function setup(data: Partial<AppData> = {}, state: Record<string, unknown> = {}) {
  useAppStore.setState({
    appData: makeData(data), uid: '', userEmail: 'a@b.c', userName: 'Owner',
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [], pinEnabled: false, pin: '' },
    syncStatus: 'ok', theme: 'dark', globalLocked: false, lockedEntries: {},
    opsYear: Y, opsMonth: M, logSearch: '', logType: 'all',
    confirmDialog: { open: false, icon: '', title: '', yesLabel: '', cb: null },
    ...state,
  } as never);
}

const btn = (name: string | RegExp) => screen.getByRole('button', { name });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });   // hanya Date: jam tetap = NOW, userEvent/timer lain tetap nyata
  vi.setSystemTime(NOW);
  toast.show.mockClear(); nav.push.mockClear();
  db.persistPayment.mockReset(); db.persistPayment.mockResolvedValue(undefined);
  db.saveDB.mockReset(); db.saveDB.mockResolvedValue(undefined);
  db.importToDB.mockReset(); db.importToDB.mockResolvedValue(undefined);
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

// ══════════════════════════════════════════════════════════════
describe('Log — tampilan dan filter (zip + A27)', () => {
  it('daftar per hari dengan awalan [PAY] disembunyikan; tab menampilkan jumlah per jenis', () => {
    setup();
    render(<LogView />);
    expect(screen.getByRole('heading', { name: 'Hari ini' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kemarin' })).toBeInTheDocument();
    expect(screen.getByText('Bayar ABIL')).toBeInTheDocument();
    expect(screen.queryByText('[PAY] Bayar ABIL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pembayaran/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^Data/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /^Sistem/ })).toHaveTextContent('1');
    expect(screen.getByText(/4 dari 4/)).toBeInTheDocument();
  });

  it('A27: tab Sistem hanya menampilkan Login; tab Data tidak memuat Login/Bayar', async () => {
    setup();
    render(<LogView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /^Sistem/ }));
    expect(screen.getByText('Login owner')).toBeInTheDocument();
    expect(screen.queryByText('Bayar ABIL')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /^Data/ }));
    expect(screen.queryByText('Login owner')).not.toBeInTheDocument();
    expect(screen.getByText('Tambah member BUDI')).toBeInTheDocument();
    expect(useAppStore.getState().logType).toBe('data');
  });

  it('cari di aksi + detail; tidak ada hasil → empty state; Reset memulihkan', async () => {
    setup();
    render(<LogView />);
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText('Cari nama / aksi...'), 'timur');
    expect(screen.getByText('Tambah member BUDI')).toBeInTheDocument();
    expect(screen.queryByText('Login owner')).not.toBeInTheDocument();
    await u.clear(screen.getByPlaceholderText('Cari nama / aksi...'));
    await u.type(screen.getByPlaceholderText('Cari nama / aksi...'), 'zzzz');
    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
    await u.click(screen.getAllByRole('button', { name: 'Reset' })[0]);
    expect(screen.getByText('Login owner')).toBeInTheDocument();
    expect(useAppStore.getState().logSearch).toBe('');
  });

  it('filter bulan: Oktober saja vs bulan tanpa data', async () => {
    setup();
    render(<LogView />);
    const u = userEvent.setup();
    await u.selectOptions(screen.getByLabelText('Filter bulan log'), '8'); // September
    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText('Filter bulan log'), '9');
    expect(screen.getByText('Login owner')).toBeInTheDocument();
  });

  it('tanpa log sama sekali → empty state "Belum ada aktivitas"', () => {
    setup({ activityLog: [] });
    render(<LogView />);
    expect(screen.getByText('Belum ada aktivitas')).toBeInTheDocument();
  });

  it('sinkron error tanpa log → state error dengan tombol coba lagi', () => {
    setup({ activityLog: [] }, { syncStatus: 'err' });
    render(<LogView />);
    expect(screen.getByText('Gagal memuat log')).toBeInTheDocument();
    expect(btn('Coba Lagi')).toBeInTheDocument();
  });
});

describe('Log — A28 Detail dan A29 Statistik', () => {
  it('A28: ketuk baris → Detail Aktivitas (judul, rincian, waktu, pelaku, jenis); Esc menutup', async () => {
    setup();
    render(<LogView />);
    const u = userEvent.setup();
    await u.click(screen.getByRole('button', { name: /Buka detail aktivitas: Bayar ABIL/ }));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Detail Aktivitas')).toBeInTheDocument();
    expect(within(dlg).getByText('Tanggal & Waktu')).toBeInTheDocument();
    expect(within(dlg).getByText('Pelaku')).toBeInTheDocument();
    expect(within(dlg).getByText('owner')).toBeInTheDocument();
    expect(within(dlg).getByText('Pembayaran')).toBeInTheDocument();
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('A29: Statistik menampilkan total/jenis dan 3 aktivitas terbaru; ketuk terbaru membuka Detail', async () => {
    setup();
    render(<LogView />);
    const u = userEvent.setup();
    await u.click(btn('Statistik'));
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Statistik Log')).toBeInTheDocument();
    const tile = (label: string) => dlg.querySelector(`[data-stat="${label}"]`)!;
    expect(tile('Total Aktivitas')).toHaveTextContent('4');
    expect(tile('Pembayaran')).toHaveTextContent('1');
    expect(tile('Data Pelanggan')).toHaveTextContent('2');
    expect(tile('Sistem')).toHaveTextContent('1');
    expect(within(dlg).getAllByRole('button', { name: /Buka detail aktivitas/ })).toHaveLength(3);
    await u.click(within(dlg).getByRole('button', { name: /Buka detail aktivitas: Bayar ABIL/ }));
    expect(screen.getByText('Detail Aktivitas')).toBeInTheDocument();
    expect(screen.queryByText('Statistik Log')).not.toBeInTheDocument();
  });

  it('A3 → Log: permintaan tertunda membuka Detail saat layar dipasang; event saat sudah terbuka', async () => {
    setup();
    requestLogDetail(LOGS[2].ts);
    const { unmount } = render(<LogView />);
    expect(await screen.findByText('Detail Aktivitas')).toBeInTheDocument();
    unmount(); cleanup();
    setup();
    render(<LogView />);
    expect(screen.queryByText('Detail Aktivitas')).not.toBeInTheDocument();
    act(() => { requestLogDetail(LOGS[1].ts); });
    expect(await screen.findByText('Detail Aktivitas')).toBeInTheDocument();
  });

  it('ts tak dikenal → toast peringatan, tanpa sheet', () => {
    setup();
    render(<LogView />);
    act(() => { requestLogDetail(1); });
    expect(toast.show).toHaveBeenCalledWith('Aktivitas tidak ditemukan', 'warn');
    expect(screen.queryByText('Detail Aktivitas')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════
describe('Operasional — ringkasan, sheet, simpan, hapus', () => {
  it('ringkasan per zona (zona kustom ikut), pengeluaran dan pendapatan bersih', () => {
    setup();
    render(<OperasionalView />);
    expect(screen.getByText('Pendapatan KRS')).toBeInTheDocument();
    expect(screen.getByText('Pendapatan SLK')).toBeInTheDocument();
    expect(screen.getByText('Pendapatan TIMUR')).toBeInTheDocument();
    const net = screen.getByLabelText('PENDAPATAN BERSIH');
    expect(net).toHaveTextContent('Rp 165.000');
    expect(net.querySelector('[data-negative]')).toHaveAttribute('data-negative', 'false');
  });

  it('bersih negatif ditandai', () => {
    setup({ operasional: { [`${Y}_${M}`]: { items: [{ label: 'Besar', nominal: 999 }] } } });
    render(<OperasionalView />);
    expect(screen.getByLabelText('PENDAPATAN BERSIH').querySelector('[data-negative]')).toHaveAttribute('data-negative', 'true');
  });

  it('Tambah Item = sheet; keterangan kosong ditolak; simpan → persistPayment + log [OPS] + toast hijau', async () => {
    setup({}, { uid: 'u1' });
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Item'));
    const dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(within(dlg).getByText('Keterangan wajib diisi.')).toBeInTheDocument();
    expect(db.persistPayment).not.toHaveBeenCalled();
    await u.type(within(dlg).getByLabelText('Keterangan'), 'Perawatan');
    await u.type(within(dlg).getByLabelText(/Nominal/), '25');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(db.persistPayment).toHaveBeenCalledTimes(1);
    const [, saved, meta] = db.persistPayment.mock.calls[0];
    expect(saved.operasional[`${Y}_${M}`].items).toHaveLength(3);
    expect(saved.operasional[`${Y}_${M}`].items[2]).toEqual({ label: 'Perawatan', nominal: 25 });
    expect(meta.action).toMatch(/^\[OPS\]/);
    expect(toast.show).toHaveBeenLastCalledWith('Item pengeluaran ditambahkan', 'ok');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Pendapatan bersih|PENDAPATAN BERSIH/i)).toHaveTextContent('Rp 140.000');
  });

  it('gagal simpan → rollback selektif + toast merah; sheet tetap terbuka', async () => {
    setup({}, { uid: 'u1' });
    db.persistPayment.mockRejectedValueOnce(new Error('offline'));
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(btn('Tambah Item'));
    const dlg = screen.getByRole('dialog');
    await u.type(within(dlg).getByLabelText('Keterangan'), 'Gagal');
    await u.click(within(dlg).getByRole('button', { name: 'Simpan' }));
    expect(useAppStore.getState().appData.operasional[`${Y}_${M}`].items).toHaveLength(2);
    expect(toast.show).toHaveBeenLastCalledWith('Gagal tersimpan ke server, periksa koneksi', 'err');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('edit baris: blur dengan nilai berubah menyimpan, tanpa perubahan tidak menyimpan', async () => {
    setup({}, { uid: 'u1' });
    render(<OperasionalView />);
    const nominal = screen.getByLabelText(/Nominal \(ribuan rupiah\) 1/);
    fireEvent.blur(nominal);
    expect(db.persistPayment).not.toHaveBeenCalled();
    fireEvent.change(nominal, { target: { value: '50' } });
    fireEvent.blur(nominal);
    await act(async () => { await Promise.resolve(); });
    expect(db.persistPayment).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().appData.operasional[`${Y}_${M}`].items[0].nominal).toBe(50);
  });

  it('menu titik tiga → Edit membuka sheet terisi; Hapus lewat Confirm (trash) lalu toast hijau', async () => {
    setup({}, { uid: 'u1' });
    render(<OperasionalView />);
    const u = userEvent.setup();
    await u.click(btn('Menu item Listrik'));
    await u.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(screen.getByLabelText('Keterangan')).toHaveValue('Listrik');
    await u.keyboard('{Escape}');
    await u.click(btn('Menu item Listrik'));
    await u.click(screen.getByRole('menuitem', { name: 'Hapus' }));
    const cd = useAppStore.getState().confirmDialog;
    expect(cd.open).toBe(true);
    expect(cd.icon).toBe('trash');
    await act(async () => { cd.cb?.(); await Promise.resolve(); });
    expect(useAppStore.getState().appData.operasional[`${Y}_${M}`].items.map(i => i.label)).toEqual(['Internet']);
    expect(toast.show).toHaveBeenLastCalledWith('Item pengeluaran dihapus', 'ok');
  });

  it('kosong → empty state dengan tombol Tambah Item', () => {
    setup({ operasional: {} });
    render(<OperasionalView />);
    expect(screen.getByText('Belum ada data pengeluaran')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tambah Item' }).length).toBeGreaterThanOrEqual(2);
  });
});

// ══════════════════════════════════════════════════════════════
describe('Pengaturan — dua level dan halaman isi', () => {
  async function openGroup(u: ReturnType<typeof userEvent.setup>, name: string) {
    await u.click(screen.getByRole('button', { name: new RegExp(name) }));
  }

  it('enam grup, default tertutup; membuka grup menampilkan baris berlencana status', async () => {
    setup();
    render(<SettingsView />);
    for (const g of ['Akun', 'Keamanan', 'Manajemen', 'Data', 'Tampilan', 'Info Aplikasi']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${g}`) })).toHaveAttribute('aria-expanded', 'false');
    }
    const u = userEvent.setup();
    await openGroup(u, '^Keamanan');
    expect(screen.getByRole('button', { name: /PIN Keamanan/ })).toHaveTextContent('Nonaktif');
    await openGroup(u, '^Manajemen');
    expect(screen.getByRole('button', { name: /Manajemen Zona/ })).toHaveTextContent('3'); // KRS, SLK, TIMUR
  });

  it('baris membuka halaman isi; tombol kembali memulihkan daftar dengan grup yang masih terbuka', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Keamanan');
    await u.click(screen.getByRole('button', { name: /PIN Keamanan/ }));
    expect(screen.getByRole('heading', { name: 'PIN Keamanan' })).toBeInTheDocument();
    await u.click(btn('Kembali'));
    expect(screen.getByRole('button', { name: /^Keamanan/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('PIN: aktifkan dengan 6 digit dua kali → pinEnabled + hash sama dengan PinLock', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Keamanan');
    await u.click(screen.getByRole('button', { name: /PIN Keamanan/ }));
    await u.click(btn('Aktifkan PIN'));
    await u.type(screen.getByLabelText('Buat PIN Baru'), '123456');
    await u.click(btn('Konfirmasi'));
    await u.type(screen.getByLabelText('Konfirmasi PIN'), '123456');
    await u.click(btn('Simpan & Aktifkan'));
    const s = useAppStore.getState().settings;
    expect(s.pinEnabled).toBe(true);
    expect(s.pin).toBe(pinHash('123456'));
    expect(pinHash('9087')).toBe(settingsHash('9087'));
  });

  it('PIN tidak cocok → pesan, tidak aktif', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Keamanan');
    await u.click(screen.getByRole('button', { name: /PIN Keamanan/ }));
    await u.click(btn('Aktifkan PIN'));
    await u.type(screen.getByLabelText('Buat PIN Baru'), '123456');
    await u.click(btn('Konfirmasi'));
    await u.type(screen.getByLabelText('Konfirmasi PIN'), '654321');
    await u.click(btn('Simpan & Aktifkan'));
    expect(screen.getByText('PIN tidak cocok')).toBeInTheDocument();
    expect(useAppStore.getState().settings.pinEnabled).toBe(false);
  });

  it('Zona: tambah zona kustom (nama maks 6, warna), tolak duplikat, sembunyikan lewat Confirm (warning)', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Manajemen');
    await u.click(screen.getByRole('button', { name: /Manajemen Zona/ }));
    expect(screen.getByText('TIMUR')).toBeInTheDocument();
    await u.click(btn('Tambah Zona Baru'));
    await u.type(screen.getByPlaceholderText(/Nama zona/), 'timur');
    await u.click(screen.getAllByRole('button', { name: 'Tambah Zona Baru' }).pop()!);
    expect(toast.show).toHaveBeenLastCalledWith('Zona sudah ada', 'err');
    await u.clear(screen.getByPlaceholderText(/Nama zona/));
    await u.type(screen.getByPlaceholderText(/Nama zona/), 'utara');
    await u.click(screen.getAllByRole('button', { name: 'Tambah Zona Baru' }).pop()!);
    expect(useAppStore.getState().settings.customZones?.map(z => z.key)).toEqual(['TIMUR', 'UTARA']);

    await u.click(btn('Sembunyikan TIMUR'));
    const cd = useAppStore.getState().confirmDialog;
    expect(cd.icon).toBe('warning');
    act(() => { cd.cb?.(); });
    expect(useAppStore.getState().settings.hiddenZones).toEqual(['TIMUR']);
  });

  it('Zona: hapus zona kustom → Confirm (trash) → zoneMembers ikut dihapus dan disimpan', async () => {
    setup({}, { uid: 'u1' });
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Manajemen');
    await u.click(screen.getByRole('button', { name: /Manajemen Zona/ }));
    await u.click(btn('Hapus zona TIMUR'));
    const cd = useAppStore.getState().confirmDialog;
    expect(cd.icon).toBe('trash');
    await act(async () => { cd.cb?.(); await Promise.resolve(); });
    expect(useAppStore.getState().settings.customZones).toEqual([]);
    expect(useAppStore.getState().appData.zoneMembers).toEqual({});
    expect(db.saveDB).toHaveBeenCalled();
  });

  it('Quick Pay: simpan 2–8 nominal; kurang dari 2 ditolak', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Manajemen');
    await u.click(screen.getByRole('button', { name: /^Quick Pay/ }));
    const input = screen.getByPlaceholderText('50, 80, 90, 100, 150, 200');
    await u.clear(input); await u.type(input, '70');
    await u.click(btn('Simpan Nominal Default'));
    expect(toast.show).toHaveBeenLastCalledWith('Minimal 2 nominal', 'err');
    await u.clear(input); await u.type(input, '70, 120, 200');
    await u.click(btn('Simpan Nominal Default'));
    expect(useAppStore.getState().settings.quickAmounts).toEqual([70, 120, 200]);
  });

  it('Tema: ChoiceRows mengganti tema (Emas) dan lencana Tema berwarna hijau', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Tampilan');
    await u.click(screen.getByRole('button', { name: /^Tema/ }));
    await u.click(screen.getByRole('radio', { name: /Emas/ }));
    expect(useAppStore.getState().theme).toBe('gold');
  });

  it('Akun Penagih: daftar member lintas zona termasuk zona kustom (satu jalur)', async () => {
    setup();
    render(<SettingsView />);
    const u = userEvent.setup();
    await openGroup(u, '^Akun');
    await u.click(screen.getByRole('button', { name: /Buat Akun Penagih/ }));
    expect(screen.getByRole('checkbox', { name: 'BUDI' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'ABIL' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'SARI' })).toBeInTheDocument();
  });

  it('A3 → Pengaturan: permintaan halaman Export dari notifikasi', async () => {
    setup();
    render(<SettingsView />);
    act(() => { requestSettingsPage('export'); });
    expect(await screen.findByRole('heading', { name: 'Export & Import Data' })).toBeInTheDocument();
    expect(screen.getByText('JSON Backup')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════
describe('Pusat Notifikasi (A3)', () => {
  const openPanel = async (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getByRole('button', { name: 'Notifikasi' }));

  it('lencana = jumlah belum dibaca; panel memuat aktivitas terbaru + ajakan backup', async () => {
    setup();
    render(<NotificationCenter />);
    expect(screen.getByRole('button', { name: 'Notifikasi' })).toHaveTextContent('5'); // 4 aktivitas + backup
    const u = userEvent.setup();
    await openPanel(u);
    expect(screen.getByText('Backup data disarankan')).toBeInTheDocument();
    expect(screen.getByText('Bayar ABIL')).toBeInTheDocument();
  });

  it('tandai semua dibaca → lencana hilang; tersimpan per-uid di localStorage', async () => {
    setup({}, { uid: 'u-1' });
    render(<NotificationCenter />);
    const u = userEvent.setup();
    await openPanel(u);
    await u.click(screen.getByRole('button', { name: 'Tandai semua dibaca' }));
    expect(screen.getByRole('button', { name: 'Notifikasi' })).not.toHaveTextContent(/\d/);
    expect(localStorage.getItem('wp_notif_read_u-1')).toBeTruthy();
    expect(localStorage.getItem('wp_notif_read_u-2')).toBeNull();
  });

  it('ketuk aktivitas → menutup panel, pindah ke Log dan membuka Detail', async () => {
    setup();
    render(<><NotificationCenter /><LogView /></>);
    const u = userEvent.setup();
    await openPanel(u);
    await u.click(within(screen.getByRole('dialog', { name: 'Notifikasi' })).getByText('Bayar ABIL'));
    expect(nav.push).toHaveBeenCalledWith('/log');
    expect(screen.queryByRole('dialog', { name: 'Notifikasi' })).not.toBeInTheDocument();
    expect(await screen.findByText('Detail Aktivitas')).toBeInTheDocument();
    expect(useAppStore.getState().currentView).toBe('log');
  });

  it('ketuk ajakan backup → buka Pengaturan halaman Export (sudah di /settings: tanpa push)', async () => {
    setup();
    render(<><NotificationCenter /><SettingsView /></>);
    const u = userEvent.setup();
    await openPanel(u);
    await u.click(screen.getByText('Backup data disarankan'));
    expect(await screen.findByRole('heading', { name: 'Export & Import Data' })).toBeInTheDocument();
    expect(useAppStore.getState().currentView).toBe('settings');
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('gagal simpan → item sementara "Gagal simpan"; tanpa log → state kosong bila sehat', async () => {
    setup({ activityLog: [] }, { syncStatus: 'err' });
    render(<NotificationCenter />);
    const u = userEvent.setup();
    await openPanel(u);
    expect(screen.getByText('Gagal simpan')).toBeInTheDocument();
    cleanup();
    localStorage.setItem('wp_last_backup', String(NOW));
    setup({ activityLog: [] });
    render(<NotificationCenter />);
    await openPanel(userEvent.setup());
    expect(screen.getByText('Belum ada notifikasi')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════
describe('Import — ringkasan per zona dan pendaftaran zona kustom', () => {
  function pickFile(content: string) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([content], 'backup.json', { type: 'application/json' });
    // jsdom: FileReader tersedia; kirim lewat event change
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
  }

  it('Confirm (warning) memuat ringkasan per zona; setelah setuju: member zona kustom + zona terdaftar + importToDB', async () => {
    setup({}, { uid: 'u1', settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [] } });
    render(<ImportInput />);
    pickFile(JSON.stringify({ krsMembers: ['A', 'B'], slkMembers: ['C'], zoneMembers: { UTARA: ['X', 'Y', 'Z'] }, payments: { a: 1 } }));
    await vi.waitFor(() => expect(useAppStore.getState().confirmDialog.open).toBe(true));
    const cd = useAppStore.getState().confirmDialog;
    expect(cd.icon).toBe('warning');
    expect(cd.highlight).toBe('2 KRS · 1 SLK · 3 UTARA · 1 data pembayaran');
    await act(async () => { cd.cb?.(); await Promise.resolve(); await Promise.resolve(); });
    expect(useAppStore.getState().appData.zoneMembers).toEqual({ UTARA: ['X', 'Y', 'Z'] });
    expect(useAppStore.getState().settings.customZones?.map(z => z.key)).toEqual(['UTARA']);
    expect(db.importToDB).toHaveBeenCalledTimes(1);
    expect(db.importToDB.mock.calls[0][1].zoneMembers).toEqual({ UTARA: ['X', 'Y', 'Z'] });
  });

  it('file bukan backup → toast gagal, tanpa Confirm', async () => {
    setup();
    render(<ImportInput />);
    pickFile('{"foo":1}');
    await vi.waitFor(() => expect(toast.show).toHaveBeenCalledWith('File tidak valid!', 'err'));
    expect(useAppStore.getState().confirmDialog.open).toBe(false);
  });
});

describe('Panduan awal', () => {
  it('tiga langkah, teks tanpa KRS/SLK tertanam, selesai menyimpan penanda', async () => {
    setup();
    render(<OnboardingHint />);
    const u = userEvent.setup();
    expect(screen.getByText('Navigasi')).toBeInTheDocument();
    await u.click(btn('Lanjut'));
    expect(screen.getByText(/tab zona di header/)).toBeInTheDocument();
    expect(screen.queryByText(/KRS atau SLK/)).not.toBeInTheDocument();
    await u.click(btn('Lanjut'));
    await u.click(btn('Mengerti'));
    expect(localStorage.getItem('wifipay_onboarding_done')).toBe('1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sudah pernah ditutup → tidak tampil', () => {
    localStorage.setItem('wifipay_onboarding_done', '1');
    setup();
    render(<OnboardingHint />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
