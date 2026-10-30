// components/ui/Button.tsx — Primitive button (REDESAIN T6, CORE BLOCK v3 .btn)
// Gaya ada di styles/ui.css (.wp-btn*). API varian dipertahankan dari versi sebelumnya.
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Spinner } from './Spinner';

const buttonVariants = cva('wp-btn', {
  variants: {
    variant: {
      primary:   'wp-btn--primary',
      secondary: 'wp-btn--secondary',
      ghost:     'wp-btn--ghost',
      danger:    'wp-btn--danger',
      success:   'wp-btn--success',
      icon:      'wp-btn--ghost',
    },
    size: {
      xs:        'wp-btn--xs',
      sm:        'wp-btn--sm',
      md:        '',
      lg:        'wp-btn--lg',
      icon:      'wp-btn--sm wp-btn--sq',
      'icon-sm': 'wp-btn--xs wp-btn--sq',
      'icon-lg': 'wp-btn--sq',
    },
    block: {
      true:  'wp-btn--block',
      false: '',
    },
  },
  defaultVariants: { variant: 'secondary', size: 'md', block: false },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (<><Spinner />{children}</>) : children}
    </button>
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
