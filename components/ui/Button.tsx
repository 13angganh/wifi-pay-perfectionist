// components/ui/Button.tsx — Primitive button dengan CVA variants
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium cursor-pointer',
    'transition-all duration-[var(--t-fast)] ease-[var(--ease-out)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zc)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:   'bg-[var(--zc)] text-white hover:opacity-90 active:scale-[0.97] shadow-[var(--shadow-xs)]',
        secondary: 'bg-[var(--bg3)] text-[var(--txt)] border border-[var(--border)] hover:bg-[var(--bg4)] active:scale-[0.97]',
        ghost:     'bg-transparent text-[var(--txt2)] hover:bg-[var(--bg3)] hover:text-[var(--txt)] active:scale-[0.97]',
        danger:    'bg-[var(--c-belum)] text-white hover:opacity-90 active:scale-[0.97] shadow-[var(--shadow-xs)]',
        success:   'bg-[var(--c-lunas)] text-white hover:opacity-90 active:scale-[0.97] shadow-[var(--shadow-xs)]',
        icon:      'bg-transparent text-[var(--txt2)] hover:bg-[var(--bg3)] hover:text-[var(--txt)] rounded-[var(--r-sm)]',
      },
      size: {
        xs:       'h-7 px-2 text-[var(--fs-caption)] rounded-[var(--r-xs)]',
        sm:       'h-8 px-3 text-[var(--fs-body)] rounded-[var(--r-sm)]',
        md:       'h-9 px-4 text-[var(--fs-body)] rounded-[var(--r-md)]',
        lg:       'h-10 px-5 text-[var(--fs-heading)] rounded-[var(--r-md)]',
        icon:     'h-8 w-8 rounded-[var(--r-sm)]',
        'icon-sm':'h-7 w-7 rounded-[var(--r-xs)]',
        'icon-lg':'h-10 w-10 rounded-[var(--r-md)]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" aria-hidden="true" />
          {children}
        </>
      ) : children}
    </button>
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
