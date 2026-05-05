// ══════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth hook
// Fase 2: Redesign — pakai browserLocalPersistence, hapus password storage
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { friendlyAuthError } from '@/lib/helpers';
import { useAppStore } from '@/store/useAppStore';

// task 1.11: type guard untuk Firebase error
function getFirebaseCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: string }).code);
  return 'unknown';
}

// ── localStorage key untuk remember email (bukan password) ──
const KEY_EMAIL = 'wp_remember_email';
const KEY_NAME  = 'wp_remember_name';

function saveRememberEmail(email: string, displayName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_EMAIL, email);
  localStorage.setItem(KEY_NAME, displayName || email.split('@')[0]);
}

function clearRememberEmail() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_EMAIL);
  localStorage.removeItem(KEY_NAME);
  // Hapus wp_cred lama jika masih ada (migration)
  localStorage.removeItem('wp_cred');
}

export function getRememberedEmail(): { email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const email = localStorage.getItem(KEY_EMAIL);
  const name  = localStorage.getItem(KEY_NAME);
  if (!email) return null;
  return { email, name: name || email.split('@')[0] };
}

// ── Auth listener hook ──
export function useAuth() {
  const { setUser, clearUser, setAuthChecked } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email || '', user.displayName || user.email?.split('@')[0] || '');
      } else {
        clearUser();
      }
      // Fase 2: set authChecked setelah callback pertama — eliminasi race condition
      setAuthChecked(true);
    });
    return unsub;
  }, [setUser, clearUser, setAuthChecked]);
}

// ── Login manual ──
export async function doLogin(
  email: string,
  pass: string,
  remember: boolean,
): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (remember) {
      saveRememberEmail(email, result.user.displayName || email.split('@')[0]);
    }
    return {};
  } catch (e: unknown) {
    return { error: friendlyAuthError(getFirebaseCode(e)) };
  }
}

// ── Register ──
export async function doRegister(
  email: string,
  pass: string,
  name: string,
): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    saveRememberEmail(email, name);
    return {};
  } catch (e: unknown) {
    return { error: friendlyAuthError(getFirebaseCode(e)) };
  }
}

// ── Logout (email tetap tersimpan untuk pre-fill) ──
export async function doLogout(): Promise<void> {
  await signOut(auth).catch(() => {});
}

// ── Switch account (hapus email tersimpan, force login baru) ──
export async function switchAccount(): Promise<void> {
  await signOut(auth).catch(() => {});
  clearRememberEmail();
}
