// components/ui/Badge.tsx — Primitive badge (REDESAIN T6, CORE BLOCK v3 .badge)
// Varian aging Tunggakan (baru/segera/kritis) ditambahkan sesuai serah-terima T3.
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type ReactNode } from 'react';

const badgeVariants = cva('wp-badge', {
  variants: {
    variant: {
      lunas:   'wp-badge--lunas',
      belum:   'wp-badge--belum',
      free:    'wp-badge--free',
      zone:    'wp-badge--zone',
      neutral: '',
      warning: 'wp-badge--warn',
      warn:    'wp-badge--warn',
      baru:    'wp-badge--baru',
      segera:  'wp-badge--segera',
      kritis:  'wp-badge--kritis',
    },
    size: {
      xs: 'wp-badge--xs',
      sm: '',
      md: 'wp-badge--md',
      lg: 'wp-badge--md',
    },
  },
  defaultVariants: { variant: 'neutral', size: 'sm' },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  color?: string; // Hex kustom — menimpa warna varian (badge zona dinamis)
}

export function Badge({ variant, size, children, className, color }: BadgeProps) {
  return (
    <span
      className={clsx(badgeVariants({ variant, size }), className)}
      style={color ? { background: `color-mix(in srgb, ${color} 16%, transparent)`, color } : undefined}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
export default Badge;
