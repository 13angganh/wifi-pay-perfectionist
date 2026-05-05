// ══════════════════════════════════════════
// lib/chartConfigs.ts — Chart.js config builders
// Dipecah dari GrafikView.tsx (task 1.15)
// any justified: react-chartjs-2 tidak expose TooltipItem.raw sebagai typed generic
// ══════════════════════════════════════════

import { chartTheme } from './design-tokens';

export interface ChartThemeConfig {
  gridColor: string;
  tickColor: string;
  legendColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  titleColor: string;
  bodyColor: string;
}

export function getChartTheme(isDark: boolean): ChartThemeConfig {
  return chartTheme(isDark);
}

/** Alias untuk getChartTheme — nama lebih eksplisit untuk sub-komponen */
export const buildChartTheme = getChartTheme;

export function buildBaseScales(cfg: ChartThemeConfig) {
  return {
    x: {
      grid: { color: cfg.gridColor },
      ticks: { color: cfg.tickColor, font: { family: 'DM Mono', size: 10 } },
    },
    y: {
      grid: { color: cfg.gridColor },
      ticks: {
        color: cfg.tickColor,
        font: { family: 'DM Mono', size: 10 },
        callback: (v: string | number) => 'Rp ' + (Number(v) * 1000).toLocaleString('id-ID'),
      },
    },
  };
}

export function buildBaseTooltip(cfg: ChartThemeConfig) {
  return {
    backgroundColor: cfg.tooltipBg,
    borderColor: cfg.tooltipBorder,
    borderWidth: 1,
    titleColor: cfg.titleColor,
    bodyColor: cfg.bodyColor,
    padding: 10,
    cornerRadius: 8,
    callbacks: {
      // Chart.js TooltipItem — any justified: no public typed generic for raw
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: (ctx: any) => `Rp ${(ctx.raw * 1000).toLocaleString('id-ID')}`,
    },
  };
}

export function buildBaseOptions(cfg: ChartThemeConfig) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: buildBaseTooltip(cfg) },
    scales: buildBaseScales(cfg),
  };
}

export function buildDonutOptions(cfg: ChartThemeConfig) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: cfg.tickColor, font: { family: 'DM Mono', size: 10 }, padding: 12, boxWidth: 10 },
      },
      tooltip: {
        backgroundColor: cfg.tooltipBg,
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw}` },
      },
    },
    cutout: '68%',
  };
}

export function buildCompareOptions(cfg: ChartThemeConfig) {
  return {
    ...buildBaseOptions(cfg),
    plugins: {
      legend: {
        display: true,
        labels: { color: cfg.legendColor, font: { family: 'DM Mono', size: 10 }, boxWidth: 10, padding: 14 },
      },
      tooltip: buildBaseTooltip(cfg),
    },
  };
}

export function buildMperiodOptions(cfg: ChartThemeConfig) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cfg.tooltipBg,
        borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: { label: (ctx: any) => `Rp ${(ctx.raw * 1000).toLocaleString('id-ID')}` },
      },
    },
    scales: {
      x: { grid: { color: cfg.gridColor }, ticks: { color: cfg.tickColor, font: { family: 'DM Mono', size: 11 } } },
      y: { grid: { color: cfg.gridColor }, ticks: { color: cfg.tickColor, font: { family: 'DM Mono', size: 10 }, callback: (v: string | number) => 'Rp ' + (Number(v) * 1000).toLocaleString('id-ID') } },
    },
  };
}
