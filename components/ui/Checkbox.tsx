// components/ui/Checkbox.tsx — Checkbox kotak (.chk) + checkbox bulat pilih-banyak (.cbx)
// Checkbox : form (mis. "Ingat saya" di Login, daftar centang Pengaturan).
// RoundCheckbox : pilih banyak di kartu member (Entry batch, Rekap batch, Akun Penagih).
'use client';

import { clsx } from 'clsx';
import { Check } from '@phosphor-icons/react';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <label className={clsx('wp-chk', className)}>
      <input ref={ref} type="checkbox" {...props} />
      {label}
    </label>
  )
);
Checkbox.displayName = 'Checkbox';

export interface RoundCheckboxProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange?: (next: boolean) => void;
  /** nama aksesibel (wajib: kontrol tanpa teks) */
  label: string;
}

export function RoundCheckbox({ checked, onChange, label, disabled, className, onClick, ...props }: RoundCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={clsx('wp-cbx', checked && 'wp-cbx--on', disabled && 'wp-cbx--dis', className)}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) onChange?.(!checked); }}
      {...props}
    >
      {checked && <Check size="1em" weight="bold" aria-hidden="true" />}
    </button>
  );
}

export { Checkbox };
export default Checkbox;
