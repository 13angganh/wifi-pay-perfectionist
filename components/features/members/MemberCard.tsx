// components/features/members/MemberCard.tsx — Fase 4 + UX Fix
// UX: haptic feedback · loading state · inputMode decimal · long press ring
//     double-submit prevention · undo payment · success flash · auto-focus
'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { getPay, isFree, rp } from '@/lib/helpers';
import { saveDB } from '@/lib/db';
import { showToast, showToastUndo } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import RiwayatModal from '@/components/modals/RiwayatModal';
import { haptic } from '@/lib/haptic';
import type { Zone } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  ChevronUp, ChevronDown, CheckCircle2, XCircle, Gift,
  Trash2, Clock, Lock, History, Zap, Check, Loader2,
} from 'lucide-react';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';

interface Props {
  name:          string;
  index:         number;
  batchMode?:    boolean;
  batchSelected?: boolean;
  onLongPress?:  () => void;
  onBatchToggle?: () => void;
}

// ── Search highlight helper ──
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.trim().length === 0) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background: 'var(--zcdim)', color: 'var(--zc)',
        borderRadius: 2, padding: '0 1px', fontWeight: 700, fontStyle: 'normal',
      }}>
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
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
    settings, search,
  } = useAppStore();

  const [riwOpen,       setRiwOpen]       = useState(false);
  // UX: loading state saat save (double-submit prevention)
  const [isSaving,      setIsSaving]      = useState(false);
  // UX: long press visual ring
  const [isLongPressing, setIsLongPressing] = useState(false);
  // UX: success flash setelah payment tersimpan
  const [showSuccess,   setShowSuccess]   = useState(false);
  // v11.5.2: counter untuk force re-trigger animasi checkmark (lihat .mc-success-check) —
  // tanpa ini, klik bayar dua kali cepat berturut-turut bisa membuat browser skip replay
  // animasi karena elemen dianggap "tidak berubah" (key sama).
  const [successKey,    setSuccessKey]    = useState(0);

  const isSavingRef    = useRef(false);  // sync guard
  const inputDirty     = useRef(false);
  const isCollapsing   = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress    = useRef(false);

  const t           = useT();
  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  // FIX 6: default ke bulan/tahun SAAT INI saat kartu pertama dibuka
  // bukan selMonth/selYear yang mungkin sudah berubah dari klik sebelumnya
  const _nowY = new Date().getFullYear();
  const _nowM = new Date().getMonth();
  const cardYear  = entryCardYear[name]  ?? _nowY;
  const cardMonth = entryCardMonth[name] ?? _nowM;
  const info      = appData.memberInfo?.[activeZone + '__' + name] || {};
  const val       = getPay(appData, activeZone, name, selYear, selMonth);
  const entryVal  = getPay(appData, activeZone, name, cardYear, cardMonth);
  const freeCur   = isFree(appData, activeZone, name, selYear, selMonth);
  const freeEntry = isFree(appData, activeZone, name, cardYear, cardMonth);
  const isLocked  = globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  const isExp     = expandedCard === name;

  const statusBorder = freeCur
    ? 'var(--c-free)'
    : (val !== null ? 'var(--c-lunas)' : 'var(--c-belum)');

  const cardRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isExp) { inputDirty.current = false; isCollapsing.current = false; return; }
    // FIX 6: saat kartu dibuka, inisialisasi ke bulan saat ini jika belum pernah diset
    if (!entryCardYear[name] && !entryCardMonth[name]) {
      const nowY = new Date().getFullYear();
      const nowM = new Date().getMonth();
      setEntryCard(name, nowY, nowM);
    }
  }, [isExp, name, entryCardYear, entryCardMonth, setEntryCard]);

  useEffect(() => {
    if (!isExp) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
    return () => clearTimeout(timer);
  }, [isExp]);

  // ── persist helper dengan double-submit guard + success flash ──
  async function persist(
    newData: typeof appData,
    action: string,
    detail: string,
  ): Promise<boolean> {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setIsSaving(true);
    setAppData(newData);
    if (!uid) { setIsSaving(false); isSavingRef.current = false; return true; }
    setSyncStatus('loading');
    try {
      await saveDB(uid, newData, { action, detail }, userEmail || '');
      setSyncStatus('ok');
      // UX: brief success flash
      setShowSuccess(true);
      setSuccessKey(k => k + 1);
      setTimeout(() => setShowSuccess(false), 700);
      haptic.success();
      return true;
    } catch {
      setSyncStatus('err');
      haptic.error();
      return false;
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }

  async function saveEntryPay(rawVal: string) {
    if (!inputDirty.current) return;
    if (isCollapsing.current) return;
    if (isLocked) { showToast(t('lockbanner.message'), 'err'); haptic.error(); return; }

    const k       = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const prevVal = entryVal; // simpan untuk undo
    const newData = { ...appData, payments: { ...appData.payments } };

    if (rawVal === '' || rawVal === null) {
      delete newData.payments[k];
      const ok = await persist(
        newData,
        `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`,
        `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`,
      );
      if (ok) showToast(`${name} ${t('common.deleted')}`, 'err');
    } else {
      const amt = +rawVal;
      if (isNaN(amt)) { showToast('Nominal tidak valid', 'err'); return; }
      newData.payments[k] = amt;
      const ok = await persist(
        newData,
        `[PAY] ${tLog('log.action.pay')} ${activeZone} - ${name}`,
        `${MONTH_NAMES[cardMonth]} ${cardYear}: ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`,
      );
      if (ok) {
        // UX: undo selama 4 detik
        const undoMsg = `${name} → ${amt === 0 ? 'Akumulasi' : rp(amt)}`;
        showToastUndo(undoMsg, async () => {
          const revert = { ...appData, payments: { ...appData.payments } };
          if (prevVal === null) delete revert.payments[k];
          else revert.payments[k] = prevVal;
          await persist(revert, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
          showToast(`${name} dibatalkan`, 'info');
        });
      }
    }
    inputDirty.current = false;
  }

  function doQuickPay(amt: number) {
    const k       = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const prevVal = entryVal; // simpan untuk undo
    const newData = { ...appData, payments: { ...appData.payments, [k]: amt } };
    if (settings?.autoDate) {
      const today   = new Date().toISOString().slice(0, 10);
      const infoKey = `${activeZone}__${name}`;
      const dateKey = `date_${cardYear}_${cardMonth}`;
      newData.memberInfo = {
        ...(newData.memberInfo || {}),
        [infoKey]: { ...(newData.memberInfo?.[infoKey] || {}), [dateKey]: today },
      };
    }
    // FIX 8: Optimistic UI — update state + toast LANGSUNG, Firebase async di background
    setAppData(newData);
    setExpandedCard(null);
    inputDirty.current = false;
    haptic.success();
    // Toast + undo langsung muncul tanpa menunggu Firebase
    showToastUndo(`${name} → ${rp(amt)}`, async () => {
      const revert = { ...appData, payments: { ...appData.payments } };
      if (prevVal === null) delete revert.payments[k];
      else revert.payments[k] = prevVal;
      await persist(revert, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
      showToast(`${name} dibatalkan`, 'info');
    });
    // Firebase write di background
    if (uid) {
      setSyncStatus('loading');
      saveDB(uid, newData,
        { action: `[PAY] ${tLog('log.action.quickPay')} ${activeZone} - ${name}`,
          detail: `${MONTH_NAMES[cardMonth]} ${cardYear}: ${rp(amt)}` },
        userEmail || ''
      ).then(() => setSyncStatus('ok')).catch(() => setSyncStatus('err'));
    }
  }

  async function quickPay(amt: number) {
    if (isLocked) { showToast('Data terkunci! Unlock dulu', 'err'); haptic.error(); return; }
    const tarifMember = info.tarif as number | undefined;
    if (tarifMember && amt > tarifMember) {
      haptic.light();
      showConfirm(
        '!',
        t('entry.confirmHighNominal'),
        t('action.confirm'),
        () => doQuickPay(amt),
        { description: `${name} · ${rp(tarifMember)} → ${rp(amt)}` },
      );
      return;
    }
    haptic.light();
    doQuickPay(amt);
  }

  async function clearPay() {
    if (isLocked) { showToast('Data terkunci! Unlock dulu', 'err'); haptic.error(); return; }
    if (entryVal === null) return;
    haptic.light();
    showConfirm(
      '🗑️',
      `Hapus pembayaran ${name}?`,
      t('membercard.deleteYes'),
      async () => {
        const k = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
        const newData = { ...appData, payments: { ...appData.payments } };
        delete newData.payments[k];
        const ok = await persist(
          newData,
          `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`,
          `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`,
        );
        if (ok) showToast(`${name} dihapus`, 'err');
      },
      { description: `${MONTH_NAMES[cardMonth]} ${cardYear} · ${entryVal > 0 ? rp(entryVal) : t('rekap.accumulation')}` },
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
    await persist(
      { ...appData, memberInfo: newInfo },
      `[DATE] ${tLog('log.action.updateDate')} ${activeZone} - ${name}`,
      `${MONTH_NAMES[cardMonth]} ${cardYear}: ${dateVal}`,
    );
  }

  function handleToggle() {
    if (batchMode) { onBatchToggle?.(); return; }
    if (isExp) { isCollapsing.current = true; setExpandedCard(null); }
    else       { setExpandedCard(name); }
  }

  function openRiwayat(e: React.MouseEvent) {
    e.stopPropagation();
    setRiwayatZone(activeZone as Zone);
    setRiwayatName(name);
    setRiwayatYear(new Date().getFullYear());
    setRiwOpen(true);
  }

  // ── Long press handlers — dengan haptic + visual ring ──
  function handlePointerDown() {
    if (batchMode) return;
    isLongPress.current = false;
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setIsLongPressing(false);
      haptic.medium();   // UX: haptic saat long press aktif
      onLongPress?.();
    }, 500);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsLongPressing(false);
  }

  // Badge status
  let tagEl: React.ReactNode;
  if (freeCur)
    tagEl = <span className="mc-tag" style={{ background:'var(--bg3)', color:'var(--c-free)', border:'1px solid var(--border)', fontSize:9, display:'flex', alignItems:'center', gap:3 }}><Gift size={9} /></span>;
  else if (val !== null && val > 0)
    tagEl = <span className="mc-tag tpaid" style={{ display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={9} /></span>;
  else if (val === 0)
    tagEl = <span className="mc-tag" style={{ background:'rgba(34,197,94,0.08)', color:'var(--c-lunas)', border:'1px solid rgba(34,197,94,0.2)', fontSize:9, display:'flex', alignItems:'center', gap:3 }}><Check size={9} /> 0</span>;
  else
    tagEl = <span className="mc-tag tunpaid" style={{ display:'flex', alignItems:'center', gap:3 }}><XCircle size={9} /></span>;

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
        className={`mcard ${isExp ? 'expanded' : ''} ${isLongPressing ? 'long-pressing' : ''} ${showSuccess ? 'payment-success' : ''}`}
        style={{
          borderLeft:  `3px solid ${showSuccess ? 'var(--c-lunas)' : batchSelected ? 'var(--zc)' : statusBorder}`,
          borderRadius: 'var(--r-md)',
          background:   showSuccess
            ? 'rgba(34,197,94,0.06)'
            : batchSelected ? 'rgba(var(--zc-rgb, 59,130,246),0.06)' : undefined,
          transition:  'transform var(--t-fast) var(--ease-smooth), box-shadow var(--t-base) var(--ease-smooth), background 0.35s ease-out, border-left-color 0.35s ease-out',
          opacity:     batchMode && !batchSelected ? 0.6 : 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onContextMenu={e => e.preventDefault()}
      >
        {/* v11.5.2: badge checkmark pojok — micro-interaction "tandai lunas" yang diperkuat.
            key={successKey} memaksa React remount elemen ini setiap trigger baru, sehingga
            animasi CSS (checkPop) selalu replay dari awal meski diklik cepat berturut-turut. */}
        {showSuccess && (
          <div key={successKey} className="mc-success-check" aria-hidden="true">
            <Check size={13} strokeWidth={3} />
          </div>
        )}
        {/* Top row */}
        <div className="mc-top" onClick={handleToggle} style={{ userSelect:'none' }}>
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
          {/* UX: search highlight */}
          <span className="mc-name"><HighlightText text={name} query={search} /></span>

          {/* UX: loading spinner saat isSaving */}
          {isSaving ? (
            <span style={{ display:'flex', alignItems:'center', color:'var(--txt4)', marginLeft:'auto' }}>
              <Loader2 size={12} className="spin" />
            </span>
          ) : val !== null && (
            val === 0
              ? <span style={{ fontSize:10, color:'var(--c-lunas)' }}>{t('membercard.acm')}</span>
              : <span style={{ fontSize:11, color:'var(--c-lunas)' }}>{val.toLocaleString('id-ID')}</span>
          )}
          {!isSaving && tagEl}
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
                {/* Input nominal — UX: inputMode decimal untuk keyboard angka di mobile */}
                <div className="mc-row">
                  <span className="mc-label">{t('common.amount').toUpperCase()}</span>
                  <input
                    ref={inputRef}
                    className="mc-input"
                    type="number"
                    inputMode="decimal"
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
                    disabled={isSaving}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                  {entryVal !== null && !isSaving && (
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
                    disabled={isSaving}
                  />
                </div>

                {/* Quick pay */}
                <div className="mc-row">
                  <span className="mc-label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Zap size={10} />QUICK
                  </span>
                  <div className="qrow">
                    {info.tarif ? (
                      <button
                        className="qb"
                        style={{ borderColor:'var(--zc)', color:'var(--zc)', fontWeight:700, position:'relative', overflow:'hidden', opacity: isSaving ? 0.5 : 1 }}
                        disabled={isSaving}
                        onClick={e => {
                          const btn = e.currentTarget;
                          const ripple = document.createElement('span');
                          const rect   = btn.getBoundingClientRect();
                          const size   = Math.max(rect.width, rect.height);
                          ripple.style.cssText = `position:absolute;border-radius:50%;width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;background:rgba(255,255,255,0.25);transform:scale(0);animation:ripple-anim 400ms ease-out forwards;pointer-events:none;`;
                          btn.appendChild(ripple);
                          setTimeout(() => ripple.remove(), 400);
                          quickPay(info.tarif as number);
                        }}
                      >
                        {isSaving ? <Loader2 size={11} className="spin" /> : `${info.tarif as number}`}
                      </button>
                    ) : (
                      <span style={{ fontSize:9, color:'var(--txt4)', alignSelf:'center' }}>{t('entry.noTarifShort')}</span>
                    )}
                    {(settings?.quickAmounts || DEFAULT_SETTINGS.quickAmounts)
                      .filter(a => a !== info.tarif)
                      .map(a => (
                        <button
                          key={a}
                          className="qb"
                          style={{ opacity: isSaving ? 0.5 : 1 }}
                          disabled={isSaving}
                          onClick={() => quickPay(a)}
                        >
                          {a}
                        </button>
                      ))}
                  </div>
                </div>

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
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt3)', fontSize:11, display:'flex', alignItems:'center', gap:5, padding:'4px 0', minHeight:32 }}
              >
                <History size={13} /> {t('membercard.history')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyframes inline — ripple + spin + long-press ring */}
      <style>{`
        @keyframes ripple-anim {
          to { transform: scale(2.5); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes longPressRing {
          from { box-shadow: 0 0 0 0 transparent; }
          to   { box-shadow: 0 0 0 3px var(--zc); }
        }
        .mcard.long-pressing {
          animation: longPressRing 500ms linear forwards !important;
        }
      `}</style>

      {/* Portal: render di document.body agar tidak terpengaruh CSS transform dari
          parent motion.div di EntryView — transform menciptakan containing block baru
          yang mematahkan position:fixed pada semua children. */}
      {typeof window !== 'undefined' && createPortal(
        <RiwayatModal open={riwOpen} onClose={() => setRiwOpen(false)} />,
        document.body
      )}
    </>
  );
}
