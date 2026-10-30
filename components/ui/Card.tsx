// components/ui/Card.tsx — Primitive card (REDESAIN T6, CORE BLOCK v3 .card)
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type HTMLAttributes } from 'react';

const cardVariants = cva('wp-card', {
  variants: {
    variant: {
      default:  '',
      elevated: 'wp-card--elevated',
      bordered: 'wp-card--bordered',
      flat:     'wp-card--flat',
      zone:     'wp-card--zone',
      hl:       'wp-card--hl',
    },
    padding: {
      none: 'wp-card--p0',
      sm:   'wp-card--p1',
      md:   'wp-card--p2',
      lg:   'wp-card--p3',
    },
    interactive: {
      true:  'wp-card--interactive',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', padding: 'md', interactive: false },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ variant, padding, interactive, className, children, ...props }: CardProps) {
  return (
    <div className={clsx(cardVariants({ variant, padding, interactive }), className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('wp-t-head', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('', className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]', className)} {...props}>
      {children}
    </div>
  );
}

export { cardVariants };
export default Card;
