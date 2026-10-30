// ══════════════════════════════════════════
// components/features/notifications/NotificationCenter.tsx — isi Pusat Notifikasi (A3) (REDESAIN T10, D12)
// Dipasang di Header menggantikan <HeaderNotifications /> kosong (kerangka T6). Lencana lonceng = jumlah belum dibaca.
// Item Log membuka Detail Log; item backup membuka Export & Import; item sinkron tidak berpindah halaman.
// Keadaan: loading (skeleton), kosong, error (gagal memuat), daftar. Penanda dibaca per-uid di localStorage.
// ══════════════════════════════════════════
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BellSlash, CloudSlash, FloppyDisk, WifiSlash, Warning } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import HeaderNotifications from '@/components/layout/Header.Notifications';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconTile, type TileTone } from '@/components/ui/IconTile';
import type { AnyIcon } from '@/components/ui/icons';
import { SkeletonList } from '@/components/ui/Skeleton';
import { getActivityMeta, stripActionTag, formatActivityTime } from '@/components/features/dashboard/DashboardView.RecentActivity';
import { requestLogDetail } from '@/components/features/log/logDetailBridge';
import { requestSettingsPage } from '@/components/features/settings/settingsBridge';
import {
  buildNotifications, isUnread, lastBackupMs, loadReadSet, markAllRead, saveReadSet, unreadCount, type NotifItem,
} from './notifications.logic';
import n from './notifications.module.css';

export default function NotificationCenter() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { appData, syncStatus, uid, setView } = useAppStore();
  const [read, setRead] = useState<Set<string>>(() => new Set());
  const [online, setOnline] = useState(true);
  const [lastBackup, setLastBackup] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Muat penanda dibaca per-uid + status koneksi + waktu backup (di effect: aman untuk SSR)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- data localStorage/navigator tidak ada saat SSR; wajib dibaca setelah dipasang */
    setRead(loadReadSet(uid || ''));
    setLastBackup(lastBackupMs());
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [uid]);

  const logs = useMemo(() => appData.activityLog || [], [appData.activityLog]);
  const items = useMemo(
    () => buildNotifications({ logs, syncStatus, online, lastBackup, now }),
    [logs, syncStatus, online, lastBackup, now],
  );
  const unread = unreadCount(items, read);

  const markRead = useCallback((ids: string[]) => {
    setRead(prev => { const next = new Set(prev); ids.forEach(i => next.add(i)); saveReadSet(uid || '', next); return next; });
  }, [uid]);
  const markAll = () => setRead(prev => { const next = markAllRead(items, prev); saveReadSet(uid || '', next); return next; });

  function open(item: NotifItem, close: () => void) {
    if (!item.transient) markRead([item.id]);
    if (item.kind === 'log' && item.log) {
      close(); setView('log');
      requestLogDetail(item.log.ts);
      if (pathname !== '/log') router.push('/log');
    } else if (item.kind === 'backup') {
      close(); setView('settings');
      requestSettingsPage('export');
      if (pathname !== '/settings') router.push('/settings');
    }
  }

  const loading = syncStatus === 'loading' && logs.length === 0;
  const failed = syncStatus === 'err' && logs.length === 0 && items.every(i => i.kind !== 'backup');
  const labels = { today: t('dashboard.today'), yesterday: t('dashboard.yesterday') };

  function describe(item: NotifItem): { icon: AnyIcon; tone: TileTone; title: string; sub: string } {
    switch (item.kind) {
      case 'sync-err': return { icon: CloudSlash, tone: 'belum', title: t('notif.syncErr'), sub: t('notif.syncErrDesc') };
      case 'sync-offline': return { icon: WifiSlash, tone: 'warn', title: t('notif.offline'), sub: t('notif.offlineDesc') };
      case 'backup': return { icon: FloppyDisk, tone: 'blue', title: t('notif.backup'), sub: item.ts ? `${t('notif.backupLast')} ${new Date(item.ts).toLocaleDateString()}` : t('notif.backupNever') };
      default: {
        const l = item.log!;
        const meta = getActivityMeta(l.action);
        return { icon: meta.icon, tone: meta.tone, title: stripActionTag(l.action) || '—', sub: l.detail || l.user || '' };
      }
    }
  }

  return (
    <HeaderNotifications unreadCount={unread}>
      {close => (
        <div className={n.wrap}>
          {loading ? (
            <SkeletonList count={4} />
          ) : failed ? (
            <EmptyState size="sm" icon={Warning} title={t('notif.loadError')} description={t('notif.loadErrorDesc')}
              action={<Button variant="secondary" size="sm" onClick={() => { setNow(Date.now()); window.location.reload(); }}>{t('common.retry')}</Button>} />
          ) : items.length === 0 ? (
            <EmptyState size="sm" icon={BellSlash} title={t('notif.empty')} description={t('notif.emptyDesc')} />
          ) : (
            <>
              <div className={n.tools}>
                <span className={n.cap}>{unread > 0 ? `${unread} ${t('notif.unread')}` : t('notif.allRead')}</span>
                <button type="button" className="wp-lnk" disabled={unread === 0} onClick={markAll}>{t('notif.markAll')}</button>
              </div>
              <ul className={n.list}>
                {items.map(item => {
                  const d = describe(item);
                  const un = isUnread(item, read);
                  return (
                    <li key={item.id}>
                      <button type="button" className={`${n.item} ${un ? n.unread : ''}`} data-unread={un ? 'true' : 'false'} data-kind={item.kind} onClick={() => open(item, close)}>
                        <IconTile icon={d.icon} tone={d.tone} size="sm" />
                        <span className={n.tx}><b>{d.title}</b>{d.sub && <small>{d.sub}</small>}</span>
                        {item.kind === 'log' && item.log && <span className={n.time}>{formatActivityTime(item.log.ts, new Date(now), labels)}</span>}
                        {un && <i className={n.dot} aria-label={t('notif.unreadMark')} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </HeaderNotifications>
  );
}
