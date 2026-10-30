// ══════════════════════════════════════════
// components/features/tunggakan/TunggakanView.Item.tsx — kartu Tunggakan (REDESAIN T8, T3 keputusan 10–12)
// Dipakai ulang (sebelumnya yatim): tiga kartu — Nunggak (aging + nominal + bulan + Kirim WA), Rajin, Gratis.
// Area atas kartu = tombol (ketuk → RiwayatModal, A18); tombol Kirim WA berdiri sendiri di luar area itu
// supaya tidak ada kontrol interaktif bersarang. Warna aging lewat variabel --ac (module css).
// ══════════════════════════════════════════
'use client';

import { Vis } from '@/components/ui/CardFilter';
import type { KeyboardEvent } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, Clock, Fire, Gift, WarningCircle, WhatsappLogo, Check } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { agingOf, type AgingLevel, type TunggakanItem as ArrearsItem } from '@/hooks/useTunggakan';
import s from './tunggakan.module.css';

const MAX_MONTHS = 12; // perilaku zip: tampil 12 bulan, sisanya "+N lagi"

const AGING_CLASS: Record<AgingLevel, string> = { baru: s.agBaru, segera: s.agSegera, kritis: s.agKritis };
const AGING_ICON = { baru: Clock, segera: WarningCircle, kritis: Fire } as const;
const AGING_TONE = { baru: 'warn', segera: 'orange', kritis: 'belum' } as const;

/** Area ketuk non-bersarang: role=button + Enter/Spasi. */
function openProps(onOpen: () => void, label: string) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
    },
  };
}

export function ArrearsCard({
  item, index, monthNames, onOpen, onWa, style,
}: {
  item: ArrearsItem; index: number; monthNames: string[];
  onOpen: () => void; onWa: () => void; style?: React.CSSProperties;
}) {
  const t = useT();
  const level = agingOf(item.count);
  const Icon = AGING_ICON[level];
  const levelLabel = level === 'baru' ? t('tunggakan.filter.new') : level === 'segera' ? t('tunggakan.filter.soon') : t('tunggakan.filter.critical');
  const shown = item.unpaid.slice(0, MAX_MONTHS);
  return (
    <Card className={clsx(s.tc, s.rise, AGING_CLASS[level])} style={style} data-testid="tunggakan-card">
      <div className={s.open} {...openProps(onOpen, `${item.name}, ${item.count} ${t('tunggakan.months')}`)}>
        <div className={s.head}>
          <IconTile icon={Icon} tone={AGING_TONE[level]} />
          <div className={s.nameTx}>
            <b>{index + 1}. {item.name}</b>
            <span className="wp-t-cap">{item.count} {t('tunggakan.months')}</span>
          </div>
          <div className={s.right}>
            <b className={clsx('wp-num', s.amt)}>{rp(item.amount)}</b>
            <span className={s.ab}><Icon size={12} weight="fill" aria-hidden="true" /> {levelLabel}</span>
          </div>
        </div>
<Vis screen="tunggakan" id="months">        <div className={s.hist}>
          {shown.map(u => <Badge key={`${u.y}-${u.mi}`} variant="belum" size="xs">{monthNames[u.mi]} {u.y}</Badge>)}
          {item.unpaid.length > MAX_MONTHS && (
            <Badge size="xs">+{item.unpaid.length - MAX_MONTHS} {t('tunggakan.more')}</Badge>
          )}
        </div></Vis>
      </div>
<Vis screen="tunggakan" id="wa">      <div className={s.actions}>
        <Button size="sm" className={s.wa} onClick={onWa}>
          <WhatsappLogo weight="fill" aria-hidden="true" /> {t('tunggakan.sendWa')}
        </Button>
        {item.tarif === undefined && <span className="wp-t-cap">({t('tunggakan.tarifDefaultHint')})</span>}
      </div></Vis>
    </Card>
  );
}

export function OnTimeCard({ name, index, onOpen, style }: { name: string; index: number; onOpen: () => void; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <Card className={clsx(s.tc, s.rise, s.rj)} style={style} data-testid="tunggakan-card">
      <div className={s.open} {...openProps(onOpen, name)}>
        <div className={s.head}>
          <IconTile icon={CheckCircle} tone="lunas" />
          <div className={s.nameTx}><b>{index + 1}. {name}</b></div>
          <span className={s.ab}><Check size={12} weight="fill" aria-hidden="true" /> {t('tunggakan.paidAll')}</span>
        </div>
      </div>
    </Card>
  );
}

export function FreeCard({
  name, index, period, onOpen, style,
}: { name: string; index: number; period: string; onOpen: () => void; style?: React.CSSProperties }) {
  const t = useT();
  return (
    <Card className={clsx(s.tc, s.rise, s.fr)} style={style} data-testid="tunggakan-card">
      <div className={s.open} {...openProps(onOpen, name)}>
        <div className={s.head}>
          <IconTile icon={Gift} tone="orange" />
          <div className={s.nameTx}>
            <b>{index + 1}. {name}</b>
            {period && <span className="wp-t-cap">{period}</span>}
          </div>
          <span className={s.ab}>{t('status.free')}</span>
        </div>
      </div>
    </Card>
  );
}
