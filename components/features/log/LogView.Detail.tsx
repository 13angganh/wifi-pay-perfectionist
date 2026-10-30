// ══════════════════════════════════════════
// components/features/log/LogView.Detail.tsx — sheet Detail Aktivitas (A28, baca-saja) (REDESAIN T10)
// Field: judul (aksi tanpa awalan [..]), rincian, Tanggal & Waktu, Pelaku, Jenis. Tidak ada field baru di database.
// ══════════════════════════════════════════
'use client';

import { useT } from '@/hooks/useT';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import { extractAmount, getActivityMeta, stripActionTag } from '@/components/features/dashboard/DashboardView.RecentActivity';
import type { ActivityLog } from '@/types';
import { formatFull, logKind } from './log.logic';
import l from './log.module.css';

export default function LogDetailSheet({ log, onClose }: { log: ActivityLog; onClose: () => void }) {
  const t = useT();
  const meta = getActivityMeta(log.action);
  const kind = logKind(log.action);
  const amount = extractAmount(log.action, log.detail);
  const kindLabel = kind === 'pay' ? t('log.statPay') : kind === 'sys' ? t('log.typeSystem') : t('log.typeData');

  return (
    <Sheet open onClose={onClose} title={t('log.detailTitle')} leading={<IconTile icon={meta.icon} tone={meta.tone} size="sm" />}>
      <div className={l.detail}>
        <b className={l.detailTitle}>{stripActionTag(log.action) || '—'}</b>
        <dl className={l.dl}>
          {log.detail && (<><dt>{t('log.detailNote')}</dt><dd>{log.detail}</dd></>)}
          {amount && (<><dt>{t('log.detailAmount')}</dt><dd className="wp-num">{amount}</dd></>)}
          <dt>{t('log.detailWhen')}</dt><dd>{formatFull(log.ts)}</dd>
          <dt>{t('log.detailActor')}</dt><dd>{log.user || '—'}</dd>
          <dt>{t('log.detailKind')}</dt><dd><Badge variant={kind === 'pay' ? 'lunas' : kind === 'sys' ? 'warning' : 'neutral'}>{kindLabel}</Badge></dd>
        </dl>
        <Button variant="secondary" block onClick={onClose}>{t('common.close')}</Button>
      </div>
    </Sheet>
  );
}
