// components/ui/Select.tsx — Styled select wrapper
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';

const selectVariants = cva(
  [
    'w-full appearance-none',
    'bg-[var(--bg3)] text-[var(--txt)]',
    'border border-[var(--border)] rounded-[var(--r-md)]',
    'pr-8',
    'transition-colors duration-[var(--t-fast)] ease-[var(--ease-out)]',
    'focus:outline-none focus:border-[var(--zc)] focus:bg-[var(--bg2)]',
    'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-8 pl-3 text-[var(--fs-caption)]',
        md: 'h-9 pl-3 text-[var(--fs-body)]',
        lg: 'h-10 pl-4 text-[var(--fs-heading)]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, label, error, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-[var(--fs-caption)] text-[var(--txt2)] font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={clsx(selectVariants({ size }), error && 'border-[var(--c-belum)] focus:border-[var(--c-belum)]', className)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 text-[var(--txt3)] pointer-events-none" />
        </div>
        {error && <p className="text-[var(--fs-caption)] text-[var(--c-belum)]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectVariants };
export default Select;
