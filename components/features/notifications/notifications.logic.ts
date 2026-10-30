// ══════════════════════════════════════════
// components/features/notifications/notifications.logic.ts — logika murni Pusat Notifikasi (A3) (REDESAIN T10, D12)
// Sumber (tanpa field Firebase baru): 8 aktivitas terbaru dari activityLog, info backup (localStorage wp_last_backup),
// dan item status sinkron (Gagal simpan, Offline). Penanda dibaca disimpan PER-UID di localStorage
// (kunci `wp_notif_read_<uid>`); item sinkron bersifat sementara (selalu belum dibaca selama kondisinya ada).
// ══════════════════════════════════════════
import type { ActivityLog, SyncStatus } from '@/types';

export const MAX_LOG_ITEMS = 8;
/** Backup dianggap perlu diingatkan bila terakhir lebih dari 30 hari lalu (atau belum pernah). */
export const BACKUP_STALE_DAYS = 30;

export type NotifKind = 'log' | 'backup' | 'sync-err' | 'sync-offline';

export interface NotifItem {
  id: string;
  kind: NotifKind;
  /** `ts` aktivitas (kind log) / waktu backup terakhir (kind backup; 0 = belum pernah) */
  ts: number;
  log?: ActivityLog;
  /** item sementara: selalu dihitung belum dibaca */
  transient: boolean;
}

export const readKey = (uid: string) => `wp_notif_read_${uid || 'anon'}`;

export function loadReadSet(uid: string): Set<string> {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(readKey(uid));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch { return new Set(); }
}

export function saveReadSet(uid: string, set: Set<string>): void {
  try { window.localStorage.setItem(readKey(uid), JSON.stringify([...set].slice(-200))); } catch { /* penyimpanan penuh/diblokir: abaikan */ }
}

export function lastBackupMs(): number {
  try {
    const v = typeof window === 'undefined' ? null : window.localStorage.getItem('wp_last_backup');
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function backupIsStale(lastMs: number, now: number): boolean {
  return !lastMs || now - lastMs > BACKUP_STALE_DAYS * 86_400_000;
}

export interface BuildInput {
  logs: ActivityLog[];
  syncStatus: SyncStatus;
  online: boolean;
  lastBackup: number;
  now: number;
}

/** Susunan: item sinkron (paling penting) → backup → aktivitas terbaru. */
export function buildNotifications({ logs, syncStatus, online, lastBackup, now }: BuildInput): NotifItem[] {
  const out: NotifItem[] = [];
  if (!online || syncStatus === 'offline') out.push({ id: 'sync:offline', kind: 'sync-offline', ts: now, transient: true });
  if (syncStatus === 'err') out.push({ id: 'sync:err', kind: 'sync-err', ts: now, transient: true });
  if (backupIsStale(lastBackup, now)) out.push({ id: `backup:${lastBackup}`, kind: 'backup', ts: lastBackup, transient: false });
  [...logs].sort((a, b) => b.ts - a.ts).slice(0, MAX_LOG_ITEMS)
    .forEach((l, i) => out.push({ id: `log:${l.ts}:${i}`, kind: 'log', ts: l.ts, log: l, transient: false }));
  return out;
}

export const isUnread = (n: NotifItem, read: Set<string>) => n.transient || !read.has(n.id);
export const unreadCount = (items: NotifItem[], read: Set<string>) => items.filter(n => isUnread(n, read)).length;

/** Tandai semua item tetap sebagai dibaca (item sementara tidak disimpan). */
export function markAllRead(items: NotifItem[], read: Set<string>): Set<string> {
  const next = new Set(read);
  items.forEach(n => { if (!n.transient) next.add(n.id); });
  return next;
}
