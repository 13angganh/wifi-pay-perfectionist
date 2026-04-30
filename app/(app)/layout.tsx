// ══════════════════════════════════════════
// app/(app)/layout.tsx — Protected app layout
// Auth guard + Firebase listener + AppShell
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import AppShell from '@/components/layout/AppShell';
import LoadingScreen from '@/components/layout/LoadingScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const { uid }  = useAppStore();

  // Aktifkan auth listener
  useAuth();
  // Aktifkan Firebase realtime listener
  useAppData();

  useEffect(() => {
    if (uid === null) {
      // Belum ada uid — tunggu sebentar, jika masih null redirect ke login
      const t = setTimeout(() => {
        if (!useAppStore.getState().uid) router.replace('/login');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [uid, router]);

  // Terapkan dark/light ke body
  const { darkMode } = useAppStore();
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
  }, [darkMode]);

  if (!uid) return <LoadingScreen />;

  return <AppShell>{children}</AppShell>;
}
