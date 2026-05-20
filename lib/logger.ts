// ══════════════════════════════════════════
// lib/logger.ts — Custom logger (menggantikan Sentry dan console.log)
// Strategy: dev → console berwarna | prod → silent (bisa diarahkan ke RTDB jika perlu)
// Semua fungsi logger di seluruh project wajib melalui file ini.
// ══════════════════════════════════════════

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev) console.info(`[WiFi Pay] ℹ️  ${msg}`, data ?? ''); // reason: dev-only log, intentional
  },
  warn: (msg: string, data?: unknown) => {
    if (isDev) console.warn(`[WiFi Pay] ⚠️  ${msg}`, data ?? ''); // reason: dev-only log, intentional
  },
  error: (msg: string, error?: unknown) => {
    // Production: tetap log error ke console (tidak send ke third-party)
    console.error(`[WiFi Pay] ❌ ${msg}`, error ?? ''); // reason: error selalu perlu dicatat, dev & prod
  },
  debug: (msg: string, data?: unknown) => {
    if (isDev) console.debug(`[WiFi Pay] 🔍 ${msg}`, data ?? ''); // reason: debug-only, dev hanya
  },
};
