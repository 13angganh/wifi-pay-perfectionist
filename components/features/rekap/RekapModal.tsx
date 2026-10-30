// components/features/rekap/RekapModal.tsx — REDESAIN T8 (T3 keputusan 7): dialog Sheet + RekapModal.MonthGrid.
// Logika tulis dipertahankan persis zip (quickPay optimis + toast Urungkan, manualPay, clearPay, kunci, rollback selektif).
// REDESAIN T12: tanggal bayar lewat SATU helper (lib/payDate.ts) di semua jalur tulis modal ini; mode manual punya
// pemilih tanggal (default hari ini); bulan Belum-terdaftar/Nonaktif tanpa pembayaran butuh konfirmasi sebelum dicatat.
'use client';

import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS_EN, MONTHS } from '@/lib/constants';
import { getPay, isFree, rp, getKey, getMonthStatus, isNotApplicable } from '@/lib/helpers';
import { localDateISO, resolvePayDate, setPayDate, payDatePatch, applyPayDatePatch, readPayDate, restorePayDate, type PayDatePatch } from '@/lib/payDate';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { persistPayment, persistPaymentGranular } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { showToast, showToastUndo } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Wallet } from '@phosphor-icons/react';
import { IconTile } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import RekapMonthGrid from './RekapModal.MonthGrid';
import r from './rekap.module.css';

interface RekapModalProps {
  inputDirty: React.MutableRefObject<boolean>;
  modalClosing: React.MutableRefObject<boolean>;
  onClose: (paidCell?: { name: string; month: number }) => void;
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
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  // T12 (F4): tanggal bayar pilihan pengguna (mode manual); kosong = hari ini. Direset tiap modal ditutup.
  const payDateRef = useRef('');
  // T12 (D3/D5): konfirmasi "tetap catat" untuk bulan N/A — kunci periode sel supaya otomatis tertutup lagi di sel lain.
  const [naOkKey, setNaOkKey] = useState('');

  if (!rekapExpanded) return null;
  const { name, month } = rekapExpanded;
  const close: RekapModalProps['onClose'] = (paidCell) => { payDateRef.current = ''; onClose(paidCell); };
  const manualDate = () => resolvePayDate(settings?.autoDate, payDateRef.current || localDateISO());

  const entryVal  = getPay(appData, activeZone, name, selYear, month);
  const entryFree = isFree(appData, activeZone, name, selYear, month);
  const entryNA   = (s => (isNotApplicable(s) ? s : null))(getMonthStatus(appData, activeZone, name, selYear, month));
  const naKey     = `${activeZone}|${name}|${selYear}|${month}`;
  const locked    = globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  const info      = appData.memberInfo?.[activeZone + '__' + name] || {};
  const tarif     = info.tarif as number | undefined;
  const quickAmts = settings?.quickAmounts || [50, 80, 90, 100, 150, 200];

  // FIX v11.5.5: rollback state lokal + log error asli jika Firebase gagal (lihat
  // catatan detail di MembersView.tsx persist()). prevData diterima sebagai PARAMETER
  // eksplisit (bukan dibaca dari closure `appData`) — penting untuk quickPay(), yang
  // sudah memanggil setAppData(newData) SEBELUM memanggil persist() secara fire-and-forget;
  // kalau prevData dibaca dari closure appData di dalam persist(), nilainya bisa sudah
  // ke-update duluan oleh re-render React, sehingga rollback jadi tidak efektif.
  // FIX v11.5.7: rollback ITU SENDIRI kini via selectiveRollback (lib/rollback.ts) — bukan
  // replace total ke prevData. Bahkan dengan prevData yang akurat (fix di atas), replace
  // total tetap bisa menghapus perubahan operasi LAIN yang berhasil concurrent selagi
  // network request ini masih berjalan. Lihat penjelasan lengkap di persist() MemberCard.tsx.
  async function persist(newData: typeof appData, action: string, detail: string, prevData: typeof appData = appData): Promise<boolean> {
    setAppData(newData);
    if (!uid) return true;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
      return true;
    } catch (err) {
      logger.error(`Gagal simpan ke Firebase — action: ${action}`, err);
      setSyncStatus('err');
      const latest = useAppStore.getState().appData;
      setAppData(selectiveRollback(latest, prevData, newData));
      return false;
    }
  }

  // ── v11.5.7: persist granular KHUSUS untuk perubahan payments murni (manualPay,
  // clearPay) — mengirim HANYA satu key payment + activityLog + lock state, bukan
  // seluruh AppData (~200KB+ untuk data multi-tahun seperti milik Hakiki, di mana
  // `payments` sendiri terukur ~77% dari total payload — lihat lib/db.ts
  // persistPaymentGranular() untuk penjelasan lengkap). Selalu membaca appData
  // TERBARU via getState() secara internal, bukan closure — supaya benar juga
  // dipanggil dari callback tertunda seperti undo toast.
  async function persistPaymentOnly(
    paymentKey: string,
    paymentValue: number | null,
    action: string,
    detail: string,
    payDate?: PayDatePatch,
  ): Promise<boolean> {
    const current   = useAppStore.getState().appData;
    const prevValue = current.payments[paymentKey] ?? null;
    const prevDate  = payDate ? readPayDate(current, payDate) : undefined;
    const newData = applyPayDatePatch({ ...current, payments: { ...current.payments } }, payDate);
    if (paymentValue === null) delete newData.payments[paymentKey];
    else newData.payments[paymentKey] = paymentValue;
    setAppData(newData);
    if (!uid) return true;
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
      return true;
    } catch (err) {
      logger.error(`Gagal simpan ke Firebase (granular) — action: ${action}`, err);
      setSyncStatus('err');
      const latest = useAppStore.getState().appData;
      const rolledBack = { ...latest, payments: { ...latest.payments } };
      if (prevValue === null) delete rolledBack.payments[paymentKey];
      else rolledBack.payments[paymentKey] = prevValue;
      setAppData(payDate ? restorePayDate(rolledBack, payDate, prevDate) : rolledBack);
      return false;
    }
  }

  function quickPay(amt: number) {
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const k         = getKey(activeZone, name, selYear, month);
    const prevVal   = getPay(appData, activeZone, name, selYear, month);
    const snapshot  = appData; // simpan SEBELUM optimistic update, untuk rollback yang benar
    const newData = setPayDate(
      { ...appData, payments: { ...appData.payments, [k]: amt } },
      activeZone, name, selYear, month, manualDate(),
    );
    // FIX 8+9: Optimistic — update state + toast LANGSUNG, Firebase async
    setAppData(newData);
    close({ name, month });
    // FIX v11.5.7: baca state TERBARU via getState() saat callback benar-benar jalan (bisa
    // sampai 4 detik kemudian — lihat penjelasan lengkap di MemberCard.tsx doQuickPay), bukan
    // dari closure `appData` yang beku pada saat quickPay ini dipanggil.
    showToastUndo(`${name} → ${rp(amt)}`, async () => {
      const latest = useAppStore.getState().appData;
      const revert = { ...latest, payments: { ...latest.payments } };
      if (prevVal === null) delete revert.payments[k];
      else revert.payments[k] = prevVal;
      await persist(revert, `[UNDO] Batalkan ${name}`, 'Dibatalkan user');
      showToast(`${name} ${t('entry.cancelled')}`, 'info');
    });
    // FIX: jika write Firebase di background ini gagal, beri tahu user secara eksplisit
    // — sebelumnya gagal diam-diam, hanya terlihat dari pill header yang mudah terlewat,
    // dan saat app dibuka ulang pembayaran ini hilang tanpa penjelasan.
    persist(newData, `[PAY] ${tLog('log.action.quickPay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear} → ${rp(amt)}`, snapshot)
      .then(ok => { if (!ok) showToast(t('common.saveFailed'), 'err'); });
  }

  async function manualPay(val: string, force = false) {
    if (!force && !inputDirty.current) return;
    if (modalClosing.current) return;
    // eslint-disable-next-line react-hooks/immutability
    inputDirty.current = false;
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const k = getKey(activeZone, name, selYear, month);
    if (val === '') {
      const ok = await persistPaymentOnly(k, null, `[DEL] ${tLog('log.action.deletePay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear}`);
      if (ok) {
        showToast(`${name} ${MONTH_NAMES[month]} ${t('common.deleted')}`, 'err');
        close();
      } else {
        showToast(t('common.saveFailed'), 'err');
      }
    } else {
      const amt = +val;
      if (isNaN(amt)) { showToast(t('entry.invalidNominal'), 'err'); return; }
      const ok = await persistPaymentOnly(
        k, amt, `[PAY] ${tLog('log.action.pay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear} → ${rp(amt)}`,
        payDatePatch(activeZone, name, selYear, month, manualDate()),
      );
      if (ok) {
        showToast(`${name} ${MONTH_NAMES[month]} → ${amt === 0 ? t('rekap.accumulation') : rp(amt)}`);
        close({ name, month });
      } else {
        showToast(t('common.saveFailed'), 'err');
      }
    }
  }

  async function clearPay(e: React.MouseEvent) {
    e.stopPropagation();
    if (locked) { showToast(t('rekap.dateLocked'), 'err'); return; }
    const curVal = getPay(appData, activeZone, name, selYear, month);
    if (curVal === null) return;
    showConfirm(
      'trash',
      `${t('rekap.deletePayment')} ${name}?`,
      t('membercard.deleteYes'),
      async () => {
        const k = getKey(activeZone, name, selYear, month);
        const ok = await persistPaymentOnly(k, null, `[DEL] ${tLog('log.action.deletePay')} Rekap ${activeZone} - ${name}`, `${MONTH_NAMES[month]} ${selYear}`);
        if (ok) {
          showToast(`${name} ${MONTH_NAMES[month]} ${t('common.deleted')}`, 'err');
          close();
        } else {
          showToast(t('common.saveFailed'), 'err');
        }
      },
      { description: `${MONTH_NAMES[month]} ${selYear} · ${curVal > 0 ? rp(curVal) : t('rekap.accumulation')}` }
    );
  }

  function askRecordNA() {
    if (!entryNA) return;
    showConfirm(
      'info',
      t('membercard.naConfirmTitle'),
      t('action.confirm'),
      () => setNaOkKey(naKey),
      { description: `${name} · ${MONTH_NAMES[month]} ${selYear} · ${t(`status.${entryNA}`)}` },
    );
  }

  return (
    <Sheet
      open
      variant="dialog"
      onClose={() => close()}
      leading={<IconTile icon={Wallet} size="sm" />}
      title={<span className="wp-num" style={{ fontSize: 'var(--fs-body)' }}>{name}</span>}
      subtitle={<span className={r.modalMeta}>{activeZone} · {MONTH_NAMES[month]} {selYear}</span>}
    >
      <RekapMonthGrid
        entryVal={entryVal}
        entryFree={entryFree}
        entryNA={entryNA && naOkKey !== naKey ? entryNA : null}
        onRecordNA={askRecordNA}
        showDate={!settings?.autoDate}
        onPayDate={v => { payDateRef.current = v; }}
        locked={locked}
        tarif={tarif}
        quickAmts={quickAmts}
        inputDirty={inputDirty}
        onQuickPay={quickPay}
        // inputDirty adalah ref milik pemanggil yang SENGAJA diubah di manualPay (perilaku zip; lihat komentar di sana)
        // eslint-disable-next-line react-hooks/immutability
        onManualPay={manualPay}
        onClearPay={clearPay}
      />
    </Sheet>
  );
}
