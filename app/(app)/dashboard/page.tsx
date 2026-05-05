'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import DashboardView from '@/components/features/dashboard/DashboardView';
export default function DashboardPage() {
  const { setView } = useAppStore();
  useEffect(()=>{ setView('dashboard'); },[setView]);
  return <DashboardView />;
}
