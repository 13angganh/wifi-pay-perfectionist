// lib/__tests__/zone-members.test.ts — REDESAIN T9 (serah-terima T4 bagian 3 butir 1, 2, 5)
// setMembersForZone (pasangan getMembersForZone) dan getZoneTotal yang benar untuk zona kustom.
import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { getMembersForZone, setMembersForZone } from '@/lib/member';
import { getZoneTotal, getKey } from '@/lib/payment';
import type { AppData } from '@/types';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

const base = (over: Partial<AppData> = {}): AppData => ({
  ...DEFAULT_APP_DATA,
  krsMembers: ['A1', 'A2'],
  slkMembers: ['S1'],
  zoneMembers: { TIMUR: ['T1', 'T2'], BARAT: ['B1'] },
  payments: {},
  ...over,
});

describe('setMembersForZone', () => {
  it('KRS hanya menyentuh krsMembers', () => {
    expect(setMembersForZone(base(), 'KRS', ['X'])).toEqual({ krsMembers: ['X'] });
  });
  it('SLK hanya menyentuh slkMembers', () => {
    expect(setMembersForZone(base(), 'SLK', ['X'])).toEqual({ slkMembers: ['X'] });
  });
  it('zona kustom hanya menyentuh zoneMembers[zona] dan menjaga zona kustom lain', () => {
    const d = base();
    const patch = setMembersForZone(d, 'TIMUR', ['T1', 'T2', 'T3']);
    expect(patch).toEqual({ zoneMembers: { TIMUR: ['T1', 'T2', 'T3'], BARAT: ['B1'] } });
    expect(patch).not.toHaveProperty('krsMembers');
    expect(patch).not.toHaveProperty('slkMembers');
  });
  it('zona kustom baru (belum ada di zoneMembers) dan appData tanpa zoneMembers', () => {
    const d = base({ zoneMembers: undefined });
    expect(setMembersForZone(d, 'UTARA', ['U1'])).toEqual({ zoneMembers: { UTARA: ['U1'] } });
  });
  it('tidak memutasi appData asli', () => {
    const d = base();
    const snap = JSON.stringify(d);
    setMembersForZone(d, 'TIMUR', ['Z']);
    expect(JSON.stringify(d)).toBe(snap);
  });
  it('pasangan baca-tulis: getMembersForZone membaca apa yang ditulis', () => {
    for (const z of ['KRS', 'SLK', 'TIMUR', 'BARAT', 'UTARA']) {
      const d = base();
      const next = { ...d, ...setMembersForZone(d, z, ['N1', 'N2']) } as AppData;
      expect(getMembersForZone(z, next)).toEqual(['N1', 'N2']);
    }
  });
});

describe('getZoneTotal (zona kustom = jumlah pembayaran anggotanya)', () => {
  it('KRS dan SLK tetap seperti semula', () => {
    const d = base({ payments: { [getKey('KRS', 'A1', 2026, 9)]: 100, [getKey('KRS', 'A2', 2026, 9)]: 50, [getKey('SLK', 'S1', 2026, 9)]: 70 } });
    expect(getZoneTotal(d, 'KRS', 2026, 9)).toBe(150);
    expect(getZoneTotal(d, 'SLK', 2026, 9)).toBe(70);
  });
  it('zona kustom dihitung dari anggotanya sendiri, bukan anggota SLK', () => {
    const d = base({
      payments: {
        [getKey('SLK', 'S1', 2026, 9)]: 70,
        [getKey('TIMUR', 'T1', 2026, 9)]: 40,
        [getKey('TIMUR', 'T2', 2026, 9)]: 60,
        [getKey('BARAT', 'B1', 2026, 9)]: 25,
      },
    });
    expect(getZoneTotal(d, 'TIMUR', 2026, 9)).toBe(100);
    expect(getZoneTotal(d, 'BARAT', 2026, 9)).toBe(25);
    expect(getZoneTotal(d, 'SLK', 2026, 9)).toBe(70);
  });
  it('zona yang tidak dikenal = 0 (bukan jatuh ke zona lain)', () => {
    expect(getZoneTotal(base({ payments: { [getKey('SLK', 'S1', 2026, 9)]: 70 } }), 'GHAIB', 2026, 9)).toBe(0);
  });
  it('2 sampai 5 zona: total tiap zona = jumlah pembayaran anggotanya, jumlah semua zona = total keseluruhan', () => {
    for (let n = 2; n <= 5; n++) {
      const names = ['KRS', 'SLK', 'Z3', 'Z4', 'Z5'].slice(0, n);
      const zoneMembers: Record<string, string[]> = {};
      const payments: Record<string, number> = {};
      let grand = 0;
      names.forEach((z, zi) => {
        const mem = [`${z}-a`, `${z}-b`];
        if (z !== 'KRS' && z !== 'SLK') zoneMembers[z] = mem;
        mem.forEach((m, mi) => { const v = (zi + 1) * 10 + mi; payments[getKey(z, m, 2026, 3)] = v; grand += v; });
      });
      const d = base({
        krsMembers: ['KRS-a', 'KRS-b'], slkMembers: ['SLK-a', 'SLK-b'], zoneMembers, payments,
      });
      let sum = 0;
      names.forEach((z, zi) => {
        const t = getZoneTotal(d, z, 2026, 3);
        expect(t).toBe((zi + 1) * 10 * 2 + 1);
        sum += t;
      });
      expect(sum).toBe(grand);
    }
  });
});
