// store/slices/exportSlice.ts
// Domain: share rekap, export, import state

import type { StateCreator } from 'zustand';
import type { ShareType, ShareFormat, ExportFormat } from '@/types';

export interface ExportSlice {
  shareType:    ShareType;
  shareFmt:     ShareFormat;
  expFmt:       ExportFormat;
  setShareType: (t: ShareType) => void;
  setShareFmt:  (f: ShareFormat) => void;
  setExpFmt:    (f: ExportFormat) => void;
}

export const createExportSlice: StateCreator<ExportSlice> = (set) => ({
  shareType:    'monthly',
  shareFmt:     'pdf',
  expFmt:       'json',
  setShareType: (t) => set({ shareType: t }),
  setShareFmt:  (f) => set({ shareFmt: f }),
  setExpFmt:    (f) => set({ expFmt: f }),
});
