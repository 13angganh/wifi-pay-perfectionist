// components/features/notifications/__tests__/notifications.logic.test.ts — REDESAIN T10 (A3 Pusat Notifikasi)
import { describe, it, expect, beforeEach } from 'vitest';
import type { ActivityLog } from '@/types';
import {
  MAX_LOG_ITEMS, BACKUP_STALE_DAYS, buildNotifications, backupIsStale, isUnread, unreadCount, markAllRead,
  loadReadSet, saveReadSet, readKey, lastBackupMs,
} from '../notifications.logic';

const now = Date.UTC(2026, 9, 18);
const DAY = 86_400_000;
const logs = (n: number): ActivityLog[] => Array.from({ length: n }, (_, i) => ({ action: `Aksi ${i}`, detail: '', user: 'o', ts: now - i * 1000 }));
const base = { logs: [] as ActivityLog[], syncStatus: 'ok' as const, online: true, lastBackup: now - DAY, now };

beforeEach(() => localStorage.clear());

describe('buildNotifications', () => {
  it('maksimal 8 aktivitas terbaru, terbaru dulu', () => {
    const items = buildNotifications({ ...base, logs: logs(20) });
    const l = items.filter(i => i.kind === 'log');
    expect(l).toHaveLength(MAX_LOG_ITEMS);
    expect(l[0].log!.action).toBe('Aksi 0');
  });
  it('item sinkron di paling atas dan bersifat sementara', () => {
    const items = buildNotifications({ ...base, logs: logs(2), syncStatus: 'err', online: false });
    expect(items.slice(0, 2).map(i => i.kind)).toEqual(['sync-offline', 'sync-err']);
    expect(items[0].transient).toBe(true);
  });
  it('backup: diingatkan bila belum pernah atau lebih dari 30 hari', () => {
    expect(BACKUP_STALE_DAYS).toBe(30);
    expect(backupIsStale(0, now)).toBe(true);
    expect(backupIsStale(now - 31 * DAY, now)).toBe(true);
    expect(backupIsStale(now - 5 * DAY, now)).toBe(false);
    expect(buildNotifications({ ...base, lastBackup: 0 }).some(i => i.kind === 'backup')).toBe(true);
    expect(buildNotifications(base).some(i => i.kind === 'backup')).toBe(false);
  });
  it('kosong bila tidak ada apa pun', () => expect(buildNotifications(base)).toEqual([]));
});

describe('belum dibaca per-uid', () => {
  it('item tetap: belum dibaca sampai ditandai; item sementara selalu belum dibaca', () => {
    const items = buildNotifications({ ...base, logs: logs(3), syncStatus: 'err' });
    const read = new Set<string>();
    expect(unreadCount(items, read)).toBe(4);
    const after = markAllRead(items, read);
    expect(unreadCount(items, after)).toBe(1); // sync-err tetap
    expect(isUnread(items.find(i => i.kind === 'log')!, after)).toBe(false);
  });
  it('disimpan per uid di localStorage dan dibaca kembali', () => {
    saveReadSet('u1', new Set(['a', 'b']));
    expect([...loadReadSet('u1')].sort()).toEqual(['a', 'b']);
    expect(loadReadSet('u2').size).toBe(0);
    expect(readKey('u1')).not.toBe(readKey('u2'));
  });
  it('data rusak di localStorage tidak melempar', () => {
    localStorage.setItem(readKey('u1'), '{bukan json');
    expect(loadReadSet('u1').size).toBe(0);
  });
  it('lastBackupMs membaca wp_last_backup', () => {
    expect(lastBackupMs()).toBe(0);
    localStorage.setItem('wp_last_backup', '12345');
    expect(lastBackupMs()).toBe(12345);
  });
});
