// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.Unpaid.tsx (REDESAIN T7)
// Kartu "Belum Bayar" + tombol Input Bayar, dan "Tunggakan Terbanyak" (top 5, lintas zona aktif).
// ══════════════════════════════════════════
'use client';

import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import { CaretRight, CheckCircle, CreditCard, Receipt, WarningCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ZoneChip } from '@/components/ui/Chip';
import { IconTile } from '@/components/ui/IconTile';
import { useAppStore } from '@/store/useAppStore';
import { zoneCssColor } from '@/lib/design-tokens';
import { useT } from '@/hooks/useT';
import type { useDashboard } from '@/hooks/useDashboard';
import s from './dashboard.module.css';

type VM = ReturnType<typeof useDashboard>;
const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;
const TOP_N = 5;

export function UnpaidCard({ d, onInputPay }: { d: VM; onInputPay: () => void }) {
  const t = useT();
  const freeByZone = d.zones.filter(z => z.free > 0).map(z => `${z.zone}:${z.free}`).join(' ');
  return (
    <Card className={clsx(s.col, s.rise)} style={rise(5)}>
      <div className={s.sec}>
        <Receipt weight="regular" aria-hidden="true" />
        <span className={s.secGrow}>{t('dashboard.unpaidTitle')} {d.bulanLbl}</span>
        <b className="wp-num" style={{ color: 'var(--c-belum)' }}>{d.totalBelum} {t('common.members')}</b>
      </div>
      <div className={s.badges}>
        <Badge variant="lunas" size="md">{t('status.lunas')} {d.totalLunas}</Badge>
        <Badge variant="belum" size="md">{t('status.belum')} {d.totalBelum}</Badge>
      </div>
      {d.totalFree > 0 && (
        <div className={clsx(s.note, s.noteFree)}>
          <CreditCard weight="regular" aria-hidden="true" />
          <span style={{ flex: 1 }}>{t('status.free')} {d.bulanLbl}</span>
          <b className="wp-num">
            {d.totalFree} {t('common.members')} <span className="wp-t-micro">({freeByZone})</span>
          </b>
        </div>
      )}
      {d.totalBelum > 0 && (
        <Button variant="primary" block onClick={onInputPay}>
          <CreditCard weight="fill" aria-hidden="true" /> {t('dashboard.inputPay')} {d.bulanLbl}
        </Button>
      )}
    </Card>
  );
}

export function TopArrearsCard({
  d, onGoEntry, onMore,
}: {
  d: VM;
  onGoEntry: (zone: string, year: number, month: number, name: string) => void;
  onMore: () => void;
}) {
  const t = useT();
  const customZones = useAppStore(st => st.settings.customZones);
  const top = d.topTunggak.slice(0, TOP_N);
  const rest = d.topTunggak.length - top.length;
  return (
    <Card className={s.rise} style={rise(6)}>
      <div className={s.sec}>
        <WarningCircle weight="regular" aria-hidden="true" />
        <span>{t('dashboard.topArrears')}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        {top.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <IconTile icon={CheckCircle} tone="lunas" />
            <span style={{ color: 'var(--c-lunas)', fontSize: 'var(--fs-body)' }}>{t('dashboard.allPaid')}</span>
          </div>
        ) : (
          top.map(r => (
            <button
              key={`${r.z}__${r.name}`}
              type="button"
              className={s.tr}
              onClick={() => onGoEntry(r.z, r.oldestY, r.oldestMi, r.name)}
              aria-label={`${r.name}, ${r.count} ${t('dashboard.arrearsAria')} ${r.oldest}`}
            >
              <IconTile icon={WarningCircle} tone="belum" />
              <span className={s.trTx}>
                <b>{r.name}</b>
                <ZoneChip color={zoneCssColor(r.z, customZones)}>{r.z}</ZoneChip>
              </span>
              <span className={s.trEnd}>
                <b className="wp-num" style={{ color: 'var(--c-belum)', fontSize: 'var(--fs-caption)' }}>{r.count} {t('common.months')}</b>
                <span className="wp-t-micro">{t('common.since')} {r.oldest}</span>
              </span>
            </button>
          ))
        )}
      </div>
      {rest > 0 && (
        <button type="button" className={clsx('wp-lnk', s.moreLink)} onClick={onMore}>
          +{rest} {t('common.more')} <CaretRight size={11} aria-hidden="true" />
        </button>
      )}
    </Card>
  );
}
