// ══════════════════════════════════════════
// app/(app)/layout.tsx — Protected app layout
// FIX: Hapus isLoggingOut dari render condition — penyebab loading stuck
// Cukup authChecked + uid untuk kontrol render. Logout langsung redirect.
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
  const router = useRouter();
  const { uid, authChecked } = useAppStore();

  // Aktifkan auth listener (set authChecked saat callback pertama)
  useAuth();
  // Aktifkan Firebase realtime listener
  useAppData();

  useEffect(() => {
    // Redirect ke login jika Firebase sudah konfirmasi tidak ada user
    if (authChecked && !uid) {
      router.replace('/login');
    }
  }, [authChecked, uid, router]);

  // Loading: saat Firebase belum selesai cek auth state
  // Setelah logout: uid langsung null → redirect ke /login terjadi di useEffect
  if (!authChecked || !uid) return <LoadingScreen />;

  return <AppShell>{children}</AppShell>;
}
