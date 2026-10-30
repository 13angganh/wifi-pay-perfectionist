// ══════════════════════════════════════════
// components/features/grafik/GrafikView.Parts.tsx — bagian bersama layar Grafik (REDESAIN T9)
// Kartu KPI (label + persen), kartu grafik (judul + legenda), bingkai kanvas beraria, dan konteks hitung yang
// dioper GrafikView ke tiap tab. Registrasi komponen Chart.js dilakukan SEKALI di sini (semua tab mengimpor file ini).
// ══════════════════════════════════════════
'use client';

import type { ReactNode } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend as ChartLegend, Filler,
} from 'chart.js';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { DeltaPct } from '@/components/ui/ProgressBar';
import type { AppData, CustomZone } from '@/types';
import type { ChartPalette } from './grafik.chart';
import g from './grafik.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, ChartLegend, Filler);

/** Semua yang dibutuhkan tab untuk menghitung dan menggambar. */
export interface GrafikCtx {
  data: AppData;
  /** zona yang dihitung (TOTAL = semua zona aktif) */
  zones: string[];
  /** SEMUA zona aktif (bawaan + kustom tampil): dasar grafik perbandingan zona + TOTAL, tidak bergantung zona terpilih */
  allZones: string[];
  activeZone: string;
  /** warna hex zona aktif (kanvas tidak bisa memakai var(--…)) */
  color: string;
  customZones: CustomZone[];
  year: number;
  lang: 'id' | 'en';
  monthNames: string[];
  palette: ChartPalette;
  /** bulan kalender sekarang (0–11), dasar proyeksi */
  nowMonth: number;
}

/** Kartu angka. `delta` (persen) ditampilkan di samping label bila bukan 0/null (perilaku zip: GrafikPctBadge). */
export function Kpi({ label, value, caption, color, delta }: {
  label: string; value: ReactNode; caption?: ReactNode; color?: string; delta?: number | null;
}) {
  return (
    <Card padding="sm" className="wp-kpi">
      <span className={clsx('wp-t-label', g.kl)}>{label}{delta ? <DeltaPct value={delta} /> : null}</span>
      <span className="wp-kpi__v" style={color ? { color } : undefined}>{value}</span>
      {caption && <span className="wp-t-cap">{caption}</span>}
    </Card>
  );
}

export function ChartCard({ title, legend, children, testId, className }: {
  title: string; legend?: ReactNode; children: ReactNode; testId?: string; className?: string;
}) {
  return (
    <Card padding="sm" className={clsx(g.chc, className)} data-testid={testId}>
      <div className={g.chh}>
        <span className="wp-t-label">{title}</span>
        {legend}
      </div>
      {children}
    </Card>
  );
}

/** Bingkai kanvas: ukuran tetap + nama aksesibel (kanvas tidak punya teks sendiri). */
export function ChartFrame({ label, height = 180, children }: { label: string; height?: number; children: ReactNode }) {
  return <div className={g.frame} role="img" aria-label={label} style={{ height }}>{children}</div>;
}

export function Legend({ items }: { items: { label: string; color: string; outline?: string }[] }) {
  return (
    <span className={g.lgd}>
      {items.map(it => (
        <span key={it.label} className={g.lgdIt}>
          <i className={g.lgdSw} style={{ background: it.color, ...(it.outline ? { border: `1px solid ${it.outline}` } : {}) }} />{it.label}
        </span>
      ))}
    </span>
  );
}
