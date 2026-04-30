// components/modals/FreeMemberModal.tsx — Fase 4: Lucide + glassmorphism
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { saveDB } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Gift, CreditCard, X, Check } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { Zone } from '@/types';

interface Props {
  open:    boolean;
  zone:    Zone;
  name:    string;
  onClose: () => void;
}

export default function FreeMemberModal({ open, zone, name, onClose }: Props) {
  const { appData, setAppData, uid, userEmail, setSyncStatus } = useAppStore();
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;

  const existing = appData.freeMembers?.[zone+'__'+name];
  const now = new Date();

  const [fromYear,  setFromYear]  = useState(existing?.fromYear  ?? now.getFullYear());
  const [fromMonth, setFromMonth] = useState(existing?.fromMonth ?? now.getMonth());
  const [toYear,    setToYear]    = useState(existing?.toYear    ?? now.getFullYear());
  const [toMonth,   setToMonth]   = useState(existing?.toMonth   ?? 11);
  const [noEnd,     setNoEnd]     = useState(existing ? existing.toYear === undefined : false);

  useEffect(() => {
    if (!open) return;
    const fm = appData.freeMembers?.[zone+'__'+name];
    setFromYear(fm?.fromYear  ?? now.getFullYear());
    setFromMonth(fm?.fromMonth ?? now.getMonth());
    setToYear(fm?.toYear      ?? now.getFullYear());
    setToMonth(fm?.toMonth    ?? 11);
    setNoEnd(fm ? fm.toYear === undefined : false);
  }, [open, zone, name]);

  if (!open) return null;

  async function persist(newData: typeof appData, action: string, detail: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try { await saveDB(uid, newData, { action, detail }, userEmail || ''); setSyncStatus('ok'); }
    catch { setSyncStatus('err'); }
  }

  async function handleSave() {
    if (!noEnd && (toYear * 12 + toMonth) < (fromYear * 12 + fromMonth)) {
      showToast(t('freemodal.dateError'), 'err');
      return;
    }
    const key      = zone + '__' + name;
    const freeData = {
      active: true, fromYear, fromMonth,
      ...(noEnd ? {} : { toYear, toMonth }),
    };
    const newData = {
      ...appData,
      freeMembers: { ...(appData.freeMembers || {}), [key]: freeData },
    };
    const detail = `${lang === 'en' ? 'From' : 'Dari'} ${MONTH_NAMES[fromMonth]} ${fromYear}${noEnd ? (lang === 'en' ? ' (forever)' : ' (selamanya)') : (lang === 'en' ? ' to ' : ' s/d ') + MONTH_NAMES[toMonth] + ' ' + toYear}`;
    await persist(newData, `[FREE] Set Free Member ${zone} - ${name}`, detail);
    showToast(`${name} ${t('freemodal.setFree')}`);
    onClose();
  }

  function handleRemove() {
    showConfirm(
      '[PAY]',
      `${t('freemodal.removeConfirm')} <b>${name}</b>?<br><span style="font-size:11px;color:var(--txt3)">${t('freemodal.removeNote')}</span>`,
      t('freemodal.removeYes'),
      async () => {
        const key     = zone + '__' + name;
        const newFree = { ...(appData.freeMembers || {}) };
        delete newFree[key];
        await persist({ ...appData, freeMembers: newFree }, `[PAY] Kembalikan ke Berbayar ${zone} - ${name}`, 'Free member dihapus');
        showToast(`${name} ${t('freemodal.removed')}`);
        onClose();
      }
    );
  }

  const cs: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)',
    color:'var(--txt)', padding:'7px 10px', borderRadius:'var(--r-sm)',
    fontSize:12, flex:1,
  };

  return (
    <div
      style={{ display:'flex', position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', zIndex:9000, alignItems:'center', justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        style={{
          background:'rgba(24,28,39,0.95)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-lg)',
          padding:20, width:'min(360px,95vw)', maxHeight:'85vh', overflowY:'auto',
          boxShadow:'var(--shadow-lg)',
          animation:'modalScaleIn var(--t-base) var(--ease-spring)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingBottom:14 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'var(--txt)', display:'flex', alignItems:'center', gap:8 }}>
            <Gift size={16} strokeWidth={1.5} color="var(--c-free)" />
            Free Member: {name}
          </div>
          <button
            onClick={onClose}
            aria-label={t("action.close")}
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--txt3)', width:32, height:32, borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Dari */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6, letterSpacing:'.06em', fontFamily:"'DM Sans',sans-serif" }}>{t("freemodal.startFrom").toUpperCase()}</div>
          <div style={{ display:'flex', gap:6 }}>
            <select style={cs} value={fromYear}  onChange={e => setFromYear(+e.target.value)}>
              {getYears().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select style={cs} value={fromMonth} onChange={e => setFromMonth(+e.target.value)}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Toggle selamanya */}
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--txt2)', cursor:'pointer', marginBottom:10, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'var(--r-sm)', border:'1px solid var(--border)' }}>
          <input
            type="checkbox" checked={noEnd}
            onChange={e => setNoEnd(e.target.checked)}
            style={{ accentColor:'var(--c-free)', width:14, height:14 }}
          />
          {t("freemodal.forever")}
        </label>

        {/* Sampai */}
        {!noEnd && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:6, letterSpacing:'.06em', fontFamily:"'DM Sans',sans-serif" }}>{t("freemodal.until").toUpperCase()}</div>
            <div style={{ display:'flex', gap:6 }}>
              <select style={cs} value={toYear}  onChange={e => setToYear(+e.target.value)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select style={cs} value={toMonth} onChange={e => setToMonth(+e.target.value)}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:16 }}>
          <button
            onClick={handleSave}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'var(--c-lunas)', padding:'11px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600, fontSize:13, transition:'all var(--t-fast)' }}
          >
            <Check size={14} /> {t("freemodal.save")}
          </button>
          {existing && (
            <button
              onClick={handleRemove}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--c-belum)', padding:'11px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600, fontSize:13, transition:'all var(--t-fast)' }}
            >
              <CreditCard size={14} /> {t("freemodal.remove")}
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--txt4)', padding:'9px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12, transition:'all var(--t-fast)' }}
          >
            {t('action.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
