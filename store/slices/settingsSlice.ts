// store/slices/settingsSlice.ts
// Domain: pengaturan lokal — PIN, tanggal otomatis, quick amounts
//
// Penyimpanan dipecah jadi 2 lapis (task: fitur Penagih / multi-akun):
//   - PER-UID (`wp_settings_${uid}`): field yang harus independen per akun —
//     pin, pinEnabled, biometricEnabled, pinTimeoutMinutes, dan preferensi
//     operasional lain (quickAmounts, customZones, hiddenZones, zoneNames,
//     autoDate). Kalau device dipakai gantian antar akun (owner ↔ penagih),
//     PIN/biometrik TIDAK BOLEH saling timpa.
//   - GLOBAL DEVICE (`wp_settings` legacy, tanpa uid): hanya `language`.
//     Sengaja ikut device, bukan akun — supaya AppErrorBoundary.tsx dan
//     lib/i18n.ts (yang baca localStorage langsung, tanpa tahu uid) tetap
//     jalan tanpa perubahan. `theme` sudah lebih dulu terpisah (key
//     `wp_theme` di uiSlice.ts) dengan alasan device-level yang sama.

import type { StateCreator } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

// Field yang TIDAK ikut per-uid — tetap di key global device.
const DEVICE_KEYS = ['language'] as const;
type DeviceKey = (typeof DEVICE_KEYS)[number];

function perUidKey(uid: string): string {
  return `wp_settings_${uid}`;
}

function readJSON(key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeJSON(key: string, value: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Gabungkan: default → nilai per-uid → override field device dari key global.
// Dipakai baik untuk load awal (uid null → semua default+device saja)
// maupun reload setelah login (uid terisi).
function loadSettings(uid: string | null): AppSettings {
  const base: AppSettings = { ...DEFAULT_SETTINGS };
  const perUid = uid ? readJSON(perUidKey(uid)) : null;
  const merged: AppSettings = { ...base, ...(perUid ?? {}) };

  // Field device selalu diambil dari key global, menimpa apapun yang ada
  // di per-uid (jaga-jaga kalau versi lama pernah nyimpan language di sana).
  const device = readJSON('wp_settings');
  const mergedRecord = merged as unknown as Record<string, unknown>;
  for (const k of DEVICE_KEYS) {
    const v = device?.[k];
    if (v !== undefined) mergedRecord[k] = v;
  }
  return merged;
}

function isDeviceKey(k: string): k is DeviceKey {
  return (DEVICE_KEYS as readonly string[]).includes(k);
}

// Simpan patch: pecah ke key device (global) dan key per-uid sesuai field-nya.
function saveSettings(uid: string | null, next: AppSettings, patchKeys: string[]) {
  if (typeof window === 'undefined') return;

  const nextRecord = next as unknown as Record<string, unknown>;
  const deviceKeysInPatch = patchKeys.filter(isDeviceKey);
  if (deviceKeysInPatch.length > 0) {
    const deviceCurrent = readJSON('wp_settings') ?? {};
    const deviceNext = { ...deviceCurrent };
    for (const k of deviceKeysInPatch) deviceNext[k] = nextRecord[k];
    writeJSON('wp_settings', deviceNext);
  }

  if (uid) {
    // Simpan seluruh `next` MINUS field device — field device sudah
    // dipisah ke key global barusan, jangan diduplikasi di sini.
    const perUidNext: Record<string, unknown> = { ...nextRecord };
    for (const k of DEVICE_KEYS) delete perUidNext[k];
    writeJSON(perUidKey(uid), perUidNext);
  }
  // uid null (belum login): field non-device tidak punya tempat sah untuk
  // disimpan permanen — cuma hidup di memori sampai login. Ini konsisten
  // dengan gate <profile>/`authChecked` yang sudah menahan akses UI utama
  // sebelum auth resolve, jadi kasus ini jarang tersentuh user nyata.
}

export interface SettingsSlice {
  settings:       AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  // Dipanggil dari useAuth.ts tepat setelah setUser()/clearUser() — titik
  // pertama uid diketahui (atau diketahui kosong). Reload settings dari
  // key per-uid yang sesuai supaya PIN/biometrik ikut akun yang login, dan
  // simpan uid itu di slice ini sendiri (bukan cross-read ke authSlice —
  // menjaga slice ini isolated, konsisten dengan slice lain di repo).
  reloadSettingsForUid: (uid: string | null) => void;
  // PIN lock state (runtime only, tidak disimpan)
  pinUnlocked:    boolean;
  setPinUnlocked: (v: boolean) => void;
}

// uid milik slice ini sendiri — TIDAK dipakai oleh komponen lain (bukan
// bagian dari kontrak SettingsSlice di atas), murni state internal supaya
// updateSettings tahu ke mana harus menulis tanpa perlu baca authSlice.
// Di-export HANYA supaya useAppStore.ts bisa menyatakan tipe AppStore
// gabungan dengan benar (Zustand butuh combine-type mencakup field ini) —
// bukan untuk dipakai langsung oleh komponen manapun.
export interface InternalSettingsState {
  _settingsUid: string | null;
}

export const createSettingsSlice: StateCreator<SettingsSlice & InternalSettingsState> = (set, get) => ({
  // Saat store dibuat, uid belum diketahui (auth belum resolve) — load
  // dengan uid=null dulu (default + field device saja). reloadSettingsForUid
  // akan dipanggil begitu auth resolve untuk mengisi field per-uid yang benar.
  settings:     loadSettings(null),
  _settingsUid: null,
  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(get()._settingsUid, next, Object.keys(patch));
    set({ settings: next });
  },
  reloadSettingsForUid: (uid) => {
    set({ settings: loadSettings(uid), _settingsUid: uid });
  },
  pinUnlocked:    false,
  setPinUnlocked: (v) => set({ pinUnlocked: v }),
});
