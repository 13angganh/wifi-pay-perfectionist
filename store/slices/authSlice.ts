// store/slices/authSlice.ts
// Domain: user identity (uid, email, name) + authChecked flag (Fase 2)

import type { StateCreator } from 'zustand';

export interface AuthSlice {
  uid:            string | null;
  userEmail:      string | null;
  userName:       string | null;
  // Fase 2: flag penanda bahwa onAuthStateChanged sudah dipanggil pertama kali
  authChecked:    boolean;
  setUser:        (uid: string, email: string, name: string) => void;
  clearUser:      () => void;
  setAuthChecked: (v: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  uid:            null,
  userEmail:      null,
  userName:       null,
  authChecked:    false,
  setUser:        (uid, email, name) => set({ uid, userEmail: email, userName: name }),
  clearUser:      () => set({ uid: null, userEmail: null, userName: null }),
  setAuthChecked: (v) => set({ authChecked: v }),
});
