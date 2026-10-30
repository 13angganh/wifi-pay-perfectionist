// components/features/dashboard/DashboardView.tsx — REDESAIN T7 (prototype T2, keputusan 1 dan 11 sampai 14)
// Orkestrator: ambil data dari useDashboard() (satu sumber hitungan), susun bagian-bagiannya.
// Urutan (T2 keputusan 1): sapaan + pemilih periode, 3 stat, Pendapatan + Bersih (+grafik 6 bulan) + Insight,
// kartu per zona, Belum Bayar + Tunggakan Terbanyak, Operasional + Backup, Ringkasan WA, Aksi Cepat, Aktivitas Terbaru.
'use client';

import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { HandWaving, Receipt } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import { useDashboard } from '@/hooks/useDashboard';
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

export default function DashboardView() {
  const router = useRouter();
  const t = useT();
  const d = useDashboard();
  const { appData, userName, userEmail, setSelYear, setSelMonth, setView, setViewWithPeriod } = useAppStore();

  function nav(v: ViewName) { setView(v); router.push('/' + v); }
  // v11.5: navigasi atomic ke Entry pada zona + bulan + tahun tertentu (klik member tunggakan →
  // langsung lompat ke bulan yang nunggak, kartu auto-expand), bukan bulan sekarang.
  function goToEntryAt(zone: string, year: number, month: number, memberName?: string) {
    setViewWithPeriod('entry', year, month, zone, memberName);
    router.push('/entry');
  }

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : '');
  // REDESAIN T12: keadaan kosong/memuat mengikuti SEMUA member terdaftar (totalListed), bukan hanya yang terhitung bulan ini.
  const loading = d.syncStatus === 'loading' && d.totalListed === 0;
  const failed  = d.syncStatus === 'err' && d.totalListed === 0;
  const empty   = !loading && !failed && d.totalListed === 0;

  const head = (
    <div className={clsx(s.head, s.rise)}>
      <div className={s.greet}>
        <span className="wp-t-cap">{t('dashboard.greeting')}</span>
        <div className={clsx('wp-t-head', s.greetName)}>
          {displayName}{' '}
          <HandWaving weight="fill" size={20} aria-hidden="true" style={{ color: 'var(--c-warn)', verticalAlign: 'text-bottom' }} />
        </div>
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

