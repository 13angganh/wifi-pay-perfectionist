// components/features/tunggakan/TunggakanView.tsx — REDESAIN T8 (prototype T3 keputusan 9–12, 16, 19)
// Orkestrator Tunggakan: periode + pencarian (A19) + mode (Nunggak/Rajin/Gratis) + chip aging (TunggakanView.FilterBar),
// ringkasan (jumlah member + total tunggakan A16), daftar kartu (TunggakanView.Item) dan RiwayatModal (A18).
// Seluruh perhitungan ada di hooks/useTunggakan.ts (fungsi murni buildTunggakan, teruji, tanpa percabangan KRS/SLK).
// Perilaku zip dipertahankan: periode = selYear/selMonth (store, dibagi dengan Entry/Dashboard), Kirim WA memakai
// tarif individual member (doWABlast), aging 1 / 2–3 / 4+ bulan, 12 bulan pertama tampil lalu "+N lagi".
'use client';

import { CardFilter, Vis } from '@/components/ui/CardFilter';
import { useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { CheckCircle, Gift, MagnifyingGlass, Medal, UsersThree, Warning, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { getYears } from '@/lib/constants';
import { rp } from '@/lib/helpers';
import { getMemberPeriods, periodContains } from '@/lib/memberPeriods';
import { doWABlast } from '@/lib/export.wa';
import { useT } from '@/hooks/useT';
import { filterArrearsByAging, useTunggakan, type AgingFilter, type TunggakanMode } from '@/hooks/useTunggakan';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import RiwayatModal from '@/components/modals/RiwayatModal';
import TunggakanFilterBar from './TunggakanView.FilterBar';
import { ArrearsCard, FreeCard, OnTimeCard } from './TunggakanView.Item';
import s from './tunggakan.module.css';

const rise = (i: number) => ({ ['--i' as string]: Math.min(i, 8) }) as CSSProperties;

export default function TunggakanView() {
  const {
    appData, syncStatus, activeZone, setSelYear, setSelMonth,
    search, setSearch, setView, setRiwayatZone, setRiwayatName, setRiwayatYear,
  } = useAppStore();
  const t = useT();
  const { memberCount, arrears, rajin, free, aging, fallbackTarif, MONTH_NAMES, selYear, selMonth } = useTunggakan();

  const [mode, setMode] = useState<TunggakanMode>('nakal');
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('total');
  const [riwOpen, setRiwOpen] = useState(false);

  const shown = filterArrearsByAging(arrears, agingFilter);
  const count = mode === 'nakal' ? shown.length : mode === 'rajin' ? rajin.length : free.length;
  const sumColor = mode === 'nakal' ? 'var(--c-belum)' : mode === 'rajin' ? 'var(--c-lunas)' : 'var(--c-free)';
  const sumLabel = mode === 'nakal' ? t('tunggakan.sumLabel') : mode === 'rajin' ? t('tunggakan.sumLunas') : t('tunggakan.sumFree');
  const totalAmount = shown.reduce((sum, x) => sum + x.amount, 0);

  // A18: ketuk kartu = RiwayatModal (komponen yang sama dengan Member/Rekap, tahun = periode yang dilihat)
  function openRiwayat(zone: string, name: string) {
    setRiwayatZone(zone);
    setRiwayatName(name);
    setRiwayatYear(selYear);
    setRiwOpen(true);
  }

  // REDESAIN T12: Free bisa banyak periode — tampilkan periode yang mencakup bulan acuan.
  function fmFreePeriod(zone: string, name: string): string {
    const fm = getMemberPeriods(appData, zone, name)?.free?.find(p => periodContains(p, selYear, selMonth));
    if (!fm) return '';
    const to = fm.toY != null && fm.toM != null
      ? ` ${t('tunggakan.until')} ${MONTH_NAMES[fm.toM]} ${fm.toY}`
      : ` (${t('tunggakan.forever')})`;
    return `${t('tunggakan.from')} ${MONTH_NAMES[fm.fromM]} ${fm.fromY}${to}`;
  }

  const resetSearch = (
    <Button variant="secondary" size="sm" onClick={() => setSearch('')}>{t('common.resetFilter')}</Button>
  );

  let body: React.ReactNode;
  if (syncStatus === 'loading' && memberCount === 0) {
    body = <SkeletonList count={4} />;
  } else if (syncStatus === 'err' && memberCount === 0) {
    body = (
      <Card>
        <EmptyState
          icon={Warning}
          title={t('tunggakan.loadErrorTitle')}
          description={t('tunggakan.loadErrorDesc')}
          action={<Button variant="primary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
        />
      </Card>
    );
  } else if (memberCount === 0) {
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
  } else if (count === 0) {
    const emptyDesc = agingFilter === 'total' ? t('tunggakan.emptyTotal')
      : agingFilter === 'baru' ? t('tunggakan.emptyNew')
      : agingFilter === 'segera' ? t('tunggakan.emptySoon')
      : t('tunggakan.emptyCritical');
    body = search ? (
      <Card><EmptyState icon={MagnifyingGlass} title={t('entry.noMatch')} description={t('common.noResult')} action={resetSearch} /></Card>
    ) : (
      <Card>
        {mode === 'nakal' && <EmptyState icon={CheckCircle} title={t('dashboard.allPaid')} description={emptyDesc} />}
        {mode === 'rajin' && <EmptyState icon={Medal} title={t('common.noData')} description={t('tunggakan.emptyRajin')} />}
        {mode === 'free' && <EmptyState icon={Gift} title={t('common.noData')} description={t('tunggakan.emptyFree')} />}
      </Card>
    );
  } else {
    body = (
      <div className={s.mlist}>
        {mode === 'nakal' && shown.map((x, i) => (
          <ArrearsCard
            key={`${x.zone}__${x.name}`}
            item={x}
            index={i}
            monthNames={MONTH_NAMES}
            style={rise(i)}
            onOpen={() => openRiwayat(x.zone, x.name)}
            // v11.5 FIX (zip): tarif INDIVIDUAL member, bukan selalu quickAmounts[0] global
            onWa={() => doWABlast(x.name, x.zone, x.unpaid, x.tarif ?? fallbackTarif)}
          />
        ))}
        {mode === 'rajin' && rajin.map((m, i) => (
          <OnTimeCard key={`${m.zone}__${m.name}`} name={m.name} index={i} style={rise(i)} onOpen={() => openRiwayat(m.zone, m.name)} />
        ))}
        {mode === 'free' && free.map((m, i) => (
          <FreeCard key={`${m.zone}__${m.name}`} name={m.name} index={i} style={rise(i)}
            period={fmFreePeriod(m.zone, m.name)} onOpen={() => openRiwayat(m.zone, m.name)} />
        ))}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={clsx('wp-pbar', s.rise)} role="group" aria-label={t('tunggakan.periodAria')}>
        <Select size="sm" aria-label={t('common.year')} value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select size="sm" aria-label={t('common.month')} value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <CardFilter compact screen="tunggakan" items={[['sum', 'view.tunggakan.sum'], ['chips', 'view.tunggakan.chips'], ['months', 'view.tunggakan.months'], ['wa', 'view.tunggakan.wa']].map(([id, k]) => ({ id, label: t(k) }))} />
      </div>

      <div className="wp-field">
        <div className="wp-inpw">
          <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
          <input
            className="wp-inp"
            data-testid="tunggakan-search"
            type="text"
            placeholder={t('tunggakan.searchPlaceholder')}
            aria-label={t('header.searchMember')}
            value={search}
            onChange={e => setSearch(e.target.value)}
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

      <TunggakanFilterBar
        mode={mode}
        aging={agingFilter}
        counts={{ nakal: aging.total, rajin: rajin.length, free: free.length }}
        agingCounts={aging}
        onMode={m => { setMode(m); setAgingFilter('total'); }}
        onAging={setAgingFilter}
      />

<Vis screen="tunggakan" id="sum">      <Card className={clsx(s.sumrow, s.rise)} style={rise(1)}>
        <div className={s.sumMain}>
          <div className="wp-t-label">{sumLabel} {MONTH_NAMES[selMonth].toUpperCase()} {selYear} · {activeZone}</div>
          <b className={clsx('wp-num', s.sumVal)} style={{ color: sumColor }}>{count} {t('common.members')}</b>
        </div>
        {mode === 'nakal' && count > 0 && (
          <div className={s.sumR}>
            <div className="wp-t-label">{t('tunggakan.totalArrears')}</div>
            <b className={clsx('wp-num', s.sumVal)}>{rp(totalAmount)}</b>
          </div>
        )}
      </Card></Vis>

      {body}

      {riwOpen && <RiwayatModal open onClose={() => setRiwOpen(false)} />}
    </div>
  );
}
