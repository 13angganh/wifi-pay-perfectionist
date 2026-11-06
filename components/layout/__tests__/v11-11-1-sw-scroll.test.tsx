// v11.11.1 — pendaftaran Service Worker + bayangan scroll (hanya bila bisa digulir)
import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';
import { computeScrollFade, useScrollFade } from '@/hooks/useScrollFade';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('ServiceWorkerRegister', () => {
  function stubSW() {
    const register = vi.fn(() => Promise.resolve({}));
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true });
    return register;
  }
  it('produksi: mendaftarkan /sw.js (scope /, tanpa cache HTTP)', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = stubSW();
    render(<ServiceWorkerRegister />);
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  });
  it('pengembangan/tes: tidak mendaftar', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const register = stubSW();
    render(<ServiceWorkerRegister />);
    expect(register).not.toHaveBeenCalled();
  });
  it('galat pendaftaran tidak melempar (app tetap jalan online)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const register = vi.fn(() => Promise.reject(new Error('x')));
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true });
    expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    await Promise.resolve();
  });
});

describe('computeScrollFade — tampil hanya bila ada yang bisa digulir dan masih ada isi di bawah', () => {
  it('halaman pendek (tidak bisa digulir) → tidak tampil', () => {
    expect(computeScrollFade({ scrollHeight: 500, scrollTop: 0, clientHeight: 500 })).toBe(false);
    expect(computeScrollFade({ scrollHeight: 503, scrollTop: 0, clientHeight: 500 })).toBe(false); // selisih kecil dianggap tidak bisa digulir
  });
  it('bisa digulir dan masih ada isi di bawah → tampil', () => {
    expect(computeScrollFade({ scrollHeight: 1500, scrollTop: 0, clientHeight: 500 })).toBe(true);
    expect(computeScrollFade({ scrollHeight: 1500, scrollTop: 400, clientHeight: 500 })).toBe(true);
  });
  it('sudah di dasar → tidak tampil', () => {
    expect(computeScrollFade({ scrollHeight: 1500, scrollTop: 1000, clientHeight: 500 })).toBe(false);
    expect(computeScrollFade({ scrollHeight: 1500, scrollTop: 980, clientHeight: 500 })).toBe(false); // < 32px dari dasar
  });
});

describe('useScrollFade', () => {
  function el(h: { scrollHeight: number; scrollTop: number; clientHeight: number }) {
    const d = document.createElement('div');
    Object.defineProperties(d, {
      scrollHeight: { get: () => h.scrollHeight }, scrollTop: { get: () => h.scrollTop }, clientHeight: { get: () => h.clientHeight },
    });
    return d;
  }
  it('mulai tidak tampil; tampil setelah diukur pada isi yang panjang; hilang saat pindah ke halaman pendek', () => {
    // rAF meniru browser: callback dijalankan NANTI (di-flush manual), bukan sinkron.
    let queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queue.push(cb); return queue.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const flush = () => act(() => { const q = queue; queue = []; q.forEach(f => f(0)); });

    const m = { scrollHeight: 1500, scrollTop: 0, clientHeight: 500 };
    const ref = { current: el(m) };
    const { result, rerender } = renderHook(({ k }) => useScrollFade(ref, k), { initialProps: { k: '/rekap' } });
    expect(result.current.visible).toBe(false);        // belum diukur
    flush();
    expect(result.current.visible).toBe(true);         // isi panjang, masih ada di bawah

    m.scrollHeight = 480;                              // pindah ke halaman pendek
    rerender({ k: '/tunggakan' });
    flush();
    expect(result.current.visible).toBe(false);

    m.scrollHeight = 1500; m.scrollTop = 1000;         // halaman panjang digulir sampai dasar
    act(() => result.current.onScroll());
    flush();
    expect(result.current.visible).toBe(false);
  });
});
