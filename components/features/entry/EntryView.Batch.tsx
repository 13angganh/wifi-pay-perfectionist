// ══════════════════════════════════════════
// components/features/entry/EntryView.Batch.tsx (REDESAIN T7, T2 keputusan 8 dan 8b)
// Bar mode pilih (Batal, jumlah terpilih, Pilih Semua) dan sheet total (Batal + Bayar (n)) berisi nama terpilih.
// Sheet memakai position: sticky di dalam #content, bukan fixed: lebarnya mengikuti area konten
// (tidak menutupi Sidebar) dan tinggi dinamisnya tidak lagi butuh ResizeObserver + spacer — ia ikut
// alur dokumen di akhir daftar, jadi kartu terakhir selalu bisa di-scroll melewatinya (perbaikan
// laporan "ZAHDAN tak bisa diklik" tetap terjaga). T6 §2 butir 7: offset bawah memperhitungkan
// Bottom Nav hanya bila navMode === 'bottom'.
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { ListChecks, X, CheckCircle, CaretDown, CaretUp } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import e from './entry.module.css';

export function BatchBar({
  count, periodLabel, zoneColor, onCancel, onSelectAll,
}: {
  count: number; periodLabel: string; zoneColor: string;
  onCancel: () => void; onSelectAll: () => void;
}) {
  const t = useT();
  return (
    <Card padding="none" className={clsx(e.bbar, e.rise)} style={{ borderColor: zoneColor }}>
      <IconButton icon={X} label={t('action.cancel')} onClick={onCancel} />
      <div className={e.bbarTx}>
        <b>{count} {t('nav.members')}</b>
        <span className="wp-t-cap">{periodLabel}</span>
      </div>
      <Button variant="secondary" size="sm" onClick={onSelectAll}>
        <ListChecks aria-hidden="true" /> {t('entry.selectAll')}
      </Button>
    </Card>
  );
}

export function BatchSheet({
  count, items, total, noTarif, periodLabel, onCancel, onPay, payDate, onPayDate,
}: {
  count: number; items: { name: string; amt: number }[]; total: number; noTarif: number; periodLabel: string;
  onCancel: () => void; onPay: () => void;
  /** REDESAIN T12 (F4): hanya diisi pada mode manual (autoDate mati) — pemilih tanggal bayar, default hari ini */
  payDate?: string; onPayDate?: (v: string) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  // Offset bawah kecil: padding bawah #content sudah menyisakan ruang Bottom Nav dan ikut mengurangi area sticky,
  // jadi menambah tinggi nav di sini (cacat zip) mendorong sheet ke atas dan menutup kartu terakhir.
  const bottom = 'var(--sp-2)';
  return (
    <Card variant="elevated" className={e.bsheet} style={{ bottom }} role="region" aria-live="polite">
      <div className={e.bsheetRow}>
        <div className={e.bsheetTx}>
          <span className="wp-t-cap">{count} {t('nav.members')} · {periodLabel}</span>
          <div className="wp-num"><span className="wp-t-label">{t('common.total')}</span> {rp(total)}</div>
        </div>
      </div>
      {items.length > 0 && (
        <>
          <button type="button" className={e.bnames} aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
            <span className={e.bnamesTx}>{items.map(it => it.name).join(', ')}</span>
            {expanded ? <CaretUp aria-hidden="true" /> : <CaretDown aria-hidden="true" />}
          </button>
          {expanded && (
            <div className={e.bl}>
              {items.map(it => (
                <div key={it.name} className={e.bli}><span>{it.name}</span><b className="wp-num">{rp(it.amt)}</b></div>
              ))}
            </div>
          )}
        </>
      )}
      {noTarif > 0 && <div className={e.bsheetNote}>{noTarif} {t('entry.batchSkipped')}</div>}
      {payDate !== undefined && onPayDate && (
        <div className={e.bsheetDate}>
          <span className="wp-t-label">{t('membercard.payDate')}</span>
          <Input type="date" size="sm" aria-label={t('membercard.payDate')} value={payDate} onChange={ev => onPayDate(ev.target.value)} />
        </div>
      )}
      <div className={e.bsheetRow}>
        <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>{t('action.cancel')}</Button>
        <Button variant="primary" onClick={onPay} style={{ flex: 2 }}>
          <CheckCircle weight="fill" aria-hidden="true" /> {t('entry.batchPay')} ({count})
        </Button>
      </div>
    </Card>
  );
}
