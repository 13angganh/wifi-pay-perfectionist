// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.Tools.tsx (REDESAIN T7)
// Baris Operasional, Backup (Download + Bagikan), Ringkasan WA, dan Aksi Cepat (A13, hanya navigasi).
// Logika backup/WA tidak berubah: doJSONBackup / doJSONShare / doWASummary dari lib/export.
// ══════════════════════════════════════════
'use client';

import { clsx } from 'clsx';
import type { CSSProperties, ElementType } from 'react';
import {
  CaretRight, ChartBar, CloudCheck, CreditCard, DownloadSimple, Briefcase,
  TrendUp, UploadSimple, WarningCircle, WhatsappLogo,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { showToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';
import { rp } from '@/lib/helpers';
import { doJSONBackup, doJSONShare, isShareSupported, doWASummary } from '@/lib/export';
import { useT } from '@/hooks/useT';
import type { useDashboard } from '@/hooks/useDashboard';
import type { ViewName } from '@/types';
import s from './dashboard.module.css';

type VM = ReturnType<typeof useDashboard>;
const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;

export function OpsRow({ d, onOpen }: { d: VM; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      className={clsx('wp-card', 'wp-card--p2', 'wp-card--interactive', s.row, s.rowBtn, s.rise)}
      style={rise(7)}
      onClick={onOpen}
      aria-label={`${t('nav.operasional')} ${d.bulanLbl}`}
    >
      <IconTile icon={Briefcase} tone="warn" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <b>{t('nav.operasional')} {d.bulanLbl}</b>
        <span className="wp-t-cap" style={{ display: 'block', color: d.totalOps > 0 ? 'var(--c-belum)' : undefined }}>
          {d.totalOps > 0 ? rp(d.totalOps) : t('common.noData')}
        </span>
      </span>
      <CaretRight size={16} aria-hidden="true" style={{ color: 'var(--txt4)', flexShrink: 0 }} />
    </button>
  );
}

export function BackupCard({ d }: { d: VM }) {
  const t = useT();
  const appData = useAppStore(st => st.appData);
  return (
    <Card className={clsx(s.row, s.rise)} style={rise(8)}>
      <IconTile icon={CloudCheck} tone="blue" />
      <div className={s.rowGrow}>
        <b>{t('dashboard.lastBackup')}</b>
        <div className="wp-t-cap">{d.backupLbl}</div>
      </div>
      <div className={s.rowActs}>
        <Button
          variant="secondary" size="sm"
          onClick={() => { doJSONBackup(appData); showToast(t('dashboard.backupDownloaded')); }}
        >
          <DownloadSimple aria-hidden="true" /> {t('dashboard.download')}
        </Button>
        {isShareSupported() && (
          <Button
            variant="secondary" size="sm"
            onClick={async () => {
              const ok = await doJSONShare(appData);
              if (ok) showToast(t('dashboard.backupShared'));
              else showToast(t('dashboard.shareCancelled'), 'err');
            }}
          >
            <UploadSimple aria-hidden="true" /> {t('dashboard.share')}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function WaCard({ d }: { d: VM }) {
  const t = useT();
  const appData = useAppStore(st => st.appData);
  return (
    <Card className={s.rise} style={rise(9)}>
      <div className={s.row}>
        <IconTile icon={UploadSimple} tone="lunas" />
        <div className={s.rowGrow}>
          <b>{t('dashboard.waSummary')}</b>
          <div className="wp-t-cap">{d.bulanLbl}</div>
        </div>
        <Button variant="success" size="sm" onClick={() => doWASummary(appData, d.dy, d.dm)}>
          <WhatsappLogo weight="fill" aria-hidden="true" /> {t('dashboard.sendWA')} {d.bulanLbl}
        </Button>
      </div>
      <div className="wp-t-micro" style={{ marginTop: 8, textAlign: 'center' }}>{t('dashboard.periodNote')}</div>
    </Card>
  );
}

const QUICK: { view: ViewName; icon: ElementType; labelKey: string }[] = [
  { view: 'entry',     icon: CreditCard,    labelKey: 'nav.entry' },
  { view: 'rekap',     icon: ChartBar,      labelKey: 'nav.rekap' },
  { view: 'tunggakan', icon: WarningCircle, labelKey: 'nav.tunggakan' },
  { view: 'grafik',    icon: TrendUp,       labelKey: 'nav.grafik' },
];

export function QuickActions({ onNav }: { onNav: (v: ViewName) => void }) {
  const t = useT();
  return (
    <nav className={clsx(s.grid4, s.rise)} style={rise(10)} aria-label={t('dashboard.quickActions')}>
      {QUICK.map(q => (
        <button key={q.view} type="button" className={clsx('wp-card', s.qa)} onClick={() => onNav(q.view)}>
          <q.icon weight="regular" aria-hidden="true" />
          <span>{t(q.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
