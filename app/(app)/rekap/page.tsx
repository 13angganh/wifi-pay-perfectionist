'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import RekapView from '@/components/features/rekap/RekapView';
export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('rekap' as any); }, []);
  return <RekapView />;
}
