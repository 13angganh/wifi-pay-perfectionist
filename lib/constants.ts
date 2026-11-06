// ══════════════════════════════════════════
// lib/constants.ts — Konstanta global
// ══════════════════════════════════════════

// v11.5: APP_NAME & APP_VERSION terpusat — single source of truth untuk tampilan
// nama & versi app di seluruh UI (Header, Sidebar, LoadingScreen, halaman login,
// halaman offline, Settings, dan footer export PDF). Sebelumnya setiap tempat
// hardcode string-nya sendiri, menyebabkan inkonsistensi (PDF export sempat
// tampil "v11.4" tanpa suffix "Next" yang dipakai di semua tempat lain).
// Saat naik versi: HANYA ubah baris ini, seluruh app otomatis konsisten.
export const APP_NAME         = 'WiFi Pay';
export const APP_VERSION      = 'v11.11.1';
export const APP_VERSION_SUFFIX = 'Next';
export const APP_VERSION_FULL = `${APP_VERSION} ${APP_VERSION_SUFFIX}`; // "v11.5 Next"

// task 1.10: MONTHS adalah canonical ID — "Agu" (bukan "Agt"). MONTHS_ID dihapus (duplikat).
export const MONTHS    = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
export const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// MONTHS_ID dihapus — gunakan MONTHS langsung untuk bahasa Indonesia

// BUG-003 fix: getYears() dievaluasi runtime setiap kali dipanggil — tidak frozen di build time
export function getYears(): number[] {
  const years: number[] = [];
  for (let i = 2023; i <= new Date().getFullYear() + 2; i++) years.push(i);
  return years;
}

export const QUICK = [50, 80, 90, 100, 150, 200];

// v11.11.1: daftar nama pelanggan bawaan DIHAPUS dari kode. Data pelanggan hanya melekat pada akun masing-masing
// di Firebase; tidak ada nama pelanggan yang ikut terkirim di bundle JS ke pengunjung situs.

// v11.6.5: Rekap pagination — jumlah baris (member) per halaman. Dipusatkan di
// sini (bukan hardcode di RekapView.tsx) mengikuti pola project yang sudah
// konsisten menaruh angka konfigurasi (APP_VERSION, MONTHS, dst) di file ini.
// 20 dipilih dari diskusi eksplisit dengan user: 12 kolom bulan × 20 baris =
// 300 sel per halaman, jauh di bawah ambang checkerboarding (~1.300 sel
// sebelum pagination), dan 20 baris kira-kira sepadan dengan tinggi layar
// mobile biasa tanpa scroll vertikal sama sekali di dalam satu halaman.
export const ROWS_PER_PAGE = 20;

// REDESAIN T11: PAGE_TITLES dan PAGE_ICON_MAP (ikon Lucide) dihapus — nol pemakai (judul/ikon menu kini dari
// lib/navItems.tsx + kamus i18n; ikon resmi = Phosphor).
