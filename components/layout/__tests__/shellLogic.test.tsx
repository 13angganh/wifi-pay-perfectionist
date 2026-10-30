// components/layout/__tests__/shellLogic.test.tsx — REDESAIN T11
// hasAnyMembers (pemicu auto-backup lintas zona) dan useEscapeClose (Esc menutup drawer Sidebar).
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import userEvent from '@testing-library/user-event';
import { hasAnyMembers, useEscapeClose } from '@/components/layout/shellLogic';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';

const data = (over: Partial<AppData>): AppData => ({ ...DEFAULT_APP_DATA, krsMembers: [], slkMembers: [], zoneMembers: {}, ...over });
const settings = (customZones: { key: string; name: string; color: string }[] = [], hiddenZones: string[] = []) =>
  ({ ...DEFAULT_SETTINGS, customZones, hiddenZones });

describe('hasAnyMembers — member di zona MANA PUN memicu auto-backup (zona kustom = KRS/SLK)', () => {
  it('KRS saja / SLK saja', () => {
    expect(hasAnyMembers(data({ krsMembers: ['A'] }), settings())).toBe(true);
    expect(hasAnyMembers(data({ slkMembers: ['B'] }), settings())).toBe(true);
  });

  it('KRS dan SLK kosong tetapi zona kustom berisi → true (dulu false: auto-backup tak pernah jalan)', () => {
    const d = data({ zoneMembers: { PRM: ['ZAKI'] } });
    expect(hasAnyMembers(d, settings([{ key: 'PRM', name: 'Prima', color: '#10B981' }]))).toBe(true);
  });

  it('zona kustom yang disembunyikan tetap dihitung (datanya tetap ada)', () => {
    const d = data({ zoneMembers: { PRM: ['ZAKI'] } });
    expect(hasAnyMembers(d, settings([{ key: 'PRM', name: 'Prima', color: '#10B981' }], ['PRM']))).toBe(true);
  });

  it('semua kosong → false (akun baru tidak memicu backup)', () => {
    expect(hasAnyMembers(data({}), settings())).toBe(false);
    expect(hasAnyMembers(data({ zoneMembers: { PRM: [] } }), settings([{ key: 'PRM', name: 'Prima', color: '#10B981' }]))).toBe(false);
  });
});

describe('useEscapeClose', () => {
  it('Esc memanggil onClose hanya saat open; listener dilepas saat tutup/unmount', async () => {
    const onClose = vi.fn();
    const { rerender, unmount } = renderHook(({ open }) => useEscapeClose(open, onClose), { initialProps: { open: false } });
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    rerender({ open: true });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('a');
    expect(onClose).toHaveBeenCalledTimes(1); // tombol lain diabaikan

    rerender({ open: false });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender({ open: true });
    unmount();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
