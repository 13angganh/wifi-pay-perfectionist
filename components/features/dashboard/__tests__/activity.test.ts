// components/features/dashboard/__tests__/activity.test.ts
// REDESAIN T7 — A12 Aktivitas Terbaru: pemetaan ikon/warna, pembersih tag, nominal, format waktu.
import { describe, it, expect, vi } from 'vitest';

// store → lib/db → lib/firebase menginisialisasi Auth; di jsdom tanpa API key itu melempar. Sama dengan test layar lain.
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
import { getActivityMeta, stripActionTag, extractAmount, formatActivityTime } from '../DashboardView.RecentActivity';

const labels = { today: 'Hari ini', yesterday: 'Kemarin' };

describe('getActivityMeta', () => {
  it('pembayaran → lunas', () => {
    expect(getActivityMeta('[PAY] Quick Pay Rekap KRS - WILDAN').tone).toBe('lunas');
    expect(getActivityMeta('Hapus bayar ABIL').tone).toBe('lunas'); // aturan "bayar" lebih dulu, sama dengan LogView
  });
  it('hapus → belum; tambah/edit → blue', () => {
    expect(getActivityMeta('[DEL] Hapus Member AKBAR').tone).toBe('belum');
    expect(getActivityMeta('[ADD] Tambah Member ADIT').tone).toBe('blue');
    expect(getActivityMeta('[EDIT] Edit Member AJI').tone).toBe('blue');
  });
  it('login/logout/gratis/sync', () => {
    expect(getActivityMeta('Login').tone).toBe('teal');
    expect(getActivityMeta('Logout').tone).toBe('slate');
    expect(getActivityMeta('[FREE] Set Gratis').tone).toBe('purple');
    expect(getActivityMeta('[SYNC] x').tone).toBe('blue');
  });
  it('tidak dikenal → soft', () => { expect(getActivityMeta('sesuatu').tone).toBe('soft'); expect(getActivityMeta('').tone).toBe('soft'); });
});

describe('stripActionTag', () => {
  it('membuang penanda di awal saja', () => {
    expect(stripActionTag('[PAY] Quick Pay Entry KRS - ABIL')).toBe('Quick Pay Entry KRS - ABIL');
    expect(stripActionTag('Login [PAY]')).toBe('Login [PAY]');
    expect(stripActionTag('')).toBe('');
  });
});

describe('extractAmount', () => {
  it('hanya untuk aksi [PAY] yang detailnya memuat Rp', () => {
    expect(extractAmount('[PAY] Quick Pay', 'Oktober 2024: Rp 100.000')).toBe('Rp 100.000');
    expect(extractAmount('[DEL] Hapus', 'Rp 100.000')).toBeNull();
    expect(extractAmount('[PAY] Batch Pay', 'ABIL: tanpa nominal')).toBeNull();
    expect(extractAmount('[PAY] Quick Pay', undefined)).toBeNull();
  });
});

describe('formatActivityTime', () => {
  const now = new Date(2026, 9, 14, 12, 0, 0);
  it('hari ini', () => {
    const ts = new Date(2026, 9, 14, 10, 24).getTime();
    expect(formatActivityTime(ts, now, labels).startsWith('Hari ini, ')).toBe(true);
  });
  it('kemarin, termasuk melewati batas bulan', () => {
    const n2 = new Date(2026, 10, 1, 9, 0);
    const ts = new Date(2026, 9, 31, 18, 30).getTime();
    expect(formatActivityTime(ts, n2, labels).startsWith('Kemarin, ')).toBe(true);
  });
  it('lebih lama → tanggal lokal + jam (bukan Hari ini/Kemarin)', () => {
    const ts = new Date(2026, 9, 10, 8, 5).getTime();
    const s = formatActivityTime(ts, now, labels);
    expect(s.startsWith('Hari ini')).toBe(false);
    expect(s.startsWith('Kemarin')).toBe(false);
    expect(s).toContain(new Date(ts).toLocaleDateString());
  });
});
