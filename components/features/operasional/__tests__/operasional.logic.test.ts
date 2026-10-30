// components/features/operasional/__tests__/operasional.logic.test.ts — REDESAIN T10 (Operasional + perbaikan zona kustom)
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData, AppSettings } from '@/types';
import {
  opsIconKey, opsTotal, buildOpsSummary, parseNominal, withUpdatedItem, isItemChanged, validateOpsForm, itemFromForm,
} from '../operasional.logic';

const Y = 2026, M = 9;
const data: AppData = {
  ...DEFAULT_APP_DATA,
  krsMembers: ['ABIL'], slkMembers: ['SARI'], zoneMembers: { TIMUR: ['BUDI'] },
  payments: { [`KRS__ABIL__${Y}__${M}`]: 100, [`SLK__SARI__${Y}__${M}`]: 80, [`TIMUR__BUDI__${Y}__${M}`]: 60 },
  memberInfo: {}, freeMembers: {}, deletedMembers: {}, operasional: {},
};
const settings: AppSettings = { ...DEFAULT_SETTINGS, customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] };

describe('opsIconKey — kata kunci keterangan', () => {
  it('memetakan', () => {
    expect(opsIconKey('Listrik PLN')).toBe('electric');
    expect(opsIconKey('Internet')).toBe('internet');
    expect(opsIconKey('Perawatan alat')).toBe('maintenance');
    expect(opsIconKey('Gaji teknisi')).toBe('salary');
    expect(opsIconKey('Lainnya')).toBe('other');
    expect(opsIconKey('  ')).toBe('receipt');
  });
});

describe('ringkasan — pendapatan − pengeluaran, satu baris per zona aktif (zona kustom ikut)', () => {
  const items = [{ label: 'Listrik', nominal: 45 }, { label: 'Internet', nominal: 30 }];
  it('opsTotal menjumlah nominal (ribuan)', () => expect(opsTotal(items)).toBe(75));
  it('zona kustom ikut dihitung', () => {
    const s = buildOpsSummary(data, settings, Y, M, items);
    expect(s.zones.map(z => z.zone)).toEqual(['KRS', 'SLK', 'TIMUR']);
    expect(s.zones.map(z => z.total)).toEqual([100, 80, 60]);
    expect(s.gross).toBe(240);
    expect(s.expense).toBe(75);
    expect(s.net).toBe(165);
  });
  it('zona kustom tersembunyi tidak dihitung; negatif dimungkinkan', () => {
    const s = buildOpsSummary(data, { ...settings, hiddenZones: ['TIMUR'] }, Y, M, [{ label: 'x', nominal: 500 }]);
    expect(s.zones.map(z => z.zone)).toEqual(['KRS', 'SLK']);
    expect(s.net).toBe(180 - 500);
  });
});

describe('nominal dan edit baris — logika zip', () => {
  it('parseNominal: `+val || 0`, tidak negatif', () => {
    expect(parseNominal('45')).toBe(45);
    expect(parseNominal('')).toBe(0);
    expect(parseNominal('abc')).toBe(0);
    expect(parseNominal('-5')).toBe(0);
  });
  it('withUpdatedItem tidak memutasi dan hanya mengubah satu baris', () => {
    const a = [{ label: 'A', nominal: 1 }, { label: 'B', nominal: 2 }];
    const b = withUpdatedItem(a, 1, 'nominal', '9');
    expect(b[1].nominal).toBe(9); expect(a[1].nominal).toBe(2); expect(b[0]).toBe(a[0]);
    expect(withUpdatedItem(a, 0, 'label', 'Z')[0].label).toBe('Z');
  });
  it('isItemChanged: hanya bila benar-benar berbeda (hindari simpan + log saat blur biasa)', () => {
    const it = { label: 'Listrik', nominal: 45 };
    expect(isItemChanged(it, 'label', 'Listrik')).toBe(false);
    expect(isItemChanged(it, 'label', 'Air')).toBe(true);
    expect(isItemChanged(it, 'nominal', '45')).toBe(false);
    expect(isItemChanged(it, 'nominal', '46')).toBe(true);
    expect(isItemChanged(undefined, 'label', 'x')).toBe(false);
  });
  it('form: label wajib; itemFromForm memangkas', () => {
    expect(validateOpsForm({ label: '  ', nominal: '10' })).toBe('labelRequired');
    expect(validateOpsForm({ label: 'Air', nominal: '' })).toBeNull();
    expect(itemFromForm({ label: ' Air ', nominal: '12' })).toEqual({ label: 'Air', nominal: 12 });
  });
});
