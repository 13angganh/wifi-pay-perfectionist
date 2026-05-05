'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import SettingsView from '@/components/features/settings/SettingsView';
export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('settings'); }, [setView]);
  return <SettingsView />;
}
