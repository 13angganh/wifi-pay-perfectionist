// T13-05 (Ukuran Teks: AppShell menerapkan data-text-size, pemilih menyimpan per perangkat) dan
// T13-11 (tab zona Header: pudar tepi kanan HANYA bila masih ada tab tersembunyi di kanan).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/dashboard' }));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('@/lib/backup', () => ({ checkAutoBackup: vi.fn() }));
vi.mock('@/hooks/useIdleTimeout', () => ({ useIdleTimeout: () => undefined }));
vi.mock('@/hooks/usePWA', () => ({ usePWA: () => undefined }));
vi.mock('@/hooks/useOfflineDetect', () => ({ useOfflineDetect: () => ({ offline: false, show: false }) }));
vi.mock('../Header', () => ({ default: () => null }));
vi.mock('../Sidebar', () => ({ default: () => null }));
vi.mock('../BottomNav', () => ({ default: () => null }));
vi.mock('@/components/ui/Toast', () => ({ default: () => null, showToast: vi.fn() }));
vi.mock('@/components/ui/Confirm', () => ({ default: () => null }));
vi.mock('@/components/ui/PinLock', () => ({ default: () => null }));
vi.mock('@/components/ui/OnboardingHint', () => ({ default: () => null }));
vi.mock('@/components/modals/AccountModal', () => ({ default: () => null }));

import { useAppStore } from '@/store/useAppStore';
import AppShell from '../AppShell';
import HeaderZoneTabs from '../Header.ZoneTabs';
import { TextSizePicker } from '../DisplayPrefs';

describe('T13-05 Ukuran Teks', () => {
  beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.textSize; useAppStore.setState({ textSize: 'normal' }); });
  afterEach(cleanup);

  it('AppShell menerapkan data-text-size pada <html> dan mengikutinya saat berubah', () => {
    render(<AppShell><p>isi</p></AppShell>);
    expect(document.documentElement.dataset.textSize).toBe('normal');
    act(() => { useAppStore.getState().setTextSize('large'); });
    expect(document.documentElement.dataset.textSize).toBe('large');
    act(() => { useAppStore.getState().setTextSize('normal'); });
    expect(document.documentElement.dataset.textSize).toBe('normal');
  });

  it('pemilih Ukuran Teks: bawaan Normal; memilih Besar mengganti nilai dan menyimpannya di perangkat', async () => {
    render(<TextSizePicker />);
    const u = userEvent.setup();
    expect(screen.getByText('Ukuran standar (bawaan)')).toBeInTheDocument();
    await u.click(screen.getByText('Besar'));
    expect(useAppStore.getState().textSize).toBe('large');
    expect(localStorage.getItem('wp_text_size')).toBe('large');
    await u.click(screen.getByText('Normal'));
    expect(useAppStore.getState().textSize).toBe('normal');
    expect(localStorage.getItem('wp_text_size')).toBe('normal');
  });
});

// ── T13-11: pudar tab zona bersyarat ─────────────────────────────────────────
type RoCb = () => void;
const ros: { cb: RoCb; targets: Element[] }[] = [];
class FakeRO {
  entry: { cb: RoCb; targets: Element[] };
  constructor(cb: RoCb) { this.entry = { cb, targets: [] }; ros.push(this.entry); }
  observe(el: Element) { this.entry.targets.push(el); }
  disconnect() { this.entry.targets.length = 0; }
  unobserve() { /* tak dipakai */ }
}
function setDims(el: HTMLElement, sw: number, cw: number, left = 0) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: sw });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: cw });
  el.scrollLeft = left;
}
const fire = () => act(() => { ros.forEach(r => r.cb()); });

describe('T13-11 Header.ZoneTabs — pudar tepi kanan bersyarat', () => {
  beforeEach(() => {
    ros.length = 0;
    vi.stubGlobal('ResizeObserver', FakeRO);
    useAppStore.setState({ activeZone: 'KRS', settings: { ...useAppStore.getState().settings, customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] } });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('semua tab muat → TIDAK ada pudar; meluber → pudar aktif; digeser sampai ujung → pudar hilang; kembali → aktif lagi', () => {
    render(<HeaderZoneTabs onZoneChange={() => undefined} />);
    const sw = screen.getByRole('group');
    expect(sw).not.toHaveAttribute('data-more');                       // sebelum ada ukuran: tanpa pudar

    setDims(sw, 198, 198); fire();                                     // muat
    expect(sw).not.toHaveAttribute('data-more');

    setDims(sw, 400, 200, 0); fire();                                  // meluber, di awal
    expect(sw).toHaveAttribute('data-more', 'true');

    setDims(sw, 400, 200, 200);                                        // digeser sampai ujung kanan
    act(() => { sw.dispatchEvent(new Event('scroll')); });
    expect(sw).not.toHaveAttribute('data-more');

    setDims(sw, 400, 200, 40);                                         // kembali sedikit ke kiri
    act(() => { sw.dispatchEvent(new Event('scroll')); });
    expect(sw).toHaveAttribute('data-more', 'true');
  });

  it('CSS: mask-image hanya pada [data-more="true"]; aturan dasar .zone-sw tidak memuat mask', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('styles/ui.css', 'utf8');
    const base = css.split('\n').find(l => l.startsWith('.zone-sw {')) ?? '';
    const cond = css.split('\n').find(l => l.startsWith('.zone-sw[data-more="true"]')) ?? '';
    expect(base).not.toMatch(/mask-image/);
    expect(cond).toMatch(/-webkit-mask-image/);
    expect(cond).toMatch(/\smask-image/);
  });
});
