// store/useAppStore.ts
import { create } from 'zustand';
import { createAuthSlice,     type AuthSlice     } from './slices/authSlice';
import { createDataSlice,     type DataSlice     } from './slices/dataSlice';
import { createViewSlice,     type ViewSlice     } from './slices/viewSlice';
import { createUiSlice,       type UiSlice       } from './slices/uiSlice';
import { createExportSlice,   type ExportSlice   } from './slices/exportSlice';
import { createSettingsSlice, type SettingsSlice, type InternalSettingsState } from './slices/settingsSlice';

// InternalSettingsState (`_settingsUid`) murni detail implementasi
// settingsSlice — disertakan di sini hanya karena Zustand butuh tipe
// combine yang mencakup seluruh field yang di-`set()` oleh slice manapun.
// Komponen lain tidak boleh membaca/menulis `_settingsUid` secara langsung.
export type AppStore = AuthSlice & DataSlice & ViewSlice & UiSlice & ExportSlice & SettingsSlice & InternalSettingsState;

export const useAppStore = create<AppStore>((...a) => ({
  ...createAuthSlice(...a),
  ...createDataSlice(...a),
  ...createViewSlice(...a),
  ...createUiSlice(...a),
  ...createExportSlice(...a),
  ...createSettingsSlice(...a),
}));

export type { AuthSlice, DataSlice, ViewSlice, UiSlice, ExportSlice, SettingsSlice };
