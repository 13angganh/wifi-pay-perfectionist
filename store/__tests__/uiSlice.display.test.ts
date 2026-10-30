// store/__tests__/uiSlice.display.test.ts — Register Tambahan A1 (navMode) + A2 (toastPosition)
// Menguji slice ASLI (useAppStore), bukan salinan logika.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { useAppStore } from '@/store/useAppStore';
import { NAV_MODE_KEY, TOAST_POS_KEY, DEFAULT_NAV_MODE, DEFAULT_TOAST_POSITION } from '@/store/slices/uiSlice';

describe('uiSlice — navMode (A1) & toastPosition (A2)', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ navMode: DEFAULT_NAV_MODE, toastPosition: DEFAULT_TOAST_POSITION, sidebarOpen: false });
  });

  it('default: navMode "bottom" (gambar referensi), toastPosition "top" (perilaku zip)', () => {
    expect(DEFAULT_NAV_MODE).toBe('bottom');
    expect(DEFAULT_TOAST_POSITION).toBe('top');
    const s = useAppStore.getState();
    expect(s.navMode).toBe('bottom');
    expect(s.toastPosition).toBe('top');
  });

  it('setNavMode mengubah state dan menyimpannya per PERANGKAT (key sendiri, bukan wp_settings)', () => {
    useAppStore.getState().setNavMode('sidebar');
    expect(useAppStore.getState().navMode).toBe('sidebar');
    expect(localStorage.getItem(NAV_MODE_KEY)).toBe('sidebar');
    expect(localStorage.getItem('wp_settings')).toBeNull();
  });

  it('pindah ke mode bottom menutup drawer sidebar yang masih terbuka', () => {
    useAppStore.getState().setNavMode('sidebar');
    useAppStore.getState().setSidebar(true);
    expect(useAppStore.getState().sidebarOpen).toBe(true);
    useAppStore.getState().setNavMode('bottom');
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('setToastPosition mengubah state dan menyimpannya per perangkat', () => {
    useAppStore.getState().setToastPosition('bottom');
    expect(useAppStore.getState().toastPosition).toBe('bottom');
    expect(localStorage.getItem(TOAST_POS_KEY)).toBe('bottom');
  });

  it('navMode dan toastPosition independen satu sama lain', () => {
    useAppStore.getState().setNavMode('sidebar');
    expect(useAppStore.getState().toastPosition).toBe('top');
    useAppStore.getState().setToastPosition('bottom');
    expect(useAppStore.getState().navMode).toBe('sidebar');
  });
});
