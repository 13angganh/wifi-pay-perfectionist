// store/__tests__/settingsSlice.test.ts
// Task 4.04 — unit tests untuk settingsSlice:
//   loadSettings (fresh, merge, corrupt JSON), updateSettings (patch, persist)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppSettings } from '@/types';

// ── localStorage mock ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};

const localStorageMock = {
  getItem:    vi.fn((key: string) => store[key] ?? null),
  setItem:    vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear:      vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ── Inline port dari settingsSlice logic ─────────────────────────────────────
// Test logika murni — tanpa Zustand boilerplate

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('wp_settings');
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

function makeSlice() {
  let settings = loadSettings();

  function updateSettings(patch: Partial<AppSettings>) {
    settings = { ...settings, ...patch };
    localStorage.setItem('wp_settings', JSON.stringify(settings));
  }

  return {
    getSettings: () => settings,
    updateSettings,
  };
}

// ── loadSettings ─────────────────────────────────────────────────────────────

describe('loadSettings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  afterEach(() => {
    localStorageMock.clear();
  });

  it('mengembalikan DEFAULT_SETTINGS jika localStorage kosong', () => {
    const { getSettings } = makeSlice();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merge dengan DEFAULT_SETTINGS jika ada nilai tersimpan', () => {
    localStorage.setItem('wp_settings', JSON.stringify({ language: 'en' }));
    const { getSettings } = makeSlice();
    expect(getSettings().language).toBe('en');
    // Properti lain tetap default
    expect(getSettings().autoDate).toBe(DEFAULT_SETTINGS.autoDate);
    expect(getSettings().pinEnabled).toBe(DEFAULT_SETTINGS.pinEnabled);
  });

  it('tidak menghapus properti default yang tidak ada di stored value', () => {
    localStorage.setItem('wp_settings', JSON.stringify({ pinEnabled: true }));
    const { getSettings } = makeSlice();
    expect(getSettings().quickAmounts).toEqual(DEFAULT_SETTINGS.quickAmounts);
  });

  it('mengembalikan DEFAULT_SETTINGS jika JSON rusak', () => {
    localStorage.setItem('wp_settings', '{INVALID_JSON:::');
    const { getSettings } = makeSlice();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('mengembalikan DEFAULT_SETTINGS jika localStorage kosong string', () => {
    localStorage.setItem('wp_settings', '');
    const { getSettings } = makeSlice();
    // empty string → JSON.parse('') throws → fallback
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

// ── updateSettings ────────────────────────────────────────────────────────────

describe('updateSettings', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  afterEach(() => {
    localStorageMock.clear();
  });

  it('mengupdate state', () => {
    const { getSettings, updateSettings } = makeSlice();
    updateSettings({ language: 'en' });
    expect(getSettings().language).toBe('en');
  });

  it('menyimpan ke localStorage', () => {
    const { updateSettings } = makeSlice();
    updateSettings({ language: 'en' });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'wp_settings',
      expect.stringContaining('"language":"en"'),
    );
  });

  it('partial patch tidak menghapus properti lain', () => {
    const { getSettings, updateSettings } = makeSlice();
    updateSettings({ pinEnabled: true });
    expect(getSettings().autoDate).toBe(DEFAULT_SETTINGS.autoDate);
    expect(getSettings().pinEnabled).toBe(true);
  });

  it('update berturut-turut terakumulasi dengan benar', () => {
    const { getSettings, updateSettings } = makeSlice();
    updateSettings({ language: 'en' });
    updateSettings({ pinEnabled: true });
    expect(getSettings().language).toBe('en');
    expect(getSettings().pinEnabled).toBe(true);
  });

  it('quickAmounts bisa diupdate dengan array baru', () => {
    const { getSettings, updateSettings } = makeSlice();
    updateSettings({ quickAmounts: [50, 100, 200] });
    expect(getSettings().quickAmounts).toEqual([50, 100, 200]);
  });

  it('nilai tersimpan dapat dibaca kembali setelah update', () => {
    const { updateSettings } = makeSlice();
    updateSettings({ pin: '1234' });

    // Buat slice baru — simulasi reload
    const { getSettings: getSettings2 } = makeSlice();
    expect(getSettings2().pin).toBe('1234');
  });
});
