// ══════════════════════════════════════════
// lib/theme.ts — v11.10.4
// Satu sumber untuk penerapan tema pada DOM (class `body.light` / `body.gold`, dark = tanpa class) + warna `theme-color`
// (bilah status/alamat browser & PWA). Dipakai oleh:
//   • themeBootScript — skrip inline PERTAMA di <body> (app/layout.tsx), jalan sebelum konten pertama tampil, sehingga
//     Splash/Login/Offline/Error sudah bertema benar sejak frame pertama;
//   • AppShell — saat pengguna mengganti tema di Pengaturan.
// Sebelumnya skrip anti-flash berada di <head> dan memakai document.body yang saat itu masih null (gagal diam-diam di try/catch),
// sedangkan class tema baru dipasang oleh AppShell — yang BELUM ada saat Splash tampil → Splash selalu gelap.
// ══════════════════════════════════════════
import { SURFACE, SURFACE_LIGHT } from './design-tokens';

export type ThemeName = 'dark' | 'light' | 'gold';

/** Warna latar tiap tema = nilai `--bg` di styles/tokens.css (dijaga test agar tidak melenceng). */
export const THEME_BG: Record<ThemeName, string> = {
  dark : SURFACE.bg,
  light: SURFACE_LIGHT.bg,
  gold : '#0C0A06',
};

/** Pasang tema ke dokumen: class pada <body> dan meta theme-color. */
export function applyTheme(theme: ThemeName, doc: Document = document): void {
  doc.body.classList.remove('light', 'gold');
  if (theme === 'light') doc.body.classList.add('light');
  else if (theme === 'gold') doc.body.classList.add('gold');
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BG[theme]);
}

/**
 * Skrip inline untuk <body> (string murni, tanpa import). Membaca `wp_theme` (+ migrasi lama `wp_dark_mode === '0'` → terang,
 * sama seperti loadTheme() di uiSlice) lalu memasang tema. Gagal diam-diam bila localStorage tidak tersedia.
 */
export const themeBootScript = `(function(){try{
var C=${JSON.stringify(THEME_BG)};
var t=localStorage.getItem('wp_theme');
if(t!=='light'&&t!=='gold'&&t!=='dark'){t=localStorage.getItem('wp_dark_mode')==='0'?'light':'dark';}
var b=document.body;b.classList.remove('light','gold');if(t!=='dark')b.classList.add(t);
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',C[t]);
}catch(e){}})();`;
