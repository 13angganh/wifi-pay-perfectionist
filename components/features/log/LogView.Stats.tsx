// ══════════════════════════════════════════
// components/features/log/LogView.Stats.tsx — sheet Statistik Log (A29) (REDESAIN T10)
// Dihitung dari activityLog yang sudah difilter Tahun/Bulan (+ pencarian): total, Pembayaran, Data, Sistem,
// grafik aktivitas per hari untuk periode terpilih, dan 3 aktivitas terbaru. Grafik = batang CSS (tanpa Chart.js).
// ══════════════════════════════════════════
'use client';

import { ChartBar, Clock, Database, GearSix, Money } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { MONTHS, MONTHS_EN } from '@/lib/constants';
import { IconTile, type TileTone } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import { getActivityMeta, stripActionTag } from '@/components/features/dashboard/DashboardView.RecentActivity';
import type { ActivityLog } from '@/types';
import { countByKind, dailyCounts, formatClock, recentLogs, statsPeriod } from './log.logic';
import l from './log.module.css';

interface Props {
  logs: ActivityLog[];       // sudah difilter Tahun/Bulan/cari (bukan jenis)
  year: string;
  month: string;
  lang: 'id' | 'en';
  onClose: () => void;
  onOpen: (log: ActivityLog) => void;
}

export default function LogStatsSheet({ logs, year, month, lang, onClose, onOpen }: Props) {
  const t = useT();
  const names = lang === 'en' ? MONTHS_EN : MONTHS;
  const c = countByKind(logs);
  const period = statsPeriod(logs, year, month, new Date());
  const days = dailyCounts(logs, period.year, period.month);
  const peak = Math.max(1, ...days);
  const recent = recentLogs(logs, 3);
  const tiles: { icon: typeof Money; tone: TileTone; n: number; label: string }[] = [
    { icon: ChartBar, tone: 'blue',   n: c.total, label: t('log.statTotal') },
    { icon: Money,    tone: 'lunas',  n: c.pay,   label: t('log.statPay') },
    { icon: Database, tone: 'purple', n: c.data,  label: t('log.statData') },
    { icon: GearSix,  tone: 'warn',   n: c.sys,   label: t('log.statSys') },
  ];

  return (
    <Sheet open onClose={onClose} title={t('log.statsTitle')} subtitle={`${names[period.month]} ${period.year}`} leading={<IconTile icon={ChartBar} size="sm" />}>
      <div className={l.stats}>
        <div className={l.statGrid}>
          {tiles.map(x => (
            <div key={x.label} className={l.statTile} data-stat={x.label}>
              <IconTile icon={x.icon} tone={x.tone} size="sm" />
              <div><b className="wp-num">{x.n.toLocaleString()}</b><span>{x.label}</span></div>
            </div>
          ))}
        </div>

        <div>
          <b className={l.secTitle}>{t('log.perDay')}</b>
          <div className={l.bars} role="img" aria-label={`${t('log.perDay')}: ${days.reduce((a, b) => a + b, 0)}`}>
            {days.map((n, i) => (
              <i key={i} className={l.bar} data-count={n} style={{ height: `${n === 0 ? 3 : Math.max(8, Math.round((n / peak) * 100))}%` }} title={`${i + 1}: ${n}`} />
            ))}
          </div>
          <div className={l.barAxis}><span>1</span><span>{Math.ceil(days.length / 2)}</span><span>{days.length}</span></div>
        </div>

        <div>
          <b className={l.secTitle}>{t('log.recent')}</b>
          {recent.length === 0 ? (
            <p className={l.muted}>{t('log.noActivity')}</p>
          ) : (
            <div className={l.recent}>
              {recent.map((r, i) => {
                const meta = getActivityMeta(r.action);
                return (
                  <button key={`${r.ts}-${i}`} type="button" className={l.recentRow} onClick={() => onOpen(r)} aria-label={`${t('log.openDetail')}: ${stripActionTag(r.action)}`}>
                    <IconTile icon={meta.icon} tone={meta.tone} size="sm" />
                    <span className={l.recentTx}><b>{stripActionTag(r.action)}</b>{r.detail && <small>{r.detail}</small>}</span>
                    <span className={l.recentTime}><Clock aria-hidden="true" /> {formatClock(r.ts)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
