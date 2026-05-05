// ══════════════════════════════════════════
// components/modals/RiwayatModal.MonthRow.tsx
// Dipecah dari RiwayatModal.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { Gift, CheckCircle2, XCircle } from 'lucide-react';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';

interface Props {
  displayName: string;  // nama bulan yang di-display
  tgl:         string;  // tanggal bayar (opsional)
  value:       number | null;
  isFree:      boolean;
  onClick:     () => void;
}

export default function RiwayatMonthRow({ displayName, tgl, value, isFree, onClick }: Props) {
  const t = useT();

  let statusEl: React.ReactNode;
  if (isFree) {
    statusEl = (
      <span style={{ color:'var(--c-free)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
        <Gift size={12} /> Free
      </span>
    );
  } else if (value !== null && value > 0) {
    statusEl = (
      <span style={{ color:'var(--c-lunas)', fontSize:11, fontWeight:600, fontFamily:"var(--font-mono),monospace" }}>
        {rp(value)}
      </span>
    );
  } else if (value === 0) {
    statusEl = (
      <span style={{ color:'var(--c-lunas)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
        <CheckCircle2 size={12} /> {t('rekap.accumulation')}
      </span>
    );
  } else {
    statusEl = (
      <span style={{ color:'var(--c-belum)', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
        <XCircle size={12} /> {t('status.belum')}
      </span>
    );
  }

  return (
    <div className="rw-month-row" style={{ cursor:'pointer' }} onClick={onClick}>
      <div>
        <div style={{ fontSize:12, color:'var(--txt)', fontFamily:"var(--font-mono),monospace" }}>{displayName}</div>
        {tgl && <div style={{ fontSize:9, color:'var(--txt4)', marginTop:1 }}>{tgl}</div>}
      </div>
      {statusEl}
    </div>
  );
}
