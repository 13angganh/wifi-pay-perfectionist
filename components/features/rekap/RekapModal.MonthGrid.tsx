// ══════════════════════════════════════════
// components/features/rekap/RekapModal.MonthGrid.tsx
// Dipecah dari RekapModal.tsx (task 1.15)
// Quick-pay buttons + manual input inside RekapModal
// ══════════════════════════════════════════
'use client';

import { Gift, Lock, X } from 'lucide-react';
import { useT } from '@/hooks/useT';


interface Props {
  name:        string;
  activeZone:  string;
  monthLabel:  string;
  selYear:     number;
  entryVal:    number | null;
  entryFree:   boolean;
  locked:      boolean;
  tarif:       number | undefined;
  quickAmts:   number[];
  inputDirty:  React.MutableRefObject<boolean>;
  onQuickPay:  (amt: number) => void;
  onManualPay: (val: string) => void;
  onClearPay:  () => void;
}

export default function RekapMonthGrid({
  name, activeZone, monthLabel, selYear,
  entryVal, entryFree, locked,
  tarif, quickAmts, inputDirty,
  onQuickPay, onManualPay, onClearPay,
}: Props) {
  const t = useT();

  return (
    <>
      {/* Header */}
      <div style={{ fontSize:14, fontWeight:700, color:'var(--txt)', fontFamily:"var(--font-mono),monospace" }}>{name}</div>
      <div style={{ fontSize:10, color:'var(--zc)', marginTop:2 }}>{activeZone} · {monthLabel} {selYear}</div>

      {/* Body */}
      <div style={{ marginTop:12 }}>
        {entryFree ? (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--c-free)', padding:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Gift size={14} /> {t('rekap.freeMember')}
          </div>
        ) : locked ? (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--c-belum)', padding:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Lock size={12} strokeWidth={1.5} />
            {t('rekap.dataLocked')}
          </div>
        ) : (
          <>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:10, color:'var(--txt4)', flexShrink:0, minWidth:60 }}>{t('common.amount').toUpperCase()}</span>
              <input
                className="mc-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                defaultValue={entryVal !== null ? String(entryVal) : ''}
                style={{ flex:1, minWidth:0 }}
                onChange={() => { inputDirty.current = true; }} // eslint-disable-line react-hooks/immutability
                onBlur={e => onManualPay(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    inputDirty.current = true; // eslint-disable-line react-hooks/immutability
                    onManualPay((e.target as HTMLInputElement).value);
                  }
                }}
                autoFocus
              />
              {entryVal !== null && (
                <button className="delbtn" onClick={onClearPay} aria-label={t('action.delete')}>
                  <X size={12} />
                </button>
              )}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {tarif && (
                <button className="qb" style={{ borderColor:'var(--zc)', color:'var(--zc)', fontWeight:700 }} onClick={() => onQuickPay(tarif)}>
                  {tarif} ★
                </button>
              )}
              {quickAmts.filter(a => a !== tarif).map(a => (
                <button key={a} className="qb" onClick={() => onQuickPay(a)}>{a}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
