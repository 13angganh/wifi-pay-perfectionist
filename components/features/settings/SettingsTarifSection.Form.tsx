// ══════════════════════════════════════════
// components/features/settings/SettingsTarifSection.Form.tsx
// Dipecah dari SettingsTarifSection.tsx (task 1.15)
// Export selectors + ToggleChip — reusable form elements
// ══════════════════════════════════════════
'use client';

import { Check } from 'lucide-react';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';

export function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'8px', borderRadius:'var(--r-sm)', border:`1px solid ${active ? 'var(--zc)' : 'var(--border)'}`, background: active ? 'var(--zcdim)' : 'var(--bg3)', color: active ? 'var(--zc)' : 'var(--txt2)', cursor:'pointer', fontSize:12, fontWeight: active ? 600 : 400, transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
      {active && <Check size={11} />}{label}
    </button>
  );
}

interface ExportSelectorsProps {
  zone: 'KRS'|'SLK'|'ALL'; setZone: (z: 'KRS'|'SLK'|'ALL') => void;
  type: 'monthly'|'yearly'; setType: (t: 'monthly'|'yearly') => void;
  year: number; setYear: (y: number) => void;
  month: number; setMonth: (m: number) => void;
  showAll?: boolean;
  lang?: string;
}

const selStyle: React.CSSProperties = { background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', padding:'7px 10px', borderRadius:'var(--r-sm)', fontSize:12, flex:1 };

export function ExportSelectors({ zone, setZone, type, setType, year, setYear, month, setMonth, showAll, lang = 'id' }: ExportSelectorsProps) {
  const t = useT();
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
      <select style={{ ...selStyle, flex:'none', minWidth:70 }} value={zone} onChange={e => setZone(e.target.value as 'KRS'|'SLK'|'ALL')}>
        <option value="KRS">KRS</option><option value="SLK">SLK</option>
        {showAll && <option value="ALL">ALL</option>}
      </select>
      <select style={{ ...selStyle, flex:'none', minWidth:90 }} value={type} onChange={e => setType(e.target.value as 'monthly'|'yearly')}>
        <option value="monthly">{t('settings.export.monthly')}</option>
        <option value="yearly">{t('settings.export.yearly')}</option>
      </select>
      <select style={{ ...selStyle, flex:'none', minWidth:56 }} value={year} onChange={e => setYear(+e.target.value)}>
        {getYears().map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {type === 'monthly' && (
        <select style={{ ...selStyle, flex:'none', minWidth:66 }} value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
        </select>
      )}
    </div>
  );
}
