// store/useAppStore.ts
import { create } from 'zustand';
import { createAuthSlice,     type AuthSlice     } from './slices/authSlice';
import { createDataSlice,     type DataSlice     } from './slices/dataSlice';
import { createViewSlice,     type ViewSlice     } from './slices/viewSlice';
import { createUiSlice,       type UiSlice       } from './slices/uiSlice';
import { createExportSlice,   type ExportSlice   } from './slices/exportSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';

export type AppStore = AuthSlice & DataSlice & ViewSlice & UiSlice & ExportSlice & SettingsSlice;

export const useAppStore = create<AppStore>((...a) => ({
  ...createAuthSlice(...a),
  ...createDataSlice(...a),
  ...createViewSlice(...a),
  ...createUiSlice(...a),
  ...createExportSlice(...a),
  ...createSettingsSlice(...a),
}));

export type { AuthSlice, DataSlice, ViewSlice, UiSlice, ExportSlice, SettingsSlice };
