// ══════════════════════════════════════════
// components/modals/FreeMemberModal.Form.tsx — editor SATU periode (REDESAIN T9, T4 keputusan 7; diperluas T12)
// Dipakai ulang untuk periode Free DAN periode Nonaktif (T12, F1/F3): Mulai dari (tahun + bulan), "selamanya / masih
// nonaktif" (menyembunyikan Sampai dengan), lalu Simpan, Hapus periode (hanya bila mengubah periode yang sudah ada;
// untuk Free tetap berlabel "Kembalikan Berbayar") dan Batal. Peringatan bila periode bertumpuk dengan periode jenis
// lain (Free vs Nonaktif boleh bertumpuk; Nonaktif yang berlaku). Komponen presentasi: state dan penyimpanan dimiliki
// FreeMemberModal.
// ══════════════════════════════════════════
'use client';

import { Check, CreditCard, Trash, Warning } from '@phosphor-icons/react';
import { getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import type { PeriodKind } from '@/lib/memberPeriods';
import f from './freeMember.module.css';

interface Props {
  kind: PeriodKind;
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  noEnd: boolean;
  hasExisting: boolean;
  /** periode ini bertumpuk dengan periode jenis lain → peringatan (tidak menolak) */
  crossWarn: boolean;
  MONTH_NAMES: string[];
  onFromYear: (v: number) => void;
  onFromMonth: (v: number) => void;
  onToYear: (v: number) => void;
  onToMonth: (v: number) => void;
  onNoEnd: (v: boolean) => void;
  onSave: () => void;
  onRemove: () => void;
  onCancel: () => void;
}

export default function FreeMemberForm(p: Props) {
  const t = useT();
  const isFree = p.kind === 'free';
  const startLabel = t(isFree ? 'freemodal.startFrom' : 'periods.inactiveFrom');
  // tahun yang tersimpan (mis. dari impor) tetap muncul di pilihan walau di luar rentang standar
  const years = Array.from(new Set([...getYears(), p.fromYear, p.toYear])).sort((a, b) => a - b);
  return (
    <div className={f.body}>
      <div className="wp-field">
        <span className="wp-t-label">{startLabel}</span>
        <div className={f.fm2}>
          <Select size="sm" aria-label={`${startLabel} — ${t('common.year')}`} value={p.fromYear} onChange={e => p.onFromYear(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select size="sm" aria-label={`${startLabel} — ${t('common.month')}`} value={p.fromMonth} onChange={e => p.onFromMonth(+e.target.value)}>
            {p.MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
        </div>
      </div>

      <Checkbox className={f.forever} checked={p.noEnd} onChange={e => p.onNoEnd(e.target.checked)} label={t(isFree ? 'freemodal.forever' : 'periods.inactiveOpen')} />

      {!p.noEnd && (
        <div className="wp-field">
          <span className="wp-t-label">{t('freemodal.until')}</span>
          <div className={f.fm2}>
            <Select size="sm" aria-label={`${t('freemodal.until')} — ${t('common.year')}`} value={p.toYear} onChange={e => p.onToYear(+e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select size="sm" aria-label={`${t('freemodal.until')} — ${t('common.month')}`} value={p.toMonth} onChange={e => p.onToMonth(+e.target.value)}>
              {p.MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </Select>
          </div>
        </div>
      )}

      {p.crossWarn && (
        <div className={f.warn} role="note">
          <Warning weight="fill" aria-hidden="true" />
          <span>{t(isFree ? 'periods.crossWarnFree' : 'periods.crossWarnInactive')}</span>
        </div>
      )}

      <div className={f.actions}>
        <Button variant="success" block onClick={p.onSave}><Check aria-hidden="true" /> {t(isFree ? 'freemodal.save' : 'periods.saveInactive')}</Button>
        {p.hasExisting && (
          <Button variant="danger" block onClick={p.onRemove}>
            {isFree ? <CreditCard aria-hidden="true" /> : <Trash aria-hidden="true" />} {t(isFree ? 'freemodal.remove' : 'periods.removeInactive')}
          </Button>
        )}
        <Button variant="ghost" block onClick={p.onCancel}>{t('action.cancel')}</Button>
      </div>
    </div>
  );
}
