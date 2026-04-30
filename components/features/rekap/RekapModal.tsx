// components/features/rekap/RekapModal.tsx — Sub-component dipecah dari RekapView (Fase 3)
'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS_EN, MONTHS_ID } from '@/lib/constants';
import { getPay, isFree, rp, getKey } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { persistPayment } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { X, Gift, Lock } from 'lucide-react';

interface RekapModalProps {
  inputDirty: React.MutableRefObject<boolean>;
  modalClosing: React.MutableRefObject<boolean>;
  onClose: () => void;
}

export default function RekapModal({ inputDirty, modalClosing, onClose }: RekapModalProps) {
  const {
    appData, setAppData, uid, userEmail,
    activeZone, selYear,
    rekapExpanded,
    globalLocked, lockedEntries,
    setSyncStatus,
    settings,
  } = useAppStore();

  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;

  if (!rekapExpanded) return null;
  const { name, month } = rekapExpanded;

  const entryVal  = getPay(appData, activeZone, name, selYear, month);
  const entryFree = isFree(appData, activeZone, name, selYear, month);
  const locked    = globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  const info      = appData.memberInfo?.[activeZone + '__' + name] || {};
  const tarif     = info.tarif as number | undefined;
  const quickAmts = settings?.quickAmounts || [50, 80, 90, 100, 150, 200];

  async function persist(newData: typeof appData, action: string, detail: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }

  async function quickPay(amt: number) {
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const k       = getKey(activeZone, name, selYear, month);
    const newData = { ...appData, payments: { ...appData.payments, [k]: amt } };
    if (settings?.autoDate) {
      const today   = new Date().toISOString().slice(0, 10);
      const infoKey = `${activeZone}__${name}`;
      const dateKey = `date_${selYear}_${month}`;
      newData.memberInfo = {
        ...(newData.memberInfo || {}),
        [infoKey]: { ...(newData.memberInfo?.[infoKey] || {}), [dateKey]: today },
      };
    }
    await persist(newData, `[PAY] ${tLog('log.action.quickPay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear} → ${rp(amt)}`);
    showToast(`${name} ${MONTH_NAMES[month]} → ${rp(amt)}`);
    onClose();
  }

  async function manualPay(val: string) {
    if (!inputDirty.current) return;
    if (modalClosing.current) return;
    inputDirty.current = false;
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const k       = getKey(activeZone, name, selYear, month);
    const newData = { ...appData, payments: { ...appData.payments } };
    if (val === '') {
      delete newData.payments[k];
      await persist(newData, `[DEL] ${tLog('log.action.deletePay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear}`);
      showToast(`${name} ${MONTH_NAMES[month]} ${t('common.deleted')}`, 'err');
    } else {
      const amt = +val;
      if (isNaN(amt)) { showToast('Nominal tidak valid', 'err'); return; }
      newData.payments[k] = amt;
      await persist(newData, `[PAY] ${tLog('log.action.pay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear} → ${rp(amt)}`);
      showToast(`${name} ${MONTH_NAMES[month]} → ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`);
    }
    onClose();
  }

  async function clearPay(e: React.MouseEvent) {
    e.stopPropagation();
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const curVal = getPay(appData, activeZone, name, selYear, month);
    if (curVal === null) return;
    showConfirm(
      '[DEL]',
      `${t('rekap.deletePayment')} <b>${name}</b>?<br><span style="font-size:11px;color:var(--txt3)">${MONTH_NAMES[month]} ${selYear} · ${curVal > 0 ? rp(curVal) : t('rekap.accumulation')}</span>`,
      t('membercard.deleteYes'),
      async () => {
        const k       = getKey(activeZone, name, selYear, month);
        const newData = { ...appData, payments: { ...appData.payments } };
        delete newData.payments[k];
        await persist(newData, `[DEL] ${tLog('log.action.deletePay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear}`);
        showToast(`${name} ${MONTH_NAMES[month]} ${t('common.deleted')}`, 'err');
        onClose();
      }
    );
  }

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:8000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: Math.round(window.innerHeight * 0.18), background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{
          background:'rgba(24,28,39,0.92)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-lg)',
          width:'min(320px,90vw)', boxShadow:'var(--shadow-lg)',
          overflow:'hidden', animation:'modalScaleIn var(--t-base) var(--ease-spring)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:4 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--txt)', fontFamily:"'DM Mono',monospace" }}>{name}</div>
            <div style={{ fontSize:10, color:'var(--zc)', marginTop:2 }}>{activeZone} · {MONTH_NAMES[month]} {selYear}</div>
          </div>
          <button onClick={onClose} aria-label="Tutup" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--txt3)', width:32, height:32, borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding:'14px 16px 16px' }}>
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
                  onChange={() => { inputDirty.current = true; }}
                  onBlur={e => manualPay(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      inputDirty.current = true;
                      manualPay((e.target as HTMLInputElement).value);
                    }
                  }}
                  autoFocus
                />
                {entryVal !== null && (
                  <button className="delbtn" onClick={clearPay} aria-label={t('action.delete')}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {tarif && (
                  <button className="qb" style={{ borderColor:'var(--zc)', color:'var(--zc)', fontWeight:700 }} onClick={() => quickPay(tarif)}>
                    {tarif} ★
                  </button>
                )}
                {quickAmts.filter(a => a !== tarif).map(a => (
                  <button key={a} className="qb" onClick={() => quickPay(a)}>{a}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
