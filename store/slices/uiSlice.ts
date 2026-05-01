// store/slices/uiSlice.ts — Fase 4: 3-mode theme (light/dark/gold)
// Domain: UI preferences — theme, sidebar, PWA install prompt

import type { StateCreator } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'gold';

function getLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

function loadTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  // Migrate lama: wp_dark_mode = '0' → light, '1' → dark
  const raw = localStorage.getItem('wp_theme');
  if (raw === 'light' || raw === 'dark' || raw === 'gold') return raw;
  // Legacy migration
  const legacy = localStorage.getItem('wp_dark_mode');
  if (legacy === '0') return 'light';
  return 'dark';
}

export interface UiSlice {
  theme:             ThemeMode;
  setTheme:          (t: ThemeMode) => void;
  // Legacy compat — beberapa tempat masih cek darkMode
  darkMode:          boolean;
  sidebarOpen:       boolean;
  setSidebar:        (v: boolean) => void;
  deferredPrompt:    Event | null;
  setDeferredPrompt: (e: Event | null) => void;
  showUpdateBanner:  boolean;
  setUpdateBanner:   (v: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set, get) => ({
  theme: loadTheme(),
  setTheme: (t) => {
    if (typeof window !== 'undefined') localStorage.setItem('wp_theme', t);
    set({ theme: t, darkMode: t !== 'light' });
  },
  // darkMode tetap untuk compat dengan AppShell body class logic
  darkMode: loadTheme() !== 'light',
  sidebarOpen:       false,
  setSidebar:        (v) => set({ sidebarOpen: v }),
  deferredPrompt:    null,
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  showUpdateBanner:  false,
  setUpdateBanner:   (v) => set({ showUpdateBanner: v }),
});
