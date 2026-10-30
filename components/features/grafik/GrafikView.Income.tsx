// ══════════════════════════════════════════
// components/features/grafik/GrafikView.Income.tsx — tab Pendapatan (REDESAIN T9, A24)
// Memuat 4 grafik zip + kartu: Total/rata-rata + VS Tahun Lalu, Bulanan + proyeksi, perbandingan zona (satu garis per
// zona aktif + TOTAL; judul dinamis), Perbandingan Tahunan, kartu Proyeksi Bulan Depan, Perbandingan Dua Periode.
// Zona kustom diperlakukan sama dengan KRS/SLK. Batang proyeksi hijau (Chart.js tidak mendukung batang putus-putus).
// ══════════════════════════════════════════
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { TrendDown, TrendUp } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { getYears } from '@/lib/constants';
import { rp } from '@/lib/helpers';
import { C_LUNAS, ZC_TOT, zoneColor } from '@/lib/design-tokens';
import { useT } from '@/hooks/useT';
import { Card } from '@/components/ui/Card';
import { KpiGrid } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { cartesianOptions } from './grafik.chart';
import {
  TOTAL_ZONE, avgNonZero, monthTotals, pctChange, periodTotal, projection, withAlpha, yearTotals, zoneMonthTotals,
} from './grafik.logic';
import { ChartCard, ChartFrame, Kpi, Legend, type GrafikCtx } from './GrafikView.Parts';
import g from './grafik.module.css';

export default function IncomeTab({ ctx }: { ctx: GrafikCtx }) {
  const t = useT();
  const { data, zones, allZones, activeZone, color, customZones, year, lang, monthNames, palette, nowMonth } = ctx;

  // Dua periode (zip): periode 1 = bulan lalu tahun ini, periode 2 = bulan yang sama tahun lalu.
  const now = new Date();
  const defMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const [p1Year, setP1Year] = useState(now.getFullYear());
  const [p1Month, setP1Month] = useState(defMonth);
  const [p2Year, setP2Year] = useState(now.getFullYear() - 1);
  const [p2Month, setP2Month] = useState(defMonth);

  const years = getYears();
  const abbr = (i: number) => monthNames[i].slice(0, 3);

  // ── KPI ──
  const mData = monthTotals(data, zones, year);
  const mTotal = mData.reduce((a, b) => a + b, 0);
  const mAvg = avgNonZero(mData);
  const yData = yearTotals(data, zones, years);
  const curYi = years.indexOf(year);
  const curYPct = curYi > 0 ? pctChange(yData[curYi], yData[curYi - 1]) : null;
  const prevYTotal = curYi > 0 ? yData[curYi - 1] : 0;

  // ── Proyeksi ──
  const proj = projection(mData, nowMonth);
  const nextIdx = (nowMonth + 1) % 12;
  const nextLabel = monthNames[nextIdx];

  // ── Dua periode ──
  const p1Total = periodTotal(data, zones, p1Year, p1Month);
  const p2Total = periodTotal(data, zones, p2Year, p2Month);
  const mperiodPct = p2Total > 0 ? Math.round(((p1Total - p2Total) / p2Total) * 100) : null;

  // ── Dataset ──
  const monthly = {
    labels: [...monthNames.map(m => m.slice(0, 3)), `${nextLabel.slice(0, 3)}*`],
    datasets: [{
      data: [...mData, proj.value],
      backgroundColor: [...mData.map(() => withAlpha(color, 0.5)), withAlpha(C_LUNAS, 0.25)],
      borderColor: [...mData.map(() => color), C_LUNAS],
      borderWidth: 2, borderRadius: 5,
    }],
  };

  // Satu garis per zona aktif (SEMUA zona, bukan hanya zona terpilih — zip: KRS vs SLK + TOTAL) + TOTAL (= jumlah semuanya). Warna zona dari zoneColor (zona kustom: warnanya sendiri).
  const zoneLines = allZones.map(z => {
    const c = zoneColor(z, customZones);
    return { label: z, data: zoneMonthTotals(data, z, year), borderColor: c, backgroundColor: withAlpha(c, 0.08), borderWidth: 2, tension: 0.4, fill: false, pointBackgroundColor: c, pointRadius: 3, pointBorderColor: 'transparent' };
  });
  const totalLine = {
    label: TOTAL_ZONE, data: zoneLines.reduce<number[]>((acc, l) => acc.map((v, i) => v + l.data[i]), monthNames.map(() => 0)),
    borderColor: ZC_TOT, backgroundColor: withAlpha(ZC_TOT, 0.08), borderWidth: 2, tension: 0.4, fill: false, pointBackgroundColor: ZC_TOT, pointRadius: 3, pointBorderColor: 'transparent', borderDash: [4, 3],
  };
  const compare = { labels: monthNames.map(m => m.slice(0, 3)), datasets: [...zoneLines, totalLine] };
  const compareTitle = `${allZones.join(' vs ')} ${year}`;

  const yearly = {
    labels: years.map(String),
    datasets: [{ data: yData, borderColor: color, backgroundColor: withAlpha(color, 0.1), borderWidth: 2, tension: 0.4, fill: true, pointBackgroundColor: color, pointRadius: 4, pointBorderColor: 'transparent' }],
  };

  const l1 = `${abbr(p1Month)} ${p1Year}`;
  const l2 = `${abbr(p2Month)} ${p2Year}`;
  const twoPeriod = {
    labels: [l1, l2],
    datasets: [{ data: [p1Total, p2Total], backgroundColor: [withAlpha(color, 0.5), withAlpha(palette.tickColor, 0.35)], borderColor: [color, palette.tickColor], borderWidth: 2, borderRadius: 6 }],
  };

  const opts = cartesianOptions(palette, 'rp', lang);

  return (
    <>
<Vis screen="grafik" id="kpi">      <KpiGrid>
        <Kpi label={`${t('common.total')} ${year}`} value={rp(mTotal)} color={color} delta={curYPct}
          caption={`${t('grafik.avgMonth')}: ${rp(mAvg)}`} />
        <Kpi label={t('grafik.vsLastYear')} value={rp(prevYTotal)} delta={curYPct}
          caption={`${t('common.year')} ${year - 1}`} />
      </KpiGrid></Vis>

      <div className={g.g2}>
<Vis screen="grafik" id="monthly">        <ChartCard
          testId="chart-monthly"
          title={`${t('grafik.monthly')} ${year} · ${activeZone}`}
          legend={proj.value > 0 ? <Legend items={[{ label: `${nextLabel.slice(0, 3)}* ${t('grafik.proj')}`, color: withAlpha(C_LUNAS, 0.25), outline: C_LUNAS }]} /> : undefined}
        >
          <ChartFrame label={`${t('grafik.monthly')} ${year}`}><Bar data={monthly} options={opts as never} /></ChartFrame>
        </ChartCard></Vis>

<Vis screen="grafik" id="compare">        <ChartCard
          testId="chart-compare"
          title={compareTitle}
          legend={<Legend items={[...zoneLines.map(l => ({ label: l.label, color: l.borderColor })), { label: TOTAL_ZONE, color: ZC_TOT }]} />}
        >
          <ChartFrame label={compareTitle}><Line data={compare} options={opts as never} /></ChartFrame>
        </ChartCard></Vis>
      </div>

      <div className={g.g2}>
<Vis screen="grafik" id="yearly">        <ChartCard testId="chart-yearly" title={`${t('grafik.yearly')} · ${activeZone}`}>
          <ChartFrame label={t('grafik.yearly')} height={170}><Line data={yearly} options={opts as never} /></ChartFrame>
        </ChartCard></Vis>

<Vis screen="grafik" id="proj">        {proj.value > 0 && (
          <Card padding="sm" className={g.proj} data-testid="card-projection">
            <span className="wp-t-label" style={{ color: 'var(--c-lunas)' }}>{t('grafik.projection')}</span>
            <div className={g.projRow}>
              <div>
                <b className={clsx('wp-num', g.projVal)}>{rp(proj.value)}</b>
                <div className="wp-t-cap">{nextLabel} {year}</div>
              </div>
              <div className={g.projR}>
                <div className="wp-t-cap">{t('grafik.basedOn')}</div>
                <div className="wp-t-micro">avg {proj.basis} {t('grafik.lastMonths')}</div>
              </div>
            </div>
          </Card>
        )}</Vis>
      </div>

<Vis screen="grafik" id="twoperiod">      <ChartCard testId="chart-twoperiod" title={t('grafik.twoperiod')}>
        <div className={g.per2}>
          <div className={g.per}>
            <span className="wp-t-label" style={{ color: 'var(--zc)' }}>{t('grafik.period1')}</span>
            <div className={g.perSel}>
              <Select size="sm" aria-label={`${t('grafik.period1')} — ${t('common.year')}`} value={p1Year} onChange={e => setP1Year(+e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
              <Select size="sm" aria-label={`${t('grafik.period1')} — ${t('common.month')}`} value={p1Month} onChange={e => setP1Month(+e.target.value)}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
              </Select>
            </div>
            <b className={clsx('wp-num', g.perVal)} style={{ color: 'var(--zc)' }} data-testid="period1-total">{rp(p1Total)}</b>
          </div>
          <div className={g.per}>
            <span className="wp-t-label">{t('grafik.period2')}</span>
            <div className={g.perSel}>
              <Select size="sm" aria-label={`${t('grafik.period2')} — ${t('common.year')}`} value={p2Year} onChange={e => setP2Year(+e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
              <Select size="sm" aria-label={`${t('grafik.period2')} — ${t('common.month')}`} value={p2Month} onChange={e => setP2Month(+e.target.value)}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
              </Select>
            </div>
            <b className={clsx('wp-num', g.perVal)} style={{ color: 'var(--txt3)' }} data-testid="period2-total">{rp(p2Total)}</b>
          </div>
        </div>
        {mperiodPct !== null && (
          <div className={clsx(g.pdiff, mperiodPct >= 0 ? g.up : g.dn2)} data-testid="period-diff">
            {mperiodPct >= 0 ? <TrendUp size={16} aria-hidden="true" /> : <TrendDown size={16} aria-hidden="true" />}
            {Math.abs(mperiodPct)}% {t('grafik.diff')}
          </div>
        )}
        <ChartFrame label={t('grafik.twoperiod')} height={170}><Bar data={twoPeriod} options={opts as never} /></ChartFrame>
      </ChartCard></Vis>
    </>
  );
}
