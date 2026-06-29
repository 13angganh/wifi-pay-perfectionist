// lib/__tests__/export.wa.test.ts
// v11.5 — unit test untuk doWABlast: memvalidasi kalkulasi total tagihan memakai
// tarif yang DIBERIKAN (per-member), bukan nilai tetap. Konteks bug yang diperbaiki:
// caller (TunggakanView.tsx) sebelumnya selalu mengirim quickAmounts[0] (tarif default
// global) ke fungsi ini, padahal setiap member bisa punya tarif berbeda (50rb vs 100rb).
// doWABlast sendiri sudah benar secara matematis sejak awal — tes ini mengunci formula
// tersebut agar regresi di masa depan (baik di fungsi ini maupun pemanggilnya) tertangkap.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { doWABlast } from '@/lib/export.wa';

describe('doWABlast', () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
  });

  it('tidak membuka window jika tidak ada bulan tunggakan', () => {
    doWABlast('ANI', 'KRS', [], 100);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('menghitung total dengan benar untuk tarif 100rb, 2 bulan tunggakan', () => {
    doWABlast('ANI', 'KRS', [{ label: 'Jan 2026' }, { label: 'Feb 2026' }], 100);
    const url = openSpy.mock.calls[0][0] as string;
    const decoded = decodeURIComponent(url);
    // 2 bulan × 100 × 1000 = 200.000
    expect(decoded).toContain('200.000');
  });

  it('menghitung total dengan benar untuk tarif 50rb (member dengan tarif lebih rendah)', () => {
    doWABlast('BUDI', 'KRS', [{ label: 'Jan 2026' }, { label: 'Feb 2026' }], 50);
    const url = openSpy.mock.calls[0][0] as string;
    const decoded = decodeURIComponent(url);
    // 2 bulan × 50 × 1000 = 100.000 — BUKAN 200.000 (yang akan terjadi jika tarif
    // tetap memakai default 100 padahal member ini tarifnya 50, sesuai bug yang dilaporkan)
    expect(decoded).toContain('100.000');
    expect(decoded).not.toContain('200.000');
  });

  it('member berbeda dengan tarif berbeda menghasilkan total yang BERBEDA untuk jumlah bulan tunggakan yang sama', () => {
    doWABlast('ANI',  'KRS', [{ label: 'Jan 2026' }], 100);
    doWABlast('BUDI', 'KRS', [{ label: 'Jan 2026' }], 50);
    const totalAni  = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    const totalBudi = decodeURIComponent(openSpy.mock.calls[1][0] as string);
    expect(totalAni).toContain('100.000');  // 1 × 100 × 1000
    expect(totalBudi).toContain('50.000');  // 1 × 50  × 1000
    expect(totalAni).not.toBe(totalBudi);
  });

  it('menghitung total dengan benar untuk 5 bulan tunggakan tarif 100rb', () => {
    const unpaid = Array.from({ length: 5 }, (_, i) => ({ label: `Bulan ${i + 1}` }));
    doWABlast('ANI', 'KRS', unpaid, 100);
    const decoded = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    // 5 × 100 × 1000 = 500.000
    expect(decoded).toContain('500.000');
  });

  it('menyertakan nama member dan zona pada pesan', () => {
    doWABlast('SARI', 'SLK', [{ label: 'Mar 2026' }], 100);
    const decoded = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    expect(decoded).toContain('SARI');
    expect(decoded).toContain('SLK');
  });

  it('menyertakan semua label bulan tunggakan pada pesan', () => {
    doWABlast('ANI', 'KRS', [{ label: 'Jan 2026' }, { label: 'Feb 2026' }, { label: 'Mar 2026' }], 100);
    const decoded = decodeURIComponent(openSpy.mock.calls[0][0] as string);
    expect(decoded).toContain('Jan 2026');
    expect(decoded).toContain('Feb 2026');
    expect(decoded).toContain('Mar 2026');
    expect(decoded).toContain('3 bulan');
  });
});
