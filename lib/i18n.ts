// ══════════════════════════════════════════
// lib/i18n.ts — Sistem multi-bahasa WiFi Pay
// ══════════════════════════════════════════
import id from './locales/id';
import en from './locales/en';

type Language = 'id' | 'en';

const locales: Record<Language, Record<string, string>> = { id, en };

// ── Ambil bahasa aktif dari localStorage ──
function getCurrentLang(): Language {
  if (typeof window === 'undefined') return 'id';
  try {
    const raw = localStorage.getItem('wp_settings');
    if (!raw) return 'id';
    const parsed = JSON.parse(raw);
    return parsed?.language === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

// ── Fungsi terjemahan utama ──
// Gunakan: t('nav.dashboard') → 'Dashboard' / 'Dashboard'
// Gunakan: t('status.lunas') → 'Lunas' / 'Paid'
export function t(key: string, lang?: Language): string {
  const activeLang = lang ?? getCurrentLang();
  const locale = locales[activeLang] ?? locales['id'];
  return locale[key] ?? locales['id'][key] ?? key;
}

// ── Hook-friendly: buat translator dengan lang tetap ──
// Pakai ini di komponen agar tidak re-read localStorage setiap render
export function createTranslator(lang: Language) {
  const locale = locales[lang] ?? locales['id'];
  return (key: string): string => locale[key] ?? locales['id'][key] ?? key;
}

// ── Ekspor ulang tipe ──
export type { Language };

// ── tLog: translator untuk log actions (bisa dipakai di luar React) ──
// Import store secara lazy untuk hindari circular dependency
export function tLog(key: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppStore } = require('@/store/useAppStore');
    const lang: Language = (useAppStore.getState()?.settings as any)?.language ?? 'id';
    return createTranslator(lang)(key);
  } catch {
    return t(key, 'id');
  }
}
