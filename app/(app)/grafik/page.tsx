'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

// task 1.09: lazy-load GrafikView agar Chart.js (~200KB gzipped) tidak masuk bundle awal.
// REDESAIN T9: penanda muat berupa skeleton tanpa teks (sebelumnya teks "Memuat grafik…" yang tertanam, tanpa i18n).
const GrafikView = dynamic(() => import('@/components/features/grafik/GrafikView'), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <Skeleton width="140px" height="36px" />
      <Skeleton height="230px" />
    </div>
  ),
});

export default function Page() {
  return <GrafikView />;
}
