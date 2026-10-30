// components/ui/EmptyState.tsx — Reusable empty state (REDESAIN T6, CORE BLOCK v3 .empty)
// `icon` menerima ikon Phosphor (resmi) ATAU ikon Lucide dari layar yang belum dimigrasi
// (T7–T10 mengganti ke Phosphor di tahap masing-masing).
'use client';

import { clsx } from 'clsx';
import { type ReactNode } from 'react';
import type { AnyIcon } from './icons';

interface EmptyStateProps {
  icon?: AnyIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  return (
    <div className={clsx('wp-empty', size === 'sm' && 'wp-empty--sm', size === 'lg' && 'wp-empty--lg', className)}>
      {Icon && (
        <div className="wp-empty__ico" aria-hidden="true">
          <Icon size="1em" weight="duotone" />
        </div>
      )}
      <b>{title}</b>
      {description && <span className="wp-empty__cap">{description}</span>}
      {action && <div style={{ marginTop: 'var(--sp-1)' }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
