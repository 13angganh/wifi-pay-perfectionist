'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';

// task 1.09: lazy-load GrafikView agar Chart.js (~200KB gzipped) tidak masuk bundle awal
const GrafikView = dynamic(() => import('@/components/features/grafik/GrafikView'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--txt4)', fontSize: 13 }}>
      Memuat grafik…
    </div>
  ),
});

export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('grafik'); }, [setView]);
  return <GrafikView />;
}
