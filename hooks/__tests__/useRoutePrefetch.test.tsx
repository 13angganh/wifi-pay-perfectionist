// v11.10.2 — useRoutePrefetch: semua rute menu di-prefetch bertahap saat senggang; aman tanpa router.prefetch.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { NAV_ITEMS, SETTINGS_ITEM } from '@/lib/navItems';

const router = vi.hoisted(() => ({ prefetch: vi.fn(), push: vi.fn() as unknown }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/components/features/grafik/GrafikView', () => ({ default: () => null }));

import { useRoutePrefetch } from '../useRoutePrefetch';

function Probe() { useRoutePrefetch(); return null; }

describe('useRoutePrefetch', () => {
  beforeEach(() => { vi.useFakeTimers(); router.prefetch.mockClear(); });
  afterEach(() => { vi.useRealTimers(); });

  it('tidak memanggil apa pun sebelum layar pertama selesai (jeda awal)', () => {
    render(<Probe />);
    vi.advanceTimersByTime(500);
    expect(router.prefetch).not.toHaveBeenCalled();
  });

  it('prefetch SEMUA rute menu + Pengaturan, satu per slot senggang (bukan sekaligus)', () => {
    render(<Probe />);
    vi.advanceTimersByTime(1200 + 300);
    expect(router.prefetch.mock.calls.length).toBeLessThan(NAV_ITEMS.length + 1);   // belum semuanya
    vi.advanceTimersByTime(10_000);
    const routes = router.prefetch.mock.calls.map(c => c[0]).sort();
    expect(routes).toEqual([...NAV_ITEMS, SETTINGS_ITEM].map(i => `/${i.v}`).sort());
  });

  it('berhenti saat unmount (tidak ada prefetch setelahnya)', () => {
    const { unmount } = render(<Probe />);
    vi.advanceTimersByTime(1200 + 300);
    const n = router.prefetch.mock.calls.length;
    unmount();
    vi.advanceTimersByTime(10_000);
    expect(router.prefetch.mock.calls.length).toBe(n);
  });
});
