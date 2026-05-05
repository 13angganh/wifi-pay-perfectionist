// ══════════════════════════════════════════
// components/layout/Header.SyncPill.tsx
// Dipecah dari Header.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { Cloud, RotateCw, AlertTriangle, WifiOff } from 'lucide-react';

export default function HeaderSyncPill() {
  const { syncStatus } = useAppStore();
  const t = useT();

  const configs = {
    ok:      { icon: <Cloud size={12} strokeWidth={1.5} />,         label: t('common.saved'),   cls: 'sync-pill ok'      },
    loading: { icon: <RotateCw size={12} strokeWidth={1.5} />,      label: t('common.saving'),  cls: 'sync-pill loading' },
    err:     { icon: <AlertTriangle size={12} strokeWidth={1.5} />, label: t('sync.error'),     cls: 'sync-pill err'     },
    offline: { icon: <WifiOff size={12} strokeWidth={1.5} />,       label: t('common.offline'), cls: 'sync-pill offline' },
  };
  const cfg = configs[syncStatus as keyof typeof configs] ?? configs.ok;

  return (
    <div
      className={cfg.cls}
      role="status"
      aria-live="polite"
      aria-label={`Status sync: ${cfg.label}`}
    >
      <span className={syncStatus === 'loading' ? 'sync-spin' : ''}>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </div>
  );
}
