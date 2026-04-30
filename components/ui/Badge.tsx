// components/ui/Badge.tsx — Primitive badge dengan CVA variants
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type ReactNode } from 'react';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 font-semibold leading-none rounded-[var(--r-full)] whitespace-nowrap',
  {
    variants: {
      variant: {
        lunas:   'bg-[#22C55E22] text-[var(--c-lunas)] border border-[#22C55E33]',
        belum:   'bg-[#EF444422] text-[var(--c-belum)] border border-[#EF444433]',
        free:    'bg-[#3B82F622] text-[var(--c-free)]  border border-[#3B82F633]',
        zone:    'bg-[var(--zcdim)] text-[var(--zc)] border border-[var(--zc)]33',
        neutral: 'bg-[var(--bg3)] text-[var(--txt2)] border border-[var(--border)]',
        warning: 'bg-[#F9731622] text-[#F97316] border border-[#F9731633]',
      },
      size: {
        xs: 'px-1.5 h-4 text-[var(--fs-micro)]',
        sm: 'px-2 h-5 text-[var(--fs-label)]',
        md: 'px-2.5 h-6 text-[var(--fs-caption)]',
        lg: 'px-3 h-7 text-[var(--fs-body)]',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  color?: string; // Custom hex color — overrides variant color for dynamic zone badges
}

export function Badge({ variant, size, children, className, color }: BadgeProps) {
  return (
    <span
      className={clsx(badgeVariants({ variant, size }), className)}
      style={color ? { backgroundColor: color + '22', color, borderColor: color + '33' } : undefined}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
export default Badge;
