// components/ui/Chip.tsx — FilterChip (.fchip), ZoneChip (.zchip), IdChip (.idc)
'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export function FilterChips({ children, ariaLabel, className }: { children: ReactNode; ariaLabel?: string; className?: string }) {
  return <div className={clsx('wp-fchips', className)} role="group" aria-label={ariaLabel}>{children}</div>;
}

export interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  count?: number | string;
  /** warna aksen chip aktif (aging Tunggakan) */
  color?: string;
  children: ReactNode;
}

export function FilterChip({ active, count, color, children, className, style, type = 'button', ...props }: FilterChipProps) {
  const st = color ? ({ ...style, ['--ac' as string]: color } as CSSProperties) : style;
  return (
    <button
      type={type}
      aria-pressed={!!active}
      className={clsx('wp-fchip', color && 'wp-fchip--ag', className)}
      style={st}
      {...props}
    >
      {children}
      {count !== undefined && <i>{count}</i>}
    </button>
  );
}

/** Chip zona: warna mengikuti zona (--zc) atau `color` bila diberikan. */
export function ZoneChip({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  const st = color
    ? ({ ['--zc' as string]: color, ['--zcdim' as string]: `color-mix(in srgb, ${color} 14%, transparent)` } as CSSProperties)
    : undefined;
  return <span className={clsx('wp-zchip', className)} style={st}>{children}</span>;
}

/** Chip ID member (font mono). `muted` = tanpa ID/tidak aktif. */
export function IdChip({ children, muted, className }: { children: ReactNode; muted?: boolean; className?: string }) {
  return <span className={clsx('wp-idc', muted && 'wp-idc--no', className)}>{children}</span>;
}

export default FilterChip;
