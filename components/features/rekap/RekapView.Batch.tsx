// ══════════════════════════════════════════
// components/features/rekap/RekapView.Batch.tsx — mode pilih Rekap (REDESAIN T8, T3 keputusan 5 dan 6)
// Bar petunjuk (bulan terpilih, Pilih Semua/Batalkan Semua, tutup) dan sheet total (daftar, total, Batal,
// Tandai Lunas Semua). Sheet memakai position: sticky di dalam #content (pola T7 EntryView.Batch): ikut alur
// dokumen sehingga tidak menutupi baris terakhir, dan offset bawah mengikuti navMode (T6 §2 butir 7).
// ══════════════════════════════════════════
'use client';

import { CheckCircle, HandTap, X } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HintBar } from '@/components/ui/HintBar';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import r from './rekap.module.css';

export function BatchHint({
  monthLabel, canSelectAll, allSelected, onSelectAll, onClose,
}: {
  monthLabel: string; canSelectAll: boolean; allSelected: boolean;
  onSelectAll: () => void; onClose: () => void;
}) {
  const t = useT();
  return (
    <HintBar
      icon={HandTap}
      action={(
        <>
          <Button variant="secondary" size="sm" onClick={onSelectAll} disabled={!canSelectAll}>
            {allSelected ? t('rekap.batchCancel') : t('entry.selectAll')}
          </Button>
          <IconButton icon={X} label={t('common.close')} size="sm" onClick={onClose} />
        </>
      )}
    >
      <b>{monthLabel}</b> — {t('rekap.batchHint')}
    </HintBar>
  );
}

export interface BatchPreviewItem { name: string; amt: number; hasTarif: boolean }

export function BatchSheet({
  items, total, periodLabel, skippedPaid, onCancel, onPay, payDate, onPayDate,
}: {
  items: BatchPreviewItem[]; total: number; periodLabel: string; skippedPaid: number;
  onCancel: () => void; onPay: () => void;
  /** REDESAIN T12 (F4): hanya diisi pada mode manual (autoDate mati) — pemilih tanggal bayar, default hari ini */
  payDate?: string; onPayDate?: (v: string) => void;
}) {
  const t = useT();
  // Offset bawah kecil: padding bawah #content sudah menyisakan ruang Bottom Nav dan ikut mengurangi area sticky,
  // jadi menambah tinggi nav di sini (cacat zip) mendorong sheet ke atas dan menutup kartu terakhir.
  const bottom = 'var(--sp-2)';
  return (
    <Card variant="elevated" className={r.bsheet} style={{ bottom }} role="region" aria-live="polite" data-testid="rekap-batch-sheet">
      <div className={r.bsheetRow}>
        <div className={r.bsheetTx}>
          <div className="wp-t-label">{items.length} {t('rekap.batchSelected')}</div>
          <span className="wp-t-cap">{periodLabel}</span>
        </div>
        <b className={`wp-num ${r.bsheetTot}`}>{rp(total)}</b>
      </div>
      <div className={r.bl}>
        {items.map(it => (
          <div key={it.name} className={r.bli}>
            <span>{it.name}</span>
            <span className={r.bliR}>
              {!it.hasTarif && <Badge size="xs">{t('rekap.defaultTag')}</Badge>}
              <b className="wp-num">{rp(it.amt)}</b>
            </span>
          </div>
        ))}
      </div>
      {skippedPaid > 0 && <div className={r.bsheetNote}>{skippedPaid} {t('entry.batchSkippedPaid')}</div>}
      {payDate !== undefined && onPayDate && (
        <div className={r.bsheetDate}>
          <span className="wp-t-label">{t('membercard.payDate')}</span>
          <Input type="date" size="sm" aria-label={t('membercard.payDate')} value={payDate} onChange={ev => onPayDate(ev.target.value)} />
        </div>
      )}
      <div className={r.bsheetRow}>
        <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>{t('action.cancel')}</Button>
        <Button variant="primary" onClick={onPay} style={{ flex: 2 }}>
          <CheckCircle weight="fill" aria-hidden="true" /> {t('rekap.batchConfirm')}
        </Button>
      </div>
    </Card>
  );
}
