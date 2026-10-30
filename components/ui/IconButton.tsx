// components/ui/IconButton.tsx — tombol ikon (menggabung .sqb, .mab, .hbtn dari CORE/T3/T4)
// `label` WAJIB (aria-label): tombol ikon-saja harus punya nama aksesibel.
'use client';

import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { AnyIcon, IconWeight } from './icons';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: AnyIcon;
  label: string;
  tone?: 'default' | 'on' | 'danger';
  /** md = 34px (sqb), sm = 32px (mab) */
  size?: 'md' | 'sm';
  /** bulat tanpa bingkai (header). */
  round?: boolean;
  weight?: IconWeight;
  /** lencana (mis. jumlah notifikasi) */
  badge?: ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, tone = 'default', size = 'md', round, weight = 'regular', badge, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={clsx(
        'wp-ibtn',
        size === 'sm' && 'wp-ibtn--sm',
        tone === 'on' && 'wp-ibtn--on',
        tone === 'danger' && 'wp-ibtn--danger',
        round && 'wp-ibtn--round',
        className,
      )}
      {...props}
    >
      <Icon size="1em" weight={weight} aria-hidden="true" />
      {badge}
    </button>
  )
);
IconButton.displayName = 'IconButton';

export { IconButton };
export default IconButton;
