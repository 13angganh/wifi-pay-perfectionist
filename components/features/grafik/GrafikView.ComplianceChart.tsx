// ══════════════════════════════════════════
// components/features/grafik/GrafikView.ComplianceChart.tsx
// Dipecah dari GrafikView.tsx (task 1.15)
// Donut chart lunas/belum/free per bulan
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useT } from '@/hooks/useT';
import { isLunas, isFree } from '@/lib/helpers';
import { buildDonutOptions } from '@/lib/chartConfigs';
import type { AppData } from '@/types';
import type { ChartThemeConfig } from '@/lib/chartConfigs';

interface Props {
  appData:     AppData;
  activeZone:  string;
  selYear:     number;
  MONTH_NAMES: string[];
  cfg:         ChartThemeConfig;
}

export default function ComplianceChart({ appData, activeZone, selYear, MONTH_NAMES, cfg }: Props) {
  const t = useT();
  const [donutMonth, setDonutMonth] = useState(new Date().getMonth());

  const donutZone = activeZone === 'TOTAL' ? 'KRS' : activeZone;
  const zoneMems  = donutZone === 'KRS' ? appData.krsMembers : appData.slkMembers;

  let lunas = 0, belum = 0, free = 0;
  for (const m of zoneMems) {
    if (isFree(appData, donutZone, m, selYear, donutMonth))        free++;
    else if (isLunas(appData, donutZone, m, selYear, donutMonth))  lunas++;
    else                                                            belum++;
  }

  const donutData = {
    labels: [t('status.lunas'), t('status.belum'), t('status.free')],
    datasets: [{
      data: [lunas, belum, free],
      backgroundColor: ['#22C55E80', '#EF444480', '#3B82F680'],
      borderColor: ['#22C55E', '#EF4444', '#3B82F6'],
      borderWidth: 2,
    }],
  };

  const donutOptions = buildDonutOptions(cfg);

  const selStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    padding:'6px 10px', borderRadius:'var(--r-sm)', fontSize:10, flex:'none', width:'auto',
  };

  return (
    <div className="chart-box">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div className="chart-title" style={{ margin:0 }}>{t('grafik.composition').toUpperCase()} {donutZone}</div>
        <select style={selStyle} value={donutMonth} onChange={e => setDonutMonth(+e.target.value)}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m.slice(0, 3)}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        {[
          { label: t('status.lunas'), val: lunas, color:'var(--c-lunas)' },
          { label: t('status.belum'), val: belum, color:'var(--c-belum)' },
          { label: t('status.free'),  val: free,  color:'var(--c-free)' },
        ].map(d => (
          <div key={d.label} style={{ flex:1, textAlign:'center', background:'var(--bg3)', borderRadius:'var(--r-sm)', padding:'8px 4px', border:`1px solid ${d.color}22` }}>
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:20, fontWeight:800, color:d.color }}>{d.val}</div>
            <div style={{ fontSize:9, color:'var(--txt4)', marginTop:2 }}>{d.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position:'relative', height:180 }}>
        <Doughnut data={donutData} options={donutOptions} />
      </div>
    </div>
  );
}
