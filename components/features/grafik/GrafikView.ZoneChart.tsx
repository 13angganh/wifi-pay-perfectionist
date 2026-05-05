// ══════════════════════════════════════════
// components/features/grafik/GrafikView.ZoneChart.tsx
// Dipecah dari GrafikView.tsx (task 1.15)
// KRS vs SLK line chart + dua periode bar chart
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { rp, getPay, getZoneTotal } from '@/lib/helpers';
import { MONTHS, getYears } from '@/lib/constants';
import { buildCompareOptions, buildMperiodOptions } from '@/lib/chartConfigs';
import type { AppData } from '@/types';
import type { ChartThemeConfig } from '@/lib/chartConfigs';

interface Props {
  appData:     AppData;
  activeZone:  string;
  selYear:     number;
  MONTH_NAMES: string[];
  cfg:         ChartThemeConfig;
  zcKRS:       string;
  zcSLK:       string;
  zcTOT:       string;
}

export default function ZoneChart({ appData, activeZone, selYear, MONTH_NAMES, cfg, zcKRS, zcSLK, zcTOT }: Props) {
  const t = useT();
  const now = new Date();

  const [p1Year,  setP1Year]  = useState(now.getFullYear());
  const [p1Month, setP1Month] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [p2Year,  setP2Year]  = useState(now.getFullYear() - 1);
  const [p2Month, setP2Month] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);

  const mems = activeZone === 'KRS' ? appData.krsMembers : activeZone === 'SLK' ? appData.slkMembers : [...appData.krsMembers, ...appData.slkMembers];

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

  const p1Total    = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, p1Year, p1Month) || 0), 0);
  const p2Total    = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, p2Year, p2Month) || 0), 0);
  const mperiodPct = p2Total > 0 ? Math.round(((p1Total - p2Total) / p2Total) * 100) : null;

  const lbl1 = `${MONTH_NAMES[p1Month].slice(0, 3)} ${p1Year}`;
  const lbl2 = `${MONTH_NAMES[p2Month].slice(0, 3)} ${p2Year}`;

  const zc = zcKRS; // fallback
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

  const compareOptions  = buildCompareOptions(cfg);
  const mperiodOptions  = buildMperiodOptions(cfg);

  const selStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    padding:'6px 10px', borderRadius:'var(--r-sm)', fontSize:11, flex:1,
  };

  return (
    <>
      {/* KRS vs SLK */}
      <div className="chart-box">
        <div className="chart-title">KRS vs SLK {selYear}</div>
        <div className="chart-wrap">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Line data={compareData} options={compareOptions as any} />
        </div>
      </div>

      {/* Dua periode */}
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
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:14, fontWeight:800, color:'var(--zc)', marginTop:6 }}>{rp(p1Total)}</div>
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
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:14, fontWeight:800, color:'var(--txt3)', marginTop:6 }}>{rp(p2Total)}</div>
          </div>
        </div>
        {mperiodPct !== null && (
          <div style={{ textAlign:'center', padding:'6px 0', marginBottom:10, fontSize:12, fontWeight:700, color: mperiodPct >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {mperiodPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(mperiodPct)}% {t('grafik.diff')}
          </div>
        )}
        <div style={{ position:'relative', height:160 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Bar data={mperiodChartData} options={mperiodOptions as any} />
        </div>
      </div>
    </>
  );
}
