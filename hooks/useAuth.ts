// ══════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth hook
// v11.3: Tambah Google Sign-In + linkWithPopup untuk link akun
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  browserLocalPersistence,
  setPersistence,
  AuthErrorCodes,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { friendlyAuthError } from '@/lib/helpers';
import { useAppStore } from '@/store/useAppStore';

// ── Google provider (singleton) ──
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── type guard untuk Firebase error ──
function getFirebaseCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: string }).code);
  return 'unknown';
}

// ── Cookie helper untuk middleware soft guard ──
const COOKIE_NAME = 'wp_session';
const COOKIE_MAX  = 60 * 60 * 24 * 30; // 30 hari
const SECURE_FLAG = process.env.NODE_ENV === 'production' ? '; Secure' : '';

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX}; SameSite=Lax${SECURE_FLAG}`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// ── localStorage keys ──
const KEY_EMAIL = 'wp_remember_email';
const KEY_NAME  = 'wp_remember_name';
const KEY_PASS  = 'wp_remember_pass';

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
        setSessionCookie();
      } else {
        clearUser();
        clearSessionCookie();
      }
      setAuthChecked(true);
    });
    return unsub;
  }, [setUser, clearUser, setAuthChecked]);
}

// ── Login email/password ──
export async function doLogin(
  email: string,
  pass: string,
  remember: boolean,
): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (remember) saveRememberCred(email, pass, result.user.displayName || email.split('@')[0]);
    return {};
  } catch (e: unknown) {
    return { error: friendlyAuthError(getFirebaseCode(e)) };
  }
}

// ── Login Google — untuk user BARU (belum punya akun) ──
export async function doLoginGoogle(): Promise<{ error?: string }> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, googleProvider);
    return {};
  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    if (code === AuthErrorCodes.POPUP_CLOSED_BY_USER || code === 'auth/popup-closed-by-user') {
      return { error: 'Login dibatalkan' };
    }
    return { error: friendlyAuthError(code) };
  }
}

// ── Link akun Google ke akun email yang sedang login ──
// Caranya: user login email dulu → lalu panggil fungsi ini
// Hasilnya: 1 UID, bisa login via email ATAU Google
export async function doLinkGoogle(): Promise<{ error?: string; success?: boolean }> {
  try {
    const user = auth.currentUser;
    if (!user) return { error: 'Tidak ada sesi aktif. Login email dulu.' };

    // Cek apakah Google sudah terhubung
    const isLinked = user.providerData.some(p => p.providerId === 'google.com');
    if (isLinked) return { error: 'Google sudah terhubung ke akun ini.' };

    await linkWithPopup(user, googleProvider);
    return { success: true };
  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    if (code === AuthErrorCodes.POPUP_CLOSED_BY_USER || code === 'auth/popup-closed-by-user') {
      return { error: 'Dibatalkan' };
    }
    if (code === 'auth/credential-already-in-use') {
      return { error: 'Akun Google ini sudah dipakai oleh akun lain.' };
    }
    if (code === 'auth/email-already-in-use') {
      return { error: 'Email Google ini sudah terdaftar di akun lain.' };
    }
    return { error: friendlyAuthError(code) };
  }
}

// ── Cek provider yang sudah terhubung ke akun aktif ──
export function getLinkedProviders(): string[] {
  return auth.currentUser?.providerData.map(p => p.providerId) ?? [];
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

// ── Update email dengan re-auth otomatis ──
// Firebase mensyaratkan sesi segar untuk operasi sensitif.
// Solusi: reauthenticate via Google popup dulu, lalu update email.
export async function doUpdateEmail(newEmail: string): Promise<{ error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) return { error: 'Tidak ada sesi aktif.' };

    // Coba update langsung dulu
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      return {};
    } catch (firstErr: unknown) {
      const code = getFirebaseCode(firstErr);
      if (code !== 'auth/requires-recent-login') {
        // Error lain (bukan sesi) — langsung throw
        throw firstErr;
      }
    }

    // Sesi expired — reauthenticate dulu
    // Cek apakah user punya Google provider
    const hasGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (hasGoogle) {
      // Reauthenticate via Google popup
      const { reauthenticateWithPopup } = await import('firebase/auth');
      await reauthenticateWithPopup(user, googleProvider);
    } else {
      // User hanya email/password — tidak bisa reauthenticate otomatis tanpa password
      return { error: 'Sesi kedaluwarsa. Logout lalu login ulang untuk mengubah email.' };
    }

    // Sekarang coba lagi setelah reauthenticate
    await verifyBeforeUpdateEmail(user, newEmail);
    return {};

  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    if (code === 'auth/popup-closed-by-user' || code === AuthErrorCodes.POPUP_CLOSED_BY_USER) {
      return { error: 'Verifikasi dibatalkan.' };
    }
    if (code === 'auth/email-already-in-use') {
      return { error: 'Email ini sudah dipakai akun lain.' };
    }
    if (code === 'auth/invalid-email') {
      return { error: 'Format email tidak valid.' };
    }
    if (code === 'auth/requires-recent-login') {
      return { error: 'Sesi kedaluwarsa. Logout lalu login ulang, kemudian coba lagi.' };
    }
    return { error: friendlyAuthError(code) };
  }
}

// ── Reset password via email ──
export async function doResetPassword(email: string): Promise<{ error?: string }> {
  try {
    if (!email.trim()) return { error: 'Masukkan email akun.' };
    await sendPasswordResetEmail(auth, email.trim());
    return {};
  } catch (e: unknown) {
    const code = getFirebaseCode(e);
    if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
      // Jangan bocorkan info apakah email terdaftar atau tidak
      return {};
    }
    return { error: friendlyAuthError(code) };
  }
}

// ── Logout ──
export async function doLogout(): Promise<void> {
  await signOut(auth).catch(() => {});
}

// ── Switch account ──
export async function switchAccount(): Promise<void> {
  await signOut(auth).catch(() => {});
}
