// ══════════════════════════════════════════
// components/features/grafik/GrafikView.Counts.tsx — tab Pembayaran dan Pelanggan (REDESAIN T9, A24–A26)
// Pembayaran: KPI Transaksi (A25) + Komposisi donat lunas/belum/gratis (zip) + Transaksi per Bulan.
// Pelanggan:  pilih bulan + KPI Pelanggan Aktif (A26) + Pelanggan Aktif per Bulan.
// Bulan terpilih dibagi dua tab (state di GrafikView). Semua dihitung dari getPay/isFree/isLunas.
// ══════════════════════════════════════════
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { Bar, Doughnut } from 'react-chartjs-2';
import { C_BELUM, C_FREE, C_LUNAS } from '@/lib/design-tokens';
import { calcPctDelta } from '@/lib/payment';
import { useT } from '@/hooks/useT';
import { KpiGrid } from '@/components/ui/KpiCard';
import { cartesianOptions, donutOptions } from './grafik.chart';
import {
  activeCustomerCount, memberCount, prevMonthOf, series12, statusBreakdown, transactionCount, withAlpha,
} from './grafik.logic';
import { ChartCard, ChartFrame, Kpi, type GrafikCtx } from './GrafikView.Parts';
import g from './grafik.module.css';

interface Props {
  ctx: GrafikCtx;
  kind: 'pay' | 'cust';
  month: number;
}

export default function CountsTab({ ctx, kind, month }: Props) {
  const t = useT();
  const { data, zones, activeZone, color, year, lang, monthNames, palette } = ctx;
  const pay = kind === 'pay';

  const count = (y: number, m: number) => (pay ? transactionCount(data, zones, y, m) : activeCustomerCount(data, zones, y, m));
  const cur = count(year, month);
  const pm = prevMonthOf(year, month);
  const delta = calcPctDelta(cur, count(pm.year, pm.month));
  const ser = series12(m => count(year, m));
  const seriesTotal = ser.reduce((a, b) => a + b, 0);
  const total = memberCount(data, zones);

  const title = pay ? t('grafik.txPerMonth') : t('grafik.activePerMonth');
  const bars = {
    labels: monthNames.map(m => m.slice(0, 3)),
    datasets: [{ data: ser, backgroundColor: ser.map(() => withAlpha(color, 0.5)), borderColor: ser.map(() => color), borderWidth: 2, borderRadius: 5 }],
  };

  const st = statusBreakdown(data, zones, year, month);
  const slices = [
    { label: t('status.lunas'), n: st.lunas, c: C_LUNAS, css: 'var(--c-lunas)' },
    { label: t('status.belum'), n: st.belum, c: C_BELUM, css: 'var(--c-belum)' },
    { label: t('status.free'),  n: st.free,  c: C_FREE,  css: 'var(--c-free)' },
  ];
  const donut = {
    labels: slices.map(s => s.label),
    datasets: [{ data: slices.map(s => s.n), backgroundColor: slices.map(s => withAlpha(s.c, 0.5)), borderColor: slices.map(s => s.c), borderWidth: 2 }],
  };

  return (
    <>
<Vis screen="grafik" id="ckpi">      <KpiGrid>
        <Kpi
          label={`${pay ? t('grafik.transactions') : t('grafik.activeCustomers')} · ${monthNames[month]} ${year}`}
          value={cur}
          color={color}
          delta={delta}
          caption={t('grafik.vsPrevMonth')}
        />
        <Kpi
          label={pay ? t('grafik.txHint') : t('grafik.totalCustomers')}
          value={pay ? seriesTotal : total}
          caption={pay ? `${t('common.year')} ${year}` : t('grafik.registered')}
        />
      </KpiGrid></Vis>

      {pay && (
<Vis screen="grafik" id="composition">        <ChartCard testId="chart-composition" title={`${t('grafik.composition')} ${activeZone}`}>
          <div className={g.stt}>
            {slices.map(s => (
              <div key={s.label} className={g.sttIt}>
                <span className="wp-t-micro">{s.label}</span>
                <b className={`wp-num ${g.sttN}`} style={{ color: s.css }}>{s.n}</b>
              </div>
            ))}
          </div>
          <div className={g.dn}>
            <div className={g.dnCv}>
              <ChartFrame label={`${t('grafik.composition')} ${activeZone}`} height={150}>
                <Doughnut data={donut} options={donutOptions(palette)} />
              </ChartFrame>
            </div>
            <div className={g.dnl}>
              {slices.map(s => (
                <div key={s.label} className={g.dnlIt}>
                  <i className={g.dnlSw} style={{ background: s.css }} />
                  <b>{s.label}</b>
                  <span className="wp-num">{s.n}</span>
                  <span className="wp-t-micro">{st.total ? Math.round((s.n / st.total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard></Vis>
      )}

<Vis screen="grafik" id="counts">      <ChartCard testId="chart-counts" title={`${title} ${year} · ${activeZone}`}>
        <ChartFrame label={title}><Bar data={bars} options={cartesianOptions(palette, 'count', lang) as never} /></ChartFrame>
      </ChartCard></Vis>
    </>
  );
}
