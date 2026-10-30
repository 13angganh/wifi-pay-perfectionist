// ══════════════════════════════════════════
// components/modals/RiwayatModal.MonthRow.tsx — baris bulan RiwayatModal (REDESAIN T8)
// Dipakai ulang (sebelumnya yatim): satu baris bulan + tanggal bayar (opsional) + status
// (gratis · nominal · Akumulasi · Belum). Ketuk = buka kartu member itu di Entry (handler ada di RiwayatModal).
// REDESAIN T12: bulan Belum terdaftar / Nonaktif tanpa pembayaran (na) tampil netral, bukan "Belum".
// ══════════════════════════════════════════
'use client';

import { CheckCircle, Gift, Prohibit, XCircle } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/Badge';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import s from './riwayat.module.css';

interface Props {
  displayName: string;   // nama bulan + tahun
  tgl:         string;   // tanggal bayar (opsional)
  value:       number | null;
  isFree:      boolean;
  /** T12: alasan bulan tidak terhitung (null/undefined = terhitung) */
  na?:         'nonaktif' | 'belumTerdaftar' | null;
  onClick:     () => void;
}

export default function RiwayatMonthRow({ displayName, tgl, value, isFree, na, onClick }: Props) {
  const t = useT();

  let statusEl: React.ReactNode;
  if (na) {
    statusEl = <Badge variant="neutral"><Prohibit size={12} aria-hidden="true" /> {t(`status.${na}`)}</Badge>;
  } else if (isFree) {
    statusEl = <Badge variant="free"><Gift size={12} weight="duotone" aria-hidden="true" /> {t('status.free')}</Badge>;
  } else if (value !== null && value > 0) {
    statusEl = <b className={`wp-num ${s.stAmt}`}>{rp(value)}</b>;
  } else if (value === 0) {
    statusEl = <span className={`${s.st} ${s.stLunas}`}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t('rekap.accumulation')}</span>;
  } else {
    statusEl = <span className={`${s.st} ${s.stBelum}`}><XCircle size={14} weight="fill" aria-hidden="true" /> {t('status.belum')}</span>;
  }

  return (
    <button type="button" className={s.rwr} onClick={onClick}>
      <span>
        <b className={`wp-num ${s.rwMon}`}>{displayName}</b>
        {tgl && <span className={`wp-t-micro ${s.rwTgl}`}>{tgl}</span>}
      </span>
      {statusEl}
    </button>
  );
}
