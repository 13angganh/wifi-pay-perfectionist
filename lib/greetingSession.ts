// ══════════════════════════════════════════
// lib/greetingSession.ts — v11.11.0
// Sesi sapaan (state modul + riwayat localStorage). Setiap app DIBUKA (halaman dimuat) atau KEMBALI dari latar belakang
// setelah ≥ 2 menit = sesi baru = sapaan baru (nada, judul, dan baris konteks dipilih ulang dan tidak mengulang yang
// terakhir dipakai). Dalam satu sesi sapaan TETAP. Riwayat 4 terakhir: localStorage `wp_greet_recent` (per perangkat).
// Dipisah dari hook agar state modul tidak dimutasi langsung di dalam komponen React.
// ══════════════════════════════════════════
import {
  EMPTY_HISTORY, pickTitleId, pickTone, pushHistory, slotForHour,
  type GreetHistory, type GreetSlot, type GreetTone,
} from './greeting';

const KEY = 'wp_greet_recent';
export const GREETING_REOPEN_MS = 2 * 60 * 1000;

export interface GreetSession {
  tone: GreetTone; titleId: string; slot: GreetSlot; roll: number; startedAt: number;
  recentLines: string[]; lineCommitted: boolean;
}

let session: GreetSession | null = null;
let hiddenAt = 0;

export function resetGreetingSession(): void { session = null; hiddenAt = 0; }

function loadHistory(): GreetHistory {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<GreetHistory> | null;
    if (!raw) return EMPTY_HISTORY;
    const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]).slice(0, 8) : []);
    return { titles: arr<string>(raw.titles), lines: arr<string>(raw.lines), tones: arr<GreetTone>(raw.tones) };
  } catch { return EMPTY_HISTORY; }
}
function saveHistory(h: GreetHistory): void {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch { /* penyimpanan penuh/diblokir: sapaan tetap jalan */ }
}

function startSession(now: Date): GreetSession {
  const history = loadHistory();
  const slot = slotForHour(now.getHours());
  const tone = pickTone(history, Math.random);
  const titleId = pickTitleId({ slot, tone, recent: history.titles, rng: Math.random });
  saveHistory(pushHistory(history, { title: titleId, tone }));
  return { tone, titleId, slot, roll: Math.random(), startedAt: now.getTime(), recentLines: history.lines, lineCommitted: false };
}

/** Sesi saat ini; dibuat bila belum ada (idempoten: aman dipanggil berkali-kali saat render). */
export function getGreetingSession(now: Date = new Date()): GreetSession {
  if (!session) session = startSession(now);
  return session;
}

/** Catat baris konteks pertama yang tampil di sesi ini agar tidak diulang di sesi berikutnya. */
export function commitGreetingLine(lineId: string): void {
  if (!session || session.lineCommitted) return;
  session.lineCommitted = true;
  saveHistory(pushHistory(loadHistory(), { line: lineId }));
}

/** Panggil saat tab/app disembunyikan. */
export function noteGreetingHidden(now: number = Date.now()): void { hiddenAt = now; }

/** Panggil saat tab/app tampil lagi. true = sudah ≥ 2 menit → sesi direset (sapaan baru pada render berikutnya). */
export function noteGreetingVisible(now: number = Date.now()): boolean {
  const reopened = hiddenAt > 0 && now - hiddenAt >= GREETING_REOPEN_MS;
  if (reopened) session = null;
  hiddenAt = 0;
  return reopened;
}
