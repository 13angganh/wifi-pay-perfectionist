// ══════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth hook
// v11.3: Tambah Google Sign-In + linkWithPopup untuk link akun
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
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
  getAuth,
} from 'firebase/auth';
import { auth, firebaseConfig } from '@/lib/firebase';
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
  const { setUser, clearUser, setAuthChecked, reloadSettingsForUid } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email || '', user.displayName || user.email?.split('@')[0] || '');
        setSessionCookie();
        // Titik pertama uid diketahui — reload PIN/biometrik/preferensi
        // operasional dari key per-uid akun ini (bahasa tetap ikut device,
        // tidak kena reload). Lihat settingsSlice.ts untuk detail split.
        reloadSettingsForUid(user.uid);
      } else {
        clearUser();
        clearSessionCookie();
        // Logout: tidak ada uid aktif — settings jatuh ke default+device
        // saja (tidak ada PIN akun manapun yang "bocor" tanpa login).
        reloadSettingsForUid(null);
      }
      setAuthChecked(true);
    });
    return unsub;
  }, [setUser, clearUser, setAuthChecked, reloadSettingsForUid]);
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

// ══════════════════════════════════════════
// Fitur Penagih — buat akun baru TANPA mengganti sesi owner
// ══════════════════════════════════════════
//
// createUserWithEmailAndPassword(auth, ...) — kalau dipanggil dengan
// instance `auth` UTAMA (yang sama dipakai owner login) — otomatis
// mengganti sesi aktif jadi user yang baru dibuat. Ini perilaku Firebase
// SDK yang tidak bisa di-nonaktifkan, bukan bug proyek ini (dikonfirmasi
// dari sifat doRegister() yang sudah ada — didesain untuk kasus BEDA:
// "seseorang mendaftar untuk dirinya sendiri", bukan "owner membuatkan
// akun untuk orang lain sambil tetap login sebagai dirinya").
//
// Solusi: instance Firebase App KEDUA yang sementara (initializeApp
// dengan nama unik, config identik — lihat firebaseConfig di
// lib/firebase.ts) — dibuat, dipakai HANYA untuk satu panggilan
// createUserWithEmailAndPassword, lalu dibuang total (signOut + deleteApp)
// sebelum fungsi ini return. Instance `auth` utama (dan sesi owner di
// dalamnya) sama sekali tidak tersentuh sepanjang proses — ini alasan
// kenapa fungsi ini TIDAK memanggil onAuthStateChanged listener apapun,
// TIDAK menyentuh useAppStore, dan TIDAK butuh reload halaman setelahnya.
//
// uid hasil createUserWithEmailAndPassword() dikembalikan LANGSUNG ke
// caller (menu "Buat Akun Penagih") — caller-lah yang lanjut memanggil
// cloneMembersToUser(uid, ...) dari lib/db.ts. Dipisah sengaja (fungsi ini
// TIDAK ikut memanggil cloneMembersToUser sendiri) supaya tanggung jawab
// tetap jelas: fungsi ini murni "buat kredensial auth", clone member
// adalah operasi RTDB terpisah yang sudah punya fungsi sendiri.
export async function createTenantAccount(
  email: string,
  pass: string,
): Promise<{ uid?: string; error?: string }> {
  // Date.now() SAJA tidak cukup unik — kalau fungsi ini dipanggil 2× dalam
  // milidetik yang sama (skenario nyata: owner membuat beberapa akun
  // penagih berturut-turut di satu sesi), dua panggilan bisa mendapat
  // timestamp identik → initializeApp() kedua akan throw app/duplicate-app
  // karena nama app sudah dipakai instance pertama yang belum sempat
  // dihapus. Ditemukan lewat test "dua panggilan berturut-turut" (lihat
  // hooks/__tests__/createTenantAccount.test.ts) — bukan diasumsikan aman.
  // Math.random() sebagai komponen kedua menjamin keunikan praktis
  // bahkan untuk panggilan di tick yang sama.
  const tempAppName = `tenant-create-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  try {
    const tempAuth = getAuth(tempApp);
    const result = await createUserWithEmailAndPassword(tempAuth, email, pass);
    const uid = result.user.uid;
    // Buang sesi di instance sementara SEBELUM instance-nya sendiri
    // dihapus — urutan ini tidak esensial secara fungsional (deleteApp
    // akan membuang semuanya juga), tapi eksplisit lebih aman untuk
    // dibaca ulang nanti: jelas bahwa TIDAK ADA sesi tenant yang
    // "menggantung" di manapun setelah fungsi ini selesai.
    await signOut(tempAuth).catch(() => {});
    return { uid };
  } catch (e: unknown) {
    return { error: friendlyAuthError(getFirebaseCode(e)) };
  } finally {
    // finally, bukan cuma di jalur sukses — kalau
    // createUserWithEmailAndPassword() throw (mis. email sudah
    // terdaftar), instance sementara ini TETAP harus dibuang, jangan
    // sampai menumpuk di memori kalau owner mencoba beberapa kali.
    await deleteApp(tempApp).catch(() => {});
  }
}
