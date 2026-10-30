// components/features/rekap/RekapView.tsx — REDESAIN T8 (prototype T3 keputusan 1–6, 9, 15, 16)
// Orkestrator Rekap: periode + pencarian + chip status (RekapView.FilterBar), ringkasan total tahun + Pilih Banyak,
// tabel 12 bulan (RekapView.Table), paginasi, mode pilih (RekapView.Batch + rekap.logic) dan RekapModal/RiwayatModal.
// Logika bisnis dipertahankan: persistPayment/selectiveRollback, kunci payment, lock global/entry, long press 500 ms,
// kilat sukses, pagination 20 baris (v11.6.5), subtotal halaman (v11.6.6). Perubahan yang disetujui: A15 filter status,
// A17 tombol Pilih Banyak (bulan acuan), A18 nama membuka RiwayatModal, pengaman batch (hanya sel belum bayar).
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  CaretLeft, CaretRight, ChartBar, ListChecks, Lock, MagnifyingGlass, UsersThree, Warning, X,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, ROWS_PER_PAGE } from '@/lib/constants';
import { getPay, rp, fuzzyMatch, getMembersForZone } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { persistPayment } from '@/lib/db';
import { localDateISO, resolvePayDate, setPayDates } from '@/lib/payDate';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/ui/Toast';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Skeleton } from '@/components/ui/Skeleton';
import RiwayatModal from '@/components/modals/RiwayatModal';
import { isBatchEligible, toggleBatchSelection, toggleSelectAll } from '../entry/batch';
import RekapModal from './RekapModal';
import RekapFilterBar from './RekapView.FilterBar';
import { RekapTable, type RowData } from './RekapView.Table';
import { BatchHint, BatchSheet } from './RekapView.Batch';
import {
  batchAmount, buildRekapBatch, cellState, columnTotals, filterByStatus, paginate, rowTotal, statusCounts, sum,
  type RekapFilter,
} from './rekap.logic';
import r from './rekap.module.css';

const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;

export default function RekapView() {
  const {
    appData, setAppData, uid, userEmail,
    activeZone, selYear, selMonth, setSelYear, setSelMonth,
    search, setSearch,
    rekapExpanded, setRekapExpanded,
    globalLocked, lockedEntries,
    syncStatus, setSyncStatus,
    setView, setRiwayatZone, setRiwayatName, setRiwayatYear,
  } = useAppStore();
  const settings = useAppStore(s => s.settings);

  const t = useT();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const inputDirty = useRef(false);
  const modalClosing = useRef(false);

  const [batchColIdx, setBatchColIdx] = useState<number | null>(null);
  const [batchSelected, setBatchSelected] = useState<string[]>([]);
  // REDESAIN T12 (F4): tanggal bayar pilihan pengguna untuk batch (mode manual). null = "hari ini" (dibaca saat dipakai).
  const [batchPayDate, setBatchPayDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<RekapFilter>('all');
  const [riwOpen, setRiwOpen] = useState(false);

  // v11.6.5: pagination — halaman DIRESET saat zona/pencarian berubah, DIPERTAHANKAN saat tahun berubah.
  // Pola "adjusting state during render" (react.dev) — bukan useEffect+setState (ditangkap eslint
  // react-hooks/set-state-in-effect). Bereaksi ke STATE, jadi semua jalur ganti zona (Header, GlobalSearch,
  // RiwayatModal, ...) tertangkap tanpa diduplikasi. T3 keputusan 5: ganti zona juga membatalkan mode pilih.
  const [currentPage, setCurrentPage] = useState(1);
  const [prevZoneForPage, setPrevZoneForPage] = useState(activeZone);
  const [prevSearchForPage, setPrevSearchForPage] = useState(search);
  if (activeZone !== prevZoneForPage || search !== prevSearchForPage) {
    if (activeZone !== prevZoneForPage) { setBatchColIdx(null); setBatchSelected([]); }
    setPrevZoneForPage(activeZone);
    setPrevSearchForPage(search);
    setCurrentPage(1);
  }

  // v11.5.2: kilat minimal saat bayar sukses dari RekapModal (successKey memastikan restart animasi)
  const [flashCell, setFlashCell] = useState<{ name: string; month: number; zone: string; year: number; successKey: number } | null>(null);
  const flashKeyCounter = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mems = getMembersForZone(activeZone, appData); // zona kustom ikut
  const counts = statusCounts(appData, activeZone, mems, selYear, selMonth);
  const filtered = filterByStatus(appData, activeZone, mems.filter(m => fuzzyMatch(m, search)), selYear, selMonth, filter);
  const colTotals = columnTotals(appData, activeZone, mems, selYear);
  const grand = sum(colTotals);
  const pg = paginate(filtered, currentPage, ROWS_PER_PAGE);
  const pageColTotals = columnTotals(appData, activeZone, pg.items, selYear);
  const pageSubtotal = sum(pageColTotals);
  const batching = batchColIdx !== null;

  // FIX v11.5.5/v11.5.7: rollback state lokal + log error asli jika Firebase gagal; rollback SELEKTIF (lib/rollback.ts)
  // supaya payment member lain yang berhasil tersimpan concurrent tidak ikut terhapus. Lihat persist() MemberCard.
  async function persist(newData: typeof appData, action: string, detail: string): Promise<boolean> {
    const prevData = appData;
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

  function isLocked(name: string) {
    return globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  }

  // v11.5.2: closeModal menerima info sel yang baru dibayar (opsional) → kilat. useCallback: dipakai handler sel
  // yang ikut di-useCallback untuk Row memo; tanpa ini referensinya berubah tiap render dan membatalkan memo.
  const closeModal = useCallback((paidCell?: { name: string; month: number }) => {
    modalClosing.current = true;
    inputDirty.current   = false;
    setRekapExpanded(null);
    setTimeout(() => { modalClosing.current = false; }, 200);
    if (paidCell) {
      flashKeyCounter.current += 1;
      setFlashCell({ ...paidCell, zone: activeZone, year: selYear, successKey: flashKeyCounter.current });
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashCell(null), 750);
    }
  }, [activeZone, selYear, setRekapExpanded]);

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  function exitBatch() {
    setBatchColIdx(null);
    setBatchSelected([]);
    setBatchPayDate(null);
  }

  // Jalur (b) A17: tombol Pilih Banyak = kolom bulan acuan. Tekan lama dihapus (permintaan user): satu jalur saja.
  function togglePick() {
    if (batching) { exitBatch(); return; }
    setBatchColIdx(selMonth);
    setBatchSelected([]);
    closeModal();
  }

  const onCellClick = useCallback((name: string, mi: number) => {
    if (batchColIdx !== null) {
      if (batchColIdx === mi) {
        const st = useAppStore.getState();
        setBatchSelected(prev => toggleBatchSelection(prev, name, st.appData, st.activeZone, st.selYear, mi));
      }
      return;
    }
    inputDirty.current   = false;
    modalClosing.current = false;
    const cur = useAppStore.getState().rekapExpanded;
    const isExp = cur?.name === name && cur?.month === mi;
    setRekapExpanded(isExp ? null : { name, month: mi });
  }, [batchColIdx, setRekapExpanded]);

  // A18: ketuk nama = RiwayatModal (komponen yang sama dengan MemberCard/Member, tanpa duplikasi)
  const onNameClick = useCallback((name: string) => {
    setRiwayatZone(activeZone);
    setRiwayatName(name);
    setRiwayatYear(selYear);
    setRiwOpen(true);
  }, [activeZone, selYear, setRiwayatZone, setRiwayatName, setRiwayatYear]);

  const fallbackAmt = settings?.quickAmounts?.[0] ?? 100;

  async function handleBatchPay() {
    if (batchColIdx === null || batchSelected.length === 0) return;
    const mi = batchColIdx;
    const plan = buildRekapBatch(appData, activeZone, batchSelected, selYear, mi, fallbackAmt, isLocked);
    if (plan.entries.length === 0) {
      if (plan.locked.length > 0) showToast(t('rekap.allLocked'), 'err');
      else showToast(`${plan.skippedPaid.length} ${t('entry.batchSkippedPaid')}`, 'info');
      return;
    }
    // REDESAIN T12 (F4): tanggal bayar lewat SATU helper (lib/payDate.ts) — otomatis = tanggal LOKAL, manual = pilihan pengguna.
    const newData = setPayDates(
      { ...appData, payments: { ...appData.payments, ...plan.payments } },
      activeZone, plan.entries.map(e => e.name), selYear, mi, resolvePayDate(settings?.autoDate, batchPayDate ?? localDateISO()),
    );
    const ok = await persist(newData,
      `[PAY] ${tLog('log.action.batchPay')} Rekap ${activeZone} - ${plan.entries.length} ${tLog('common.members')}`,
      `${MONTH_NAMES[mi]} ${selYear}`,
    );
    showToast(ok ? `${plan.entries.length} ${t('rekap.batchSuccess')}` : t('common.saveFailed'), ok ? 'ok' : 'err');
    if (ok && plan.skippedPaid.length > 0) {
      setTimeout(() => showToast(`${plan.skippedPaid.length} ${t('entry.batchSkippedPaid')}`, 'info'), 800);
    }
    exitBatch();
  }

  // Banner terkunci: ketuk = buka lewat satu-satunya jalur yang ada (tombol kunci Header; pola T7).
  function unlockViaHeader() {
    document.querySelector<HTMLButtonElement>('.header-lock-action-btn')?.click();
  }

  const rows: RowData[] = pg.items.map((name, i) => ({
    name,
    index: pg.start + i,
    rowTotal: rowTotal(appData, activeZone, name, selYear),
    cells: MONTH_NAMES.map((monthLabel, mi) => {
      const v = getPay(appData, activeZone, name, selYear, mi);
      const cs = cellState(appData, activeZone, name, selYear, mi, selMonth);
      const inBatchCol = batchColIdx === mi;
      const eligible = inBatchCol && isBatchEligible(appData, activeZone, name, selYear, mi);
      const isFlashing = flashCell?.name === name && flashCell?.month === mi
        && flashCell?.zone === activeZone && flashCell?.year === selYear;
      return {
        mi, v, monthLabel,
        kind: cs.kind,
        na: cs.na,
        isDimmed: batching && !inBatchCol,
        isSelected: inBatchCol && batchSelected.includes(name),
        eligible,
        notEligible: inBatchCol && !eligible,
        isExp: rekapExpanded?.name === name && rekapExpanded?.month === mi,
        isFlashing,
        flashKey: isFlashing ? flashCell!.successKey : 0,
      };
    }),
  }));

  // Sheet batch
  const batchPlan = batchColIdx !== null
    ? buildRekapBatch(appData, activeZone, batchSelected, selYear, batchColIdx, fallbackAmt, () => false)
    : null;
  const batchItems = (batchPlan?.entries ?? []).map(e => ({
    name: e.name, amt: e.amt, hasTarif: batchAmount(appData, activeZone, e.name, fallbackAmt).hasTarif,
  }));
  const batchTotal = batchItems.reduce((s, it) => s + it.amt, 0);
  const batchAllSelected = (() => {
    if (batchColIdx === null) return false;
    const next = toggleSelectAll(batchSelected, filtered, appData, activeZone, selYear, batchColIdx);
    return next.length === 0 && batchSelected.length > 0;
  })();
  const batchEligibleCount = batchColIdx === null ? 0
    : filtered.filter(n => isBatchEligible(appData, activeZone, n, selYear, batchColIdx)).length;

  const loading = syncStatus === 'loading' && mems.length === 0;
  const failed  = syncStatus === 'err' && mems.length === 0;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div aria-busy="true">
        <Skeleton height="34px" rounded="lg" style={{ marginBottom: 12 }} />
        <Skeleton height="280px" rounded="lg" />
      </div>
    );
  } else if (failed) {
    body = (
      <Card>
        <EmptyState
          icon={Warning}
          title={t('rekap.loadErrorTitle')}
          description={t('rekap.loadErrorDesc')}
          action={<Button variant="primary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
        />
      </Card>
    );
  } else if (mems.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={UsersThree}
          title={t('common.noMember')}
          description={t('common.addMemberHint')}
          action={(
            <Link href="/members" className={buttonVariants({ variant: 'primary', size: 'sm' })} onClick={() => setView('members')}>
              {t('entry.zoneEmptyAction')}
            </Link>
          )}
        />
      </Card>
    );
  } else if (filtered.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon={MagnifyingGlass}
          title={t('entry.noMatch')}
          description={t('common.noResult')}
          action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setFilter('all'); }}>{t('common.resetFilter')}</Button>}
        />
      </Card>
    );
  } else {
    body = (
      <>
        <div className={r.rise} style={rise(2)}>
          <RekapTable
            rows={rows}
            monthNames={MONTH_NAMES}
            selYear={selYear}
            refMonth={selMonth}
            batchColIdx={batchColIdx}
            page={pg.page}
            totalPages={pg.totalPages}
            pageColTotals={pageColTotals}
            pageSubtotal={pageSubtotal}
            colTotals={colTotals}
            grand={grand}
            onCellClick={onCellClick}
            onNameClick={onNameClick}
          />
        </div>
        <div className={r.count}>{t('rekap.scrollHint')}</div>
        <div className={r.count}>
          {t('rekap.showing')} {pg.start + 1}–{pg.end} {t('rekap.of')} {filtered.length} {t('common.members')}
        </div>
        {pg.totalPages > 1 && (
          <div className={r.pgn}>
            <IconButton icon={CaretLeft} label={t('rekap.pagePrev')} disabled={pg.page <= 1}
              onClick={() => setCurrentPage(Math.max(1, pg.page - 1))} />
            <b className={clsx('wp-num', r.pgnTx)}>{t('rekap.page')} {pg.page} / {pg.totalPages}</b>
            <IconButton icon={CaretRight} label={t('rekap.pageNext')} disabled={pg.page >= pg.totalPages}
              onClick={() => setCurrentPage(Math.min(pg.totalPages, pg.page + 1))} />
          </div>
        )}
      </>
    );
  }

  return (
    <div className={r.page}>
      {globalLocked && (
        <button type="button" className={clsx(r.lkb, r.rise)} onClick={unlockViaHeader} aria-label={t('entry.lockBannerAria')}>
          <Lock weight="fill" aria-hidden="true" />
          <span>{t('lockbanner.message')}</span>
        </button>
      )}

      <RekapFilterBar
        year={selYear}
        month={selMonth}
        monthNames={MONTH_NAMES}
        // ganti tahun menutup modal dan mode pilih (zip); halaman dipertahankan
        onYear={y => { setSelYear(y); closeModal(); exitBatch(); }}
        onMonth={setSelMonth}
        search={search}
        onSearch={setSearch}
        filter={filter}
        counts={counts}
        onFilter={f => { setFilter(f); setCurrentPage(1); }}
      />

<Vis screen="rekap" id="sum">      <Card className={clsx(r.sumrow, r.rise)} style={rise(1)}>
        <IconTile icon={ChartBar} size="sm" />
        <div className={r.sumMain}>
          <div className="wp-t-label">{activeZone} {selYear}</div>
          <b className={clsx('wp-num', r.sumVal)}>{rp(grand)}</b>
        </div>
        <Button variant="secondary" size="sm" onClick={togglePick} disabled={mems.length === 0}>
          {batching ? <X aria-hidden="true" /> : <ListChecks aria-hidden="true" />}
          {batching ? t('action.cancel') : t('rekap.pickMulti')}
        </Button>
      </Card></Vis>

      {batchColIdx !== null && (
        <BatchHint
          monthLabel={MONTH_NAMES[batchColIdx]}
          canSelectAll={batchEligibleCount > 0}
          allSelected={batchAllSelected}
          onSelectAll={() => setBatchSelected(toggleSelectAll(batchSelected, filtered, appData, activeZone, selYear, batchColIdx))}
          onClose={exitBatch}
        />
      )}

      {body}

      {batchColIdx !== null && batchSelected.length > 0 && batchPlan && (
        <BatchSheet
          items={batchItems}
          total={batchTotal}
          periodLabel={`${MONTH_NAMES[batchColIdx]} ${selYear} · ${activeZone}`}
          skippedPaid={batchPlan.skippedPaid.length}
          onCancel={exitBatch}
          onPay={handleBatchPay}
          payDate={settings?.autoDate ? undefined : (batchPayDate ?? localDateISO())}
          onPayDate={settings?.autoDate ? undefined : setBatchPayDate}
        />
      )}

      <RekapModal inputDirty={inputDirty} modalClosing={modalClosing} onClose={closeModal} />
      {riwOpen && <RiwayatModal open onClose={() => setRiwOpen(false)} />}
    </div>
  );
}
