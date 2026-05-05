// ══════════════════════════════════════════
// components/modals/FreeMemberModal.Form.tsx
// Dipecah dari FreeMemberModal.tsx (task 1.15)
// Form: dari/sampai bulan + actions
// ══════════════════════════════════════════
'use client';

import { Check, CreditCard } from 'lucide-react';
import { getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';

interface Props {
  fromYear:   number;
  fromMonth:  number;
  toYear:     number;
  toMonth:    number;
  noEnd:      boolean;
  hasExisting: boolean;
  MONTH_NAMES: string[];
  onFromYear:  (v: number) => void;
  onFromMonth: (v: number) => void;
  onToYear:    (v: number) => void;
  onToMonth:   (v: number) => void;
  onNoEnd:     (v: boolean) => void;
  onSave:      () => void;
  onRemove:    () => void;
  onCancel:    () => void;
}

const cs: React.CSSProperties = {
  background: 'var(--bg3)', border: '1px solid var(--border)',
  color: 'var(--txt)', padding: '7px 10px', borderRadius: 'var(--r-sm)',
  fontSize: 12, flex: 1,
};

export default function FreeMemberForm(p: Props) {
  const t = useT();
  return (
    <>
      {/* Dari */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6, letterSpacing:'.06em', fontFamily:"var(--font-sans),sans-serif" }}>{t('freemodal.startFrom').toUpperCase()}</div>
        <div style={{ display:'flex', gap:6 }}>
          <select style={cs} value={p.fromYear}  onChange={e => p.onFromYear(+e.target.value)}>
            {getYears().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={cs} value={p.fromMonth} onChange={e => p.onFromMonth(+e.target.value)}>
            {p.MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Toggle selamanya */}
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--txt2)', cursor:'pointer', marginBottom:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
        <input type="checkbox" checked={p.noEnd} onChange={e => p.onNoEnd(e.target.checked)} style={{ accentColor:'var(--c-free)', width:14, height:14 }} />
        {t('freemodal.forever')}
      </label>

      {/* Sampai */}
      {!p.noEnd && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6, letterSpacing:'.06em', fontFamily:"var(--font-sans),sans-serif" }}>{t('freemodal.until').toUpperCase()}</div>
          <div style={{ display:'flex', gap:6 }}>
            <select style={cs} value={p.toYear}  onChange={e => p.onToYear(+e.target.value)}>
              {getYears().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select style={cs} value={p.toMonth} onChange={e => p.onToMonth(+e.target.value)}>
              {p.MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:16 }}>
        <button onClick={p.onSave} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'var(--c-lunas)', padding:'11px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600, fontSize:13 }}>
          <Check size={14} /> {t('freemodal.save')}
        </button>
        {p.hasExisting && (
          <button onClick={p.onRemove} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--c-belum)', padding:'11px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600, fontSize:13 }}>
            <CreditCard size={14} /> {t('freemodal.remove')}
          </button>
        )}
        <button onClick={p.onCancel} style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--txt4)', padding:'9px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12 }}>
          {t('action.cancel')}
        </button>
      </div>
    </>
  );
}
