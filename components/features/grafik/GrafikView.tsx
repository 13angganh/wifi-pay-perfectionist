// components/features/grafik/GrafikView.tsx — Fase 4: react-chartjs-2 npm (CDN removed)
'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { getPay, getZoneTotal, isLunas, isFree, rp } from '@/lib/helpers';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { chartTheme, ZC_KRS, ZC_SLK, ZC_TOT, zoneColor } from '@/lib/design-tokens';

// Register semua Chart.js components yang dipakai
ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler
);

export default function GrafikView() {
  const { appData, activeZone, selYear, setSelYear, theme } = useAppStore();

  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;
  const [donutMonth, setDonutMonth] = useState(new Date().getMonth());
  const [p1Year,  setP1Year]  = useState(new Date().getFullYear());
  const [p1Month, setP1Month] = useState(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1);
  const [p2Year,  setP2Year]  = useState(new Date().getFullYear() - 1);
  const [p2Month, setP2Month] = useState(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1);

  const az   = activeZone as string;
  const mems = az === 'KRS' ? appData.krsMembers : az === 'SLK' ? appData.slkMembers : [...appData.krsMembers, ...appData.slkMembers];

  const zc    = zoneColor(az);
  const zcKRS = ZC_KRS;
  const zcSLK = ZC_SLK;
  const zcTOT = ZC_TOT;

  const mData = MONTHS.map((_, mi) =>
    activeZone === 'TOTAL'
      ? getZoneTotal(appData, 'KRS', selYear, mi) + getZoneTotal(appData, 'SLK', selYear, mi)
      : mems.reduce((s, m) => s + (getPay(appData, activeZone, m, selYear, mi) || 0), 0)
  );
  const yData = getYears().map(y =>
    activeZone === 'TOTAL'
      ? MONTHS.reduce((s, _, mi) => s + getZoneTotal(appData, 'KRS', y, mi) + getZoneTotal(appData, 'SLK', y, mi), 0)
      : MONTHS.reduce((s, _, mi) => s + mems.reduce((ss, m) => ss + (getPay(appData, activeZone, m, y, mi) || 0), 0), 0)
  );

  const mNonZero   = mData.filter(v => v > 0);
  const mAvg       = mNonZero.length ? Math.round(mNonZero.reduce((a, b) => a + b, 0) / mNonZero.length) : 0;
  const mTotal     = mData.reduce((a, b) => a + b, 0);
  const curYi      = getYears().indexOf(selYear);
  const curYPct    = curYi > 0 && yData[curYi - 1] ? Math.round(((yData[curYi] - yData[curYi - 1]) / yData[curYi - 1]) * 100) : null;
  const prevYTotal = curYi > 0 ? yData[curYi - 1] : 0;

  const last3          = mData.slice(0, new Date().getMonth() + 1).filter(v => v > 0).slice(-3);
  const proyeksi       = last3.length ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length) : 0;
  const nextMonthIdx   = (new Date().getMonth() + 1) % 12;
  const nextMonthLabel = MONTH_NAMES[nextMonthIdx];

  function getDonutData(zone: string, year: number, month: number) {
    const zoneMems = zone === 'KRS' ? appData.krsMembers : appData.slkMembers;
    let lunas = 0, belum = 0, free = 0;
    for (const m of zoneMems) {
      if (isFree(appData, zone, m, year, month))       free++;
      else if (isLunas(appData, zone, m, year, month)) lunas++;
      else                                              belum++;
    }
    return { lunas, belum, free, total: zoneMems.length };
  }

  const p1Total    = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, p1Year, p1Month) || 0), 0);
  const p2Total    = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, p2Year, p2Month) || 0), 0);
  const mperiodPct = p2Total > 0 ? Math.round(((p1Total - p2Total) / p2Total) * 100) : null;

  // ── Chart theming ──
  const { gridColor, tickColor, legendColor, tooltipBg, tooltipBorder, titleColor, bodyColor } = chartTheme(theme !== 'light');

  const baseScales = {
    x: {
      grid: { color: gridColor },
      ticks: { color: tickColor, font: { family: 'DM Mono', size: 10 } },
    },
    y: {
      grid: { color: gridColor },
      ticks: {
        color: tickColor,
        font: { family: 'DM Mono', size: 10 },
        callback: (v: string | number) => 'Rp ' + (Number(v) * 1000).toLocaleString('id-ID'),
      },
    },
  };

  const baseTooltip = {
    backgroundColor: tooltipBg,
    borderColor: tooltipBorder,
    borderWidth: 1,
    titleColor,
    bodyColor,
    padding: 10,
    cornerRadius: 8,
    callbacks: {
      label: (ctx: any) => `Rp ${(ctx.raw * 1000).toLocaleString('id-ID')}`,
    },
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: baseTooltip },
    scales: baseScales,
  };

  // Chart 1: Bulanan + proyeksi
  const monthlyData = {
    labels: [...MONTH_NAMES.map(m => m.slice(0, 3)), `${nextMonthLabel.slice(0, 3)}*`],
    datasets: [{
      data: [...mData, proyeksi],
      backgroundColor: [...mData.map(() => zc + '80'), '#22C55E40'],
      borderColor: [...mData.map(() => zc), '#22C55E'],
      borderWidth: 2,
      borderRadius: 5,
    }],
  };

  // Chart 2: Tahunan
  const yearlyData = {
    labels: getYears().map(String),
    datasets: [{
      data: yData,
      borderColor: zc, backgroundColor: zc + '18',
      borderWidth: 2, tension: 0.4, fill: true,
      pointBackgroundColor: zc, pointRadius: 4, pointBorderColor: 'transparent',
    }],
  };

  // Chart 3: KRS vs SLK compare
  const kData = MONTHS.map((_, mi) => getZoneTotal(appData, 'KRS', selYear, mi));
  const sData = MONTHS.map((_, mi) => getZoneTotal(appData, 'SLK', selYear, mi));
  const tData = MONTHS.map((_, mi) => kData[mi] + sData[mi]);
  const compareData = {
    labels: MONTH_NAMES.map(m => m.slice(0, 3)),
    datasets: [
      { label: 'KRS',   data: kData, borderColor: zcKRS, backgroundColor: zcKRS + '15', borderWidth: 2, tension: 0.4, fill: false, pointBackgroundColor: zcKRS, pointRadius: 3, pointBorderColor: 'transparent' },
      { label: 'SLK',   data: sData, borderColor: zcSLK, backgroundColor: zcSLK + '15', borderWidth: 2, tension: 0.4, fill: false, pointBackgroundColor: zcSLK, pointRadius: 3, pointBorderColor: 'transparent' },
      { label: 'TOTAL', data: tData, borderColor: zcTOT, backgroundColor: zcTOT + '15', borderWidth: 2, tension: 0.4, fill: false, pointBackgroundColor: zcTOT, pointRadius: 3, pointBorderColor: 'transparent', borderDash: [4, 3] },
    ],
  };
  const compareOptions = {
    ...baseOptions,
    plugins: {
      legend: {
        display: true,
        labels: { color: legendColor, font: { family: 'DM Mono', size: 10 }, boxWidth: 10, padding: 14 },
      },
      tooltip: baseTooltip,
    },
  };

  // Chart 4: Donut
  const donutZone = activeZone === 'TOTAL' ? 'KRS' : activeZone;
  const donutStat = getDonutData(donutZone, selYear, donutMonth);
  const donutChartData = {
    labels: [t('status.lunas'), t('status.belum'), t('status.free')],
    datasets: [{
      data: [donutStat.lunas, donutStat.belum, donutStat.free],
      backgroundColor: ['#22C55E80', '#EF444480', '#3B82F680'],
      borderColor: ['#22C55E', '#EF4444', '#3B82F6'],
      borderWidth: 2,
    }],
  };
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'bottom' as const,
        labels: { color: tickColor, font: { family: 'DM Mono', size: 10 }, padding: 12, boxWidth: 10 },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw}` },
      },
    },
    cutout: '68%',
  };

  // Chart 5: Dua periode
  const lbl1 = `${MONTH_NAMES[p1Month].slice(0, 3)} ${p1Year}`;
  const lbl2 = `${MONTH_NAMES[p2Month].slice(0, 3)} ${p2Year}`;
  const mperiodChartData = {
    labels: [lbl1, lbl2],
    datasets: [{
      data: [p1Total, p2Total],
      backgroundColor: [zc + '80', 'rgba(161,168,193,0.3)'],
      borderColor: [zc, '#A1A8C1'],
      borderWidth: 2,
      borderRadius: 6,
    }],
  };
  const mperiodOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        callbacks: { label: (ctx: any) => `Rp ${(ctx.raw * 1000).toLocaleString('id-ID')}` },
      },
    },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'DM Mono', size: 11 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'DM Mono', size: 10 }, callback: (v: string | number) => 'Rp ' + (Number(v) * 1000).toLocaleString('id-ID') } },
    },
  };

  function PctBadge({ pct }: { pct: number | null }) {
    if (!pct) return null;
    return (
      <span style={{ fontSize:10, fontWeight:600, color: pct >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', marginLeft:6, display:'inline-flex', alignItems:'center', gap:2 }}>
        {pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {Math.abs(pct)}%
      </span>
    );
  }

  const selStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    padding:'6px 10px', borderRadius:'var(--r-sm)', fontSize:11, flex:1,
  };

  return (
    <div>
      {/* Controls */}
      <div className="ctrl-row" style={{ justifyContent:'space-between', alignItems:'center' }}>
        <select className="cs" value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4, fontFamily:"'DM Sans',sans-serif" }}>
            {t('common.total').toUpperCase()} {selYear}<PctBadge pct={curYPct} />
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:zc }}>{rp(mTotal)}</div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{t('grafik.avgMonth')}: {rp(mAvg)}</div>
        </div>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4, fontFamily:"'DM Sans',sans-serif" }}>{t('grafik.vsLastYear').toUpperCase()}<PctBadge pct={curYPct} /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:'var(--txt2)' }}>{rp(prevYTotal)}</div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{t('common.year')} {selYear - 1}</div>
        </div>
      </div>

      {/* Chart 1: Bulanan + proyeksi */}
      <div className="chart-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div className="chart-title" style={{ margin:0 }}>{t('grafik.monthly').toUpperCase()} {selYear} · {activeZone}</div>
          {proyeksi > 0 && (
            <div style={{ fontSize:9, color:'var(--c-lunas)', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:8, height:8, background:'#22C55E40', border:'1px solid #22C55E', borderRadius:2, display:'inline-block' }} />
              {nextMonthLabel.slice(0, 3)}* {t('grafik.proj')}
            </div>
          )}
        </div>
        <div className="chart-wrap">
          <Bar data={monthlyData} options={baseOptions as any} />
        </div>
      </div>

      {/* Chart 2: KRS vs SLK */}
      <div className="chart-box">
        <div className="chart-title">KRS vs SLK {selYear}</div>
        <div className="chart-wrap">
          <Line data={compareData} options={compareOptions as any} />
        </div>
      </div>

      {/* Chart 3: Donut lunas/belum/free */}
      <div className="chart-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div className="chart-title" style={{ margin:0 }}>{t('grafik.composition').toUpperCase()} {donutZone}</div>
          <select style={{ ...selStyle, flex:'none', width:'auto', fontSize:10 }} value={donutMonth} onChange={e => setDonutMonth(+e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {[
            { label: t('status.lunas'), val: donutStat.lunas, color:'var(--c-lunas)' },
            { label: t('status.belum'), val: donutStat.belum, color:'var(--c-belum)' },
            { label: t('status.free'),  val: donutStat.free,  color:'var(--c-free)' },
          ].map(d => (
            <div key={d.label} style={{ flex:1, textAlign:'center', background:'var(--bg3)', borderRadius:'var(--r-sm)', padding:'8px 4px', border:`1px solid ${d.color}22` }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:d.color }}>{d.val}</div>
              <div style={{ fontSize:9, color:'var(--txt4)', marginTop:2 }}>{d.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position:'relative', height:180 }}>
          <Doughnut data={donutChartData} options={donutOptions} />
        </div>
      </div>

      {/* Chart 4: Tahunan */}
      <div className="chart-box">
        <div className="chart-title">{t('grafik.yearly').toUpperCase()} · {activeZone}</div>
        <div className="chart-wrap">
          <Line data={yearlyData} options={baseOptions as any} />
        </div>
      </div>

      {/* Card proyeksi */}
      {proyeksi > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--r-md)', padding:14, marginBottom:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'rgba(34,197,94,0.7)', letterSpacing:'.07em', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{t('grafik.projection').toUpperCase()}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'var(--c-lunas)' }}>{rp(proyeksi)}</div>
              <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{nextMonthLabel} {selYear}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:'var(--txt3)' }}>{t('grafik.basedOn')}</div>
              <div style={{ fontSize:10, color:'var(--txt4)' }}>avg {last3.length} {t('grafik.lastMonths')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart 5: Dua periode */}
      <div className="chart-box">
        <div className="chart-title" style={{ marginBottom:12 }}>{t('grafik.twoperiod').toUpperCase()}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:9, color:'var(--zc)', letterSpacing:'.06em', marginBottom:6 }}>{t('grafik.period1').toUpperCase()}</div>
            <div style={{ display:'flex', gap:5 }}>
              <select style={selStyle} value={p1Year}  onChange={e => setP1Year(+e.target.value)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select style={selStyle} value={p1Month} onChange={e => setP1Month(+e.target.value)}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
              </select>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:'var(--zc)', marginTop:6 }}>{rp(p1Total)}</div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:6 }}>{t('grafik.period2').toUpperCase()}</div>
            <div style={{ display:'flex', gap:5 }}>
              <select style={selStyle} value={p2Year}  onChange={e => setP2Year(+e.target.value)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select style={selStyle} value={p2Month} onChange={e => setP2Month(+e.target.value)}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
              </select>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:'var(--txt3)', marginTop:6 }}>{rp(p2Total)}</div>
          </div>
        </div>
        {mperiodPct !== null && (
          <div style={{ textAlign:'center', padding:'6px 0', marginBottom:10, fontSize:12, fontWeight:700, color: mperiodPct >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {mperiodPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(mperiodPct)}% {t('grafik.diff')}
          </div>
        )}
        <div style={{ position:'relative', height:160 }}>
          <Bar data={mperiodChartData} options={mperiodOptions as any} />
        </div>
      </div>
    </div>
  );
}
