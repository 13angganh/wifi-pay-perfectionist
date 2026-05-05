// store/slices/uiSlice.ts — 3-mode theme (light/dark/gold)
// Domain: UI preferences — theme, sidebar, PWA install prompt, confirm dialog

import type { StateCreator } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'gold';

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

const DEFAULT_CONFIRM: ConfirmDialogState = {
  open: false, title: 'Yakin?', yesLabel: 'Ya', cb: null,
};

export interface UiSlice {
  theme:             ThemeMode;
  setTheme:          (t: ThemeMode) => void;
  // Legacy compat
  darkMode:          boolean;
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
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  theme: loadTheme(),
  setTheme: (t) => {
    if (typeof window !== 'undefined') localStorage.setItem('wp_theme', t);
    set({ theme: t, darkMode: t !== 'light' });
  },
  darkMode: loadTheme() !== 'light',
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
});
