// app/(app)/loading.tsx — Premium loading page
import { SkeletonCard, SkeletonStat } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      {/* List cards */}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
