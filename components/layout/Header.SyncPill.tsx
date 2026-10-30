// ══════════════════════════════════════════
// components/layout/Header.SyncPill.tsx
// REDESAIN T6: dipakai Header.tsx (sebelumnya yatim + duplikat inline). Kelas `.sync-pill`
// tetap dipakai MembersView (T9) — jangan ganti nama.
// ══════════════════════════════════════════
'use client';

import { CloudCheck, ArrowsClockwise, Warning, WifiSlash } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';

export default function HeaderSyncPill() {
  const syncStatus = useAppStore(s => s.syncStatus);
  const t = useT();

  const configs = {
    ok:      { Icon: CloudCheck,      label: t('common.saved'),   cls: 'sync-pill ok'      },
    loading: { Icon: ArrowsClockwise, label: t('common.saving'),  cls: 'sync-pill loading' },
    err:     { Icon: Warning,         label: t('sync.error'),     cls: 'sync-pill err'     },
    offline: { Icon: WifiSlash,       label: t('common.offline'), cls: 'sync-pill offline' },
  };
  const cfg = configs[syncStatus as keyof typeof configs] ?? configs.ok;
  const { Icon } = cfg;

  return (
    <div
      className={cfg.cls}
      role="status"
      aria-live="polite"
      aria-label={`${t('header.syncStatus')}: ${cfg.label}`}
    >
      <span className={syncStatus === 'loading' ? 'sync-spin' : ''}><Icon size={14} weight="fill" aria-hidden="true" /></span>
      <span className="sync-pill__txt">{cfg.label}</span>
    </div>
  );
}
