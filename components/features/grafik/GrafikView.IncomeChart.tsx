// ══════════════════════════════════════════
// components/features/grafik/GrafikView.IncomeChart.tsx
// Dipecah dari GrafikView.tsx (task 1.15)
// Chart bulanan + proyeksi + tahunan + stat cards
// ══════════════════════════════════════════
'use client';

import { Bar, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { rp } from '@/lib/helpers';
import { getYears } from '@/lib/constants';
import { buildBaseOptions } from '@/lib/chartConfigs';
import type { ChartThemeConfig } from '@/lib/chartConfigs';

interface Props {
  mData:        number[];
  yData:        number[];
  mTotal:       number;
  mAvg:         number;
  proyeksi:     number;
  prevYTotal:   number;
  curYPct:      number | null;
  selYear:      number;
  activeZone:   string;
  zc:           string;
  MONTH_NAMES:  string[];
  cfg:          ChartThemeConfig;
}

function PctBadge({ pct }: { pct: number | null }) {
  if (!pct) return null;
  return (
    <span style={{ fontSize:10, fontWeight:600, color: pct >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', marginLeft:6, display:'inline-flex', alignItems:'center', gap:2 }}>
      {pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

export default function IncomeChart({ mData, yData, mTotal, mAvg, proyeksi, prevYTotal, curYPct, selYear, activeZone, zc, MONTH_NAMES, cfg }: Props) {
  const t = useT();

  const nextMonthIdx   = (new Date().getMonth() + 1) % 12;
  const nextMonthLabel = MONTH_NAMES[nextMonthIdx];
  const last3          = mData.slice(0, new Date().getMonth() + 1).filter(v => v > 0).slice(-3);

  const baseOptions = buildBaseOptions(cfg);

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

  const yearlyData = {
    labels: getYears().map(String),
    datasets: [{
      data: yData,
      borderColor: zc, backgroundColor: zc + '18',
      borderWidth: 2, tension: 0.4, fill: true,
      pointBackgroundColor: zc, pointRadius: 4, pointBorderColor: 'transparent',
    }],
  };

  return (
    <>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4, fontFamily:"var(--font-sans),sans-serif" }}>
            {t('common.total').toUpperCase()} {selYear}<PctBadge pct={curYPct} />
          </div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:15, fontWeight:800, color:zc }}>{rp(mTotal)}</div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{t('grafik.avgMonth')}: {rp(mAvg)}</div>
        </div>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4, fontFamily:"var(--font-sans),sans-serif" }}>{t('grafik.vsLastYear').toUpperCase()}<PctBadge pct={curYPct} /></div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:15, fontWeight:800, color:'var(--txt2)' }}>{rp(prevYTotal)}</div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{t('common.year')} {selYear - 1}</div>
        </div>
      </div>

      {/* Chart bulanan */}
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Bar data={monthlyData} options={baseOptions as any} />
        </div>
      </div>

      {/* Chart tahunan */}
      <div className="chart-box">
        <div className="chart-title">{t('grafik.yearly').toUpperCase()} · {activeZone}</div>
        <div className="chart-wrap">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Line data={yearlyData} options={baseOptions as any} />
        </div>
      </div>

      {/* Card proyeksi */}
      {proyeksi > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'var(--r-md)', padding:14, marginBottom:12, boxShadow:'var(--shadow-xs)' }}>
          <div style={{ fontSize:9, color:'rgba(34,197,94,0.7)', letterSpacing:'.07em', marginBottom:6, fontFamily:"var(--font-sans),sans-serif" }}>{t('grafik.projection').toUpperCase()}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:20, fontWeight:800, color:'var(--c-lunas)' }}>{rp(proyeksi)}</div>
              <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>{nextMonthLabel} {selYear}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:'var(--txt3)' }}>{t('grafik.basedOn')}</div>
              <div style={{ fontSize:10, color:'var(--txt4)' }}>avg {last3.length} {t('grafik.lastMonths')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
