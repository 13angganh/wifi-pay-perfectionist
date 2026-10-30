// store/slices/uiSlice.ts — 3-mode theme (light/dark/gold)
// Domain: UI preferences — theme, mode navigasi, posisi toast, sidebar, PWA install prompt,
//         confirm dialog
//
// REDESAIN T6 (Register Tambahan A1 + A2, disetujui user): `navMode` dan `toastPosition`
// adalah pengaturan PERANGKAT (bukan per akun) — pola sama dengan `theme` (`wp_theme`):
// key localStorage sendiri, dibaca saat store dibuat.
//   - navMode       : 'bottom' (default, gambar referensi) | 'sidebar'
//   - toastPosition : 'top' (default, perilaku zip) | 'bottom'

import type { StateCreator } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'gold';
export type NavMode = 'bottom' | 'sidebar';
export type ToastPosition = 'top' | 'bottom';

export const NAV_MODE_KEY = 'wp_nav_mode';
export const TOAST_POS_KEY = 'wp_toast_pos';
export const DEFAULT_NAV_MODE: NavMode = 'bottom';
export type TextSize = 'normal' | 'large';
export const HIDDEN_CARDS_KEY = 'wp_hidden_cards';
export const TEXT_SIZE_KEY = 'wp_text_size';
export const DEFAULT_TEXT_SIZE: TextSize = 'normal';
export const DEFAULT_TOAST_POSITION: ToastPosition = 'top';

// ── Fase 2: Confirm dialog state (props terstruktur, tanpa HTML string) ──
export interface ConfirmDialogState {
  open:        boolean;
  icon?:       string;
  title:       string;
  description?: string;
  highlight?:  string;
  highlightColor?: string;
  yesLabel:    string;
  cb:          (() => void) | null;
}

function getLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// suppress unused-var warning — getLS dipakai di bawah
void getLS;

function loadTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const raw = localStorage.getItem('wp_theme');
  if (raw === 'light' || raw === 'dark' || raw === 'gold') return raw;
  // Legacy migration
  const legacy = localStorage.getItem('wp_dark_mode');
  if (legacy === '0') return 'light';
  return 'dark';
}

function loadNavMode(): NavMode {
  if (typeof window === 'undefined') return DEFAULT_NAV_MODE;
  const raw = localStorage.getItem(NAV_MODE_KEY);
  return raw === 'bottom' || raw === 'sidebar' ? raw : DEFAULT_NAV_MODE;
}

function loadHiddenCards(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const v: unknown = JSON.parse(localStorage.getItem(HIDDEN_CARDS_KEY) || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    // Data situs bisa rusak/diubah tangan: hanya terima { layar: string[] }; sisanya dibuang (bawaan = semua kartu tampil).
    const out: Record<string, string[]> = {};
    for (const [screen, ids] of Object.entries(v as Record<string, unknown>)) {
      if (Array.isArray(ids)) out[screen] = ids.filter((x): x is string => typeof x === 'string');
    }
    return out;
  } catch { return {}; }
}
function saveHiddenCards(v: Record<string, string[]>) { try { localStorage.setItem(HIDDEN_CARDS_KEY, JSON.stringify(v)); } catch { /* abaikan */ } }

function loadTextSize(): TextSize {
  if (typeof window === 'undefined') return DEFAULT_TEXT_SIZE;
  try { const raw = localStorage.getItem(TEXT_SIZE_KEY); return raw === 'large' ? 'large' : DEFAULT_TEXT_SIZE; } catch { return DEFAULT_TEXT_SIZE; }
}

function loadToastPosition(): ToastPosition {
  if (typeof window === 'undefined') return DEFAULT_TOAST_POSITION;
  const raw = localStorage.getItem(TOAST_POS_KEY);
  return raw === 'top' || raw === 'bottom' ? raw : DEFAULT_TOAST_POSITION;
}

const DEFAULT_CONFIRM: ConfirmDialogState = {
  open: false, title: 'Yakin?', yesLabel: 'Ya', cb: null,
};

export interface UiSlice {
  theme:             ThemeMode;
  setTheme:          (t: ThemeMode) => void;
  // Legacy compat
  darkMode:          boolean;
  // A1: mode navigasi (pengaturan perangkat)
  navMode:           NavMode;
  textSize:          TextSize;
  hiddenCards:       Record<string, string[]>;
  toggleCardVisible: (screen: string, id: string) => void;
  showAllCards:      (screen: string) => void;
  setTextSize:       (s: TextSize) => void;
  setNavMode:        (m: NavMode) => void;
  // A2: posisi toast (pengaturan perangkat)
  toastPosition:     ToastPosition;
  setToastPosition:  (p: ToastPosition) => void;
  sidebarOpen:       boolean;
  setSidebar:        (v: boolean) => void;
  deferredPrompt:    Event | null;
  setDeferredPrompt: (e: Event | null) => void;
  showUpdateBanner:  boolean;
  setUpdateBanner:   (v: boolean) => void;
  // Fase 2: Confirm dialog state
  confirmDialog:     ConfirmDialogState;
  showConfirmDialog: (state: Omit<ConfirmDialogState, 'open'>) => void;
  closeConfirmDialog: () => void;
  // FIX: loading state saat logout/ganti akun — konsistensi UX
  isLoggingOut:      boolean;
  setLoggingOut:     (v: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  theme: loadTheme(),
  setTheme: (t) => {
    if (typeof window !== 'undefined') localStorage.setItem('wp_theme', t);
    set({ theme: t, darkMode: t !== 'light' });
  },
  darkMode: loadTheme() !== 'light',
  navMode: loadNavMode(),
  setNavMode: (m) => {
    if (typeof window !== 'undefined') localStorage.setItem(NAV_MODE_KEY, m);
    // pindah ke mode bottom: pastikan drawer sidebar tidak tertinggal terbuka
    set(m === 'bottom' ? { navMode: m, sidebarOpen: false } : { navMode: m });
  },
  textSize: loadTextSize(),
  hiddenCards: loadHiddenCards(),
  toggleCardVisible: (screen, id) => set(st => {
    const cur = st.hiddenCards[screen] ?? [];
    const next = { ...st.hiddenCards, [screen]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
    saveHiddenCards(next); return { hiddenCards: next };
  }),
  showAllCards: (screen) => set(st => { const next = { ...st.hiddenCards, [screen]: [] }; saveHiddenCards(next); return { hiddenCards: next }; }),
  setTextSize: (s) => {
    if (typeof window !== 'undefined') { try { localStorage.setItem(TEXT_SIZE_KEY, s); } catch { /* abaikan */ } }
    set({ textSize: s });
  },
  toastPosition: loadToastPosition(),
  setToastPosition: (p) => {
    if (typeof window !== 'undefined') localStorage.setItem(TOAST_POS_KEY, p);
    set({ toastPosition: p });
  },
  sidebarOpen:       false,
  setSidebar:        (v) => set({ sidebarOpen: v }),
  deferredPrompt:    null,
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  showUpdateBanner:  false,
  setUpdateBanner:   (v) => set({ showUpdateBanner: v }),
  // Fase 2: Confirm dialog
  confirmDialog:      DEFAULT_CONFIRM,
  showConfirmDialog:  (state) => set({ confirmDialog: { ...state, open: true } }),
  closeConfirmDialog: () => set({ confirmDialog: DEFAULT_CONFIRM }),
  // FIX: loading state saat logout/ganti akun
  isLoggingOut:       false,
  setLoggingOut:      (v) => set({ isLoggingOut: v }),
});
