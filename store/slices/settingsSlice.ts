// store/slices/settingsSlice.ts
// Domain: pengaturan lokal — PIN, tanggal otomatis, quick amounts

import type { StateCreator } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem('wp_settings');
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(s: AppSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wp_settings', JSON.stringify(s));
}

export interface SettingsSlice {
  settings:     AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  // PIN lock state (runtime only, tidak disimpan)
  pinUnlocked:  boolean;
  setPinUnlocked: (v: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings:    loadSettings(),
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },
  pinUnlocked:  false,
  setPinUnlocked: (v) => set({ pinUnlocked: v }),
});
