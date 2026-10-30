// components/features/members/MemberCard.tsx — REDESAIN T7 (prototype T2 keputusan 3, 4, 5, 6, 7, 8, 8b, 9, 14)
// Logika (persist/undo/rollback selektif/double-submit guard/long press/period snapshot) DIPERTAHANKAN dari
// v11.7.1; yang berubah: tampilan (primitive T6 + MemberCard.module.css), ikon Lucide → Phosphor, teks literal →
// i18n, kunci showConfirm semantik, dan guard batch (kartu lunas/gratis tidak bisa dipilih).
// UX: haptic feedback · loading state · inputMode decimal · long press ring · double-submit prevention ·
//     undo payment · success flash · auto-focus
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
  CaretDown, CaretUp, CalendarBlank, CreditCard, Check, Lock, Prohibit, Scroll, Trash, Lightning,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { getPay, isFree, rp, resolveEntryCardPeriod, resolveDisplayStatus, getMonthStatus, isNotApplicable } from '@/lib/helpers';
import { resolvePayDate, setPayDate, payDatePatch, applyPayDatePatch, readPayDate, restorePayDate, type PayDatePatch } from '@/lib/payDate';
import { saveDB, persistPaymentGranular } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { showToast, showToastUndo } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IdChip } from '@/components/ui/Chip';
import { RoundCheckbox } from '@/components/ui/Checkbox';
import { IconButton } from '@/components/ui/IconButton';
import { QuickPayGrid } from '@/components/ui/QuickPayGrid';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import RiwayatModal from '@/components/modals/RiwayatModal';
import { haptic } from '@/lib/haptic';
import type { Zone } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import m from './MemberCard.module.css';

interface Props {
  name:          string;
  index:         number;
  batchMode?:    boolean;
  batchSelected?: boolean;
  /** T7 keputusan 8b: dalam mode pilih hanya member BELUM BAYAR yang bisa dipilih (dihitung EntryView lewat batch.ts) */
  batchEligible?: boolean;
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
      <mark className={m.mark}>
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

export default function MemberCard({ name, index, batchMode = false, batchSelected = false, batchEligible = true, onBatchToggle }: Props) {
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
  // UX: success flash setelah payment tersimpan
  const [showSuccess,   setShowSuccess]   = useState(false);
  // T7 keputusan 14: validasi nominal inline (input merah + pesan) selain toast
  const [amtErr,        setAmtErr]        = useState(false);
  // v11.5.2: counter untuk force re-trigger animasi checkmark (lihat .mc-success-check) —
  // tanpa ini, klik bayar dua kali cepat berturut-turut bisa membuat browser skip replay
  // animasi karena elemen dianggap "tidak berubah" (key sama).
  const [successKey,    setSuccessKey]    = useState(0);
  // REDESAIN T12 (D5/D3): bulan Belum-terdaftar/Nonaktif tanpa pembayaran — mencatat pembayaran BARU butuh konfirmasi.
  // Disimpan sebagai kunci periode kartu (bukan boolean) supaya otomatis "tertutup lagi" begitu bulan kartu berganti.
  const [naOkKey,       setNaOkKey]       = useState('');

  const isSavingRef    = useRef(false);  // sync guard
  const inputDirty     = useRef(false);
  const isCollapsing   = useRef(false);
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
  // REDESAIN T12: N/A = Belum terdaftar / Nonaktif TANPA pembayaran (dengan pembayaran = "lunas", D3).
  const curNA   = (s => (isNotApplicable(s) ? s : null))(getMonthStatus(appData, activeZone, name, selYear, selMonth));
  const entryNA = (s => (isNotApplicable(s) ? s : null))(getMonthStatus(appData, activeZone, name, cardYear, cardMonth));
  const naKey   = `${activeZone}|${name}|${cardYear}|${cardMonth}`;
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
  const { val: displayVal, free: displayFree } =
    resolveDisplayStatus(isExp, val, freeCur, entryVal, freeEntry);
  const displayNA = isExp ? entryNA : curNA;

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
    payDate?: PayDatePatch, // REDESAIN T12 (F4): tanggal bayar ikut ditulis dalam update() granular yang sama
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
    const prevDate  = payDate ? readPayDate(current, payDate) : undefined;
    const newData = applyPayDatePatch({ ...current, payments: { ...current.payments } }, payDate);
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
        payDate,
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
      setAppData(payDate ? restorePayDate(rolledBack, payDate, prevDate) : rolledBack);
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
      if (isNaN(amt)) { setAmtErr(true); showToast(t('entry.invalidNominal'), 'err'); return; }
      const ok = await persistPaymentOnly(
        k, amt,
        `[PAY] ${tLog('log.action.pay')} ${activeZone} - ${name}`,
        `${MONTH_NAMES[cardMonth]} ${cardYear}: ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`,
        // REDESAIN T12 (F4): mode otomatis = tanggal LOKAL hari ini ikut tercatat; mode manual = kolom "Tgl Bayar" di bawah.
        payDatePatch(activeZone, name, cardYear, cardMonth, resolvePayDate(settings?.autoDate)),
      );
      if (ok) {
        // UX: undo selama 4 detik
        const undoMsg = `${name} → ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`;
        // FIX v11.5.7: persistPaymentOnly membaca appData terbaru secara internal saat
        // dipanggil (bukan dari closure di sini), jadi undo callback ini otomatis aman
        // terhadap staleness tanpa perlu getState() manual — lihat penjelasan lengkap di
        // doQuickPay untuk kenapa closure staleness ini penting.
        showToastUndo(undoMsg, async () => {
          await persistPaymentOnly(k, prevVal, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
          showToast(`${name} ${t('entry.cancelled')}`, 'info');
        });
      }
    }
    inputDirty.current = false;
  }

  function doQuickPay(amt: number) {
    const k         = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
    const prevVal   = entryVal; // simpan untuk undo
    // REDESAIN T12 (F4): tanggal bayar lewat SATU helper (lib/payDate.ts) — otomatis = tanggal LOKAL, bukan UTC.
    const newData = setPayDate(
      { ...appData, payments: { ...appData.payments, [k]: amt } },
      activeZone, name, cardYear, cardMonth, resolvePayDate(settings?.autoDate),
    );
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
      showToast(`${name} ${t('entry.cancelled')}`, 'info');
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
    if (isLocked) { showToast(t('entry.locked'), 'err'); haptic.error(); return; }
    const tarifMember = info.tarif as number | undefined;
    if (tarifMember && amt > tarifMember) {
      haptic.light();
      showConfirm(
        'info',
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
    if (isLocked) { showToast(t('entry.locked'), 'err'); haptic.error(); return; }
    if (entryVal === null) return;
    haptic.light();
    showConfirm(
      'trash',
      `${t('entry.deletePayTitle')} ${name}?`,
      t('membercard.deleteYes'),
      async () => {
        const k = `${activeZone}__${name}__${cardYear}__${cardMonth}`;
        const ok = await persistPaymentOnly(
          k, null,
          `[DEL] ${tLog('log.action.deletePay')} ${activeZone} - ${name}`,
          `${MONTH_NAMES[cardMonth]} ${cardYear}: ${tLog('log.detail.deleted')}`,
        );
        if (ok) showToast(`${name} ${t('common.deleted')}`, 'err');
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
    // Klik yang menyusul tekan lama (mouse lepas setelah 500 ms) bukan ketukan baru: abaikan satu kali,
    // supaya member yang baru dipilih oleh startBatch tidak langsung batal terpilih.
    // T2 keputusan 8b: dalam mode pilih, hanya member belum bayar yang bisa diketuk.
    if (batchMode) { if (batchEligible) onBatchToggle?.(); return; }
    if (isExp) { isCollapsing.current = true; setNaOkKey(''); setExpandedCard(null); }
    else       { setExpandedCard(name); }
  }

  function openRiwayat(e: React.MouseEvent) {
    e.stopPropagation();
    setRiwayatZone(activeZone as Zone);
    setRiwayatName(name);
    setRiwayatYear(new Date().getFullYear());
    setRiwOpen(true);
  }

  // ── Tampilan (REDESAIN T7) ──
  // REDESAIN T12: N/A tanpa pembayaran = 'nonaktif' | 'belumTerdaftar' (redup + chip); selain itu seperti sebelumnya.
  const payStatus: 'lunas' | 'belum' | 'free' = displayFree ? 'free' : displayVal !== null ? 'lunas' : 'belum';
  const status = displayNA ?? payStatus;
  const naOk = naOkKey === naKey;
  function askRecordNA() {
    if (!entryNA) return;
    haptic.light();
    showConfirm(
      'info',
      t('membercard.naConfirmTitle'),
      t('action.confirm'),
      () => setNaOkKey(naKey),
      { description: `${name} · ${MONTH_NAMES[cardMonth]} ${cardYear} · ${t(`status.${entryNA}`)}` },
    );
  }
  const tarif = info.tarif as number | undefined;
  const quickAmounts = settings?.quickAmounts || DEFAULT_SETTINGS.quickAmounts;
  // T2 keputusan 4: chip tarif diurutkan pertama + disorot (QuickPayGrid menyorot `tarif`)
  const orderedAmounts = tarif ? [tarif, ...quickAmounts.filter(a => a !== tarif)] : quickAmounts;
  const safeId   = name.replace(/\s/g, '_');
  const idText   = info.id ? String(info.id) : '';
  const ipHref   = info.ip ? (String(info.ip).startsWith('http') ? String(info.ip) : 'http://' + String(info.ip)) : '';
  const hasDel   = entryVal !== null && !isSaving;
  const autoDate = settings?.autoDate === true;

  const idEl = idText
    ? (ipHref
        ? <a href={ipHref} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><IdChip>{idText}</IdChip></a>
        : <button type="button" className={m.idBtn} onClick={openRiwayat}><IdChip>{idText}</IdChip></button>)
    : null;

  return (
    <>
      <div ref={cardRef} id={`card-${safeId}`} data-testid="member-card" data-index={index}>
        <Card
          padding="none"
          className={clsx(
            m.mc, m[status],
            batchMode && batchSelected && m.picked,
            batchMode && !batchEligible && m.na,
            showSuccess && m.flash,
          )}
          aria-disabled={batchMode && !batchEligible ? true : undefined}
        >
          {/* badge centang pojok — key={successKey} memaksa remount supaya animasi replay saat dipicu cepat berturut-turut */}
          {showSuccess && (
            <div key={successKey} className={m.check} aria-hidden="true">
              <Check size={13} weight="bold" />
            </div>
          )}

          {/* Baris atas */}
          <div
            className={m.head}
            role="button"
            tabIndex={0}
            aria-expanded={batchMode ? undefined : isExp}
            onClick={handleToggle}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); handleToggle(); }
            }}
          >
            {batchMode && (
              <RoundCheckbox
                checked={batchSelected}
                disabled={!batchEligible}
                label={batchEligible ? `${t('entry.batchSelectedAria')} ${name}` : `${name}: ${t('entry.batchNotEligible')}`}
                onClick={e => e.stopPropagation()}
                onChange={() => onBatchToggle?.()}
              />
            )}
            <span className={clsx('wp-tile', 'wp-tile--sm', displayNA ? 'wp-tile--slate' : `wp-tile--${status}`, m.letter)} aria-hidden="true">
              {name.trim().charAt(0).toUpperCase()}
            </span>
            <div className={m.tx}>
              <b className={m.name}><HighlightText text={name} query={search} /></b>
<Vis screen="entry" id="cardinfo">              <span className={clsx('wp-t-cap', m.sub)}>
                {idEl}
                <span>{tarif ? `${t('entry.tarifLabel')} ${rp(tarif)}` : t('entry.noTarifShort')}</span>
              </span></Vis>
            </div>
            <div className={m.end}>
              {isSaving ? (
                <Spinner />
              ) : (
                <>
                  <Badge variant={displayNA ? 'neutral' : payStatus}>{t(`status.${status}`)}</Badge>
                  {displayVal === 0 && !displayFree && <span className="wp-t-micro">{t('membercard.acm')}</span>}
                  {displayVal !== null && displayVal > 0 && <span className="wp-num">{rp(displayVal)}</span>}
                </>
              )}
            </div>
            {!batchMode && (
              isExp ? <CaretUp className={m.caret} size={16} aria-hidden="true" /> : <CaretDown className={m.caret} size={16} aria-hidden="true" />
            )}
          </div>

          {/* Isi terbuka */}
          {isExp && !batchMode && (
            <div className={m.body}>
              {/* Periode kartu — key supaya React 19 me-mount ulang <select> saat nilai berubah dari luar
                  (lihat catatan v11.5.8/v11.5.9: snapshot entryCardYear/Month dan clearEntryCardFor). */}
              <div className={m.two}>
                <Select key={cardYear} size="sm" aria-label={t('common.year')} value={cardYear}
                  onChange={e => { monthManuallyChanged.current = true; setEntryCard(name, +e.target.value, cardMonth); }}>
                  {getYears().map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
                <Select key={`${cardYear}-${cardMonth}`} size="sm" aria-label={t('common.month')} value={cardMonth}
                  onChange={e => { monthManuallyChanged.current = true; setEntryCard(name, cardYear, +e.target.value); }}>
                  {MONTH_NAMES.map((mn, i) => <option key={i} value={i}>{mn}</option>)}
                </Select>
              </div>

              {freeEntry ? (
                <div className={clsx(m.note, m.noteFree)}><CreditCard aria-hidden="true" /> {t('rekap.freeMember')}</div>
              ) : isLocked ? (
                <div className={clsx(m.note, m.noteLock)}><Lock weight="fill" aria-hidden="true" /> {t('rekap.dataLocked')}</div>
              ) : entryNA && !naOk ? (
                <div className={clsx(m.note, m.noteNA)}>
                  <Prohibit aria-hidden="true" />
                  <span className={m.noteNAtx}>{t(entryNA === 'nonaktif' ? 'membercard.naNonaktif' : 'membercard.naBelumTerdaftar')}</span>
                  <Button variant="secondary" size="sm" onClick={askRecordNA}>{t('membercard.naRecord')}</Button>
                </div>
              ) : (
                <>
                  {/* Nominal — input uncontrolled (defaultValue) dengan key periode: selama mengetik key stabil
                      (tidak remount), begitu periode kartu berubah dari luar defaultValue dibaca ulang (v11.5.9). */}
                  <div className="wp-field">
                    <label className="wp-t-label" htmlFor={`inp-${safeId}`}>{t('common.amount').toUpperCase()}</label>
                    <div className={m.amtWrap}>
                      <span className={m.amtPre} aria-hidden="true">Rp</span>
                      <input
                        key={`${cardYear}-${cardMonth}`}
                        ref={inputRef}
                        id={`inp-${safeId}`}
                        className={clsx('wp-inp', 'wp-inp--num', m.amtIn, hasDel && m.amtInDel, amtErr && 'wp-inp--err')}
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        defaultValue={entryVal !== null ? String(entryVal) : ''}
                        aria-invalid={amtErr || undefined}
                        onChange={() => { inputDirty.current = true; if (amtErr) setAmtErr(false); }}
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
                      <span className={clsx(m.amtSuf, hasDel && m.amtSufDel)} aria-hidden="true">.000</span>
                      {hasDel && (
                        <IconButton className={m.amtDel} icon={Trash} tone="danger" size="sm" label={t('entry.deleteAria')} onClick={clearPay} />
                      )}
                    </div>
                    {amtErr && <span className="wp-msg" role="alert">{t('entry.invalidNominal')}</span>}
                  </div>

                  {/* Quick pay — nominal kustom dari pengaturan (settings.quickAmounts) */}
                  <div className="wp-field">
                    <span className={clsx('wp-t-label', m.lbl)}><Lightning size={12} aria-hidden="true" /> QUICK</span>
                    <QuickPayGrid
                      amounts={orderedAmounts}
                      tarif={tarif}
                      onPick={quickPay}
                      formatLabel={a => `${a}K`}
                      disabled={isSaving}
                      ariaLabel={t('entry.quickAria')}
                    />
                    {!tarif && <span className="wp-t-cap">{t('entry.noTarifShort')}. {t('entry.setTarifHint')}</span>}
                  </div>

                  {/* Tanggal bayar — autoDate aktif: field dikunci (tanggal diisi sistem saat quick pay) */}
                  <div className="wp-field">
                    <label className={clsx('wp-t-label', m.lbl)} htmlFor={`dt-${safeId}`}>
                      <CalendarBlank size={12} aria-hidden="true" /> {t('membercard.payDate').toUpperCase()}
                      {autoDate && <Lock size={12} weight="fill" aria-label={t('entry.autoDate')} />}
                    </label>
                    <input
                      key={`${cardYear}-${cardMonth}-${(info[`date_${cardYear}_${cardMonth}`] as string) || ''}`}
                      id={`dt-${safeId}`}
                      className="wp-inp"
                      type="date"
                      defaultValue={(info[`date_${cardYear}_${cardMonth}`] as string) || ''}
                      onBlur={e => saveDate(e.target.value)}
                      disabled={isSaving || autoDate}
                    />
                  </div>
                </>
              )}

              {/* Riwayat */}
              <div className={m.foot}>
                <span className="grow" style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" onClick={openRiwayat}>
                  <Scroll aria-hidden="true" /> {t('membercard.history')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Portal: render di document.body agar tidak terpengaruh CSS transform dari parent —
          transform menciptakan containing block baru yang mematahkan position:fixed pada children. */}
      {typeof window !== 'undefined' && createPortal(
        <RiwayatModal open={riwOpen} onClose={() => setRiwOpen(false)} />,
        document.body
      )}
    </>
  );
}
