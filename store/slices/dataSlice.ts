// store/slices/dataSlice.ts
// Domain: appData dari Firebase + sync status

import type { StateCreator } from 'zustand';
import type { AppData, SyncStatus } from '@/types';
import { DEFAULT_APP_DATA } from '@/lib/db';

export interface DataSlice {
  appData:       AppData;
  syncStatus:    SyncStatus;
  setAppData:    (data: AppData) => void;
  setSyncStatus: (s: SyncStatus) => void;
}

export const createDataSlice: StateCreator<DataSlice> = (set) => ({
  appData:       { ...DEFAULT_APP_DATA },
  syncStatus:    'loading',
  setAppData:    (data) => set({ appData: data }),
  setSyncStatus: (s)    => set({ syncStatus: s }),
});
