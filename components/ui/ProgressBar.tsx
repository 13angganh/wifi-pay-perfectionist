// components/ui/ProgressBar.tsx — bar progres tipis (.bar) + persen perubahan (.pct)
'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from '@phosphor-icons/react';
import { clsx } from 'clsx';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** nama aksesibel, mis. "Progres pembayaran" */
  label: string;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, label, color, className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={clsx('wp-bar', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <i style={{ width: `${v}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

/** Persen perubahan: hijau naik, merah turun, abu-abu nol. `invert` membalik makna (mis. tunggakan naik = buruk). */
export function DeltaPct({ value, invert, suffix = '%', className }: { value: number; invert?: boolean; suffix?: string; className?: string }) {
  const up = value > 0, down = value < 0;
  const good = invert ? down : up;
  const tone = value === 0 ? 'n' : good ? 'g' : 'b';
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const sign = up ? '+' : '';
  return (
    <span className={clsx('wp-pct', `wp-pct--${tone}`, className)}>
      <Icon size={12} weight="bold" aria-hidden="true" />
      {sign}{value}{suffix}
    </span>
  );
}

export default ProgressBar;
