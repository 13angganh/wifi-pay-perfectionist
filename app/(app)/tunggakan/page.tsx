'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import TunggakanView from '@/components/features/tunggakan/TunggakanView';
export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('tunggakan'); }, [setView]);
  return <TunggakanView />;
}
