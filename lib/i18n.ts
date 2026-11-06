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
    const lang: Language = useAppStore.getState()?.settings?.language ?? 'id';
    return createTranslator(lang)(key);
  } catch {
    // v11.11.1: cadangan membaca bahasa dari localStorage (sama seperti t()), bukan dipaksa 'id' —
    // supaya pesan tetap mengikuti bahasa app walau store tidak bisa dimuat lewat require().
    return t(key);
  }
}

// ── v11.11.1: bahasa aktif (di luar React) + pengisi placeholder {nama} ──
// Dipakai ekspor Excel/PDF/WA agar mengikuti bahasa app, sama seperti tLog().
export function getActiveLang(): Language {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAppStore } = require('@/store/useAppStore');
    return useAppStore.getState()?.settings?.language === 'en' ? 'en' : 'id';
  } catch {
    return getCurrentLang();
  }
}

/** Isi placeholder {nama} pada kalimat terjemahan (satu kalimat utuh per bahasa, bukan potongan yang disambung). */
export function fillText(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
