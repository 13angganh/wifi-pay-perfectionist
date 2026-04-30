// components/ui/Input.tsx — Primitive input dengan CVA variants
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

const inputVariants = cva(
  [
    'w-full bg-[var(--bg3)] text-[var(--txt)]',
    'border border-[var(--border)] rounded-[var(--r-md)]',
    'placeholder:text-[var(--txt4)]',
    'transition-colors duration-[var(--t-fast)] ease-[var(--ease-out)]',
    'focus:outline-none focus:border-[var(--zc)] focus:bg-[var(--bg2)]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        error:  'border-[var(--c-belum)] focus:border-[var(--c-belum)]',
        search: 'bg-[var(--bg2)] border-[var(--border2)] focus:bg-[var(--bg3)]',
      },
      size: {
        sm: 'h-8 px-3 text-[var(--fs-caption)]',
        md: 'h-9 px-3 text-[var(--fs-body)]',
        lg: 'h-10 px-4 text-[var(--fs-heading)]',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const effectiveVariant = error ? 'error' : variant;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[var(--fs-caption)] text-[var(--txt2)] font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[var(--txt3)] pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(inputVariants({ variant: effectiveVariant, size }), leftIcon && 'pl-9', rightIcon && 'pr-9', className)}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[var(--txt3)] flex items-center">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-[var(--fs-caption)] text-[var(--c-belum)]">{error}</p>}
        {hint && !error && <p className="text-[var(--fs-caption)] text-[var(--txt3)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
export default Input;
