// components/features/members/MemberCard.tsx — Fase 4 + UX Fix
// UX: haptic feedback · loading state · inputMode decimal · long press ring
//     double-submit prevention · undo payment · success flash · auto-focus
'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { getPay, isFree, rp, resolveEntryCardPeriod, resolveDisplayStatus } from '@/lib/helpers';
import { saveDB, persistPaymentGranular } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
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
    entryCardYear, entryCardMonth, setEntryCard, clearEntryCardFor,
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
  // v11.5.9: true jika user SENGAJA mengubah dropdown BULAN di kartu ini selama sesi
  // expand saat ini (bukan dari toggle period luar). Dipakai untuk membedakan override
  // manual (harus tetap dilindungi meski kartu ditutup) dari snapshot otomatis (aman
  // dihapus saat kartu ditutup, supaya pembukaan berikutnya ikut toggle terkini lagi).
  const monthManuallyChanged = useRef(false);

  const t           = useT();
  const lang        = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  // FIX v11.5.7 (mengganti "FIX 6" lama): default ke selYear/selMonth (toggle period
  // Entry di atas) — BUKAN new Date() (kalender hari ini). Sebelumnya kartu yang belum
  // pernah dibuka selalu jatuh ke bulan kalender sungguhan, mengabaikan toggle atas
  // sepenuhnya — sehingga toggle ke April lalu membuka kartu baru menampilkan Juli
  // (bulan sistem hari ini), bukan April (bulan yang dipilih user di toggle). Mekanisme
  // "sekali dibuka, terkunci" dari FIX 6 asli tetap dipertahankan utuh: effect di bawah
  // hanya men-snapshot NILAI SAAT INI dari selYear/selMonth ke entryCardYear/Month pada
  // saat kartu pertama kali expand — setelah tersimpan, nilai itu tidak lagi mengikuti
  // perubahan toggle berikutnya (mencegah kartu yang sedang diisi user tergeser mendadak),
  // dan override manual member lain (via dropdown BULAN per-kartu) tidak tersentuh.
  // Logic resolusi diekstrak ke resolveEntryCardPeriod (lib/payment.ts) agar bisa di-unit-test.
  const { year: cardYear, month: cardMonth } = resolveEntryCardPeriod(name, entryCardYear, entryCardMonth, selYear, selMonth);
  const info      = appData.memberInfo?.[activeZone + '__' + name] || {};
  const val       = getPay(appData, activeZone, name, selYear, selMonth);
  const entryVal  = getPay(appData, activeZone, name, cardYear, cardMonth);
  const freeCur   = isFree(appData, activeZone, name, selYear, selMonth);
  const freeEntry = isFree(appData, activeZone, name, cardYear, cardMonth);
  const isLocked  = globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  const isExp     = expandedCard === name;

  // v11.5.10: kartu TERTUTUP → header (border, badge, nominal ringkas) selalu ikuti
  // toggle period atas (val/freeCur, selYear/selMonth) — status ringkas untuk bulan yang
  // sedang dilihat user secara umum. Kartu TERBUKA → header harus konsisten dengan ISI
  // form di dalamnya (BULAN/NOMINAL/TGL BAYAR, yang sudah ikut cardYear/cardMonth sejak
  // v11.5.9) — kalau tidak, border/badge bisa menampilkan status bulan lain sementara
  // form di bawahnya menampilkan bulan yang berbeda, membingungkan. Mekanisme: begitu
  // kartu ditutup, acuan otomatis kembali ke toggle atas (clearEntryCardFor di effect
  // atas sudah menangani ini); begitu kartu dibuka, header switch mengikuti cardYear/
  // cardMonth kartu itu sendiri — termasuk saat user mengubah dropdown BULAN di dalamnya.
  // Logic diekstrak ke resolveDisplayStatus (lib/payment.ts) agar bisa di-unit-test.
  const { val: displayVal, free: displayFree, statusBorder: displayStatusBorder } =
    resolveDisplayStatus(isExp, val, freeCur, entryVal, freeEntry);

  const cardRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const wasExpanded = useRef(false);

  useEffect(() => {
    if (!isExp) {
      inputDirty.current = false;
      isCollapsing.current = false;
      // v11.5.9: transisi true→false terdeteksi (bukan sekadar "isExp saat ini false" —
      // wasExpanded mencegah ini terpicu berulang kali selagi kartu memang tetap tertutup
      // dan effect ini re-run karena dependency lain berubah, mis. selYear/selMonth).
      // Hapus snapshot HANYA jika user tidak pernah sengaja mengubah dropdown BULAN
      // selama sesi expand yang baru saja berakhir — override manual tetap dilindungi
      // penuh, snapshot otomatis (dari toggle) dibersihkan agar pembukaan berikutnya
      // fresh mengikuti toggle terkini, bukan terkunci ke bulan pertama kartu ini dibuka.
      if (wasExpanded.current && !monthManuallyChanged.current) {
        clearEntryCardFor(name);
      }
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    // v11.5.9: reset di awal SETIAP sesi expand baru, bukan hanya sekali — supaya sesi
    // berikutnya (setelah snapshot lama dibersihkan) mulai dari kondisi "belum diubah
    // manual" yang bersih, bukan mewarisi flag true dari sesi expand sebelumnya.
    monthManuallyChanged.current = false;
    // FIX v11.5.7: saat kartu dibuka, inisialisasi ke selYear/selMonth (toggle period
    // Entry saat ini) jika belum pernah diset — bukan new Date() (kalender hari ini).
    if (!entryCardYear[name] && !entryCardMonth[name]) {
      setEntryCard(name, selYear, selMonth);
    }
  }, [isExp, name, entryCardYear, entryCardMonth, setEntryCard, selYear, selMonth, clearEntryCardFor]);

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
    const prevData = appData; // snapshot untuk rollback jika gagal (FIX v11.5.5)
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
    } catch (err) {
      logger.error(`Gagal simpan ke Firebase — action: ${action}`, err);
      setSyncStatus('err');
      // FIX v11.5.7: rollback SELEKTIF via selectiveRollback (lib/rollback.ts), bukan replace
      // total ke prevData. Antara setAppData(newData) di atas dan kegagalan network ini
      // terdeteksi, operasi LAIN (mis. quick-pay di kartu member lain) bisa saja sudah
      // setAppData() dengan datanya sendiri di atas newData ini. Replace total ke prevData
      // (snapshot dari SEBELUM operasi ini) akan menghapus perubahan itu juga — data-loss
      // nyata, bukan cuma soal timing. selectiveRollback membaca state TERBARU dan mengembalikan
      // HANYA entry spesifik yang benar-benar diubah oleh newData ini (per-key, bukan per-field
      // — dua member berbeda yang sama-sama menyentuh `payments` tidak akan saling menimpa).
      const latest = useAppStore.getState().appData;
      setAppData(selectiveRollback(latest, prevData, newData));
      haptic.error();
      return false;
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }

  // ── v11.5.7: persist granular KHUSUS untuk perubahan payments murni (saveEntryPay,
  // clearPay) — mengirim HANYA satu key payment + activityLog + lock state, bukan
  // seluruh AppData. Ini fix untuk bug "delay saat mengetik/menyimpan nominal" yang
  // dilaporkan — lihat penjelasan lengkap dan perhitungan payload di lib/db.ts
  // persistPaymentGranular(). persist() generik di atas TETAP dipakai untuk perubahan
  // yang menyentuh field lain (mis. saveDate → memberInfo), karena field itu memang
  // perlu dikirim utuh.
  async function persistPaymentOnly(
    paymentKey: string,
    paymentValue: number | null,
    action: string,
    detail: string,
  ): Promise<boolean> {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setIsSaving(true);
    // FIX v11.5.7: baca appData TERBARU via getState(), bukan closure `appData` component —
    // fungsi ini dipanggil juga dari callback yang bisa tertunda sampai 4 detik (toast undo),
    // jadi closure `appData` yang beku akan sama bermasalahnya dengan bug yang diperbaiki di
    // doQuickPay/saveEntryPay lainnya. Membaca via getState() di sini berarti SEMUA pemanggil
    // — termasuk yang tertunda — otomatis benar tanpa perlu masing-masing mengurus staleness.
    const current   = useAppStore.getState().appData;
    const prevValue = current.payments[paymentKey] ?? null; // untuk rollback selektif
    const newData = { ...current, payments: { ...current.payments } };
    if (paymentValue === null) delete newData.payments[paymentKey];
    else newData.payments[paymentKey] = paymentValue;
    setAppData(newData);
    if (!uid) { setIsSaving(false); isSavingRef.current = false; return true; }
    setSyncStatus('loading');
    try {
      await persistPaymentGranular(
        uid, paymentKey, paymentValue, current.activityLog || [],
        { action, detail }, userEmail || '',
        () => ({
          globalLocked: useAppStore.getState().globalLocked,
          lockedEntries: useAppStore.getState().lockedEntries,
        }),
      );
      setSyncStatus('ok');
      setShowSuccess(true);
      setSuccessKey(k => k + 1);
      setTimeout(() => setShowSuccess(false), 700);
      haptic.success();
      return true;
    } catch (err) {
      logger.error(`Gagal simpan ke Firebase (granular) — action: ${action}`, err);
      setSyncStatus('err');
      // Rollback selektif per-key, konsisten dengan pendekatan selectiveRollback: baca
      // state TERBARU, kembalikan HANYA key payment ini ke nilai sebelumnya — perubahan
      // concurrent pada key lain (termasuk key payment member lain) tidak tersentuh.
      const latest = useAppStore.getState().appData;
      const rolledBack = { ...latest, payments: { ...latest.payments } };
      if (prevValue === null) delete rolledBack.payments[paymentKey];
      else rolledBack.payments[paymentKey] = prevValue;
      setAppData(rolledBack);
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

    if (rawVal === '' || rawVal === null) {
      const ok = await persistPaymentOnly(
        k, null,
        `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`,
        `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`,
      );
      if (ok) showToast(`${name} ${t('common.deleted')}`, 'err');
    } else {
      const amt = +rawVal;
      if (isNaN(amt)) { showToast('Nominal tidak valid', 'err'); return; }
      const ok = await persistPaymentOnly(
        k, amt,
        `[PAY] ${tLog('log.action.pay')} ${activeZone} - ${name}`,
        `${MONTH_NAMES[cardMonth]} ${cardYear}: ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`,
      );
      if (ok) {
        // UX: undo selama 4 detik
        const undoMsg = `${name} → ${amt === 0 ? 'Akumulasi' : rp(amt)}`;
        // FIX v11.5.7: persistPaymentOnly membaca appData terbaru secara internal saat
        // dipanggil (bukan dari closure di sini), jadi undo callback ini otomatis aman
        // terhadap staleness tanpa perlu getState() manual — lihat penjelasan lengkap di
        // doQuickPay untuk kenapa closure staleness ini penting.
        showToastUndo(undoMsg, async () => {
          await persistPaymentOnly(k, prevVal, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
          showToast(`${name} dibatalkan`, 'info');
        });
      }
    }
    inputDirty.current = false;
  }

  function doQuickPay(amt: number) {
    const k         = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const prevVal   = entryVal; // simpan untuk undo
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
    // FIX v11.5.7: toast undo bertahan 4 detik (TOAST_UNDO_DURATION) dan Firebase write di
    // bawah berjalan async — dalam window itu member LAIN bisa saja di-quick-pay juga, yang
    // meng-update appData global. Closure di sini TIDAK BOLEH menangkap `appData`/`newData`
    // sebagai snapshot beku, karena "Batalkan" yang dieksekusi belakangan akan menimpa balik
    // seluruh state ke snapshot lama itu — menghapus payment member lain yang berhasil
    // tersimpan di antaranya (data-loss nyata, bukan cuma soal delay). Baca ulang state
    // TERBARU via getState() tepat saat callback ini benar-benar jalan, dan terapkan HANYA
    // perubahan spesifik milik payment ini di atas apapun yang current saat itu.
    showToastUndo(`${name} → ${rp(amt)}`, async () => {
      const latest = useAppStore.getState().appData;
      const revert = { ...latest, payments: { ...latest.payments } };
      if (prevVal === null) delete revert.payments[k];
      else revert.payments[k] = prevVal;
      await persist(revert, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
      showToast(`${name} dibatalkan`, 'info');
    });
    // Firebase write di background
    // FIX: jika gagal, beri toast eksplisit + hapus HANYA payment ini dari state TERBARU
    // (bukan replace ke snapshot lama sebelum optimistic update — alasan sama seperti undo
    // di atas), supaya percobaan berikutnya tidak bertumpu pada data yang belum tersimpan,
    // tanpa menghapus perubahan member lain yang mungkin berhasil tersimpan di antaranya.
    if (uid) {
      setSyncStatus('loading');
      saveDB(uid, newData,
        { action: `[PAY] ${tLog('log.action.quickPay')} ${activeZone} - ${name}`,
          detail: `${MONTH_NAMES[cardMonth]} ${cardYear}: ${rp(amt)}` },
        userEmail || ''
      ).then(() => setSyncStatus('ok'))
       .catch((err) => {
         logger.error(`Gagal simpan quickPay ke Firebase — ${name}`, err);
         setSyncStatus('err');
         const latest = useAppStore.getState().appData;
         const rolledBack = { ...latest, payments: { ...latest.payments } };
         if (prevVal === null) delete rolledBack.payments[k];
         else rolledBack.payments[k] = prevVal;
         setAppData(rolledBack);
         showToast(t('common.saveFailed'), 'err');
       });
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
        const ok = await persistPaymentOnly(
          k, null,
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
    // FIX: saveDate sebelumnya tidak pernah menampilkan toast sama sekali — sukses
    // maupun gagal. Sekarang tetap silent saat sukses (micro-update, tidak perlu toast),
    // tapi toast error eksplisit jika gagal tersimpan, supaya user tidak mengira tanggal
    // sudah tersimpan padahal hanya berubah optimis di state lokal.
    const ok = await persist(
      { ...appData, memberInfo: newInfo },
      `[DATE] ${tLog('log.action.updateDate')} ${activeZone} - ${name}`,
      `${MONTH_NAMES[cardMonth]} ${cardYear}: ${dateVal}`,
    );
    if (!ok) showToast(t('common.saveFailed'), 'err');
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
  if (displayFree)
    tagEl = <span className="mc-tag" style={{ background:'var(--bg3)', color:'var(--c-free)', border:'1px solid var(--border)', fontSize:9, display:'flex', alignItems:'center', gap:3 }}><Gift size={9} /></span>;
  else if (displayVal !== null && displayVal > 0)
    tagEl = <span className="mc-tag tpaid" style={{ display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={9} /></span>;
  else if (displayVal === 0)
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
          borderLeft:  `3px solid ${showSuccess ? 'var(--c-lunas)' : batchSelected ? 'var(--zc)' : displayStatusBorder}`,
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
          ) : displayVal !== null && (
            displayVal === 0
              ? <span style={{ fontSize:10, color:'var(--c-lunas)' }}>{t('membercard.acm')}</span>
              : <span style={{ fontSize:11, color:'var(--c-lunas)' }}>{displayVal.toLocaleString('id-ID')}</span>
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
              {/* FIX v11.5.8: key={cardYear} — React 19 punya known edge case di mana
                  <select> controlled yang value-nya berubah dari SUMBER LUAR (di sini:
                  toggle period Entry di atas, bukan interaksi langsung user dengan
                  dropdown ini) tidak selalu repaint tampilan visualnya. Memberi key
                  membuat React mount ulang node <select> yang benar-benar baru saat
                  cardYear berubah, alih-alih mengandalkan update-in-place.
                  KOREKSI v11.5.9 (saat itu masih benar, sudah tidak akurat lagi sejak
                  v11.5.10 — lihat di bawah): entryVal TIDAK selalu akurat sebagai bukti
                  (ia feed ke defaultValue uncontrolled di field NOMINAL yang tidak pernah
                  refresh tanpa key), dan waktu itu badge status header kartu masih SELALU
                  baca val/freeCur (selYear/selMonth) tanpa syarat, tidak peduli isExp.
                  Root cause SEBENARNYA dari bug "toggle diganti berkali-kali, dropdown
                  BULAN tidak pernah ikut berubah" ada di useEffect di atas: snapshot
                  entryCardYear/Month[name] tersimpan PERMANEN sejak kartu ini pertama
                  kali dibuka — bahkan setelah ditutup — sehingga pembukaan berikutnya
                  selalu membaca snapshot lama itu, bukan toggle terkini. Fix sesungguhnya
                  ada di clearEntryCardFor saat kartu ditutup (lihat useEffect), key di
                  sini tetap dipertahankan sebagai proteksi tambahan yang sah untuk kasus
                  repaint React 19.
                  UPDATE v11.5.10: badge/border/nominal-ringkas di header kartu (lihat
                  displayVal/displayFree di atas deklarasi cardRef) SEKARANG memang
                  switch ke entryVal/freeEntry saat kartu terbuka (isExp true) — supaya
                  konsisten dengan isi form BULAN/NOMINAL di bawahnya, bukan menampilkan
                  status bulan lain yang membingungkan saat toggle atas beda dari bulan
                  yang sedang dipilih di dalam kartu. Untuk kartu tertutup, tetap murni
                  val/freeCur (toggle atas) seperti semula. */}
              <select key={cardYear} className="cs" style={{ fontSize:11, padding:'4px 8px' }} value={cardYear}
                onChange={e => { monthManuallyChanged.current = true; setEntryCard(name, +e.target.value, cardMonth); }}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {/* key={cardMonth}-nya sendiri tidak cukup untuk memicu remount saat
                  perubahan bersumber dari cardYear (tahun berubah, bulan bisa jadi
                  sama persis) — key digabung agar dropdown bulan juga ikut mount ulang
                  setiap kali BAIK tahun MAUPUN bulan berubah dari toggle luar. */}
              <select key={`${cardYear}-${cardMonth}`} className="cs" style={{ fontSize:11, padding:'4px 8px' }} value={cardMonth}
                onChange={e => { monthManuallyChanged.current = true; setEntryCard(name, cardYear, +e.target.value); }}>
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
                {/* Input nominal — UX: inputMode decimal untuk keyboard angka di mobile.
                    v11.5.9 FIX: key={`${cardYear}-${cardMonth}`} ditambahkan. Sebelumnya
                    input ini defaultValue TANPA key — begitu di-mount sekali, defaultValue
                    TIDAK PERNAH terbaca ulang meski entryVal (yang mengikuti cardYear/
                    cardMonth) berubah dari luar (kartu ditutup-buka setelah toggle
                    period diganti). Ini kemungkinan besar penyebab utama "seolah tidak
                    ada perubahan apa-apa" — field NOMINAL adalah yang paling diperhatikan
                    user, dan selalu diam di nilai kartu pertama kali dibuka. defaultValue
                    (bukan value/controlled) SENGAJA dipertahankan — kalau diganti
                    controlled penuh, setiap re-render akan mereset input dan mengganggu
                    user yang sedang mengetik. key yang terikat cardYear/cardMonth memberi
                    manfaat KEDUANYA: selama sesi mengetik (cardYear/cardMonth tidak
                    berubah), key stabil → tidak ada remount → uncontrolled tetap bebas
                    campur tangan React. Begitu cardYear/cardMonth berubah dari luar, key
                    berubah → React mount node BARU → defaultValue dibaca ulang dari
                    entryVal terkini. */}
                <div className="mc-row">
                  <span className="mc-label">{t('common.amount').toUpperCase()}</span>
                  <input
                    key={`${cardYear}-${cardMonth}`}
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
                  {/* v11.5.9: key sama seperti input NOMINAL — defaultValue di sini juga
                      tidak pernah terbaca ulang tanpa key saat cardYear/cardMonth berubah
                      dari luar (bug identik dengan field NOMINAL). */}
                  <input
                    key={`${cardYear}-${cardMonth}`}
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
