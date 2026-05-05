// ══════════════════════════════════════════
// app/(app)/layout.tsx — Protected app layout
// Fase 2: Hapus setTimeout 1500ms, pakai authChecked dari Firebase callback
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
  const router       = useRouter();
  const { uid, authChecked } = useAppStore();

  // Aktifkan auth listener (set authChecked saat callback pertama)
  useAuth();
  // Aktifkan Firebase realtime listener
  useAppData();

  useEffect(() => {
    // Tunggu Firebase konfirmasi auth state sebelum redirect
    // authChecked = true berarti onAuthStateChanged sudah fire pertama kali
    if (authChecked && !uid) {
      router.replace('/login');
    }
  }, [authChecked, uid, router]);

  // Tampilkan loading sampai Firebase konfirmasi state
  if (!authChecked || !uid) return <LoadingScreen />;

  return <AppShell>{children}</AppShell>;
}
