// ══════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth hook
// Fase 2: Redesign — pakai browserLocalPersistence, hapus password storage
// Sesi Fix: Tambah cookie wp_session untuk middleware soft guard
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

// ── Cookie helper untuk middleware soft guard ──
// Cookie ini dibaca middleware.ts di Edge Runtime untuk optimasi UX.
// Auth sebenarnya tetap dikelola Firebase (bukan cookie ini).
const COOKIE_NAME  = 'wp_session';
const COOKIE_MAX   = 60 * 60 * 24 * 30; // 30 hari
const SECURE_FLAG  = process.env.NODE_ENV === 'production' ? '; Secure' : '';

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX}; SameSite=Lax${SECURE_FLAG}`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// ── localStorage keys untuk remember kredensial ──
const KEY_EMAIL = 'wp_remember_email';
const KEY_NAME  = 'wp_remember_name';
const KEY_PASS  = 'wp_remember_pass'; // disimpan untuk auto-login jika sesi expired

function saveRememberCred(email: string, pass: string, displayName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_EMAIL, email);
  localStorage.setItem(KEY_NAME,  displayName || email.split('@')[0]);
  localStorage.setItem(KEY_PASS,  pass);
}


export function getRememberedCred(): { email: string; name: string; pass: string } | null {
  if (typeof window === 'undefined') return null;
  const email = localStorage.getItem(KEY_EMAIL);
  const name  = localStorage.getItem(KEY_NAME);
  const pass  = localStorage.getItem(KEY_PASS);
  if (!email || !pass) return null;
  return { email, name: name || email.split('@')[0], pass };
}

/** @deprecated gunakan getRememberedCred() */
export function getRememberedEmail(): { email: string; name: string } | null {
  const cred = getRememberedCred();
  if (!cred) return null;
  return { email: cred.email, name: cred.name };
}

// ── Auth listener hook ──
export function useAuth() {
  const { setUser, clearUser, setAuthChecked } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email || '', user.displayName || user.email?.split('@')[0] || '');
        // Set cookie untuk middleware (optimasi UX skip login screen)
        setSessionCookie();
      } else {
        clearUser();
        // Clear cookie saat logout
        clearSessionCookie();
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
      // FIX: simpan email + password agar tidak perlu ketik ulang jika sesi expired
      saveRememberCred(email, pass, result.user.displayName || email.split('@')[0]);
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
    saveRememberCred(email, pass, name);
    return {};
  } catch (e: unknown) {
    return { error: friendlyAuthError(getFirebaseCode(e)) };
  }
}

// ── Logout biasa — kredensial TETAP tersimpan untuk auto-login berikutnya ──
export async function doLogout(): Promise<void> {
  await signOut(auth).catch(() => {});
  // Cookie di-clear oleh onAuthStateChanged callback
  // email + password TETAP di localStorage → user tidak perlu ketik ulang
}

// ── Switch account — sign out Firebase, kredensial TETAP tersimpan ──
// User bisa ketik manual jika mau ganti akun, tapi jika tidak sengaja klik
// maka tinggal klik "Masuk" lagi tanpa perlu ketik ulang.
export async function switchAccount(): Promise<void> {
  await signOut(auth).catch(() => {});
  // TIDAK clearRememberCred() — email+pass tetap tersimpan
}
