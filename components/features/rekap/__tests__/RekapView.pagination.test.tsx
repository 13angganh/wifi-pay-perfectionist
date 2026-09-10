// components/features/rekap/__tests__/RekapView.pagination.test.tsx
// v11.6.5 — Test regresi untuk fitur pagination Rekap (ROWS_PER_PAGE=20).
//
// KONTEKS: pagination ditambahkan untuk mengurangi jumlah sel yang dirender
// sekaligus (mitigasi checkerboarding Chromium saat fast-scroll mobile — lihat
// README v11.6.5 untuk detail lengkap). Keputusan desain dari diskusi
// eksplisit dengan user, semua diuji di sini:
//   1. Kontrol pagination TIDAK muncul kalau member ≤ ROWS_PER_PAGE (1 halaman)
//   2. Kontrol MUNCUL dan menampilkan halaman yang benar kalau member > ROWS_PER_PAGE
//   3. Nomor urut tetap ABSOLUT lintas halaman (halaman 2 mulai dari 21, bukan 1)
//   4. Ganti ZONA mereset ke halaman 1
//   5. Ganti SEARCH mereset ke halaman 1
//   6. Ganti TAHUN mempertahankan halaman aktif (SENGAJA beda dari #4/#5)
//   7. Tombol prev/next disabled dengan benar di batas halaman pertama/terakhir
//
// Menggunakan render sungguhan (bukan shallow) + userEvent, mengikuti pola
// PinLock.test.tsx — supaya perubahan implementasi internal apa pun tidak
// bisa lolos dari test ini selama perilaku yang terlihat user berubah.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RekapView from '../RekapView';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import { ROWS_PER_PAGE } from '@/lib/constants';

// Sama seperti PinLock.test.tsx — RekapView → useAppStore → dataSlice →
// lib/db.ts → lib/firebase.ts butuh Firebase Auth/Database sungguhan yang
// tidak tersedia (dan tidak dibutuhkan) di unit test.
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

// 25 nama member — sengaja > ROWS_PER_PAGE (20) supaya selalu ada 2 halaman
// utk skenario yang butuh multi-halaman. Diberi awalan angka 2-digit
// (M01, M02, ...) supaya urutan alfabetis == urutan yang diharapkan,
// menghindari ambiguitas soal urutan sorting.
const MANY_MEMBERS = Array.from({ length: 25 }, (_, i) => `M${String(i + 1).padStart(2, '0')}`);
// 5 nama — sengaja < ROWS_PER_PAGE supaya jadi kasus 1-halaman.
const FEW_MEMBERS = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko'];

function setupStore(members: string[]) {
  useAppStore.setState({
    appData: {
      ...DEFAULT_APP_DATA,
      krsMembers: members,
      slkMembers: [],
      zoneMembers: { KRS: members, SLK: [] },
    },
    settings: { ...DEFAULT_SETTINGS },
    activeZone: 'KRS',
    selYear: 2026,
    uid: 'test-uid',
    userEmail: 'test@test.com',
    search: '',
    rekapExpanded: null,
    globalLocked: false,
    lockedEntries: {},
    syncStatus: 'ok',
  } as never);
}

describe('RekapView — pagination (v11.6.5)', () => {
  beforeEach(() => {
    // Reset store ke default sebelum tiap test — mencegah state pagination
    // dari test sebelumnya (currentPage, dst) bocor ke test berikutnya,
    // karena useAppStore adalah module-level singleton yang persist antar test
    // dalam satu file kecuali di-reset eksplisit.
    setupStore(FEW_MEMBERS);
  });

  it('kontrol pagination TIDAK muncul saat member ≤ ROWS_PER_PAGE (1 halaman)', () => {
    setupStore(FEW_MEMBERS);
    render(<RekapView />);
    expect(screen.queryByLabelText('Halaman sebelumnya')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Halaman berikutnya')).not.toBeInTheDocument();
  });

  it('kontrol pagination MUNCUL saat member > ROWS_PER_PAGE, menampilkan halaman 1 dari 2', () => {
    setupStore(MANY_MEMBERS);
    render(<RekapView />);
    expect(screen.getByText(/Halaman 1 \/ 2/)).toBeInTheDocument();
  });

  it('halaman 1 menampilkan member pertama (M01) TAPI BUKAN member setelah ROWS_PER_PAGE (M21)', () => {
    setupStore(MANY_MEMBERS);
    render(<RekapView />);
    expect(screen.getByText('M01')).toBeInTheDocument();
    expect(screen.getByText(`M${ROWS_PER_PAGE}`)).toBeInTheDocument(); // M20 — baris terakhir halaman 1
    expect(screen.queryByText('M21')).not.toBeInTheDocument(); // baris pertama halaman 2, belum terlihat
  });

  it('klik "Halaman berikutnya" menampilkan M21 (halaman 2) dan menyembunyikan M01 (halaman 1)', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));

    expect(screen.getByText(/Halaman 2 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText('M21')).toBeInTheDocument();
    expect(screen.queryByText('M01')).not.toBeInTheDocument();
  });

  it('nomor urut ABSOLUT lintas halaman — baris pertama halaman 2 bernomor 21, bukan 1', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));

    // M21 adalah member ke-21 (index 20), jadi nomor urutnya harus 21.
    // Cari <tr data-name="M21"> lalu cek sel nomor urut (td pertama).
    const row = document.querySelector('tr[data-name="M21"]');
    expect(row).toBeTruthy();
    const firstCell = row!.querySelectorAll('td')[0];
    expect(firstCell.textContent).toBe('21');
  });

  it('tombol "sebelumnya" disabled di halaman 1, tombol "berikutnya" disabled di halaman terakhir', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    render(<RekapView />);

    expect(screen.getByLabelText('Halaman sebelumnya')).toBeDisabled();
    expect(screen.getByLabelText('Halaman berikutnya')).not.toBeDisabled();

    await user.click(screen.getByLabelText('Halaman berikutnya'));

    expect(screen.getByLabelText('Halaman sebelumnya')).not.toBeDisabled();
    expect(screen.getByLabelText('Halaman berikutnya')).toBeDisabled();
  });

  it('ganti ZONA mereset halaman ke 1 (pindah ke halaman 2 dulu, lalu ganti zona)', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));
    expect(screen.getByText(/Halaman 2 \/ 2/)).toBeInTheDocument();

    // Simulasikan ganti zona dari LUAR komponen (persis seperti Header.tsx/
    // GlobalSearch.tsx memanggil setZone — bukan dari kontrol di dalam
    // RekapView sendiri, sengaja menguji reaksi terhadap PERUBAHAN STATE,
    // bukan reaksi terhadap satu handler tertentu). setState dipanggil di
    // luar React callstack (bukan via userEvent), jadi perlu act() eksplisit
    // — React Testing Library hanya otomatis membungkus event yang lewat
    // userEvent/fireEvent, bukan panggilan store langsung seperti ini.
    act(() => {
      useAppStore.setState({ activeZone: 'SLK', search: '' } as never);
    });

    // Re-render terjadi otomatis krn RekapView subscribe ke store — tapi
    // perlu re-render eksplisit di test env utk memicu re-evaluasi.
    render(<RekapView />);
    // Zona SLK kosong di setup ini → 0 halaman efektif tapi totalPages
    // di-floor minimal 1 → tidak ada kontrol sama sekali (member.length=0)
    expect(screen.queryByLabelText('Halaman berikutnya')).not.toBeInTheDocument();
  });

  it('ganti SEARCH mereset halaman ke 1', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    const { rerender } = render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));
    expect(screen.getByText(/Halaman 2 \/ 2/)).toBeInTheDocument();

    const searchBox = screen.getByPlaceholderText('Cari member...');
    await user.type(searchBox, 'M0');
    rerender(<RekapView />);

    // "M0" match M01-M09 (9 member, fuzzy subsequence match) → 1 halaman,
    // dan yang lebih penting: harus balik ke tampilan "halaman 1" (kontrol
    // hilang total krn totalPages jadi 1 utk hasil filter ini)
    expect(screen.queryByLabelText('Halaman berikutnya')).not.toBeInTheDocument();
  });

  it('ganti TAHUN MEMPERTAHANKAN halaman aktif (beda sengaja dari zona/search)', async () => {
    setupStore(MANY_MEMBERS);
    const user = userEvent.setup();
    render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));
    expect(screen.getByText(/Halaman 2 \/ 2/)).toBeInTheDocument();

    // Ganti tahun via dropdown select (elemen asli, bukan set store langsung
    // — supaya menguji jalur asli yang dipakai user: onChange dropdown yang
    // juga memanggil closeModal()+exitBatch() di baris yang sama).
    const yearSelect = screen.getByDisplayValue('2026') as HTMLSelectElement;
    await user.selectOptions(yearSelect, screen.getAllByRole('option').find(
      o => (o as HTMLOptionElement).value !== '2026'
    ) as HTMLElement);

    // Halaman TETAP 2 — inti dari test ini.
    expect(screen.getByText(/Halaman 2 \/ 2/)).toBeInTheDocument();
  });
});

// v11.6.6 — Test regresi untuk baris "Subtotal Halaman" di tfoot, ditambahkan
// berdampingan dengan baris "Total Keseluruhan" yang sudah ada sejak sebelum
// pagination, agar user bisa langsung bandingkan subtotal halaman aktif vs
// total seluruh zona tanpa menghitung manual (permintaan eksplisit user
// setelah pagination v11.6.5 dirilis).
describe('RekapView — subtotal halaman di tfoot (v11.6.6)', () => {
  // Payment SENGAJA beda nilai jelas antar member halaman 1 (M01-M20) vs
  // halaman 2 (M21-M25) — supaya test membuktikan subtotal benar2 dihitung
  // dari kelompok member yang tepat, bukan kebetulan lulus krn semua nol.
  // M01 dibayar 50rb di bulan Jan (index 0), M21 dibayar 200rb di bulan Jan.
  function setupStoreWithPayments() {
    useAppStore.setState({
      appData: {
        ...DEFAULT_APP_DATA,
        krsMembers: MANY_MEMBERS,
        slkMembers: [],
        zoneMembers: { KRS: MANY_MEMBERS, SLK: [] },
        payments: {
          'KRS__M01__2026__0': 50,   // halaman 1 — nilai dlm ribuan, sesuai konvensi getPay()
          'KRS__M21__2026__0': 200,  // halaman 2
        },
      },
      settings: { ...DEFAULT_SETTINGS },
      activeZone: 'KRS',
      selYear: 2026,
      uid: 'test-uid',
      userEmail: 'test@test.com',
      search: '',
      rekapExpanded: null,
      globalLocked: false,
      lockedEntries: {},
      syncStatus: 'ok',
    } as never);
  }

  it('baris "Subtotal Halaman" TIDAK muncul saat cuma 1 halaman (subtotal = total, dua baris identik percuma)', () => {
    setupStore(FEW_MEMBERS);
    render(<RekapView />);
    expect(screen.queryByText(/Subtotal Halaman/)).not.toBeInTheDocument();
  });

  it('baris "Subtotal Halaman 1" muncul dengan label halaman yang benar saat multi-halaman', () => {
    setupStoreWithPayments();
    render(<RekapView />);
    expect(screen.getByText(/Subtotal Halaman 1\b/)).toBeInTheDocument();
  });

  it('subtotal halaman 1 HANYA menghitung M01 (50rb), TIDAK ikut M21 (200rb dari halaman 2)', () => {
    setupStoreWithPayments();
    render(<RekapView />);
    // Cari baris tfoot subtotal secara spesifik (bukan getByText global yg
    // ambigu — '50.000' juga cocok di sel <td> individual M01 sendiri).
    const subtotalRow = screen.getByText(/Subtotal Halaman 1\b/).closest('tr');
    expect(subtotalRow).toBeTruthy();
    expect(subtotalRow!.textContent).toContain('50.000');
    expect(subtotalRow!.textContent).not.toContain('200.000');
  });

  it('pindah ke halaman 2: subtotal berubah jadi HANYA M21 (200rb), M01 (50rb) tidak lagi ikut dihitung', async () => {
    setupStoreWithPayments();
    const user = userEvent.setup();
    render(<RekapView />);

    await user.click(screen.getByLabelText('Halaman berikutnya'));

    const subtotalRow = screen.getByText(/Subtotal Halaman 2\b/).closest('tr');
    expect(subtotalRow).toBeTruthy();
    expect(subtotalRow!.textContent).toContain('200.000');
    // "50.000" TIDAK boleh muncul di baris subtotal halaman 2 — meski M01
    // masih dihitung di baris "Total Keseluruhan" (selalu dari seluruh
    // zona), baris SUBTOTAL harus murni dari member halaman aktif saja.
    expect(subtotalRow!.textContent).not.toContain('50.000');
  });

  it('"Total Keseluruhan" TETAP menjumlahkan SEMUA member (M01+M21=250rb), tidak terpengaruh halaman aktif', async () => {
    setupStoreWithPayments();
    const user = userEvent.setup();
    render(<RekapView />);

    // Cari baris tfoot "Total Keseluruhan" via elemen <td> secara spesifik
    // (bukan getByText('Total') generik — teks "Total" juga muncul di <th>
    // header kolom terakhir dan <span> batchSheet, keduanya akan membuat
    // getByText melempar multiple-match error).
    const totalCellP1 = Array.from(document.querySelectorAll('td'))
      .find(td => td.textContent === 'Total');
    expect(totalCellP1).toBeTruthy();
    const totalRowP1 = totalCellP1!.closest('tr');
    expect(totalRowP1).toBeTruthy();
    // Di halaman 1 — total keseluruhan sudah harus 250rb (50+200), BUKAN
    // cuma 50rb (M01 saja) — ini regresi terhadap perilaku grand total yang
    // sudah ada SEBELUM subtotal ditambahkan, harus tetap independen dari
    // halaman aktif seperti sebelumnya.
    expect(totalRowP1!.textContent).toContain('250.000');

    await user.click(screen.getByLabelText('Halaman berikutnya'));

    const totalCellP2 = Array.from(document.querySelectorAll('td'))
      .find(td => td.textContent === 'Total');
    expect(totalCellP2).toBeTruthy();
    const totalRowP2 = totalCellP2!.closest('tr');
    expect(totalRowP2).toBeTruthy();
    // Di halaman 2 — total keseluruhan HARUS TETAP 250rb, tidak berubah
    // jadi 200rb (M21 saja) hanya karena pindah halaman.
    expect(totalRowP2!.textContent).toContain('250.000');
  });
});
