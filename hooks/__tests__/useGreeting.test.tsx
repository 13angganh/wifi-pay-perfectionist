// hooks/__tests__/useGreeting.test.tsx — v11.11.0: setiap app ditutup lalu dibuka lagi = sapaan BARU; dalam satu sesi tetap.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_SETTINGS } from '@/types';
import { __resetGreetingSession, useGreeting } from '../useGreeting';
import { GREETING_REOPEN_MS, getGreetingSession } from '@/lib/greetingSession';
import type { GreetStats } from '@/lib/greeting';

const STATS: GreetStats = {
  current: true, members: 10, lunas: 4, belum: 6, lunasPct: 40, hasIncome: true, incomeLabel: 'Rp 400.000', incomePct: null, arrears: null,
};

function setStore(name: string | null, language: 'id' | 'en' = 'id') {
  useAppStore.setState({ userName: name, settings: { ...DEFAULT_SETTINGS, language } } as never);
}
function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => { localStorage.clear(); __resetGreetingSession(); setStore('Budi'); vi.useRealTimers(); });
afterEach(() => { vi.useRealTimers(); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); });

describe('useGreeting', () => {
  it('judul memuat nama tampilan; tanpa nama → judul utuh tanpa nama', () => {
    const { result, rerender } = renderHook(() => useGreeting(STATS));
    expect(result.current.title).toContain('Budi');
    act(() => setStore(''));
    rerender();
    expect(result.current.title).not.toContain('Budi');
    expect(result.current.title).not.toMatch(/,\s*$|undefined|null/);
  });

  it('dalam satu sesi sapaan TETAP (render ulang, pindah menu, ganti nama/bahasa tidak mengganti kalimat)', () => {
    const { result, rerender } = renderHook(() => useGreeting(STATS));
    const first = getGreetingSession().titleId;
    const line = result.current.line;
    for (let i = 0; i < 10; i++) rerender();
    expect(getGreetingSession().titleId).toBe(first);
    expect(result.current.line).toBe(line);
    const { result: second } = renderHook(() => useGreeting(STATS)); // komponen lain/remount (kembali ke Beranda)
    expect(second.current.title).toBe(result.current.title);
    expect(second.current.line).toBe(line);
  });

  it('tutup lalu buka lagi (halaman dimuat ulang) 40 kali: judul selalu berbeda dari sesi sebelumnya', () => {
    const titles: string[] = [];
    for (let i = 0; i < 40; i++) {
      __resetGreetingSession();                           // proses/halaman baru; localStorage (riwayat) TETAP ada
      const { result, unmount } = renderHook(() => useGreeting(STATS));
      titles.push(result.current.title);
      unmount();
    }
    for (let i = 1; i < titles.length; i++) expect(titles[i], `buka ke-${i + 1}`).not.toBe(titles[i - 1]);
    expect(new Set(titles).size).toBeGreaterThan(8);
  });

  it('baris konteks berbeda dari sesi sebelumnya bila ada alternatif; muncul hanya setelah data siap', () => {
    const lines: (string | null)[] = [];
    for (let i = 0; i < 30; i++) {
      __resetGreetingSession();
      const { result, unmount } = renderHook(() => useGreeting(STATS));
      lines.push(result.current.line);
      unmount();
    }
    expect(lines.every(l => !!l)).toBe(true);
    for (let i = 1; i < lines.length; i++) expect(lines[i], `buka ke-${i + 1}`).not.toBe(lines[i - 1]);

    __resetGreetingSession();
    const loading = renderHook(() => useGreeting(null));
    expect(loading.result.current.title).toBeTruthy();
    expect(loading.result.current.line).toBeNull();           // data belum siap → hanya judul
  });

  it('kembali dari latar belakang ≥ 2 menit = sapaan baru; sebentar saja = tetap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0, 0));
    const { result } = renderHook(() => useGreeting(STATS));
    const firstId = getGreetingSession().titleId;
    const firstTitle = result.current.title;

    act(() => setVisibility('hidden'));
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0, 30));          // 30 detik
    act(() => setVisibility('visible'));
    expect(getGreetingSession().titleId).toBe(firstId);
    expect(result.current.title).toBe(firstTitle);

    act(() => setVisibility('hidden'));
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0, 30 + GREETING_REOPEN_MS / 1000 + 1));
    act(() => setVisibility('visible'));
    expect(getGreetingSession().titleId).not.toBe(firstId);
    expect(result.current.title).not.toBe(firstTitle);
  });

  it('riwayat tersimpan di localStorage (judul + baris + nada)', () => {
    renderHook(() => useGreeting(STATS));
    const h = JSON.parse(localStorage.getItem('wp_greet_recent') || '{}');
    expect(h.titles).toHaveLength(1);
    expect(h.tones).toHaveLength(1);
    expect(h.lines).toHaveLength(1);
  });

  it('English memakai kalimat Inggris', () => {
    setStore('Alex', 'en');
    const { result } = renderHook(() => useGreeting(STATS));
    expect(result.current.title).toContain('Alex');
    expect(result.current.title).not.toMatch(/Selamat|Pagi|Siang|Sore|Malam/);
  });
});
