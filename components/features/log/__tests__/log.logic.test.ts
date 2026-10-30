// components/features/log/__tests__/log.logic.test.ts — REDESAIN T10 (Log: aturan zip + A27/A28/A29)
import { describe, it, expect } from 'vitest';
import type { ActivityLog } from '@/types';
import {
  LOG_LIMIT, isPayLog, logKind, filterLogs, isFilterActive, countByKind, groupByDay, statsPeriod, dailyCounts,
  recentLogs, findLogByTs, formatClock,
} from '../log.logic';

const L = (action: string, ts: number, detail = '', user = 'owner'): ActivityLog => ({ action, ts, detail, user });
const D = (y: number, m: number, d: number, h = 10) => new Date(y, m, d, h, 0, 0).getTime();

describe('isPayLog — aturan "Hanya Bayar" zip, tidak berubah', () => {
  it('mengenali Quick Pay, [PAY], [DEL], [FREE], "Hapus bayar" dan awalan legacy', () => {
    expect(isPayLog('Quick Pay ABIL')).toBe(true);
    expect(isPayLog('[PAY] Bayar')).toBe(true);
    expect(isPayLog('[DEL] Hapus')).toBe(true);
    expect(isPayLog('[FREE] Gratis')).toBe(true);
    expect(isPayLog('Hapus bayar ABIL')).toBe(true);
    expect(isPayLog('\u{1F4B0} lama')).toBe(true);
  });
  it('bukan pembayaran: kosong, Login, Tambah Member', () => {
    expect(isPayLog('')).toBe(false);
    expect(isPayLog('Login')).toBe(false);
    expect(isPayLog('Tambah member X')).toBe(false);
  });
});

describe('A27 — logKind eksklusif', () => {
  it('Pembayaran menang atas Sistem/Data', () => {
    expect(logKind('[PAY] Bayar ABIL')).toBe('pay');
  });
  it('Sistem: Login/Masuk/Logout/Keluar/Kunci/Lock/Sync (dengan atau tanpa tag)', () => {
    for (const a of ['Login owner', 'Masuk', 'Logout', 'Keluar', 'Kunci global', 'Lock entry', 'Sync data', '[SYNC] Sinkron', '[LOGIN] x']) expect(logKind(a), a).toBe('sys');
  });
  it('Data: sisanya', () => {
    for (const a of ['Tambah member BUDI', '[OPS] Update operasional', 'Ubah tarif', '']) expect(logKind(a), a).toBe('data');
  });
});

describe('filterLogs — pencarian, jenis, tahun, bulan', () => {
  const logs = [
    L('[PAY] Bayar ABIL', D(2026, 9, 18), 'Rp 100.000'),
    L('Tambah member BUDI', D(2026, 9, 17)),
    L('Login owner', D(2026, 8, 30)),
    L('[OPS] Update operasional', D(2025, 11, 2), 'Desember'),
  ];
  const base = { type: 'all' as const, query: '', year: '', month: '' };
  it('semua → tidak menyaring', () => expect(filterLogs(logs, base)).toHaveLength(4));
  it('jenis', () => {
    expect(filterLogs(logs, { ...base, type: 'pay' })).toHaveLength(1);
    expect(filterLogs(logs, { ...base, type: 'sys' })).toHaveLength(1);
    expect(filterLogs(logs, { ...base, type: 'data' })).toHaveLength(2);
  });
  it('cari di aksi DAN detail, tidak peka huruf besar', () => {
    expect(filterLogs(logs, { ...base, query: 'abil' })).toHaveLength(1);
    expect(filterLogs(logs, { ...base, query: 'desember' })).toHaveLength(1);
  });
  it('tahun + bulan; ignoreType mengabaikan jenis', () => {
    expect(filterLogs(logs, { ...base, year: '2026' })).toHaveLength(3);
    expect(filterLogs(logs, { ...base, year: '2026', month: '9' })).toHaveLength(2);
    expect(filterLogs(logs, { ...base, type: 'pay', year: '2026', month: '9' }, true)).toHaveLength(2);
  });
  it('isFilterActive', () => {
    expect(isFilterActive(base)).toBe(false);
    expect(isFilterActive({ ...base, query: ' ' })).toBe(false);
    expect(isFilterActive({ ...base, month: '0' })).toBe(true); // '0' = Januari → filter aktif
  });
  it('batas tampil 150 baris', () => expect(LOG_LIMIT).toBe(150));
});

describe('countByKind + A29 statistik', () => {
  const logs = [L('[PAY] a', 1), L('[PAY] b', 2), L('Tambah x', 3), L('Login', 4)];
  it('menghitung total/pay/data/sys', () => expect(countByKind(logs)).toEqual({ total: 4, pay: 2, data: 1, sys: 1 }));
  it('statsPeriod: bulan terpilih bila ada', () => {
    expect(statsPeriod(logs, '2026', '3', new Date(2026, 9, 18))).toEqual({ year: 2026, month: 3 });
    expect(statsPeriod(logs, '', '3', new Date(2026, 9, 18))).toEqual({ year: 2026, month: 3 });
  });
  it('statsPeriod: tanpa bulan → bulan entri terbaru', () => {
    const l = [L('a', D(2026, 7, 5)), L('b', D(2026, 8, 20))];
    expect(statsPeriod(l, '', '', new Date(2026, 9, 18))).toEqual({ year: 2026, month: 8 });
    expect(statsPeriod([], '', '', new Date(2026, 9, 18))).toEqual({ year: 2026, month: 9 });
  });
  it('dailyCounts: panjang = jumlah hari bulan, hitung per tanggal', () => {
    const l = [L('a', D(2026, 9, 1)), L('b', D(2026, 9, 1, 15)), L('c', D(2026, 9, 31)), L('d', D(2026, 8, 1))];
    const c = dailyCounts(l, 2026, 9);
    expect(c).toHaveLength(31);
    expect(c[0]).toBe(2); expect(c[30]).toBe(1);
    expect(c.reduce((a, b) => a + b, 0)).toBe(3);
    expect(dailyCounts([], 2026, 1)).toHaveLength(28);
  });
  it('recentLogs: terbaru dulu, maksimal n, tidak memutasi', () => {
    const l = [L('a', 1), L('b', 3), L('c', 2), L('d', 4)];
    expect(recentLogs(l, 3).map(x => x.action)).toEqual(['d', 'b', 'c']);
    expect(l.map(x => x.action)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('groupByDay — Hari ini / Kemarin / tanggal', () => {
  const now = new Date(2026, 9, 18, 12);
  const labels = { today: 'Hari ini', yesterday: 'Kemarin' };
  it('mengelompokkan berurutan dan menamai', () => {
    const logs = [L('a', D(2026, 9, 18, 9)), L('b', D(2026, 9, 18, 8)), L('c', D(2026, 9, 17)), L('d', D(2026, 9, 1))];
    const g = groupByDay(logs, now, labels);
    expect(g.map(x => x.label).slice(0, 2)).toEqual(['Hari ini', 'Kemarin']);
    expect(g[0].items).toHaveLength(2);
    expect(g).toHaveLength(3);
    expect(g[2].label).not.toMatch(/Hari ini|Kemarin/);
  });
  it('kosong → kosong', () => expect(groupByDay([], now, labels)).toEqual([]));
});

describe('A28 — findLogByTs + format', () => {
  it('menemukan log berdasarkan ts', () => {
    const l = [L('a', 10), L('b', 20)];
    expect(findLogByTs(l, 20)?.action).toBe('b');
    expect(findLogByTs(l, 99)).toBeUndefined();
  });
  it('formatClock menghasilkan jam:menit', () => expect(formatClock(D(2026, 9, 18, 9))).toMatch(/\d{1,2}[.:]\d{2}/));
});
