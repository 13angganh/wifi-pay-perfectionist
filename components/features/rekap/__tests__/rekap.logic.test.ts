// components/features/rekap/__tests__/rekap.logic.test.ts
// REDESAIN T8 — logika murni Rekap: filter status A15, jenis sel, total (rumus zip), paginasi, rencana batch (pengaman).
import { describe, it, expect, vi } from 'vitest';

// DEFAULT_APP_DATA ada di lib/db → lib/firebase (Auth butuh API key); di unit test cukup di-mock.
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
import {
  refStatus, statusCounts, filterByStatus, cellKind, rowTotal, columnTotals, sum, paginate,
  batchAmount, buildRekapBatch,
} from '../rekap.logic';
import { DEFAULT_APP_DATA } from '@/lib/db';
import type { AppData } from '@/types';

const Y = 2026, M = 9; // Oktober 2026 = bulan acuan

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR'],
    slkMembers: [],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
    payments: {
      [`KRS__ABIL__${Y}__${M}`]: 100,   // lunas
      [`KRS__ADIT__${Y}__${M}`]: 0,     // Akm (nilai 0 tetap tercatat = lunas)
      [`TIMUR__BUDI__${Y}__${M}`]: 90,
    },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__AKBAR: { tarif: 150 }, TIMUR__BUDI: { tarif: 90 } },
    freeMembers: { TIMUR__CITRA: { active: true, fromYear: 2023, fromMonth: 0 } },
    ...over,
  };
}

describe('refStatus / statusCounts / filterByStatus (A15)', () => {
  it('lunas = ada nilai (termasuk 0), belum = tidak ada nilai, free = isFree', () => {
    const d = makeData();
    expect(refStatus(d, 'KRS', 'ABIL', Y, M)).toBe('lunas');
    expect(refStatus(d, 'KRS', 'ADIT', Y, M)).toBe('lunas');
    expect(refStatus(d, 'KRS', 'AKBAR', Y, M)).toBe('belum');
    expect(refStatus(d, 'TIMUR', 'CITRA', Y, M)).toBe('free');
  });

  it('member gratis tetap gratis walau ada nilai pembayaran tercatat (isFree menang)', () => {
    const d = makeData({ payments: { [`TIMUR__CITRA__${Y}__${M}`]: 90 } });
    expect(refStatus(d, 'TIMUR', 'CITRA', Y, M)).toBe('free');
  });

  it('jumlah chip dihitung per zona kustom — bukan KRS/SLK tetap', () => {
    const d = makeData();
    expect(statusCounts(d, 'KRS', d.krsMembers, Y, M)).toEqual({ all: 3, lunas: 2, belum: 1, free: 0 });
    expect(statusCounts(d, 'TIMUR', d.zoneMembers!.TIMUR, Y, M)).toEqual({ all: 2, lunas: 1, belum: 0, free: 1 });
  });

  it('filterByStatus: all mengembalikan semua; lainnya hanya status itu (urutan dipertahankan)', () => {
    const d = makeData();
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'all')).toEqual(['ABIL', 'ADIT', 'AKBAR']);
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'lunas')).toEqual(['ABIL', 'ADIT']);
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'belum')).toEqual(['AKBAR']);
    expect(filterByStatus(d, 'KRS', d.krsMembers, Y, M, 'free')).toEqual([]);
  });
});

describe('cellKind', () => {
  const d = makeData();
  it('paid / akm / due / future / free', () => {
    expect(cellKind(d, 'KRS', 'ABIL', Y, M, M)).toBe('paid');
    expect(cellKind(d, 'KRS', 'ADIT', Y, M, M)).toBe('akm');
    expect(cellKind(d, 'KRS', 'AKBAR', Y, M, M)).toBe('due');        // bulan ≤ acuan
    expect(cellKind(d, 'KRS', 'AKBAR', Y, M + 1, M)).toBe('future'); // bulan > acuan
    expect(cellKind(d, 'TIMUR', 'CITRA', Y, 3, M)).toBe('free');
  });
  it('jatuh tempo mengikuti bulan acuan: mi sama dengan acuan masih due, mi acuan+1 future', () => {
    expect(cellKind(d, 'KRS', 'AKBAR', Y, 4, 4)).toBe('due');
    expect(cellKind(d, 'KRS', 'AKBAR', Y, 5, 4)).toBe('future');
  });
});

describe('total — rumus zip dipertahankan', () => {
  it('total baris mengecualikan bulan gratis; total kolom memakai nilai mentah', () => {
    const d = makeData({
      payments: { [`TIMUR__CITRA__${Y}__2`]: 90, [`TIMUR__BUDI__${Y}__2`]: 90 },
    });
    // CITRA gratis di Maret → baris CITRA = 0 walau ada nilai mentah 90
    expect(rowTotal(d, 'TIMUR', 'CITRA', Y)).toBe(0);
    expect(rowTotal(d, 'TIMUR', 'BUDI', Y)).toBe(90);
    // kolom Maret (mi=2) menjumlah nilai mentah keduanya = 180 (perilaku zip, sengaja tidak disatukan)
    expect(columnTotals(d, 'TIMUR', ['BUDI', 'CITRA'], Y)[2]).toBe(180);
  });
  it('sum menjumlah deret', () => { expect(sum([1, 2, 3])).toBe(6); expect(sum([])).toBe(0); });
});

describe('paginate (v11.6.5)', () => {
  const list = Array.from({ length: 25 }, (_, i) => i);
  it('totalPages minimal 1 walau kosong', () => {
    const p = paginate([], 1, 20);
    expect(p.totalPages).toBe(1); expect(p.items).toEqual([]); expect(p.start).toBe(0); expect(p.end).toBe(0);
  });
  it('halaman 2 dari 25 item = indeks 20–24, nomor urut absolut mulai 20', () => {
    const p = paginate(list, 2, 20);
    expect(p.totalPages).toBe(2); expect(p.start).toBe(20); expect(p.end).toBe(25); expect(p.items).toHaveLength(5);
  });
  it('halaman di-clamp ke rentang valid', () => {
    expect(paginate(list, 99, 20).page).toBe(2);
    expect(paginate(list, 0, 20).page).toBe(1);
  });
});

describe('batchAmount / buildRekapBatch (pengaman batch, keputusan 5 dan 6)', () => {
  const d = makeData();
  it('nominal = tarif member, atau QuickPay pertama bila tak ada tarif (zip)', () => {
    expect(batchAmount(d, 'KRS', 'AKBAR', 100)).toEqual({ amt: 150, hasTarif: true });
    expect(batchAmount(d, 'KRS', 'ADIT', 100)).toEqual({ amt: 100, hasTarif: false });
  });

  it('hanya sel belum bayar yang ditulis; lunas, Akm dan gratis dilewati (tidak ditimpa)', () => {
    const plan = buildRekapBatch(d, 'KRS', ['AKBAR', 'ABIL', 'ADIT'], Y, M, 100, () => false);
    expect(plan.payments).toEqual({ [`KRS__AKBAR__${Y}__${M}`]: 150 });
    expect(plan.entries).toEqual([{ name: 'AKBAR', amt: 150 }]);
    expect(plan.skippedPaid.sort()).toEqual(['ABIL', 'ADIT']);
  });

  it('member gratis di zona kustom dilewati; kunci payment memakai zona kustom itu', () => {
    const plan = buildRekapBatch(d, 'TIMUR', ['CITRA'], Y, 2, 100, () => false);
    expect(plan.entries).toEqual([]);
    expect(plan.skippedPaid).toEqual(['CITRA']);
    const plan2 = buildRekapBatch(d, 'TIMUR', ['BUDI'], Y, 3, 100, () => false);
    expect(Object.keys(plan2.payments)).toEqual([`TIMUR__BUDI__${Y}__3`]);
  });

  it('member terkunci dilewati dan dicatat terpisah (perilaku zip: continue)', () => {
    const plan = buildRekapBatch(d, 'KRS', ['AKBAR'], Y, M, 100, n => n === 'AKBAR');
    expect(plan.entries).toEqual([]);
    expect(plan.locked).toEqual(['AKBAR']);
    expect(plan.skippedPaid).toEqual([]);
  });
});
