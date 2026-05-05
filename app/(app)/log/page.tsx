'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LogView from '@/components/features/log/LogView';
export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('log'); }, [setView]);
  return <LogView />;
}
