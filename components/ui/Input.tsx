// components/ui/Input.tsx — Input, Textarea, Field (REDESAIN T6, CORE BLOCK v3 .inp/.field)
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import {
  forwardRef, useId,
  type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from 'react';

const inputVariants = cva('wp-inp', {
  variants: {
    variant: {
      default: '',
      error:   'wp-inp--err',
      search:  'wp-inp--search',
    },
    size: {
      sm: 'wp-inp--sm',
      md: '',
      lg: 'wp-inp--lg',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

/** Pembungkus label + pesan error/hint — dipakai Input, Select, Textarea. */
export function Field({
  label, htmlFor, error, hint, errorId, hintId, className, children,
}: {
  label?: string; htmlFor?: string; error?: string; hint?: string;
  errorId?: string; hintId?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={clsx('wp-field', className)}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error && <span id={errorId} className="wp-msg" role="alert">{error}</span>}
      {hint && !error && <span id={hintId} className="wp-hint-txt">{hint}</span>}
    </div>
  );
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Angka/nominal: font mono + tabular. */
  numeric?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, hint, leftIcon, rightIcon, numeric, id, ...props }, ref) => {
    const auto = useId();
    const inputId = id ?? auto;
    const errorId = `${inputId}-err`;
    const hintId = `${inputId}-hint`;
    const effectiveVariant = error ? 'error' : variant;
    const input = (
      <input
        ref={ref}
        id={inputId}
        className={clsx(inputVariants({ variant: effectiveVariant, size }), numeric && 'wp-inp--num', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...props}
      />
    );
    return (
      <Field label={label} htmlFor={inputId} error={error} hint={hint} errorId={errorId} hintId={hintId}>
        {leftIcon || rightIcon ? (
          <div className="wp-inpw">
            {leftIcon && <span className="wp-inpw__ico" aria-hidden="true">{leftIcon}</span>}
            {input}
            {rightIcon && <span className="wp-inpw__end" style={{ pointerEvents: 'none' }}>{rightIcon}</span>}
          </div>
        ) : input}
      </Field>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const auto = useId();
    const areaId = id ?? auto;
    const errorId = `${areaId}-err`;
    const hintId = `${areaId}-hint`;
    return (
      <Field label={label} htmlFor={areaId} error={error} hint={hint} errorId={errorId} hintId={hintId}>
        <textarea
          ref={ref}
          id={areaId}
          className={clsx('wp-inp', error && 'wp-inp--err', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Textarea, inputVariants };
export default Input;
