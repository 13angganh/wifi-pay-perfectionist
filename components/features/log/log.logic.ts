// ══════════════════════════════════════════
// components/features/log/log.logic.ts — logika murni layar Log (REDESAIN T10, prototype T5, D4 + A27/A28/A29)
// Tanpa store/React. Aturan zip yang DIPERTAHANKAN persis: filter "Hanya Bayar" (isPayLog), pencarian substring
// (textMatch) di aksi + detail, filter Tahun/Bulan, batas tampil 150 baris. Teks aksi di database tidak diubah.
// A27: klasifikasi eksklusif Pembayaran / Sistem / Data. A29: statistik dihitung dari activityLog (tanpa field baru).
// ══════════════════════════════════════════
import type { ActivityLog } from '@/types';
import { textMatch } from '@/lib/member';

export const LOG_LIMIT = 150;

export type LogKind = 'pay' | 'data' | 'sys';
export type LogFilterType = 'all' | LogKind;

/** Aturan "Hanya Bayar" dari zip (LogView v11.7.1), tidak diubah. */
export function isPayLog(action: string): boolean {
  const a = action || '';
  return !!a && (
    a.includes('Quick Pay')
    || a.startsWith('[PAY]') || a.startsWith('[DEL]') || a.startsWith('[FREE]')
    // Legacy: data lama memakai awalan emoji (kantong uang, tempat sampah, tanda "FREE")
    || /^[\u{1F4B0}\u{1F5D1}\u{1F193}]/u.test(a)
    || a.includes('Hapus bayar')
  );
}

const SYS_WORDS = /^(login|masuk|logout|keluar|kunci|lock|sync)/i;
const SYS_TAGS = /^\[(SYNC|LOGIN|LOGOUT|LOCK|SYS)\]/i;

/** A27: Pembayaran = aturan zip; sisanya Sistem bila berawalan kata sesi/kunci/sinkron, selain itu Data. */
export function logKind(action: string): LogKind {
  if (isPayLog(action)) return 'pay';
  const a = (action || '').trim();
  if (SYS_TAGS.test(a)) return 'sys';
  const bare = a.replace(/^\[[A-Z_]+\]\s*/, '');
  return SYS_WORDS.test(bare) ? 'sys' : 'data';
}

export interface LogFilter {
  type: LogFilterType;
  query: string;
  /** '' = semua tahun */
  year: string;
  /** '' = semua bulan; selain itu indeks bulan 0–11 sebagai teks */
  month: string;
}

/** Filter lengkap. `ignoreType` dipakai untuk menghitung jumlah per jenis pada filter lain yang sama. */
export function filterLogs(logs: ActivityLog[], f: LogFilter, ignoreType = false): ActivityLog[] {
  let out = [...logs];
  if (!ignoreType && f.type !== 'all') out = out.filter(l => logKind(l.action) === f.type);
  if (f.query.trim()) out = out.filter(l => textMatch(l.action || '', f.query) || textMatch(l.detail || '', f.query));
  if (f.year) out = out.filter(l => new Date(l.ts).getFullYear() === +f.year);
  if (f.month) out = out.filter(l => new Date(l.ts).getMonth() === +f.month);
  return out;
}

export function isFilterActive(f: LogFilter): boolean {
  return f.type !== 'all' || !!f.query.trim() || !!f.year || !!f.month;
}

export function countByKind(logs: ActivityLog[]): { total: number; pay: number; data: number; sys: number } {
  const r = { total: logs.length, pay: 0, data: 0, sys: 0 };
  for (const l of logs) r[logKind(l.action)]++;
  return r;
}

export interface DayGroup { key: string; label: string; items: ActivityLog[] }

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Kelompokkan per hari (urutan input dipertahankan): "Hari ini", "Kemarin", atau tanggal lokal. */
export function groupByDay(logs: ActivityLog[], now: Date, labels: { today: string; yesterday: string }): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const l of logs) {
    const d = new Date(l.ts);
    const key = String(startOfDay(d));
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
      g = { key, label: diff === 0 ? labels.today : diff === 1 ? labels.yesterday : d.toLocaleDateString(), items: [] };
      groups.push(g);
    }
    g.items.push(l);
  }
  return groups;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatFull(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

/** A29: bulan yang digrafikkan = bulan terpilih (tahun terpilih atau tahun berjalan); tanpa bulan = bulan entri terbaru. */
export function statsPeriod(logs: ActivityLog[], year: string, month: string, now: Date): { year: number; month: number } {
  if (month) return { year: year ? +year : now.getFullYear(), month: +month };
  const newest = logs.reduce<ActivityLog | null>((a, l) => (!a || l.ts > a.ts ? l : a), null);
  const ref = newest ? new Date(newest.ts) : now;
  return { year: year ? +year : ref.getFullYear(), month: ref.getMonth() };
}

/** Jumlah aktivitas per hari (indeks 0 = tanggal 1) untuk bulan tertentu. */
export function dailyCounts(logs: ActivityLog[], year: number, month: number): number[] {
  const days = new Date(year, month + 1, 0).getDate();
  const out = new Array<number>(days).fill(0);
  for (const l of logs) {
    const d = new Date(l.ts);
    if (d.getFullYear() === year && d.getMonth() === month) out[d.getDate() - 1]++;
  }
  return out;
}

export function recentLogs(logs: ActivityLog[], n: number): ActivityLog[] {
  return [...logs].sort((a, b) => b.ts - a.ts).slice(0, n);
}

/** Cari log berdasarkan `ts` (dipakai Pusat Notifikasi → Detail Log). */
export function findLogByTs(logs: ActivityLog[], ts: number): ActivityLog | undefined {
  return logs.find(l => l.ts === ts);
}
