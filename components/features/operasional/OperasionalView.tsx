// components/features/operasional/OperasionalView.tsx — Fase 4: cleanup
'use client';

import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { getZoneTotal, rp } from '@/lib/helpers'
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { persistPayment } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { X, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import type { OpsItem } from '@/types';

// Font dan ukuran konsisten untuk semua elemen
const FONT    = "'DM Mono',monospace";
const FS_BODY = 12;  // font size semua input dan label
const FS_VAL  = 12;  // font size semua nilai result — SAMA semua
const FS_LBL  = 11;  // font size label result

export default function OperasionalView() {
  const { appData, setAppData, uid, userEmail, opsYear, opsMonth, setOpsYear, setOpsMonth, setSyncStatus } = useAppStore();

  const opsKey  = `${opsYear}_${opsMonth}`;
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;
  const opsData = appData.operasional?.[opsKey] || { items: [] };
  const items   = opsData.items || [];

  const krsTotal    = getZoneTotal(appData, 'KRS', opsYear, opsMonth);
  const slkTotal    = getZoneTotal(appData, 'SLK', opsYear, opsMonth);
  const grossIncome = krsTotal + slkTotal;
  const totalOps    = items.reduce((s, it) => s + (+it.nominal || 0), 0);
  const netIncome   = grossIncome - totalOps;

  async function persist(newData: typeof appData) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action:`[OPS] ${tLog('log.action.updateOps')}`, detail:`${MONTH_NAMES[opsMonth]} ${opsYear}` }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }

  function updatedData(newItems: OpsItem[]) {
    return { ...appData, operasional: { ...appData.operasional, [opsKey]: { items: newItems } } };
  }

  async function addItem() { await persist(updatedData([...items, { label:'', nominal:0 }])); }

  async function updateItem(i: number, field: 'label' | 'nominal', val: string) {
    const newItems = items.map((it, idx) =>
      idx === i ? { ...it, [field]: field === 'nominal' ? (+val || 0) : val } : it
    );
    await persist(updatedData(newItems));
  }

  function deleteItem(i: number) {
    const item = items[i];
    showConfirm('[DEL]', `${t('action.delete')} <b>${item?.label || 'item'}</b>?`, t('action.confirm'), async () => {
      await persist(updatedData(items.filter((_, idx) => idx !== i)));
      showToast(t('common.deleted'), 'err');
    });
  }

  const minYear = 2026;
  const filteredYears = getYears().filter(y => y >= minYear);

  // Style konsisten untuk semua input
  const inputBaseStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    borderRadius:6, padding:'8px 10px', fontSize:FS_BODY, fontFamily:FONT,
    outline:'none',
  };

  // Style konsisten untuk semua baris result
  function ResultRow({ label, value, color, highlight }: { label:string; value:string; color:string; highlight?:boolean }) {
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding: highlight ? '10px 12px' : '8px 0',
        borderBottom: highlight ? 'none' : '1px solid var(--border)',
        background: highlight ? 'rgba(34,197,94,0.06)' : 'transparent',
        borderRadius: highlight ? 'var(--r-sm)' : 0,
        marginTop: highlight ? 6 : 0,
        border: highlight ? '1px solid rgba(34,197,94,0.2)' : undefined,
      }}>
        <span style={{ fontSize:FS_LBL, color: highlight ? 'var(--c-lunas)' : 'var(--txt3)', fontFamily:FONT, fontWeight: highlight ? 700 : 400 }}>
          {label}
        </span>
        <span style={{ fontSize:FS_VAL, color, fontFamily:FONT, fontWeight:600 }}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Period selector */}
      <div className="ctrl-row" style={{ marginBottom:10 }}>
        <select className="cs" value={opsYear} onChange={e => { const y=+e.target.value; setOpsYear(y); if(y===minYear&&opsMonth<0) setOpsMonth(0); }}>
          {filteredYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="cs" value={opsMonth} onChange={e => setOpsMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i} disabled={opsYear===minYear&&i<0}>{m}</option>)}
        </select>
        <span style={{ fontSize:11, color:'var(--txt3)', alignSelf:'center', fontFamily:FONT }}>{MONTH_NAMES[opsMonth]} {opsYear}</span>
      </div>

      {/* Items */}
      <div className="ops-card">
        <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:10, fontFamily:FONT }}>
          {t('ops.expenseTitle')}
        </div>

        {items.map((it, i) => (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            {/* Label keterangan */}
            <input
              style={{ ...inputBaseStyle, flex:1 }}
              placeholder={t('ops.itemPlaceholder')}
              defaultValue={it.label}
              onBlur={e => updateItem(i, 'label', e.target.value)}
              autoComplete="off"
            />
            {/* Nominal — rata kanan, font sama */}
            <input
              style={{ ...inputBaseStyle, width:90, textAlign:'right' }}
              type="number"
              inputMode="numeric"
              placeholder="0"
              defaultValue={it.nominal || ''}
              onBlur={e => updateItem(i, 'nominal', e.target.value)}
              autoComplete="off"
            />
            <button onClick={() => deleteItem(i)}
              aria-label={`Hapus item ${it.label || i + 1}`}
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--c-belum)', padding:'7px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:FS_BODY, flexShrink:0, fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', minWidth:34, minHeight:34 }}>
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>
        ))}

        <button onClick={addItem}
          style={{ width:'100%', background:'var(--bg3)', border:'1px dashed var(--border)', color:'var(--zc)', padding:9, borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:FS_BODY, marginTop:6, fontFamily:FONT }}>
          {t('ops.addItem')}
        </button>
      </div>

      {/* Result — semua font sama ukuran FS_VAL */}
      <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, padding:'4px 14px', marginTop:10 }}>
        <ResultRow label={t('ops.incomeKRS')}    value={rp(krsTotal)}    color="var(--zc-krs)" />
        <ResultRow label={t('ops.incomeSLK')}    value={rp(slkTotal)}    color="var(--zc-slk)" />
        <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
        <ResultRow label={t('ops.grossIncome')}  value={rp(grossIncome)} color="var(--c-lunas)" />
        <ResultRow label={t('ops.totalExpense')} value={rp(totalOps)}    color="var(--c-belum)" />
        <ResultRow
          label={t('ops.netIncome')}
          value={rp(netIncome)}
          color={netIncome >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)'}
          highlight
        />
      </div>
    </div>
  );
}
