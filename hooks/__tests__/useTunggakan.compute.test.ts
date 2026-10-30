// hooks/__tests__/useTunggakan.compute.test.ts
// REDESAIN T8 — buildTunggakan: perbaikan percabangan KRS/SLK (T4 §3 butir 6, T5 §3), aging, A16 nominal, A19 pencarian.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
import { buildTunggakan, tunggakanZones, agingOf, filterArrearsByAging } from '../useTunggakan';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData, AppSettings } from '@/types';

const Y = 2026, M = 9; // Oktober 2026

/** Bayar semua bulan dari Jan 2023 s/d periode acuan, kecuali [tahun, bulan] di `skip`. */
function payAll(zone: string, name: string, skip: [number, number][] = []): Record<string, number> {
  const out: Record<string, number> = {};
  for (let y = 2023; y <= Y; y++) {
    for (let m = 0; m <= (y === Y ? M : 11); m++) {
      if (skip.some(([sy, sm]) => sy === y && sm === m)) continue;
      out[`${zone}__${name}__${y}__${m}`] = 100;
    }
  }
  return out;
}
const last = (n: number): [number, number][] => Array.from({ length: n }, (_, i) => [Y, M - i]);

function makeData(): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR', 'ALFIN'],
    slkMembers: ['SARI'],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
    payments: {
      ...payAll('KRS', 'ABIL', last(1)),    // 1 bulan  → baru
      ...payAll('KRS', 'ADIT', last(3)),    // 3 bulan  → segera
      ...payAll('KRS', 'AKBAR', last(6)),   // 6 bulan  → kritis
      ...payAll('KRS', 'ALFIN'),            // lunas semua → rajin
      ...payAll('SLK', 'SARI', last(2)),
      ...payAll('TIMUR', 'BUDI', last(4)),  // 4 bulan  → kritis (zona kustom)
    },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 80 }, TIMUR__BUDI: { tarif: 60 } },
    freeMembers: { TIMUR__CITRA: { active: true, fromYear: 2023, fromMonth: 0 } }, // gratis penuh
  };
}

const settings = (patch: Partial<AppSettings> = {}): AppSettings => ({
  ...DEFAULT_SETTINGS,
  customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }],
  hiddenZones: [],
  ...patch,
});

describe('agingOf', () => {
  it('1 = baru, 2–3 = segera, 4+ = kritis', () => {
    expect([1, 2, 3, 4, 9].map(agingOf)).toEqual(['baru', 'segera', 'segera', 'kritis', 'kritis']);
  });
});

describe('tunggakanZones — tanpa daftar zona tertanam', () => {
  it('zona aktif → hanya zona itu (zona kustom ikut)', () => {
    expect(tunggakanZones('TIMUR', settings())).toEqual(['TIMUR']);
    expect(tunggakanZones('KRS', settings())).toEqual(['KRS']);
  });
  it('TOTAL → semua zona aktif; zona tersembunyi tidak ikut', () => {
    expect(tunggakanZones('TOTAL', settings())).toEqual(['KRS', 'SLK', 'TIMUR']);
    expect(tunggakanZones('TOTAL', settings({ hiddenZones: ['TIMUR'] }))).toEqual(['KRS', 'SLK']);
  });
});

describe('buildTunggakan', () => {
  const d = makeData();

  it('zona bawaan: urut jumlah bulan terbanyak, aging dan nominal (jumlah bulan × tarif member, default 100)', () => {
    const r = buildTunggakan(d, ['KRS'], Y, M, '', 100);
    expect(r.arrears.map(x => x.name)).toEqual(['AKBAR', 'ADIT', 'ABIL']);
    expect(r.arrears.map(x => x.count)).toEqual([6, 3, 1]);
    expect(r.arrears.map(x => x.amount)).toEqual([600, 240, 100]); // AKBAR tanpa tarif → default 100
    expect(r.arrears.map(x => x.tarif)).toEqual([undefined, 80, 100]);
    expect(r.aging).toEqual({ total: 3, baru: 1, segera: 1, kritis: 1 });
    expect(r.rajin.map(m => m.name)).toEqual(['ALFIN']);
    expect(r.free).toEqual([]);
    expect(r.memberCount).toBe(4);
  });

  it('zona KUSTOM dihitung penuh (tunggakan, tarif, gratis) — tidak jatuh ke KRS/SLK', () => {
    const r = buildTunggakan(d, ['TIMUR'], Y, M, '', 100);
    expect(r.arrears).toHaveLength(1);
    expect(r.arrears[0]).toMatchObject({ zone: 'TIMUR', name: 'BUDI', count: 4, tarif: 60, amount: 240 });
    expect(r.free).toEqual([{ zone: 'TIMUR', name: 'CITRA' }]);
    expect(r.rajin).toEqual([]);
    expect(r.aging.kritis).toBe(1);
  });

  it('tunggakan bulan gratis tidak dihitung: CITRA gratis sejak awal → tanpa tunggakan', () => {
    const r = buildTunggakan(d, ['TIMUR'], Y, M, '', 100);
    expect(r.arrears.map(x => x.name)).not.toContain('CITRA');
  });

  it('perilaku zip: member gratis di bulan acuan yang masih punya tunggakan tampil di tunggakan DAN gratis, bukan rajin', () => {
    const data: AppData = {
      ...d,
      freeMembers: { KRS__ADIT: { active: true, fromYear: Y, fromMonth: M } }, // gratis hanya Oktober
    };
    const r = buildTunggakan(data, ['KRS'], Y, M, '', 100);
    const adit = r.arrears.find(x => x.name === 'ADIT');
    expect(adit?.count).toBe(2); // Agu + Sep; Okt gratis tidak dihitung
    expect(r.free.map(m => m.name)).toEqual(['ADIT']);
    expect(r.rajin.map(m => m.name)).not.toContain('ADIT');
  });

  it('mode TOTAL menggabung zona dan membawa label zona per item', () => {
    const zones = tunggakanZones('TOTAL', settings());
    const r = buildTunggakan(d, zones, Y, M, '', 100);
    expect(r.arrears.map(x => `${x.zone}:${x.name}`)).toEqual(['KRS:AKBAR', 'TIMUR:BUDI', 'KRS:ADIT', 'SLK:SARI', 'KRS:ABIL']);
    expect(r.memberCount).toBe(7);
  });

  it('A19 pencarian nama memfilter semua daftar dan jumlah (fuzzy seperti Rekap/Entry)', () => {
    const r = buildTunggakan(d, ['KRS'], Y, M, 'akb', 100);
    expect(r.arrears.map(x => x.name)).toEqual(['AKBAR']);
    expect(r.rajin).toEqual([]);
    expect(r.aging.total).toBe(1);
    expect(r.memberCount).toBe(4); // jumlah member zona tidak ikut tersaring (untuk keadaan "belum ada member")
  });

  it('periode acuan lebih awal mengurangi tunggakan (s/d bulan acuan, bukan s/d hari ini)', () => {
    const r = buildTunggakan(d, ['KRS'], Y, 3, '', 100); // s/d April 2026: semua bulan itu lunas
    expect(r.arrears).toEqual([]);
    expect(r.rajin).toHaveLength(4);
  });

  it('filterArrearsByAging', () => {
    const r = buildTunggakan(d, ['KRS'], Y, M, '', 100);
    expect(filterArrearsByAging(r.arrears, 'total')).toHaveLength(3);
    expect(filterArrearsByAging(r.arrears, 'segera').map(x => x.name)).toEqual(['ADIT']);
    expect(filterArrearsByAging(r.arrears, 'kritis').map(x => x.name)).toEqual(['AKBAR']);
  });
});
