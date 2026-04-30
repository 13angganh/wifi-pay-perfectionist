// components/ui/EmptyState.tsx — Reusable empty state component
'use client';

import { clsx } from 'clsx';
import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  const iconSizeMap  = { sm: 28, md: 36, lg: 48 };
  const paddingMap   = { sm: 'py-6', md: 'py-10', lg: 'py-16' };
  const titleSizeMap = { sm: 'text-[var(--fs-body)]', md: 'text-[var(--fs-heading)]', lg: 'text-[15px]' };
  const boxSize      = iconSizeMap[size] * 2;

  return (
    <div className={clsx('flex flex-col items-center justify-center text-center gap-3', paddingMap[size], className)}>
      {Icon && (
        <div
          className="flex items-center justify-center rounded-[var(--r-lg)] bg-[var(--bg3)]"
          style={{ width: boxSize, height: boxSize }}
        >
          <Icon size={iconSizeMap[size]} strokeWidth={1.5} className="text-[var(--txt4)]" />
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[240px]">
        <p className={clsx('font-semibold text-[var(--txt2)]', titleSizeMap[size])}>{title}</p>
        {description && (
          <p className="text-[var(--fs-caption)] text-[var(--txt3)] leading-[var(--lh-caption)]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
