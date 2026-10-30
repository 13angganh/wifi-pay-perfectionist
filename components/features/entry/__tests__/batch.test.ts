// components/features/entry/__tests__/batch.test.ts
// REDESAIN T7 — guard batch (T2 keputusan 8b): hanya member BELUM BAYAR yang bisa dipilih.
// Titik masuk yang diuji: toggle satu member, Pilih Semua, dan eksekusi (buildBatchPayments).
import { describe, it, expect } from 'vitest';
import {
  isBatchEligible, filterBatchEligible, toggleBatchSelection, toggleSelectAll, buildBatchPayments,
} from '../batch';
import type { AppData } from '@/types';

const Y = 2026, M = 9;

function makeData(): AppData {
  return {
    krsMembers: ['ABIL', 'ADIT', 'AJI', 'AKBAR', 'ALFIN'],
    slkMembers: [],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
    payments: {
      [`KRS__ADIT__${Y}__${M}`]: 100,   // lunas
      [`KRS__AJI__${Y}__${M}`]: 0,      // akumulasi (0 = tercatat, bukan belum)
    },
    memberInfo: {
      'KRS__ABIL':  { tarif: 100 },
      'KRS__ADIT':  { tarif: 100 },
      'KRS__AJI':   { tarif: 80 },
      'KRS__AKBAR': { },                 // belum bayar, TANPA tarif
      'KRS__ALFIN': { tarif: 150 },
      'TIMUR__BUDI': { tarif: 90 },
    },
    activityLog: [],
    freeMembers: { 'KRS__ALFIN': { active: true, fromYear: 2026, fromMonth: 0 } },
    deletedMembers: {},
    operasional: {},
  };
}

describe('isBatchEligible — hanya belum bayar', () => {
  const d = makeData();
  it('belum bayar → boleh', () => expect(isBatchEligible(d, 'KRS', 'ABIL', Y, M)).toBe(true));
  it('lunas → ditolak', () => expect(isBatchEligible(d, 'KRS', 'ADIT', Y, M)).toBe(false));
  it('akumulasi (nominal 0) dihitung sudah tercatat → ditolak', () => expect(isBatchEligible(d, 'KRS', 'AJI', Y, M)).toBe(false));
  it('gratis → ditolak', () => expect(isBatchEligible(d, 'KRS', 'ALFIN', Y, M)).toBe(false));
  it('belum bayar tanpa tarif tetap boleh dipilih (dilewati saat eksekusi, sesuai zip)', () => {
    expect(isBatchEligible(d, 'KRS', 'AKBAR', Y, M)).toBe(true);
  });
  it('zona kustom diperlakukan sama', () => {
    expect(isBatchEligible(d, 'TIMUR', 'BUDI', Y, M)).toBe(true);
    expect(isBatchEligible(d, 'TIMUR', 'BUDI', Y, M + 1)).toBe(true);
  });
  it('periode lain: status mengikuti periode yang ditanyakan', () => {
    expect(isBatchEligible(d, 'KRS', 'ADIT', Y, M - 1)).toBe(true);
  });
});

describe('filterBatchEligible', () => {
  it('membuang lunas, akumulasi, dan gratis', () => {
    const d = makeData();
    expect(filterBatchEligible(d, 'KRS', d.krsMembers, Y, M)).toEqual(['ABIL', 'AKBAR']);
  });
});

describe('toggleBatchSelection (toggleBatchMember + guard)', () => {
  const d = makeData();
  it('menambah member belum bayar', () => {
    expect(toggleBatchSelection([], 'ABIL', d, 'KRS', Y, M)).toEqual(['ABIL']);
  });
  it('menolak member lunas/gratis — pilihan tidak berubah', () => {
    expect(toggleBatchSelection(['ABIL'], 'ADIT', d, 'KRS', Y, M)).toEqual(['ABIL']);
    expect(toggleBatchSelection([], 'ALFIN', d, 'KRS', Y, M)).toEqual([]);
  });
  it('mencabut pilihan yang sudah ada (juga bila kini sudah lunas)', () => {
    expect(toggleBatchSelection(['ABIL', 'ADIT'], 'ADIT', d, 'KRS', Y, M)).toEqual(['ABIL']);
  });
  it('tidak memutasi array masukan', () => {
    const cur = ['ABIL'];
    toggleBatchSelection(cur, 'AKBAR', d, 'KRS', Y, M);
    expect(cur).toEqual(['ABIL']);
  });
});

describe('toggleSelectAll (setBatchSelected + guard)', () => {
  const d = makeData();
  it('hanya memilih yang belum bayar di daftar terfilter', () => {
    expect(toggleSelectAll([], d.krsMembers, d, 'KRS', Y, M)).toEqual(['ABIL', 'AKBAR']);
  });
  it('hormati daftar terfilter (pencarian/filter)', () => {
    expect(toggleSelectAll([], ['ABIL', 'ADIT'], d, 'KRS', Y, M)).toEqual(['ABIL']);
  });
  it('semua yang berhak sudah terpilih → mengosongkan', () => {
    expect(toggleSelectAll(['ABIL', 'AKBAR'], d.krsMembers, d, 'KRS', Y, M)).toEqual([]);
  });
  it('tidak ada yang berhak → hasil kosong, bukan memilih lunas', () => {
    expect(toggleSelectAll([], ['ADIT', 'AJI', 'ALFIN'], d, 'KRS', Y, M)).toEqual([]);
  });
});

describe('buildBatchPayments (executeBatch + guard)', () => {
  it('menulis tarif hanya untuk belum bayar bertarif; kunci sama dengan zip', () => {
    const d = makeData();
    const plan = buildBatchPayments(d, 'KRS', ['ABIL'], Y, M);
    expect(plan.payments).toEqual({ [`KRS__ABIL__${Y}__${M}`]: 100 });
    expect(plan.details).toEqual([{ name: 'ABIL', tarif: 100 }]);
  });
  it('member belum bayar tanpa tarif → dilewati (noTarif), bukan error', () => {
    const d = makeData();
    const plan = buildBatchPayments(d, 'KRS', ['ABIL', 'AKBAR'], Y, M);
    expect(plan.noTarif).toEqual(['AKBAR']);
    expect(Object.keys(plan.payments)).toHaveLength(1);
  });
  it('TIDAK menimpa pembayaran lunas yang ikut terpilih (data berubah setelah dipilih)', () => {
    const d = makeData();
    const plan = buildBatchPayments(d, 'KRS', ['ABIL', 'ADIT', 'AJI', 'ALFIN'], Y, M);
    expect(plan.ineligible).toEqual(['ADIT', 'AJI', 'ALFIN']);
    expect(Object.keys(plan.payments)).toEqual([`KRS__ABIL__${Y}__${M}`]);
  });
  it('zona kustom: kunci memakai zona aktif', () => {
    const d = makeData();
    const plan = buildBatchPayments(d, 'TIMUR', ['BUDI', 'CITRA'], Y, M);
    expect(plan.payments).toEqual({ [`TIMUR__BUDI__${Y}__${M}`]: 90 });
    expect(plan.noTarif).toEqual(['CITRA']);
  });
  it('pilihan kosong → rencana kosong', () => {
    const plan = buildBatchPayments(makeData(), 'KRS', [], Y, M);
    expect(plan).toEqual({ payments: {}, details: [], noTarif: [], ineligible: [] });
  });
});
