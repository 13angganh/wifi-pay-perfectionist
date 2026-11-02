// components/features/dashboard/DashboardView.tsx — REDESAIN T7 (prototype T2, keputusan 1 dan 11 sampai 14)
// Orkestrator: ambil data dari useDashboard() (satu sumber hitungan), susun bagian-bagiannya.
// Urutan (T2 keputusan 1): sapaan + pemilih periode, 3 stat, Pendapatan + Bersih (+grafik 6 bulan) + Insight,
// kartu per zona, Belum Bayar + Tunggakan Terbanyak, Operasional + Backup, Ringkasan WA, Aksi Cepat, Aktivitas Terbaru.
'use client';

import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Moon, MoonStars, Receipt, Sun, SunHorizon, CloudSun } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import { useDashboard } from '@/hooks/useDashboard';
import { useGreeting } from '@/hooks/useGreeting';
import { rp } from '@/lib/helpers';
import type { GreetSlot, GreetStats } from '@/lib/greeting';
import { CardFilter, Vis } from '@/components/ui/CardFilter';

const DASH_ITEMS: [string, string][] = [['stat', 'view.dash.stat'], ['income', 'view.dash.income'], ['insight', 'view.dash.insight'], ['zones', 'view.dash.zones'], ['unpaid', 'view.dash.unpaid'], ['arrears', 'view.dash.arrears'], ['ops', 'view.dash.ops'], ['backup', 'view.dash.backup'], ['wa', 'view.dash.wa'], ['quick', 'view.dash.quick'], ['recent', 'view.dash.recent']];
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import type { ViewName } from '@/types';
import { StatTiles, IncomeCard, InsightCard, ZoneCards } from './DashboardView.Stats';
import { UnpaidCard, TopArrearsCard } from './DashboardView.Unpaid';
import { OpsRow, BackupCard, WaCard, QuickActions } from './DashboardView.Tools';
import { RecentActivity } from './DashboardView.RecentActivity';
import s from './dashboard.module.css';

const GREET_ICON: Record<GreetSlot, typeof Sun> = { morning: SunHorizon, noon: Sun, afternoon: CloudSun, evening: Moon, late: MoonStars };

export default function DashboardView() {
  const router = useRouter();
  const t = useT();
  const d = useDashboard();
  const { appData, setSelYear, setSelMonth, setView, setViewWithPeriod } = useAppStore(useShallow(s => ({ appData: s.appData, setSelYear: s.setSelYear, setSelMonth: s.setSelMonth, setView: s.setView, setViewWithPeriod: s.setViewWithPeriod })));

  function nav(v: ViewName) { setView(v); router.push('/' + v); }
  // v11.5: navigasi atomic ke Entry pada zona + bulan + tahun tertentu (klik member tunggakan →
  // langsung lompat ke bulan yang nunggak, kartu auto-expand), bukan bulan sekarang.
  function goToEntryAt(zone: string, year: number, month: number, memberName?: string) {
    setViewWithPeriod('entry', year, month, zone, memberName);
    router.push('/entry');
  }

  // v11.11.0: sapaan dinamis (lib/greeting.ts). Nama = nama tampilan dari Pengaturan (bukan awalan email).
  const dyNow = d.dy, dmNow = d.dm;
  const stats = useMemo<GreetStats | null>(() => {
    if (d.syncStatus === 'loading' && d.totalListed === 0) return null;
    const now = new Date();
    return {
      current: dyNow === now.getFullYear() && dmNow === now.getMonth(),
      members: d.totalMembers, lunas: d.totalLunas, belum: d.totalBelum, lunasPct: d.lunasPctNow,
      hasIncome: d.totalIncome > 0, incomeLabel: rp(d.totalIncome), incomePct: d.totalPct,
      arrears: d.topTunggak[0] ? { name: d.topTunggak[0].name, count: d.topTunggak[0].count } : null,
    };
  }, [d.syncStatus, d.totalListed, d.totalMembers, d.totalLunas, d.totalBelum, d.lunasPctNow, d.totalIncome, d.totalPct, d.topTunggak, dyNow, dmNow]);
  const greet = useGreeting(stats);
  const GreetIcon = GREET_ICON[greet.slot];
  // REDESAIN T12: keadaan kosong/memuat mengikuti SEMUA member terdaftar (totalListed), bukan hanya yang terhitung bulan ini.
  const loading = d.syncStatus === 'loading' && d.totalListed === 0;
  const failed  = d.syncStatus === 'err' && d.totalListed === 0;
  const empty   = !loading && !failed && d.totalListed === 0;

  const head = (
    <div className={clsx(s.head, s.rise)}>
      <div className={s.greet}>
        <div className={clsx('wp-t-head', s.greetTitle)} data-testid="greeting-title">
          <GreetIcon weight="fill" size={20} aria-hidden="true" style={{ color: 'var(--c-warn)', flexShrink: 0 }} />
          <span>{greet.title}</span>
        </div>
        {greet.line && <span className={clsx('wp-t-cap', s.greetLine)} data-testid="greeting-line">{greet.line}</span>}
      </div>
      <div className="wp-pbar">
        <Select size="sm" aria-label={t('common.year')} value={d.dy} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select size="sm" aria-label={t('common.month')} value={d.dm} onChange={e => setSelMonth(+e.target.value)}>
          {d.MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <CardFilter compact screen="dashboard" items={DASH_ITEMS.map(([id, k]) => ({ id, label: t(k) }))} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={s.page}>
        {head}
        <div className={s.skRow}><Skeleton height="62px" /><Skeleton height="62px" /><Skeleton height="62px" /></div>
        <Skeleton height="110px" />
        <Skeleton height="90px" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (failed) {
    return (
      <div className={s.page}>
        {head}
        <Card>
          <EmptyState
            icon={Receipt}
            title={t('dashboard.loadErrorTitle')}
            description={t('dashboard.loadErrorDesc')}
            action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
            size="md"
          />
        </Card>
      </div>
    );
  }
  if (empty) {
    return (
      <div className={s.page}>
        {head}
        <Card>
          <EmptyState
            icon={Receipt}
            title={t('members.empty')}
            description={t('onboarding.step1')}
            action={<Button variant="primary" size="sm" onClick={() => nav('members')}>{t('entry.zoneEmptyAction')}</Button>}
            size="md"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {head}
      <Vis screen="dashboard" id="stat"><StatTiles d={d} /></Vis>
      <div className={s.g2}>
        <Vis screen="dashboard" id="income"><IncomeCard d={d} /></Vis>
        <Vis screen="dashboard" id="insight"><InsightCard d={d} /></Vis>
      </div>
      <Vis screen="dashboard" id="zones"><ZoneCards d={d} /></Vis>
      <div className={s.g2}>
        <Vis screen="dashboard" id="unpaid"><UnpaidCard d={d} onInputPay={() => { setViewWithPeriod('entry', d.dy, d.dm); router.push('/entry'); }} /></Vis>
        <Vis screen="dashboard" id="arrears"><TopArrearsCard d={d} onGoEntry={goToEntryAt} onMore={() => nav('tunggakan')} /></Vis>
      </div>
      <div className={s.g2}>
        <Vis screen="dashboard" id="ops"><OpsRow d={d} onOpen={() => nav('operasional')} /></Vis>
        <Vis screen="dashboard" id="backup"><BackupCard d={d} /></Vis>
      </div>
      <Vis screen="dashboard" id="wa"><WaCard d={d} /></Vis>
      <Vis screen="dashboard" id="quick"><QuickActions onNav={nav} /></Vis>
      <Vis screen="dashboard" id="recent"><RecentActivity logs={appData.activityLog} onSeeAll={() => nav('log')} /></Vis>
    </div>
  );
}

