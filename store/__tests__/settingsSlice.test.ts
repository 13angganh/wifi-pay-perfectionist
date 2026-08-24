// store/__tests__/settingsSlice.test.ts
// Task 4.04 — unit tests untuk settingsSlice:
//   loadSettings (fresh, merge, corrupt JSON), updateSettings (patch, persist)
//
// Diperbarui (fitur Penagih / multi-akun): settingsSlice sekarang memecah
// penyimpanan jadi 2 lapis — per-uid (PIN, biometrik, dll — harus independen
// antar akun) dan device global (bahasa — sengaja ikut device, bukan akun).
// Test di bawah mem-port ulang logika itu sebagai salinan inline (pola yang
// sama seperti versi asli file ini), plus test baru khusus untuk memverifikasi
// properti yang paling kritis: PIN akun A tidak pernah bocor ke akun B di
// device yang sama, dan bahasa tetap konsisten terlepas dari akun mana yang
// login.

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

// ── Inline port dari settingsSlice logic (versi split per-uid/device) ────────
// Test logika murni — tanpa Zustand boilerplate

const DEVICE_KEYS = ['language'] as const;
type DeviceKey = (typeof DEVICE_KEYS)[number];

function perUidKey(uid: string): string {
  return `wp_settings_${uid}`;
}

function readJSON(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeJSON(key: string, value: Record<string, unknown>) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isDeviceKey(k: string): k is DeviceKey {
  return (DEVICE_KEYS as readonly string[]).includes(k);
}

function loadSettings(uid: string | null): AppSettings {
  const base: AppSettings = { ...DEFAULT_SETTINGS };
  const perUid = uid ? readJSON(perUidKey(uid)) : null;
  const merged: AppSettings = { ...base, ...(perUid ?? {}) };

  const device = readJSON('wp_settings');
  const mergedRecord = merged as unknown as Record<string, unknown>;
  for (const k of DEVICE_KEYS) {
    const v = device?.[k];
    if (v !== undefined) mergedRecord[k] = v;
  }
  return merged;
}

function saveSettings(uid: string | null, next: AppSettings, patchKeys: string[]) {
  const nextRecord = next as unknown as Record<string, unknown>;
  const deviceKeysInPatch = patchKeys.filter(isDeviceKey);
  if (deviceKeysInPatch.length > 0) {
    const deviceCurrent = readJSON('wp_settings') ?? {};
    const deviceNext = { ...deviceCurrent };
    for (const k of deviceKeysInPatch) deviceNext[k] = nextRecord[k];
    writeJSON('wp_settings', deviceNext);
  }

  if (uid) {
    const perUidNext: Record<string, unknown> = { ...nextRecord };
    for (const k of DEVICE_KEYS) delete perUidNext[k];
    writeJSON(perUidKey(uid), perUidNext);
  }
}

function makeSlice(initialUid: string | null = null) {
  let settings = loadSettings(initialUid);
  let currentUid = initialUid;

  function updateSettings(patch: Partial<AppSettings>) {
    settings = { ...settings, ...patch };
    saveSettings(currentUid, settings, Object.keys(patch));
  }

  function reloadSettingsForUid(uid: string | null) {
    currentUid = uid;
    settings = loadSettings(uid);
  }

  return {
    getSettings: () => settings,
    updateSettings,
    reloadSettingsForUid,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});
afterEach(() => {
  localStorageMock.clear();
});

// ── loadSettings (tanpa uid — perilaku dasar tetap seperti sebelumnya) ───────

describe('loadSettings (uid null)', () => {
  it('mengembalikan DEFAULT_SETTINGS jika localStorage kosong', () => {
    const { getSettings } = makeSlice();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('mengembalikan DEFAULT_SETTINGS jika JSON rusak', () => {
    localStorage.setItem('wp_settings', '{INVALID_JSON:::');
    const { getSettings } = makeSlice();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('mengembalikan DEFAULT_SETTINGS jika localStorage kosong string', () => {
    localStorage.setItem('wp_settings', '');
    const { getSettings } = makeSlice();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

// ── loadSettings (dengan uid — field per-uid) ─────────────────────────────────

describe('loadSettings (dengan uid)', () => {
  it('merge dengan DEFAULT_SETTINGS jika ada nilai tersimpan di key per-uid', () => {
    localStorage.setItem('wp_settings_userA', JSON.stringify({ pinEnabled: true }));
    const { getSettings } = makeSlice('userA');
    expect(getSettings().pinEnabled).toBe(true);
    // Properti lain tetap default
    expect(getSettings().autoDate).toBe(DEFAULT_SETTINGS.autoDate);
  });

  it('tidak menghapus properti default yang tidak ada di stored value', () => {
    localStorage.setItem('wp_settings_userA', JSON.stringify({ pinEnabled: true }));
    const { getSettings } = makeSlice('userA');
    expect(getSettings().quickAmounts).toEqual(DEFAULT_SETTINGS.quickAmounts);
  });

  it('uid berbeda tidak saling baca data per-uid satu sama lain', () => {
    localStorage.setItem('wp_settings_userA', JSON.stringify({ pin: '1111' }));
    localStorage.setItem('wp_settings_userB', JSON.stringify({ pin: '2222' }));
    expect(makeSlice('userA').getSettings().pin).toBe('1111');
    expect(makeSlice('userB').getSettings().pin).toBe('2222');
  });
});

// ── Split device vs per-uid: kasus paling kritis untuk fitur Penagih ────────

describe('split penyimpanan device (bahasa) vs per-uid (PIN, biometrik)', () => {
  it('PIN yang disimpan untuk uid A TIDAK muncul saat load uid B (device sama)', () => {
    const sliceA = makeSlice('userA');
    sliceA.updateSettings({ pinEnabled: true, pin: 'hash-a' });

    // Device yang sama, ganti ke uid B (skenario: HP dipakai gantian)
    const sliceB = makeSlice('userB');
    expect(sliceB.getSettings().pin).toBe(DEFAULT_SETTINGS.pin);
    expect(sliceB.getSettings().pinEnabled).toBe(DEFAULT_SETTINGS.pinEnabled);
  });

  it('biometricEnabled uid A tidak bocor ke uid B', () => {
    const sliceA = makeSlice('userA');
    sliceA.updateSettings({ biometricEnabled: true });

    const sliceB = makeSlice('userB');
    expect(sliceB.getSettings().biometricEnabled).toBe(false);
  });

  it('bahasa (language) TETAP SAMA meski ganti uid di device yang sama', () => {
    const sliceA = makeSlice('userA');
    sliceA.updateSettings({ language: 'en' });

    // Ganti akun — reload ke uid B lewat instance yang sama (simulasi
    // login/logout di device yang sama, bukan slice baru dari nol)
    sliceA.reloadSettingsForUid('userB');
    expect(sliceA.getSettings().language).toBe('en');

    // Slice benar-benar baru (reload halaman) untuk uid B juga tetap 'en'
    const sliceBFresh = makeSlice('userB');
    expect(sliceBFresh.getSettings().language).toBe('en');
  });

  it('reloadSettingsForUid memuat ulang PIN sesuai uid baru pada slice yang sama', () => {
    const slice = makeSlice('userA');
    slice.updateSettings({ pin: 'hash-a', pinEnabled: true });
    expect(slice.getSettings().pin).toBe('hash-a');

    slice.reloadSettingsForUid('userB');
    expect(slice.getSettings().pin).toBe(DEFAULT_SETTINGS.pin);
    expect(slice.getSettings().pinEnabled).toBe(DEFAULT_SETTINGS.pinEnabled);

    slice.reloadSettingsForUid('userA');
    expect(slice.getSettings().pin).toBe('hash-a');
  });

  it('reloadSettingsForUid(null) — logout tidak meninggalkan PIN akun sebelumnya di state', () => {
    const slice = makeSlice('userA');
    slice.updateSettings({ pin: 'hash-a', pinEnabled: true });

    slice.reloadSettingsForUid(null);
    expect(slice.getSettings().pin).toBe(DEFAULT_SETTINGS.pin);
    expect(slice.getSettings().pinEnabled).toBe(DEFAULT_SETTINGS.pinEnabled);
  });

  it('updateSettings dengan uid null tidak menulis ke key per-uid manapun', () => {
    const slice = makeSlice(null);
    slice.updateSettings({ language: 'en' });
    // Cuma key device yang boleh kesentuh — tidak ada key per-uid yang dibuat
    const perUidKeys = Object.keys(store).filter(k => k.startsWith('wp_settings_'));
    expect(perUidKeys).toEqual([]);
  });
});

// ── updateSettings (perilaku dasar tetap seperti sebelumnya) ─────────────────

describe('updateSettings', () => {
  it('mengupdate state', () => {
    const { getSettings, updateSettings } = makeSlice('userA');
    updateSettings({ language: 'en' });
    expect(getSettings().language).toBe('en');
  });

  it('menyimpan field device ke key wp_settings (bukan key per-uid)', () => {
    const { updateSettings } = makeSlice('userA');
    updateSettings({ language: 'en' });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'wp_settings',
      expect.stringContaining('"language":"en"'),
    );
  });

  it('menyimpan field per-uid ke key wp_settings_<uid>', () => {
    const { updateSettings } = makeSlice('userA');
    updateSettings({ pinEnabled: true });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'wp_settings_userA',
      expect.stringContaining('"pinEnabled":true'),
    );
  });

  it('partial patch tidak menghapus properti lain', () => {
    const { getSettings, updateSettings } = makeSlice('userA');
    updateSettings({ pinEnabled: true });
    expect(getSettings().autoDate).toBe(DEFAULT_SETTINGS.autoDate);
    expect(getSettings().pinEnabled).toBe(true);
  });

  it('update berturut-turut terakumulasi dengan benar', () => {
    const { getSettings, updateSettings } = makeSlice('userA');
    updateSettings({ language: 'en' });
    updateSettings({ pinEnabled: true });
    expect(getSettings().language).toBe('en');
    expect(getSettings().pinEnabled).toBe(true);
  });

  it('quickAmounts bisa diupdate dengan array baru', () => {
    const { getSettings, updateSettings } = makeSlice('userA');
    updateSettings({ quickAmounts: [50, 100, 200] });
    expect(getSettings().quickAmounts).toEqual([50, 100, 200]);
  });

  it('nilai PIN tersimpan dapat dibaca kembali setelah "reload" (uid sama)', () => {
    const { updateSettings } = makeSlice('userA');
    updateSettings({ pin: '1234' });

    // Buat slice baru dengan uid sama — simulasi reload halaman, akun tetap login
    const { getSettings: getSettings2 } = makeSlice('userA');
    expect(getSettings2().pin).toBe('1234');
  });
});
