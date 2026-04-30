// store/slices/authSlice.ts
// Domain: user identity (uid, email, name)

import type { StateCreator } from 'zustand';

export interface AuthSlice {
  uid:       string | null;
  userEmail: string | null;
  userName:  string | null;
  setUser:   (uid: string, email: string, name: string) => void;
  clearUser: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  uid:       null,
  userEmail: null,
  userName:  null,
  setUser:   (uid, email, name) => set({ uid, userEmail: email, userName: name }),
  clearUser: () => set({ uid: null, userEmail: null, userName: null }),
});
