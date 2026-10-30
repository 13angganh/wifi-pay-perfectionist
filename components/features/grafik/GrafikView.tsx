// ══════════════════════════════════════════
// components/features/grafik/GrafikView.tsx — layar Grafik (REDESAIN T9, prototype T4)
//
// Orkestrator: kontrol (tahun + chip zona), tab jenis data (A24), state memuat/kosong/gagal. Isi tab:
// GrafikView.Income.tsx (Pendapatan, 4 grafik zip + kartu), GrafikView.Counts.tsx (Pembayaran: donat + transaksi A25;
// Pelanggan: pelanggan aktif A26). Perhitungan murni di grafik.logic.ts (teruji), opsi Chart.js di grafik.chart.ts.
// Produksi tetap react-chartjs-2 dengan chartTheme + token (prototype menggambar SVG sendiri).
//
// Zip yang DIPERTAHANKAN: pilih tahun, kartu Total/rata-rata/VS Tahun Lalu (persen sama di kedua kartu, T4 §3 butir b),
// bulanan + proyeksi, perbandingan zona (+TOTAL), komposisi donat + pilih bulan, tahunan, kartu proyeksi, dua periode,
// EmptyState `grafik.noDataTitle/Desc`, skeleton tanpa teks sebelum mount (v11.5.11, anti salah-bahasa saat hidrasi).
// PERBAIKAN ZONA KUSTOM (disetujui): zona kustom = KRS/SLK; mode TOTAL = jumlah semua zona aktif.
// ══════════════════════════════════════════
'use client';

import { CardFilter } from '@/components/ui/CardFilter';
import { useState, type CSSProperties } from 'react';
import { ChartBar, ChartLineUp, Receipt, UsersThree, WarningCircle } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { zoneColor, zoneCssVars } from '@/lib/design-tokens';
import { useT } from '@/hooks/useT';
import { useMounted } from '@/hooks/useMounted';
import { Button } from '@/components/ui/Button';
import { ZoneChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { paletteFor } from './grafik.chart';
import { getAllActiveZones } from '@/lib/member';
import { memberCount, zonesFor } from './grafik.logic';
import type { GrafikCtx } from './GrafikView.Parts';
import IncomeTab from './GrafikView.Income';
import CountsTab from './GrafikView.Counts';
import g from './grafik.module.css';

type Tab = 'inc' | 'pay' | 'cust';

export default function GrafikView() {
  const { appData, activeZone, selYear, setSelYear, theme, settings, syncStatus } = useAppStore();
  const t = useT();
  const lang: 'id' | 'en' = settings.language === 'en' ? 'en' : 'id';
  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS;

  // v11.5.11 (dipertahankan): tunda konten yang bergantung bahasa sampai mounted di client; sebelum itu skeleton murni
  // visual TANPA TEKS (bahasa server selalu 'id', jadi teks apa pun bisa terlihat salah bahasa sesaat).
  const mounted = useMounted();
  const [tab, setTab] = useState<Tab>('inc');
  const [month, setMonth] = useState(new Date().getMonth());

  if (!mounted || (syncStatus === 'loading' && memberCount(appData, zonesFor(activeZone, settings)) === 0)) {
    return (
      <div className={g.root} aria-busy="true">
        <Skeleton width="140px" height="36px" />
        <div className="wp-kpi2"><Skeleton height="76px" /><Skeleton height="76px" /></div>
        <Skeleton height="230px" />
        <Skeleton height="230px" />
      </div>
    );
  }

  const customZones = settings.customZones ?? [];
  const zones = zonesFor(activeZone, settings);
  const hasData = memberCount(appData, zones) > 0;
  const color = zoneColor(activeZone, customZones);
  const zv = zoneCssVars(activeZone, customZones);
  const zoneVars = { ['--zc' as string]: zv.zc, ['--zcdim' as string]: zv.zcdim } as CSSProperties;

  if (syncStatus === 'err' && !hasData) {
    return (
      <EmptyState icon={WarningCircle} title={t('grafik.loadErrorTitle')} description={t('grafik.loadErrorDesc')} size="md"
        action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>} />
    );
  }

  const ctx: GrafikCtx = {
    data: appData, zones, allZones: getAllActiveZones(settings), activeZone, color, customZones, year: selYear, lang, monthNames,
    palette: paletteFor(theme), nowMonth: new Date().getMonth(),
  };

  return (
    <div className={g.root} style={zoneVars}>
      <div className="wp-pbar">
        <Select size="sm" aria-label={t('common.year')} value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        {tab !== 'inc' && (
          <Select size="sm" aria-label={t('common.month')} value={month} onChange={e => setMonth(+e.target.value)} data-testid="grafik-month">
            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
        )}
        <span className="wp-pbar__fix"><ZoneChip color={color}>{activeZone}</ZoneChip></span>
        <CardFilter compact screen="grafik" items={(tab === 'inc'
          ? [['kpi', 'view.gf.kpi'], ['monthly', 'view.gf.monthly'], ['compare', 'view.gf.compare'], ['yearly', 'view.gf.yearly'], ['proj', 'view.gf.proj'], ['twoperiod', 'view.gf.twoperiod']]
          : [['ckpi', 'view.gf.kpi'], ['composition', 'view.gf.composition'], ['counts', 'view.gf.counts']]
        ).filter(([id]) => tab !== 'cust' || id !== 'composition').map(([id, k]) => ({ id, label: t(k) }))} />
      </div>

      <Segmented
        mode="tabs"
        ariaLabel={t('grafik.tabsAria')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'inc',  label: <><ChartLineUp aria-hidden="true" /> {t('grafik.tabIncome')}</> },
          { value: 'pay',  label: <><Receipt aria-hidden="true" /> {t('grafik.tabPayments')}</> },
          { value: 'cust', label: <><UsersThree aria-hidden="true" /> {t('grafik.tabCustomers')}</> },
        ]}
      />

      {!hasData ? (
        <EmptyState icon={ChartBar} title={t('grafik.noDataTitle')} description={t('grafik.noDataDesc')} size="md" />
      ) : tab === 'inc' ? (
        <IncomeTab ctx={ctx} />
      ) : (
        <CountsTab ctx={ctx} kind={tab} month={month} />
      )}
    </div>
  );
}
