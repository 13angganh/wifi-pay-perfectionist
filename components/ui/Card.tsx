// components/ui/Card.tsx — Primitive card dengan CVA variants
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type ReactNode, type HTMLAttributes } from 'react';

const cardVariants = cva(
  'rounded-[var(--r-md)] transition-all duration-[var(--t-fast)] ease-[var(--ease-out)]',
  {
    variants: {
      variant: {
        default:  'bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)]',
        elevated: 'bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-md)]',
        bordered: 'bg-[var(--bg2)] border-2 border-[var(--border)]',
        flat:     'bg-[var(--bg3)]',
        zone:     'bg-[var(--card)] border border-[var(--zc)]44 shadow-[0_0_0_1px_var(--zcdim)]',
      },
      padding: {
        none: '',
        sm:   'p-3',
        md:   'p-4',
        lg:   'p-5',
      },
      interactive: {
        true:  'cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--border2)] active:scale-[0.99]',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', padding: 'md', interactive: false },
  }
);

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
    <h3 className={clsx('text-[var(--fs-heading)] font-semibold text-[var(--txt)]', className)} {...props}>
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
