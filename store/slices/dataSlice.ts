// store/slices/dataSlice.ts
// Domain: appData dari Firebase + sync status

import type { StateCreator } from 'zustand';
import type { AppData, SyncStatus } from '@/types';
import { emptyAppData } from '@/lib/db';

export interface DataSlice {
  appData:       AppData;
  syncStatus:    SyncStatus;
  setAppData:    (data: AppData) => void;
  setSyncStatus: (s: SyncStatus) => void;
  /** v11.11.1: kosongkan salinan data di memori (hanya salinan sementara; Firebase TIDAK disentuh). */
  resetData:     () => void;
}

export const createDataSlice: StateCreator<DataSlice> = (set) => ({
  appData:       emptyAppData(),
  syncStatus:    'loading',
  setAppData:    (data) => set({ appData: data }),
  setSyncStatus: (s)    => set({ syncStatus: s }),
  resetData:     ()     => set({ appData: emptyAppData(), syncStatus: 'loading' }),
});
