// ══════════════════════════════════════════
// components/features/settings/settingsBridge.ts — jembatan "buka halaman Pengaturan" dari Pusat Notifikasi (REDESAIN T10, D12)
// Pola sama dengan logDetailBridge: tanpa menyentuh store. Item notifikasi backup → halaman Export & Import.
// ══════════════════════════════════════════
export type SettingsPageKey =
  | 'textsize'
  | 'email' | 'tenant' | 'pin' | 'bio' | 'zone' | 'ip' | 'quick' | 'autodate'
  | 'export' | 'wa' | 'theme' | 'nav' | 'toast' | 'lang';

export const SETTINGS_PAGE_EVENT = 'wp:open-settings-page';
let pending: SettingsPageKey | null = null;

export function requestSettingsPage(key: SettingsPageKey): void {
  pending = key;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SETTINGS_PAGE_EVENT, { detail: key }));
}

export function takePendingSettingsPage(): SettingsPageKey | null {
  const v = pending;
  pending = null;
  return v;
}
