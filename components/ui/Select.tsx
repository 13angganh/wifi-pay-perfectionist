// components/ui/Select.tsx — Styled select (REDESAIN T6, CORE BLOCK v3 select.inp)
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { CaretDown } from '@phosphor-icons/react';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { Field } from './Input';

const selectVariants = cva('wp-inp', {
  variants: {
    size: { sm: 'wp-inp--sm', md: '', lg: 'wp-inp--lg' },
  },
  defaultVariants: { size: 'md' },
});

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, label, error, id, children, ...props }, ref) => {
    const auto = useId();
    const selectId = id ?? auto;
    const errorId = `${selectId}-err`;
    return (
      <Field label={label} htmlFor={selectId} error={error} errorId={errorId}>
        <div className="wp-inpw wp-inpw--sel">
          <select
            ref={ref}
            id={selectId}
            className={clsx(selectVariants({ size }), error && 'wp-inp--err', className)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          >
            {children}
          </select>
          <span className="wp-inpw__end" aria-hidden="true"><CaretDown size={14} weight="bold" /></span>
        </div>
      </Field>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectVariants };
export default Select;
