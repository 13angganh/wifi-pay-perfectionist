// app/__tests__/boundary.test.tsx — REDESAIN T11: layar galat rute, 404, dan galat global.
// Perilaku zip utuh (pesan error asli, Coba Lagi = reset, Dashboard) + teks lewat kamus id/en + tanpa emoji.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
vi.mock('next/navigation', () => ({ useRouter: () => nav, usePathname: () => '/dashboard' }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => <a href={href} {...p}>{children}</a>,
}));

import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_SETTINGS } from '@/types';
import ErrorPage from '@/app/(app)/error';
import NotFound from '@/app/(app)/not-found';
import GlobalError from '@/app/global-error';

const lang = (language: 'id' | 'en') => useAppStore.setState({ settings: { ...DEFAULT_SETTINGS, language } } as never);

let errSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { nav.push.mockClear(); lang('id'); errSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { errSpy.mockRestore(); localStorage.clear(); });

describe('app/(app)/error.tsx', () => {
  it('menampilkan judul + pesan error asli; mencatat ke console', () => {
    const err = new Error('Gagal memuat data member');
    render(<ErrorPage error={err} reset={() => {}} />);
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    expect(screen.getByText('Gagal memuat data member')).toBeInTheDocument();
    expect(errSpy).toHaveBeenCalledWith('[WiFi-Pay Error]', err);
  });

  it('pesan kosong → teks bawaan dari kamus', () => {
    render(<ErrorPage error={new Error('')} reset={() => {}} />);
    expect(screen.getByText('Halaman ini mengalami kesalahan. Coba muat ulang atau kembali ke Beranda.')).toBeInTheDocument();
  });

  it('Coba Lagi = reset(); Dashboard = router.push("/dashboard")', async () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('x')} reset={reset} />);
    await userEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(reset).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Beranda' }));
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
  });

  it('mengikuti bahasa Inggris', () => {
    lang('en');
    render(<ErrorPage error={new Error('')} reset={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});

describe('app/(app)/not-found.tsx', () => {
  it('judul + tautan Ke Dashboard (tautan sungguhan, bukan tombol)', () => {
    render(<NotFound />);
    expect(screen.getByText('Halaman Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ke Beranda/ })).toHaveAttribute('href', '/dashboard');
  });

  it('mengikuti bahasa Inggris', () => {
    lang('en');
    render(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Dashboard/ })).toHaveAttribute('href', '/dashboard');
  });
});

describe('app/global-error.tsx (di luar provider: teks lewat t() non-hook, bahasa dari wp_settings)', () => {
  const html = () => renderToStaticMarkup(<GlobalError error={new Error('boom')} reset={() => {}} />);

  it('Indonesia secara bawaan; tanpa emoji (ikon = SVG Phosphor)', () => {
    const out = html();
    expect(out).toContain('Terjadi Kesalahan');
    expect(out).toContain('Aplikasi mengalami kesalahan yang tidak terduga. Coba muat ulang halaman.');
    expect(out).toContain('Coba Lagi');
    expect(out).toContain('<svg');
    expect(/\p{Extended_Pictographic}/u.test(out)).toBe(false);
  });

  it('bahasa Inggris bila wp_settings.language = en', () => {
    localStorage.setItem('wp_settings', JSON.stringify({ language: 'en' }));
    const out = html();
    expect(out).toContain('Something went wrong');
    expect(out).toContain('Try Again');
  });
});
