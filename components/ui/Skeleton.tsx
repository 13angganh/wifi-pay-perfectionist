// components/ui/Skeleton.tsx — Skeleton loading (REDESAIN T6, CORE BLOCK v3 .skel)
// API ekspor dipertahankan (dipakai 8 file layar): Skeleton, SkeletonText, SkeletonCard,
// SkeletonRow, SkeletonList, SkeletonStat.
'use client';

import { clsx } from 'clsx';
import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ width, height, rounded = 'md', className, style, ...props }: SkeletonProps) {
  const radiusMap = { sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', full: 'var(--r-full)' };
  return (
    <div
      className={clsx('wp-skel', className)}
      style={{ width, height: height ?? '1rem', borderRadius: radiusMap[rounded], ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="14px" width={i === lines - 1 && lines > 1 ? '65%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('wp-card flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton width="120px" height="16px" />
        <Skeleton width="48px" height="22px" rounded="full" />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-3 py-3 border-b border-[var(--border)]', className)}>
      <Skeleton width="34px" height="34px" rounded="full" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton width="140px" height="14px" />
        <Skeleton width="80px" height="12px" />
      </div>
      <Skeleton width="56px" height="24px" rounded="full" />
    </div>
  );
}

export function SkeletonList({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx('', className)}>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={clsx('wp-card flex flex-col gap-2', className)}>
      <Skeleton width="80px" height="12px" />
      <Skeleton width="100px" height="26px" />
      <Skeleton width="60px" height="12px" />
    </div>
  );
}

export default Skeleton;
