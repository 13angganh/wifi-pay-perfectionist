// ══════════════════════════════════════════
// components/features/operasional/OperasionalView.Form.tsx
// Dipecah dari OperasionalView.tsx (task 1.15)
// Daftar item + input baris per item
// ══════════════════════════════════════════
'use client';

import { X } from 'lucide-react';
import { useT } from '@/hooks/useT';

export interface OpsItem { label: string; nominal: number; }

interface Props {
  items:        OpsItem[];
  onAdd:        () => void;
  onUpdate:     (i: number, field: 'label' | 'nominal', val: string) => void;
  onDelete:     (i: number) => void;
}

const FONT = "var(--font-mono), monospace";

export default function OperasionalForm({ items, onAdd, onUpdate, onDelete }: Props) {
  const t = useT();

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    color: 'var(--txt)',
    borderRadius: 'var(--r-sm)',
    padding: '8px 10px',
    fontSize: 12,
    fontFamily: FONT,
    outline: 'none',
    transition: 'border-color var(--t-fast)',
    minHeight: 36,
  };

  return (
    <div className="ops-card">
      <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:10, fontFamily:FONT }}>
        {t('ops.expenseTitle')}
      </div>

      {items.map((it, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <input
            style={{ ...inputStyle, flex:1 }}
            placeholder={t('ops.itemPlaceholder')}
            defaultValue={it.label}
            onBlur={e => onUpdate(i, 'label', e.target.value)}
            autoComplete="off"
          />
          <input
            style={{ ...inputStyle, width:90, textAlign:'right' }}
            type="number"
            inputMode="numeric"
            placeholder="0"
            defaultValue={it.nominal || ''}
            onBlur={e => onUpdate(i, 'nominal', e.target.value)}
            autoComplete="off"
          />
          <button
            onClick={() => onDelete(i)}
            aria-label={`Hapus item ${it.label || i + 1}`}
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--c-belum)', padding:'7px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12, flexShrink:0, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', minWidth:34, minHeight:34 }}
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>
      ))}

      <button
        onClick={onAdd}
        style={{ width:'100%', background:'var(--bg3)', border:'1px dashed var(--border)', color:'var(--zc)', padding:9, borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12, marginTop:6, fontFamily:FONT }}
      >
        {t('ops.addItem')}
      </button>
    </div>
  );
}
