// store/slices/uiSlice.ts
// Domain: UI preferences — dark mode, sidebar, PWA install prompt

import type { StateCreator } from 'zustand';

function getLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export interface UiSlice {
  darkMode:          boolean;
  toggleTheme:       () => void;
  sidebarOpen:       boolean;
  setSidebar:        (v: boolean) => void;
  deferredPrompt:    Event | null;
  setDeferredPrompt: (e: Event | null) => void;
  showUpdateBanner:  boolean;
  setUpdateBanner:   (v: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set, get) => ({
  darkMode:    getLS('wp_dark_mode', '1') !== '0',
  toggleTheme: () => {
    const next = !get().darkMode;
    if (typeof window !== 'undefined') localStorage.setItem('wp_dark_mode', next ? '1' : '0');
    set({ darkMode: next });
  },
  sidebarOpen:       false,
  setSidebar:        (v) => set({ sidebarOpen: v }),
  deferredPrompt:    null,
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  showUpdateBanner:  false,
  setUpdateBanner:   (v) => set({ showUpdateBanner: v }),
});
