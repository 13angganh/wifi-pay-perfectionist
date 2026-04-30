'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import MembersView from '@/components/features/members/MembersView';
export default function Page() {
  const { setView } = useAppStore();
  useEffect(() => { setView('members'); }, []);
  return <MembersView />;
}
