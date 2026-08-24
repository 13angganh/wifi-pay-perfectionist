// ══════════════════════════════════════════
// lib/firebase.ts — Firebase init (env vars)
// ══════════════════════════════════════════

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};
// Di-export (fitur Penagih) supaya createTenantAccount() di hooks/useAuth.ts
// bisa membuat instance Firebase App KEDUA yang sementara dengan config
// identik — tanpa duplikasi manual objek config di file lain (yang rawan
// drift kalau env var berubah). Instance kedua ini dipakai HANYA untuk
// createUserWithEmailAndPassword() penagih, supaya tidak mengganti sesi
// auth utama milik owner yang sedang login.
export { firebaseConfig };

// Cegah double-init di Next.js dev hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getDatabase(app);
export default app;
