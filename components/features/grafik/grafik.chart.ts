// ══════════════════════════════════════════
// components/features/grafik/grafik.chart.ts — opsi Chart.js layar Grafik (REDESAIN T9)
// Produksi tetap react-chartjs-2 (prototype T4 menggambar SVG sendiri: yang ditiru hanya tampilan dan label sumbu
// ringkas). Warna kanvas tidak bisa memakai var(--…), jadi sumber warna = lib/design-tokens.ts (chartTheme + konstanta
// token), bukan hex di file layar. Sumbu memakai angka ringkas (jt/rb); nilai penuh "Rp …" muncul di tooltip.
// ══════════════════════════════════════════
import type { ChartOptions, TooltipItem } from 'chart.js';
import { chartTheme } from '@/lib/design-tokens';
import { rp } from '@/lib/helpers';
import { compactRp } from './grafik.logic';

export type ChartThemeName = 'dark' | 'light' | 'gold';
export type ChartPalette = ReturnType<typeof chartTheme>;
export type ValueKind = 'rp' | 'count';

export const paletteFor = (theme: ChartThemeName): ChartPalette => chartTheme(theme !== 'light', theme);

const MONO = 'JetBrains Mono';

/** Opsi dasar untuk grafik batang/garis. `kind='rp'`: nilai rupiah (ribuan); `kind='count'`: bilangan bulat. */
export function cartesianOptions(p: ChartPalette, kind: ValueKind, lang: 'id' | 'en', legend = false): ChartOptions<'bar' | 'line'> {
  const fmt = (v: number) => (kind === 'rp' ? rp(v) : String(v));
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legend
        ? { display: true, labels: { color: p.legendColor, font: { family: MONO, size: 10 }, boxWidth: 10, padding: 14 } }
        : { display: false },
      tooltip: {
        backgroundColor: p.tooltipBg, borderColor: p.tooltipBorder, borderWidth: 1,
        titleColor: p.titleColor, bodyColor: p.bodyColor, padding: 10, cornerRadius: 8,
        callbacks: {
          label: (ctx: TooltipItem<'bar' | 'line'>) => {
            const prefix = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
            return `${prefix}${fmt(ctx.raw as number)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: p.gridColor }, ticks: { color: p.tickColor, font: { family: MONO, size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: p.gridColor },
        ticks: {
          color: p.tickColor, font: { family: MONO, size: 10 },
          ...(kind === 'count' ? { precision: 0 } : {}),
          callback: (v: string | number) => (kind === 'rp' ? compactRp(Number(v), lang) : String(v)),
        },
      },
    },
  };
}

/** Opsi donat komposisi status: legenda dirender di luar kanvas (daftar di kartu), jadi legend dimatikan. */
export function donutOptions(p: ChartPalette): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: p.tooltipBg, borderColor: p.tooltipBorder, borderWidth: 1,
        titleColor: p.titleColor, bodyColor: p.bodyColor,
        callbacks: { label: (ctx: TooltipItem<'doughnut'>) => `${ctx.label}: ${ctx.raw}` },
      },
    },
  };
}
