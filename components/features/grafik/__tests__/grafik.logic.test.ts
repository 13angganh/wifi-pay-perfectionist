// components/features/grafik/__tests__/grafik.logic.test.ts — REDESAIN T9
// Perhitungan murni Grafik: rumus zip dipertahankan, A25/A26, dan zona kustom = KRS/SLK (2 sampai 5 zona, mode TOTAL).
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import {
  TOTAL_ZONE, activeCustomerCount, avgNonZero, compactRp, memberCount, monthTotals, pctChange, periodTotal,
  prevMonthOf, projection, series12, statusBreakdown, transactionCount, withAlpha, yearTotals, zoneMonthTotals, zonesFor,
} from '../grafik.logic';

const Y = 2026;
const data = (over: Partial<AppData> = {}): AppData => ({
  ...DEFAULT_APP_DATA,
  krsMembers: ['A', 'B', 'C'],
  slkMembers: ['S'],
  zoneMembers: { TIMUR: ['T1', 'T2'] },
  payments: {
    [`KRS__A__${Y}__8`]: 100, [`KRS__B__${Y}__8`]: 100, [`KRS__A__${Y}__9`]: 100, [`KRS__C__${Y}__9`]: 0,
    [`SLK__S__${Y}__9`]: 70,
    [`TIMUR__T1__${Y}__9`]: 40, [`TIMUR__T2__${Y}__9`]: 60, [`TIMUR__T1__${Y - 1}__9`]: 10,
  },
  freeMembers: { KRS__B: { active: true, fromYear: Y, fromMonth: 9 } },
  ...over,
});
const settings = { ...DEFAULT_SETTINGS, customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] as string[] };

describe('zonesFor / memberCount', () => {
  it('zona tunggal = dirinya sendiri; TOTAL = semua zona aktif (bawaan + kustom tampil)', () => {
    expect(zonesFor('KRS', settings)).toEqual(['KRS']);
    expect(zonesFor('TIMUR', settings)).toEqual(['TIMUR']);
    expect(zonesFor(TOTAL_ZONE, settings)).toEqual(['KRS', 'SLK', 'TIMUR']);
  });
  it('zona kustom tersembunyi tidak ikut TOTAL', () => {
    expect(zonesFor(TOTAL_ZONE, { ...settings, hiddenZones: ['TIMUR'] })).toEqual(['KRS', 'SLK']);
  });
  it('memberCount menghitung anggota tiap zona (zona kustom dari zoneMembers, bukan SLK)', () => {
    expect(memberCount(data(), ['TIMUR'])).toBe(2);
    expect(memberCount(data(), ['KRS', 'SLK', 'TIMUR'])).toBe(6);
    expect(memberCount(data(), ['GHAIB'])).toBe(0);
  });
});

describe('total pendapatan', () => {
  it('zoneMonthTotals zona kustom dari anggotanya; monthTotals = jumlah zona', () => {
    expect(zoneMonthTotals(data(), 'TIMUR', Y)[9]).toBe(100);
    expect(zoneMonthTotals(data(), 'SLK', Y)[9]).toBe(70);
    expect(monthTotals(data(), ['KRS', 'SLK', 'TIMUR'], Y)[9]).toBe(100 + 0 + 70 + 100);
    expect(monthTotals(data(), ['KRS'], Y)[8]).toBe(200);
  });
  it('yearTotals per tahun; periodTotal satu bulan', () => {
    expect(yearTotals(data(), ['TIMUR'], [Y - 1, Y])).toEqual([10, 100]);
    expect(periodTotal(data(), ['TIMUR'], Y, 9)).toBe(100);
    expect(periodTotal(data(), ['KRS', 'SLK', 'TIMUR'], Y, 9)).toBe(270);
  });
  it('2 sampai 5 zona: jumlah garis zona = total garis TOTAL tiap bulan', () => {
    for (let n = 2; n <= 5; n++) {
      const names = ['KRS', 'SLK', 'Z3', 'Z4', 'Z5'].slice(0, n);
      const zoneMembers: Record<string, string[]> = {};
      const payments: Record<string, number> = {};
      names.forEach((z, zi) => {
        const mem = [`${z}1`, `${z}2`];
        if (z !== 'KRS' && z !== 'SLK') zoneMembers[z] = mem;
        mem.forEach((m, mi) => { payments[`${z}__${m}__${Y}__${mi}`] = (zi + 1) * 10; });
      });
      const d = data({ krsMembers: ['KRS1', 'KRS2'], slkMembers: ['SLK1', 'SLK2'], zoneMembers, payments });
      const lines = names.map(z => zoneMonthTotals(d, z, Y));
      const total = monthTotals(d, names, Y);
      total.forEach((v, i) => expect(v).toBe(lines.reduce((s, l) => s + l[i], 0)));
      expect(total.reduce((a, b) => a + b, 0)).toBe(names.reduce((s, _, zi) => s + (zi + 1) * 20, 0));
    }
  });
});

describe('rumus zip', () => {
  it('pctChange: null bila tahun lalu 0/tidak ada; dibulatkan', () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(10, undefined)).toBeNull();
    expect(pctChange(100, 300)).toBe(-67);
  });
  it('avgNonZero: rata-rata bulan terisi, 0 bila kosong', () => {
    expect(avgNonZero([0, 100, 200, 0])).toBe(150);
    expect(avgNonZero([0, 0])).toBe(0);
  });
  it('projection: rata-rata 3 bulan terakhir terisi sampai bulan sekarang', () => {
    const m = [100, 0, 200, 300, 400, 0, 999, 0, 0, 0, 0, 0];
    expect(projection(m, 4)).toEqual({ value: 300, basis: 3 });     // 200,300,400
    expect(projection(m, 1)).toEqual({ value: 100, basis: 1 });
    expect(projection([0, 0, 0], 2)).toEqual({ value: 0, basis: 0 });
  });
  it('prevMonthOf: Januari → Desember tahun lalu', () => {
    expect(prevMonthOf(2026, 0)).toEqual({ year: 2025, month: 11 });
    expect(prevMonthOf(2026, 5)).toEqual({ year: 2026, month: 4 });
  });
});

describe('komposisi dan A25/A26', () => {
  it('statusBreakdown: gratis dulu, lalu lunas (termasuk nilai 0), sisanya belum; zona kustom dari anggotanya', () => {
    expect(statusBreakdown(data(), ['KRS'], Y, 9)).toEqual({ lunas: 2, belum: 0, free: 1, total: 3 }); // A lunas, B gratis, C bayar 0 = lunas
    expect(statusBreakdown(data(), ['TIMUR'], Y, 9)).toEqual({ lunas: 2, belum: 0, free: 0, total: 2 });
    expect(statusBreakdown(data(), ['TIMUR'], Y, 3)).toEqual({ lunas: 0, belum: 2, free: 0, total: 2 });
  });
  it('statusBreakdown TOTAL menjumlah semua zona', () => {
    expect(statusBreakdown(data(), ['KRS', 'SLK', 'TIMUR'], Y, 9)).toEqual({ lunas: 5, belum: 0, free: 1, total: 6 });
  });
  it('A25 transactionCount: pembayaran tercatat bukan gratis; A26 activeCustomerCount: lunas + gratis', () => {
    expect(transactionCount(data(), ['KRS'], Y, 9)).toBe(2);        // A (100) dan C (0 tercatat); B gratis tidak dihitung
    expect(activeCustomerCount(data(), ['KRS'], Y, 9)).toBe(3);     // A, B (gratis), C
    expect(transactionCount(data(), ['TIMUR'], Y, 9)).toBe(2);
    expect(activeCustomerCount(data(), ['KRS', 'SLK', 'TIMUR'], Y, 9)).toBe(6);
    expect(transactionCount(data(), ['KRS'], Y, 0)).toBe(0);
  });
  it('series12 menghasilkan 12 nilai', () => {
    expect(series12(m => m)).toHaveLength(12);
    expect(series12(m => transactionCount(data(), ['KRS'], Y, m))[8]).toBe(2);
  });
});

describe('format', () => {
  it('compactRp (nilai dalam ribuan rupiah): rb, jt, M; pemisah desimal mengikuti bahasa', () => {
    expect(compactRp(0)).toBe('0');
    expect(compactRp(500)).toBe('500rb');
    expect(compactRp(1000)).toBe('1jt');
    expect(compactRp(1500)).toBe('1,5jt');
    expect(compactRp(1500, 'en')).toBe('1.5jt');
    expect(compactRp(2500000)).toBe('2,5M');
    expect(compactRp(0.5)).toBe('500');
    expect(compactRp(-1000)).toBe('-1jt');
  });
  it('withAlpha: hex 6 digit diberi alpha; selain itu apa adanya', () => {
    expect(withAlpha('#3B82F6', 0.5)).toBe('#3B82F680');
    expect(withAlpha('var(--zc)', 0.5)).toBe('var(--zc)');
  });
});
