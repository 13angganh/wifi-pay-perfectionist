// components/features/entry/EntryView.tsx — REDESAIN T7 (prototype T2 keputusan 2, 7, 8, 8b, 9, 10, 13)
// Orkestrator Entry: periode + Pilih Banyak, ringkasan, Potensi Belum Masuk, chip filter, pencarian,
// daftar kartu (EntryView.MemberList + MemberCard) dan mode pilih (EntryView.Batch + batch.ts).
// Logika bisnis dipertahankan: persistPayment/selectiveRollback, kunci payment, lock global, search/filter di store.
'use client';

import { CardFilter, Vis } from '@/components/ui/CardFilter';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, ListBullets, ListChecks, Lock, MagnifyingGlass, X, XCircle, Gift,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { getPay, isLunas, isFree, rp, fuzzyMatch, getMembersForZone } from '@/lib/helpers';
import { zoneCssColor } from '@/lib/design-tokens';
import { useT } from '@/hooks/useT';
import { persistPayment } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import MemberCard from '../members/MemberCard';
import type { FilterStatus } from '@/types';
import { buildBatchPayments, filterBatchEligible, isBatchEligible, toggleBatchSelection, toggleSelectAll } from './batch';
import { BatchBar, BatchSheet } from './EntryView.Batch';
import { localDateISO, resolvePayDate, setPayDates } from '@/lib/payDate';
import { MemberList } from './EntryView.MemberList';
import e from './entry.module.css';

const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;

// Snapshot scroll Entry. Store `entryScrollTop` direkomendasikan zip, tetapi setView() di store selalu
// meresetnya ke 0 saat pindah menu, dan handler onScroll di zip dipasang pada <div> yang tidak scroll
// (yang scroll adalah #content), jadi posisi tidak pernah tersimpan. Snapshot modul ini bertahan selama
// sesi SPA dan hanya dipulihkan bila zona + periode sama (posisi hanya bermakna untuk daftar yang sama).
let savedScroll: { top: number; key: string } | null = null;

export default function EntryView() {
  const router = useRouter();
  const {
    appData, setAppData, uid, userEmail,
    activeZone, selYear, selMonth, setSelYear, setSelMonth,
    search, setSearch,
    filterStatus, setFilter,
    setEntryScrollTop,
    globalLocked,
    syncStatus,
    setSyncStatus,
    batchMode, batchSelected, batchYear, batchMonth,
    setBatchMode, setBatchPeriod, setBatchSelected, clearBatch,
    setView,
  } = useAppStore();
  const t = useT();
  const settings = useAppStore(s => s.settings);
  // REDESAIN T12 (F4): tanggal bayar pilihan pengguna untuk batch (mode manual). null = "hari ini" (dibaca saat dipakai).
  const [batchPayDate, setBatchPayDate] = useState<string | null>(null);
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const zc = zoneCssColor(activeZone, settings.customZones);

  const mems = getMembersForZone(activeZone, appData); // zona kustom ikut

  const freeCount = mems.filter(m => isFree(appData, activeZone, m, selYear, selMonth)).length;
  const paid      = mems.filter(m => isLunas(appData, activeZone, m, selYear, selMonth) && !isFree(appData, activeZone, m, selYear, selMonth)).length;
  const unpaid    = mems.filter(m => isBatchEligible(appData, activeZone, m, selYear, selMonth)).length;
  const total     = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, selYear, selMonth) || 0), 0);

  const potensiUnpaid = mems.reduce((sum, m) => {
    if (!isBatchEligible(appData, activeZone, m, selYear, selMonth)) return sum;
    const tarif = appData.memberInfo?.[activeZone + '__' + m]?.tarif as number | undefined;
    return sum + (tarif ?? 0);
  }, 0);

  const filtered = mems.filter(name => {
    if (!fuzzyMatch(name, search)) return false;
    if (filterStatus === 'paid')   return isLunas(appData, activeZone, name, selYear, selMonth) && !isFree(appData, activeZone, name, selYear, selMonth);
    if (filterStatus === 'unpaid') return isBatchEligible(appData, activeZone, name, selYear, selMonth);
    if (filterStatus === 'free')   return isFree(appData, activeZone, name, selYear, selMonth);
    return true;
  });

  // ── Posisi scroll tersimpan (Daftar Wajib-Ada: "scroll position tersimpan") ──
  const scrollKey = `${activeZone}|${selYear}|${selMonth}`;
  const scrollKeyRef = useRef(scrollKey);
  useEffect(() => { scrollKeyRef.current = scrollKey; }, [scrollKey]);
  useEffect(() => {
    const content = document.getElementById('content');
    if (!content) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // abaikan scroll yang terjadi saat rute sudah berpindah (reset ke atas oleh navigasi)
        if (!window.location.pathname.endsWith('/entry')) return;
        savedScroll = { top: content.scrollTop, key: scrollKeyRef.current };
        setEntryScrollTop(content.scrollTop);
      });
    };
    content.addEventListener('scroll', onScroll, { passive: true });
    // Pulihkan saat masuk lagi — kecuali lompatan dari Dashboard ke kartu tertentu (expandedCard terisi).
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (savedScroll && savedScroll.top > 0 && savedScroll.key === scrollKeyRef.current && !useAppStore.getState().expandedCard) {
      const top = savedScroll.top;
      timer = setTimeout(() => { content.scrollTop = top; }, 60); // tunggu DOM daftar ter-render
    }
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      content.removeEventListener('scroll', onScroll);
    };
  }, [setEntryScrollTop]);

  const chips: { key: FilterStatus; icon: typeof ListBullets; label: string; count?: number }[] = [
    { key: 'all',    icon: ListBullets, label: t('common.all') },
    { key: 'paid',   icon: CheckCircle, label: t('status.lunas'), count: paid },
    { key: 'unpaid', icon: XCircle,     label: t('status.belum'), count: unpaid },
    { key: 'free',   icon: Gift,        label: t('status.free'),  count: freeCount },
  ];

  // ── Mode pilih (Pilih Banyak): masuk dengan pilihan kosong seperti Rekap; tekan lama dihapus (permintaan user) ──
  function startBatchMany() {
    if (globalLocked) { showToast(t('entry.locked'), 'err'); return; }
    if (filterBatchEligible(appData, activeZone, mems, selYear, selMonth).length === 0) return;
    setBatchMode(true);
    setBatchPeriod(selYear, selMonth);
    setBatchSelected([]);
  }

  function toggleOne(name: string) {
    if (!batchMode) return;
    setBatchSelected(toggleBatchSelection(useAppStore.getState().batchSelected, name, appData, activeZone, batchYear, batchMonth));
  }

  function selectAllVisible() {
    setBatchSelected(toggleSelectAll(batchSelected, filtered, appData, activeZone, batchYear, batchMonth));
  }

  async function executeBatch() {
    if (batchSelected.length === 0) return;
    if (globalLocked) { showToast(t('entry.locked'), 'err'); return; }

    const plan = buildBatchPayments(appData, activeZone, batchSelected, batchYear, batchMonth);
    const details = plan.details.map(d => `${d.name}: ${rp(d.tarif)}`);

    if (details.length === 0) {
      if (plan.noTarif.length > 0) showToast(t('entry.noTarif'), 'err');
      else showToast(`${plan.ineligible.length} ${t('entry.batchSkippedPaid')}`, 'info');
      return;
    }

    // REDESAIN T12 (F4): batch Entry kini mencatat tanggal bayar (sebelumnya tidak) lewat SATU helper (lib/payDate.ts):
    // otomatis = tanggal LOKAL hari ini, manual = pilihan pengguna di sheet batch.
    const newData = setPayDates(
      { ...appData, payments: { ...appData.payments, ...plan.payments } },
      activeZone, plan.details.map(d => d.name), batchYear, batchMonth, resolvePayDate(settings.autoDate, batchPayDate ?? localDateISO()),
    );
    const prevData = appData; // snapshot untuk rollback jika gagal
    setAppData(newData);
    let ok = true;
    if (uid) {
      setSyncStatus('loading');
      try {
        await persistPayment(uid, newData, {
          action: `[PAY] Batch Pay Entry ${activeZone} - ${details.length} member - ${MONTH_NAMES[batchMonth]} ${batchYear}`,
          detail: details.join(', '),
        }, userEmail || '', () => ({
          globalLocked: useAppStore.getState().globalLocked,
          lockedEntries: useAppStore.getState().lockedEntries,
        }));
        setSyncStatus('ok');
      } catch (err) {
        logger.error('Gagal simpan batch pay Entry ke Firebase', err);
        setSyncStatus('err'); ok = false;
        // FIX v11.5.7: rollback SELEKTIF via selectiveRollback (lib/rollback.ts) — per-KEY payment,
        // sehingga payment member lain yang berhasil tersimpan concurrent aman. Lihat persist() MemberCard.
        const latest = useAppStore.getState().appData;
        setAppData(selectiveRollback(latest, prevData, newData));
      }
    }
    if (ok) {
      showToast(`${details.length} ${t('entry.batchSuccess')}`);
      if (plan.noTarif.length > 0) {
        setTimeout(() => showToast(`${plan.noTarif.length} ${t('entry.batchSkipped')}`, 'info'), 800);
      }
      if (plan.ineligible.length > 0) {
        setTimeout(() => showToast(`${plan.ineligible.length} ${t('entry.batchSkippedPaid')}`, 'info'), 1600);
      }
    } else {
      showToast(t('common.saveFailed'), 'err');
    }
    exitBatch();
  }

  function exitBatch() {
    clearBatch();
    setBatchPayDate(null);
  }

  useEffect(() => {
    if (!batchMode) setBatchPeriod(selYear, selMonth);
  }, [selYear, selMonth, batchMode, setBatchPeriod]);

  const batchPlan = buildBatchPayments(appData, activeZone, batchSelected, batchYear, batchMonth);
  const batchTotal = batchPlan.details.reduce((s, d) => s + d.tarif, 0);
  const periodLabel = `${MONTH_NAMES[batchMode ? batchMonth : selMonth]} ${batchMode ? batchYear : selYear} · ${activeZone}`;
  const loading = syncStatus === 'loading';
  const failed  = syncStatus === 'err';

  // Banner terkunci (T2 keputusan 7): ketuk = buka. Membuka kunci memakai satu-satunya jalur yang sudah ada,
  // yaitu tombol kunci Header (toggleGlobalLock + rollback selektif), supaya logika kunci tidak diduplikasi.
  function unlockViaHeader() {
    document.querySelector<HTMLButtonElement>('.header-lock-action-btn')?.click();
  }

  return (
    <div className={e.page}>
      {globalLocked && (
        <button type="button" className={clsx(e.lkb, e.rise)} onClick={unlockViaHeader} aria-label={t('entry.lockBannerAria')}>
          <Lock weight="fill" aria-hidden="true" />
          <span>{t('lockbanner.message')}</span>
        </button>
      )}

      {batchMode ? (
        <BatchBar
          count={batchSelected.length}
          periodLabel={periodLabel}
          zoneColor={zc}
          onCancel={exitBatch}
          onSelectAll={selectAllVisible}
        />
      ) : (
        <>
          {/* Periode + Bayar Semua */}
          <div className={clsx('wp-pbar', e.rise)} style={rise(1)} role="group" aria-label={t('entry.periodAria')}>
            <Select size="sm" aria-label={t('common.year')} value={selYear} onChange={ev => setSelYear(+ev.target.value)}>
              {getYears().map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select size="sm" aria-label={t('common.month')} value={selMonth} onChange={ev => setSelMonth(+ev.target.value)}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </Select>
            <CardFilter compact screen="entry" items={[['sum', 'view.entry.sum'], ['pot', 'view.entry.pot'], ['chips', 'view.entry.chips'], ['cardinfo', 'view.entry.cardinfo']].map(([id, k]) => ({ id, label: t(k) }))} />
          </div>
        </>
      )}

      {/* Pencarian — selalu tampil, juga saat mode pilih (perbaikan v11.x: tanpa ini user terkunci pada
          hasil pencarian lama dan tak bisa menambah member lain ke batch). */}
      <div className="wp-field">
        <div className="wp-inpw">
          <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
          <input
            className="wp-inp"
            data-testid="entry-search"
            type="text"
            placeholder={`${t('entry.searchPlaceholder')} ${activeZone}...`}
            aria-label={t('header.searchMember')}
            value={search}
            onChange={ev => setSearch(ev.target.value)}
            autoComplete="off"
          />
          {search && (
            <span className="wp-inpw__end" style={{ pointerEvents: 'auto' }}>
              <button type="button" aria-label={t('entry.clearSearch')} onClick={() => setSearch('')}
                style={{ background: 'none', border: 0, color: 'inherit', display: 'flex', cursor: 'pointer' }}>
                <X />
              </button>
            </span>
          )}
        </div>
      </div>
      {!batchMode && (
        <>
          {/* Chip filter */}
<Vis screen="entry" id="chips">          <FilterChips ariaLabel={t('entry.filterAria')}>
            {chips.map(c => (
              <FilterChip key={c.key} active={filterStatus === c.key} count={c.count} onClick={() => setFilter(c.key)}>
                <c.icon aria-hidden="true" /> {c.label}
              </FilterChip>
            ))}
          </FilterChips></Vis>

          {/* Ringkasan periode (dipertahankan dari zip: sum-bar) */}
<Vis screen="entry" id="sum">          <Card className={clsx(e.sum, e.rise)} style={rise(2)}>
            <div className={e.sumMain}>
              <div className="wp-t-label">{periodLabel}</div>
              <b className={clsx('wp-num', e.sumVal)} aria-label={t('entry.summaryTotal')}>{rp(total)}</b>
            </div>
            <Button variant="secondary" size="sm" onClick={startBatchMany} disabled={unpaid === 0 && !globalLocked}>
              <ListChecks weight="bold" aria-hidden="true" /> {t('rekap.pickMulti')}
            </Button>
          </Card></Vis>

          {/* Potensi Belum Masuk */}
          <Vis screen="entry" id="pot">
          {unpaid > 0 && potensiUnpaid > 0 && (
            <Card className={clsx(e.pot, e.rise)} style={rise(3)}>
              <div style={{ flex: '1 1 10rem', minWidth: 0 }}>
                <div className="wp-t-label" style={{ color: 'var(--c-belum)' }}>{t('entry.potentialUnpaid')}</div>
                <div className="wp-num wp-t-head" style={{ color: 'var(--c-belum)' }}>{rp(potensiUnpaid)}</div>
              </div>
              <div className="wp-t-cap" style={{ textAlign: 'right' }}>
                {t('entry.from')} {unpaid} {t('entry.membersUnpaid')}
              </div>
            </Card>
          )}
          </Vis>
        </>
      )}
      <div className={e.count}>
        {filtered.length} {t('common.members')}{search ? ` ${t('common.noResult').toLowerCase()}` : ''} · {activeZone}
      </div>

      <MemberList
        names={filtered}
        totalInZone={mems.length}
        loading={loading}
        failed={failed}
        search={search}
        onResetSearch={() => setSearch('')}
        onGoMembers={() => { setView('members'); router.push('/members'); }}
        renderItem={(name, i) => (
          <MemberCard
            name={name}
            index={i}
            batchMode={batchMode}
            batchSelected={batchSelected.includes(name)}
            batchEligible={isBatchEligible(appData, activeZone, name, batchYear, batchMonth)}
            onBatchToggle={() => toggleOne(name)}
          />
        )}
      />

      {batchMode && batchSelected.length > 0 && (
        <BatchSheet
          count={batchSelected.length}
          items={batchPlan.details.map(d => ({ name: d.name, amt: d.tarif }))}
          total={batchTotal}
          noTarif={batchPlan.noTarif.length}
          periodLabel={periodLabel}
          onCancel={exitBatch}
          onPay={executeBatch}
          payDate={settings.autoDate ? undefined : (batchPayDate ?? localDateISO())}
          onPayDate={settings.autoDate ? undefined : setBatchPayDate}
        />
      )}
    </div>
  );
}
