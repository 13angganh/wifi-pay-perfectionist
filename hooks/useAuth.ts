// ══════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth hook
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         updateProfile, signOut, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { saveCred, clearCred, getSavedCred, friendlyAuthError } from '@/lib/helpers';
import { useAppStore } from '@/store/useAppStore';

export function useAuth() {
  const { setUser, clearUser } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email || '', user.displayName || user.email?.split('@')[0] || '');
      } else {
        clearUser();
      }
    });
    return unsub;
  }, [setUser, clearUser]);
}

// ── Login dengan credentials tersimpan (tombol Lanjutkan) ──
export async function loginRemembered(): Promise<{ error?: string }> {
  const user = auth.currentUser;
  if (user) return {};

  const cred = getSavedCred();
  if (!cred) return { error: 'no_cred' };

  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, cred.email, cred.pass);
    saveCred(cred.email, cred.pass, result.user.displayName || cred.email.split('@')[0]);
    return {};
  } catch (e: any) {
    return { error: friendlyAuthError(e.code) };
  }
}

// ── Login manual ──
export async function doLogin(email: string, pass: string): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    saveCred(email, pass, result.user.displayName || email.split('@')[0]);
    return {};
  } catch (e: any) {
    return { error: friendlyAuthError(e.code) };
  }
}

// ── Register ──
export async function doRegister(email: string, pass: string, name: string): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    saveCred(email, pass, name);
    return {};
  } catch (e: any) {
    return { error: friendlyAuthError(e.code) };
  }
}

// ── Logout (credentials tetap tersimpan, hanya session dihapus) ──
export async function doLogout(): Promise<void> {
  await signOut(auth).catch(() => {});
}

// ── Switch account (hapus credentials) ──
export async function switchAccount(): Promise<void> {
  await signOut(auth).catch(() => {});
  clearCred();
}
