// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.Stats.tsx (REDESAIN T7)
// Statistik: 3 stat (Lunas/Belum/Gratis), Pendapatan + Bersih + grafik 6 bulan (A14),
// Insight, kartu per zona (KRS, SLK, zona kustom aktif).
// Dipakai DashboardView.tsx (file ini sebelumnya yatim; ditulis ulang, tanpa framer-motion/lucide).
// ══════════════════════════════════════════
'use client';

import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { ArrowRight, CreditCard, Receipt, Wallet } from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { DeltaPct, ProgressBar } from '@/components/ui/ProgressBar';
import { useAppStore } from '@/store/useAppStore';
import { zoneCssColor } from '@/lib/design-tokens';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import type { useDashboard } from '@/hooks/useDashboard';
import s from './dashboard.module.css';

type VM = ReturnType<typeof useDashboard>;
const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;

export function StatTiles({ d }: { d: VM }) {
  const t = useT();
  const items = [
    { icon: Wallet,     tone: 'lunas' as const, v: d.totalLunas, l: t('status.lunas') },
    { icon: Receipt,    tone: 'belum' as const, v: d.totalBelum, l: t('status.belum') },
    { icon: CreditCard, tone: 'free'  as const, v: d.totalFree,  l: t('status.free') },
  ];
  return (
    <div className={clsx(s.grid3, s.rise)} style={rise(1)}>
      {items.map(it => (
        <Card key={it.tone} className={s.stat}>
          <IconTile icon={it.icon} tone={it.tone} />
          <div style={{ minWidth: 0 }}>
            <div className={clsx('wp-num', s.statNum)}>{it.v}</div>
            <div className="wp-t-cap">{it.l}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function IncomeCard({ d }: { d: VM }) {
  const t = useT();
  const max = Math.max(...d.history.map(h => h.total), 0);
  const prevName = d.MONTH_NAMES[d.prevDm];
  return (
    <Card variant="hl" className={clsx(s.hero, s.rise)} style={rise(2)}>
      <div className={s.heroMain}>
        <div className="wp-t-cap" style={{ color: 'var(--txt2)' }}>{t('dashboard.thisMonth')}</div>
        <div className={clsx('wp-num wp-num--xl wp-gtxt', s.heroVal)}>{rp(d.totalIncome)}</div>
        <div className={s.heroMeta}>
          {d.totalPct !== null && (
            <>
              <DeltaPct value={d.totalPct} />
              <span className="wp-t-micro">{t('dashboard.vs')} {prevName}</span>
            </>
          )}
          {d.totalOps > 0 && (
            <span className="wp-t-cap" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {t('dashboard.ops')}: {rp(d.totalOps)}
              <ArrowRight size={11} aria-hidden="true" />
              <b style={{ color: d.netIncome >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)' }}>
                {t('dashboard.net')}: {rp(d.netIncome)}
              </b>
            </span>
          )}
        </div>
      </div>
      <div className={s.bars} role="img" aria-label={t('dashboard.incomeTrend')}>
        {d.history.map((h, i) => (
          <i
            key={`${h.y}-${h.m}`}
            style={{
              height: `${max > 0 ? Math.round((h.total / max) * 100) : 0}%`,
              opacity: +(0.4 + i * 0.12).toFixed(2),
            }}
          />
        ))}
      </div>
    </Card>
  );
}

export function InsightCard({ d }: { d: VM }) {
  const t = useT();
  const prevName = d.MONTH_NAMES[d.prevDm];
  return (
    <Card className={s.rise} style={rise(3)}>
      <div className="wp-t-label" style={{ marginBottom: 10 }}>{t('dashboard.insightTitle')}</div>
      <div className={s.mini}>
        <div>
          <div className="wp-t-micro">{t('dashboard.insightTunggakan')}</div>
          <div className={s.miniV} style={{ color: d.totalBelum > 0 ? 'var(--c-belum)' : 'var(--c-lunas)' }}>
            {d.totalBelum} <span className="wp-t-cap">{t('common.members')}</span>
          </div>
          {d.tunggakanDelta !== null ? (
            <>
              <DeltaPct value={d.tunggakanDelta} invert />{' '}
              <span className="wp-t-micro">{t('dashboard.vs')} {prevName}</span>
            </>
          ) : (
            <span className="wp-t-micro">{t('dashboard.insightNoBaseline')}</span>
          )}
        </div>
        <div>
          <div className="wp-t-micro">{t('dashboard.insightLunasRatio')}</div>
          <div className={s.miniV} style={{ color: 'var(--c-lunas)' }}>{d.lunasPctNow}%</div>
          {d.lunasPctDelta === 0 ? (
            <span className="wp-pct wp-pct--n">{t('dashboard.insightSame')}</span>
          ) : (
            <>
              <DeltaPct value={d.lunasPctDelta} suffix={` ${t('dashboard.pointsShort')}`} />{' '}
              <span className="wp-t-micro">{t('dashboard.vs')} {prevName}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ZoneCards({ d }: { d: VM }) {
  const t = useT();
  const customZones = useAppStore(st => st.settings.customZones);
  return (
    <div className={clsx(s.zones, s.rise)} style={rise(4)}>
      {d.zones.map(z => {
        const color = zoneCssColor(z.zone, customZones);
        return (
          <Card key={z.zone}>
            <div className={clsx('wp-t-cap', s.zoneHead)}>
              <b style={{ color }}>{z.zone}</b>
              {z.pct !== null && <DeltaPct value={z.pct} />}
            </div>
            <div className={clsx('wp-num', s.zoneVal)} style={{ color }}>{rp(z.total)}</div>
            <ProgressBar value={z.lunasPct} label={`${z.zone} ${t('dashboard.zoneProgress')}`} color={color} />
            <div className="wp-t-micro" style={{ marginTop: 6 }}>
              {z.lunas}/{z.members} {t('status.lunas')} ({z.lunasPct}%)
            </div>
          </Card>
        );
      })}
    </div>
  );
}
