// components/features/members/MemberCard.tsx — Fase 4: left border + Lucide + micro-interact + batch
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { getPay, isFree, isLunas, rp } from '@/lib/helpers';
import { saveDB } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import RiwayatModal from '@/components/modals/RiwayatModal';
import type { Zone } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  ChevronUp, ChevronDown, CheckCircle2, XCircle, Gift,
  Trash2, Clock, Lock, History, Zap, Check,
} from 'lucide-react';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';

interface Props {
  name: string;
  index: number;
  batchMode?: boolean;
  batchSelected?: boolean;
  onLongPress?: () => void;
  onBatchToggle?: () => void;
}

export default function MemberCard({ name, index, batchMode = false, batchSelected = false, onLongPress, onBatchToggle }: Props) {
  const {
    appData, setAppData, uid, userEmail,
    activeZone, selYear, selMonth,
    expandedCard, setExpandedCard,
    entryCardYear, entryCardMonth, setEntryCard,
    globalLocked, lockedEntries,
    setSyncStatus,
    setRiwayatZone, setRiwayatName, setRiwayatYear,
    settings,
  } = useAppStore();

  const [riwOpen, setRiwOpen] = useState(false);
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;
  const inputDirty   = useRef(false);
  const isCollapsing = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress  = useRef(false);

  const cardYear  = entryCardYear[name]  ?? selYear;
  const cardMonth = entryCardMonth[name] ?? selMonth;
  const info      = appData.memberInfo?.[activeZone + '__' + name] || {};
  const val       = getPay(appData, activeZone, name, selYear, selMonth);
  const entryVal  = getPay(appData, activeZone, name, cardYear, cardMonth);
  const freeCur   = isFree(appData, activeZone, name, selYear, selMonth);
  const freeEntry = isFree(appData, activeZone, name, cardYear, cardMonth);
  const isLocked  = globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  const isExp     = expandedCard === name;

  // Status untuk left border
  const statusBorder = freeCur
    ? 'var(--c-free)'
    : (val !== null ? 'var(--c-lunas)' : 'var(--c-belum)');

  const cardRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isExp) {
      inputDirty.current = false;
      isCollapsing.current = false;
    }
  }, [isExp]);

  useEffect(() => {
    if (!isExp) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
    return () => clearTimeout(t);
  }, [isExp]);

  async function persist(newData: typeof appData, action: string, detail: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await saveDB(uid, newData, { action, detail }, userEmail || '');
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }

  async function saveEntryPay(rawVal: string) {
    if (!inputDirty.current) return;
    if (isCollapsing.current) return;
    if (isLocked) { showToast(t('lockbanner.message'), 'err'); return; }

    const k = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const newData = { ...appData, payments: { ...appData.payments } };

    if (rawVal === '' || rawVal === null) {
      delete newData.payments[k];
      await persist(newData, `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`, `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`);
      showToast(`${name} ${t('common.deleted')}`, 'err');
    } else {
      const amt = +rawVal;
      if (isNaN(amt)) { showToast('Nominal tidak valid', 'err'); return; }
      newData.payments[k] = amt;
      await persist(newData, `[PAY] ${tLog('log.action.pay')} ${activeZone} - ${name}`, `${MONTH_NAMES[cardMonth]} ${cardYear}: ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`);
      showToast(`${name} → ${amt === 0 ? 'Akumulasi' : rp(amt)}`);
    }
    inputDirty.current = false;
  }

  function doQuickPay(amt: number) {
    const k = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const newData = { ...appData, payments: { ...appData.payments, [k]: amt } };
    if (settings?.autoDate) {
      const today = new Date().toISOString().slice(0, 10);
      const infoKey = `${activeZone}__${name}`;
      const dateKey = `date_${cardYear}_${cardMonth}`;
      newData.memberInfo = {
        ...(newData.memberInfo || {}),
        [infoKey]: { ...(newData.memberInfo?.[infoKey] || {}), [dateKey]: today },
      };
    }
    persist(newData, `[PAY] ${tLog('log.action.quickPay')} ${activeZone} - ${name}`, `${MONTH_NAMES[cardMonth]} ${cardYear}: ${rp(amt)}`);
    showToast(`${name} → ${rp(amt)}`);
    inputDirty.current = false;
    setExpandedCard(null);
  }

  async function quickPay(amt: number) {
    if (isLocked) { showToast('Data terkunci! Unlock dulu', 'err'); return; }
    const tarifMember = info.tarif as number | undefined;
    // Konfirmasi jika nominal > tarif
    if (tarifMember && amt > tarifMember) {
      showConfirm(
        '!',
        `${t('entry.confirmHighNominal')}<br><span style="font-size:11px;color:var(--txt3)">${name} · ${rp(tarifMember)} → ${rp(amt)}</span>`,
        t('action.confirm'),
        () => doQuickPay(amt),
      );
      return;
    }
    doQuickPay(amt);
  }

  async function clearPay() {
    if (isLocked) { showToast('Data terkunci! Unlock dulu', 'err'); return; }
    if (entryVal === null) return;
    showConfirm(
      'X',
      `Hapus pembayaran <b>${name}</b>?<br><span style="font-size:11px;color:var(--txt3)">${MONTH_NAMES[cardMonth]} ${cardYear} · ${entryVal > 0 ? rp(entryVal) : t('rekap.accumulation')}</span>`,
      t('membercard.deleteYes'),
      async () => {
        const k = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
        const newData = { ...appData, payments: { ...appData.payments } };
        delete newData.payments[k];
        await persist(newData, `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`, `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`);
        showToast(`${name} dihapus`, 'err');
      }
    );
  }

  async function saveDate(dateVal: string) {
    if (!dateVal) return;
    const k2      = `date_${cardYear}_${cardMonth}`;
    const infoKey = `${activeZone}__${name}`;
    const newInfo = {
      ...(appData.memberInfo || {}),
      [infoKey]: { ...(appData.memberInfo?.[infoKey] || {}), [k2]: dateVal },
    };
    await persist({ ...appData, memberInfo: newInfo }, `[DATE] ${tLog('log.action.updateDate')} ${activeZone} - ${name}`, `${MONTH_NAMES[cardMonth]} ${cardYear}: ${dateVal}`);
  }

  function handleToggle() {
    if (batchMode) { onBatchToggle?.(); return; }
    if (isExp) {
      isCollapsing.current = true;
      setExpandedCard(null);
    } else {
      setExpandedCard(name);
    }
  }

  function openRiwayat(e: React.MouseEvent) {
    e.stopPropagation();
    setRiwayatZone(activeZone as Zone);
    setRiwayatName(name);
    setRiwayatYear(new Date().getFullYear());
    setRiwOpen(true);
  }

  // Long press handlers
  function handlePointerDown() {
    if (batchMode) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.();
    }, 500);
  }
  function handlePointerUp() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }
  function handlePointerLeave() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  // Badge status (top row)
  let tagEl: React.ReactNode;
  if (freeCur)
    tagEl = <span className="mc-tag" style={{ background:'rgba(59,130,246,0.12)', color:'var(--c-free)', border:'1px solid rgba(59,130,246,0.25)', fontSize:9, display:'flex', alignItems:'center', gap:3 }}><Gift size={9} /></span>;
  else if (val !== null && val > 0)
    tagEl = <span className="mc-tag tpaid" style={{ display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={9} /></span>;
  else if (val === 0)
    tagEl = <span className="mc-tag" style={{ background:'rgba(34,197,94,0.08)', color:'var(--c-lunas)', border:'1px solid rgba(34,197,94,0.2)', fontSize:9, display:'flex', alignItems:'center', gap:3 }}><Check size={9} /> 0</span>;
  else
    tagEl = <span className="mc-tag tunpaid" style={{ display:'flex', alignItems:'center', gap:3 }}><XCircle size={9} /></span>;

  // ID badge
  const idEl = info.id
    ? (info.ip
        ? <a className="mc-id" href={String(info.ip).startsWith('http') ? String(info.ip) : 'http://' + String(info.ip)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{String(info.id)}</a>
        : <span className="mc-id" style={{ cursor:'pointer' }} onClick={openRiwayat}>{String(info.id)}</span>)
    : null;

  return (
    <>
      <div
        ref={cardRef}
        id={`card-${name.replace(/\s/g, '_')}`}
        className={`mcard ${isExp ? 'expanded' : ''}`}
        style={{
          // Left border status — 3px solid, sesuai status member
          borderLeft: `3px solid ${batchSelected ? 'var(--zc)' : statusBorder}`,
          borderRadius: 'var(--r-md)',
          // Micro-interaction: scale saat tap
          transition: 'transform var(--t-fast) var(--ease-smooth), box-shadow var(--t-base) var(--ease-smooth)',
          // Batch mode highlight
          opacity: batchMode && !batchSelected ? 0.6 : 1,
          background: batchSelected ? 'rgba(var(--zc-rgb, 59,130,246),0.06)' : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={e => { e.preventDefault(); }} // prevent context menu on long press mobile
      >
        {/* Top row */}
        <div
          className="mc-top"
          onClick={handleToggle}
          style={{ userSelect:'none' }}
        >
          {/* Batch checkbox */}
          {batchMode && (
            <div style={{
              width:18, height:18, borderRadius:'var(--r-xs)',
              border: `2px solid ${batchSelected ? 'var(--zc)' : 'var(--border)'}`,
              background: batchSelected ? 'var(--zc)' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, marginRight:4, transition:'all var(--t-fast)',
            }}>
              {batchSelected && <Check size={11} color="#fff" />}
            </div>
          )}

          <span className="mc-num">{index + 1}</span>
          {idEl}
          <span className="mc-name">{name}</span>
          {val !== null && (
            val === 0
              ? <span style={{ fontSize:10, color:'var(--c-lunas)' }}>{t('membercard.acm')}</span>
              : <span style={{ fontSize:11, color:'var(--c-lunas)' }}>{val.toLocaleString('id-ID')}</span>
          )}
          {tagEl}
          {!batchMode && (
            <span style={{ color:'var(--txt4)', fontSize:12, marginLeft:2, display:'flex', alignItems:'center' }}>
              {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>

        {/* Body expanded */}
        {isExp && !batchMode && (
          <div className="mc-body">
            {/* Bulan selector */}
            <div className="mc-row" style={{ marginBottom:6 }}>
              <span className="mc-label">{t('common.month').toUpperCase()}</span>
              <select className="cs" style={{ fontSize:11, padding:'4px 8px' }} value={cardYear}
                onChange={e => setEntryCard(name, +e.target.value, cardMonth)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="cs" style={{ fontSize:11, padding:'4px 8px' }} value={cardMonth}
                onChange={e => setEntryCard(name, cardYear, +e.target.value)}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>

            {freeEntry ? (
              <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--r-sm)', padding:8, fontSize:11, color:'var(--c-lunas)', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Gift size={13} /> {t('rekap.freeMember')}
              </div>
            ) : isLocked ? (
              <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--r-sm)', padding:8, fontSize:11, color:'var(--c-belum)', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Lock size={13} /> {t('rekap.dataLocked')}
              </div>
            ) : (
              <>
                {/* Input nominal */}
                <div className="mc-row">
                  <span className="mc-label">{t('common.amount').toUpperCase()}</span>
                  <input
                    ref={inputRef}
                    className="mc-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    defaultValue={entryVal !== null ? String(entryVal) : ''}
                    id={`inp-${name.replace(/\s/g, '_')}`}
                    onChange={() => { inputDirty.current = true; }}
                    onBlur={e => saveEntryPay(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        inputDirty.current = true;
                        saveEntryPay((e.target as HTMLInputElement).value);
                        setExpandedCard(null);
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                  {entryVal !== null && (
                    <button className="delbtn" onClick={clearPay} aria-label="Hapus pembayaran">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Tanggal */}
                <div className="mc-row">
                  <span className="mc-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={10} />{t('membercard.payDate').toUpperCase()}
                  </span>
                  <input
                    className="mc-date"
                    type="date"
                    defaultValue={(info[`date_${cardYear}_${cardMonth}`] as string) || ''}
                    onBlur={e => saveDate(e.target.value)}
                  />
                </div>

                {/* Quick pay */}
                <div className="mc-row">
                  <span className="mc-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Zap size={10} />QUICK
                  </span>
                  <div className="qrow">
                    {info.tarif
                      ? (
                        /* Quick pay button dengan ripple effect */
                        <button
                          className="qb"
                          style={{ borderColor:'var(--zc)', color:'var(--zc)', fontWeight:700, position:'relative', overflow:'hidden' }}
                          onClick={e => {
                            // Ripple effect
                            const btn = e.currentTarget;
                            const ripple = document.createElement('span');
                            const rect = btn.getBoundingClientRect();
                            const size = Math.max(rect.width, rect.height);
                            ripple.style.cssText = `
                              position:absolute; border-radius:50%;
                              width:${size}px; height:${size}px;
                              left:${e.clientX - rect.left - size/2}px;
                              top:${e.clientY - rect.top - size/2}px;
                              background:rgba(255,255,255,0.25);
                              transform:scale(0); animation:ripple-anim 400ms ease-out forwards;
                              pointer-events:none;
                            `;
                            btn.appendChild(ripple);
                            setTimeout(() => ripple.remove(), 400);
                            quickPay(info.tarif as number);
                          }}
                        >
                          {info.tarif as number}k
                        </button>
                      )
                      : <span style={{ fontSize:9, color:'var(--txt4)', alignSelf:'center' }}>{t('entry.noTarifShort')}</span>}
                    {(settings?.quickAmounts || DEFAULT_SETTINGS.quickAmounts).filter(a => a !== info.tarif).map(a => (
                      <button key={a} className="qb" onClick={() => quickPay(a)}>{a}</button>
                    ))}
                  </div>
                </div>

                {/* Hint tarif */}
                {!info.tarif && (
                  <div style={{ fontSize:9, color:'var(--txt4)', marginTop:-4, marginBottom:4 }}>
                    {t('membercard.setTarifHint')}
                  </div>
                )}
              </>
            )}

            {/* Riwayat link */}
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border2)', display:'flex', justifyContent:'flex-end' }}>
              <button
                onClick={openRiwayat}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'var(--txt3)', fontSize:11, display:'flex', alignItems:'center', gap:5,
                  padding:'4px 0', minHeight:32,
                }}
              >
                <History size={13} /> {t('membercard.history')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ripple keyframe — inject sekali */}
      <style>{`
        @keyframes ripple-anim {
          to { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <RiwayatModal open={riwOpen} onClose={() => setRiwOpen(false)} />
    </>
  );
}
