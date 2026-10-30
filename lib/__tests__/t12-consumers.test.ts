// lib/__tests__/t12-consumers.test.ts — REDESAIN T12 (S2 + S4): konsumen status (Dashboard, Tunggakan, Grafik, Rekap, Batch,
// WA, Export) memperlakukan bulan Belum terdaftar / Nonaktif tanpa pembayaran sebagai N/A (tidak terhitung), dan satu
// helper tanggal bayar (lokal, bukan UTC) untuk semua jalur.
// Tanggal "sekarang" untuk uji jam 00:30 WIB: zona waktu diset ke Asia/Jakarta di awal berkas.
process.env.TZ = 'Asia/Jakarta';

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { DEFAULT_APP_DATA, buildGranularPaymentPatch } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import { computeDashboard } from '@/hooks/useDashboard';
import { buildTunggakan } from '@/hooks/useTunggakan';
import { statusBreakdown } from '@/components/features/grafik/grafik.logic';
import { isBatchEligible } from '@/components/features/entry/batch';
import { refStatus, statusCounts, filterByStatus, cellState, cellKind, rowTotal, columnTotals } from '@/components/features/rekap/rekap.logic';
import { doWASummary } from '@/lib/export.wa';
import { exportStatusLabel } from '@/lib/export.excel';
import { getKey } from '@/lib/payment';
import {
  localDateISO, isIsoDate, resolvePayDate, setPayDate, setPayDates, payDatePatch,
  applyPayDatePatch, readPayDate, restorePayDate,
} from '@/lib/payDate';

const Y = 2026, M = 9; // Oktober 2026

function payRange(zone: string, name: string, from: [number, number], to: [number, number], skip: [number, number][] = [], v = 100) {
  const out: Record<string, number> = {};
  for (let y = from[0]; y <= to[0]; y++) {
    for (let m = (y === from[0] ? from[1] : 0); m <= (y === to[0] ? to[1] : 11); m++) {
      if (skip.some(([sy, sm]) => sy === y && sm === m)) continue;
      out[getKey(zone, name, y, m)] = v;
    }
  }
  return out;
}

// Per Okt 2026:  ABIL lunas · ADIT belum terdaftar · AKBAR nonaktif · ALFIN nonaktif TAPI sudah bayar (lunas, D3)
//                ANA free (rekaman lama) · AYU belum (tunggakan tepat 1 bulan)
function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ALFIN', 'ANA', 'AYU'], slkMembers: [], zoneMembers: {},
    payments: {
      ...payRange('KRS', 'ABIL', [2023, 0], [Y, M]),
      ...payRange('KRS', 'AKBAR', [2026, 0], [Y, M - 1]),
      ...payRange('KRS', 'ALFIN', [2026, 0], [Y, M - 1]),
      [getKey('KRS', 'ALFIN', Y, M)]: 90,
      ...payRange('KRS', 'AYU', [2023, 0], [Y, M], [[Y, M]]),
    },
    freeMembers: { KRS__ANA: { active: true, fromYear: 2023, fromMonth: 0 } },
    memberPeriods: {
      KRS__ADIT:  { joined: { y: Y, m: M + 1 } },
      KRS__AKBAR: { joined: { y: 2026, m: 0 }, inactive: [{ fromY: Y, fromM: M, toY: Y, toM: M }] },
      KRS__ALFIN: { joined: { y: 2026, m: 0 }, inactive: [{ fromY: Y, fromM: M, toY: Y, toM: M }] },
    },
    ...over,
  };
}
const settings = { ...DEFAULT_SETTINGS, customZones: [], hiddenZones: [] as string[] };

describe('Rekap — status, hitungan, dan jenis sel', () => {
  const d = makeData();
  it('refStatus per member pada bulan acuan', () => {
    expect(['ABIL', 'ADIT', 'AKBAR', 'ALFIN', 'ANA', 'AYU'].map(n => refStatus(d, 'KRS', n, Y, M)))
      .toEqual(['lunas', 'belumTerdaftar', 'nonaktif', 'lunas', 'free', 'belum']);
  });
  it('statusCounts: "Belum" tidak menghitung N/A; kunci N/A hanya muncul bila ada', () => {
    const names = d.krsMembers;
    expect(statusCounts(d, 'KRS', names, Y, M)).toEqual({ all: 6, lunas: 2, belum: 1, free: 1, nonaktif: 1, belumTerdaftar: 1 });
    expect(statusCounts(makeData({ memberPeriods: {} }), 'KRS', ['ABIL', 'AYU', 'ANA'], Y, M)).toEqual({ all: 3, lunas: 1, belum: 1, free: 1 });
  });
  it('filterByStatus: belum = hanya yang benar-benar menunggak; nonaktif dapat disaring', () => {
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'belum')).toEqual(['AYU']);
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'nonaktif')).toEqual(['AKBAR']);
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'all')).toHaveLength(6);
  });
  it('cellState: sel N/A bertanda khusus ("na") dengan alasannya; pembayaran di bulan nonaktif tetap sel bayar biasa', () => {
    expect(cellState(d, 'KRS', 'ADIT', Y, M, M)).toEqual({ kind: 'na', na: 'belumTerdaftar' });
    expect(cellState(d, 'KRS', 'AKBAR', Y, M, M)).toEqual({ kind: 'na', na: 'nonaktif' });
    expect(cellState(d, 'KRS', 'ALFIN', Y, M, M)).toEqual({ kind: 'paid' });
    expect(cellKind(d, 'KRS', 'ANA', Y, M, M)).toBe('free');
    expect(cellKind(d, 'KRS', 'AYU', Y, M, M)).toBe('due');
    expect(cellKind(d, 'KRS', 'AYU', Y, M + 1, M)).toBe('future');
  });
  it('total baris/kolom = jumlah pembayaran apa adanya (pembayaran di bulan nonaktif tetap dihitung; N/A tanpa bayar = 0)', () => {
    expect(rowTotal(d, 'KRS', 'ALFIN', Y)).toBe(9 * 100 + 90);
    expect(rowTotal(d, 'KRS', 'ADIT', Y)).toBe(0);
    expect(columnTotals(d, 'KRS', ['AKBAR', 'ALFIN'], Y)[M]).toBe(90);
  });
});

describe('Batch — member N/A dikecualikan', () => {
  it('hanya status "belum" yang boleh dibayar massal', () => {
    const d = makeData();
    expect(d.krsMembers.filter(n => isBatchEligible(d, 'KRS', n, Y, M))).toEqual(['AYU']);
  });
});

describe('Dashboard — N/A bukan lunas, bukan belum, bukan penyebut', () => {
  const r = computeDashboard(makeData(), settings, Y, M);
  const krs = r.zones.find(z => z.zone === 'KRS')!;
  it('ZoneStat memakai member yang TERHITUNG; gratis termasuk lunas', () => {
    expect(krs).toMatchObject({ members: 4, lunas: 3, belum: 1, free: 1, lunasPct: 75 });
    expect(r).toMatchObject({ totalMembers: 4, totalLunas: 3, totalBelum: 1, totalFree: 1, lunasPctNow: 75, totalListed: 6 });
  });
  it('pendapatan tetap dari pembayaran yang tercatat (termasuk bulan nonaktif)', () => {
    expect(krs.total).toBe(100 + 90);
  });
  it('tunggakan terbanyak tidak memuat N/A', () => {
    expect(r.topTunggak.map(a => [a.name, a.count])).toEqual([['AYU', 1]]);
  });
});

describe('Tunggakan — N/A tidak ditagih dan tidak masuk Rajin/Free', () => {
  const r = buildTunggakan(makeData(), ['KRS'], Y, M, '', 100);
  it('hanya AYU menunggak (1 bulan); N/A bukan penunggak', () => {
    expect(r.arrears.map(a => [a.name, a.count, a.amount])).toEqual([['AYU', 1, 100]]);
    expect(r.aging.total).toBe(1);
  });
  it('Rajin hanya yang terhitung & lunas; Free tetap Free; member N/A pada bulan acuan tidak masuk keduanya', () => {
    expect(r.rajin.map(m => m.name)).toEqual(['ABIL', 'ALFIN']);
    expect(r.free.map(m => m.name)).toEqual(['ANA']);
    expect(r.memberCount).toBe(6);
  });
  it('S2: terdaftar sejak Okt 2026 dan Okt belum bayar → tunggakan tepat 1 bulan', () => {
    const d = makeData({ krsMembers: ['BARU'], payments: {}, freeMembers: {}, memberPeriods: { KRS__BARU: { joined: { y: Y, m: M } } } });
    const t = buildTunggakan(d, ['KRS'], Y, M, '', 100);
    expect(t.arrears.map(a => [a.name, a.count])).toEqual([['BARU', 1]]);
  });
});

describe('Grafik — komposisi status tanpa N/A', () => {
  it('total (penyebut kepatuhan) hanya member terhitung', () => {
    expect(statusBreakdown(makeData(), ['KRS'], Y, M)).toEqual({ lunas: 2, belum: 1, free: 1, total: 4 });
  });
});

describe('Ringkasan WA — Lunas/Belum/Tunggakan tanpa N/A', () => {
  let opened = '';
  beforeEach(() => { opened = ''; vi.spyOn(window, 'open').mockImplementation((u?: string | URL) => { opened = decodeURIComponent(String(u)); return null; }); });
  it('menghitung hanya member terhitung; pendapatan = pembayaran tercatat', () => {
    doWASummary(makeData(), Y, M, ['KRS']);
    expect(opened).toContain('KRS : Rp 190.000');
    expect(opened).toMatch(/Lunas\*\s+KRS: 2/);
    expect(opened).toMatch(/Belum Bayar Okt 2026\*\s+KRS: 1/);
    expect(opened).toMatch(/Ada Tunggakan\*\s+KRS: 1/);
  });
});

describe('Export — label status bulanan', () => {
  it('Lunas bila ada pembayaran (termasuk bulan nonaktif); tanpa pembayaran: Gratis / Nonaktif / Belum terdaftar / Belum', () => {
    const d = makeData();
    expect(['ABIL', 'ADIT', 'AKBAR', 'ALFIN', 'ANA', 'AYU'].map(n => exportStatusLabel(d, 'KRS', n, Y, M)))
      .toEqual(['Lunas', 'Belum terdaftar', 'Nonaktif', 'Lunas', 'Gratis', 'Belum']);
  });
});

// ════════════════════════════════════════════════════════════
// S4 — SATU helper tanggal bayar
// ════════════════════════════════════════════════════════════
describe('lib/payDate — tanggal LOKAL, bukan UTC (F4)', () => {
  it('localDateISO pada 00:30 WIB tetap tanggal lokal (toISOString lama mundur ke hari sebelumnya)', () => {
    const d = new Date(2026, 9, 22, 0, 30);                       // 22 Okt 2026 00:30 waktu perangkat
    expect(localDateISO(d)).toBe('2026-10-22');
    if (d.getTimezoneOffset() === -420) expect(d.toISOString().slice(0, 10)).toBe('2026-10-21'); // bukti: UTC salah hari
  });
  it('isIsoDate menolak tanggal yang tidak ada di kalender dan teks bebas', () => {
    expect(isIsoDate('2026-10-05')).toBe(true);
    expect(isIsoDate('2026-02-31')).toBe(false);
    expect(isIsoDate('05/10/2026')).toBe(false);
    expect(isIsoDate('')).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
  it('resolvePayDate: otomatis = hari ini lokal; manual = pilihan valid; manual tanpa pilihan = tidak ada tanggal', () => {
    const now = new Date(2026, 9, 22, 0, 30);
    expect(resolvePayDate(true, null, now)).toBe('2026-10-22');
    expect(resolvePayDate(true, '2020-01-01', now)).toBe('2026-10-22');   // pilihan manual diabaikan saat otomatis
    expect(resolvePayDate(false, '2026-10-05', now)).toBe('2026-10-05');
    expect(resolvePayDate(false, null, now)).toBeNull();
    expect(resolvePayDate(false, 'bukan tanggal', now)).toBeNull();
  });
  it('setPayDate menulis memberInfo[ZONA__NAMA].date_Y_M tanpa mengubah masukan; tanpa tanggal = data apa adanya', () => {
    const d = makeData();
    const snap = JSON.stringify(d);
    const out = setPayDate(d, 'KRS', 'ABIL', Y, M, '2026-10-22');
    expect(out.memberInfo!['KRS__ABIL']['date_2026_9']).toBe('2026-10-22');
    expect(JSON.stringify(d)).toBe(snap);
    expect(setPayDate(d, 'KRS', 'ABIL', Y, M, null)).toBe(d);
  });
  it('setPayDates (batch) menulis untuk semua nama dan mempertahankan data member lain', () => {
    const d = makeData({ memberInfo: { KRS__AYU: { tarif: 100, 'date_2026_8': '2026-09-01' } } });
    const out = setPayDates(d, 'KRS', ['AYU', 'ABIL'], Y, M, '2026-10-22');
    expect(out.memberInfo!['KRS__AYU']).toEqual({ tarif: 100, 'date_2026_8': '2026-09-01', 'date_2026_9': '2026-10-22' });
    expect(out.memberInfo!['KRS__ABIL']['date_2026_9']).toBe('2026-10-22');
    expect(setPayDates(d, 'KRS', [], Y, M, '2026-10-22')).toBe(d);
  });
  it('zona kustom memakai kunci ZONA__NAMA yang sama', () => {
    const out = setPayDate(makeData(), 'TIMUR', 'CITRA', Y, M, '2026-10-22');
    expect(out.memberInfo!['TIMUR__CITRA']['date_2026_9']).toBe('2026-10-22');
  });
  it('payDatePatch / applyPayDatePatch / readPayDate / restorePayDate (jalur tulis granular + rollback)', () => {
    const p = payDatePatch('KRS', 'ABIL', Y, M, '2026-10-22')!;
    expect(p).toEqual({ infoKey: 'KRS__ABIL', dateKey: 'date_2026_9', date: '2026-10-22' });
    expect(payDatePatch('KRS', 'ABIL', Y, M, null)).toBeUndefined();
    const base = makeData({ memberInfo: { KRS__ABIL: { 'date_2026_9': '2026-10-01' } } });
    expect(readPayDate(base, p)).toBe('2026-10-01');
    const applied = applyPayDatePatch(base, p);
    expect(readPayDate(applied, p)).toBe('2026-10-22');
    expect(applyPayDatePatch(base, undefined)).toBe(base);
    expect(readPayDate(restorePayDate(applied, p, '2026-10-01'), p)).toBe('2026-10-01');
    expect('date_2026_9' in restorePayDate(applied, p, undefined).memberInfo!['KRS__ABIL']).toBe(false);
  });
});

describe('buildGranularPaymentPatch — tanggal bayar ikut dalam update() atomik yang sama', () => {
  const lock = { globalLocked: false, lockedEntries: {} };
  const log = { action: '[PAY] x', detail: 'y' };
  it('tanpa payDate: patch lama persis (tidak ada jalur memberInfo)', () => {
    const patch = buildGranularPaymentPatch('KRS__ABIL__2026__9', 100, [], log, 'a@b.c', lock, 5);
    expect(Object.keys(patch).sort()).toEqual(['_globalLocked', '_lockedEntries', 'activityLog', 'payments/KRS__ABIL__2026__9']);
  });
  it('dengan payDate: satu kunci memberInfo/{member}/date_Y_M ditambahkan (bukan seluruh memberInfo)', () => {
    const pd = payDatePatch('KRS', 'ABIL', Y, M, '2026-10-22');
    const patch = buildGranularPaymentPatch('KRS__ABIL__2026__9', 100, [], log, 'a@b.c', lock, 5, pd);
    expect(patch['memberInfo/KRS__ABIL/date_2026_9']).toBe('2026-10-22');
    expect(patch['payments/KRS__ABIL__2026__9']).toBe(100);
  });
  it("kunci tanggal yang mengandung '/' ditolak (tidak boleh menyusup ke jalur lain)", () => {
    expect(() => buildGranularPaymentPatch('KRS__A__2026__9', 1, [], log, '', lock, 5, { infoKey: 'KRS__A/B', dateKey: 'date_2026_9', date: '2026-10-22' })).toThrow();
  });
});
