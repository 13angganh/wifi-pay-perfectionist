// components/ui/EmptyState.tsx — Reusable empty state component
// UI FIX: Framer Motion entrance + icon box lebih stylized + border subtle
'use client';

import { clsx } from 'clsx';
import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  const iconSizeMap  = { sm: 28, md: 40, lg: 52 };   // +4px dari sebelumnya
  const paddingMap   = { sm: 'py-6', md: 'py-10', lg: 'py-16' };
  const titleSizeMap = { sm: 'text-[var(--fs-body)]', md: 'text-[var(--fs-heading)]', lg: 'text-[15px]' };
  const boxSize      = iconSizeMap[size] * 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={clsx('flex flex-col items-center justify-center text-center gap-3', paddingMap[size], className)}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] /* spring-like */ }}
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: 'var(--r-lg)',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 var(--glass-tint)',
          }}
        >
          <Icon size={iconSizeMap[size]} strokeWidth={1.5} className="text-[var(--txt4)]" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="flex flex-col gap-1 max-w-[240px]"
      >
        <p className={clsx('font-semibold text-[var(--txt2)]', titleSizeMap[size])}>{title}</p>
        {description && (
          <p className="text-[var(--fs-caption)] text-[var(--txt3)] leading-[var(--lh-caption)]">
            {description}
          </p>
        )}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.18 }}
          className="mt-1"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
