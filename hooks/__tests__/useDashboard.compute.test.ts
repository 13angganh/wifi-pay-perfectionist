// hooks/__tests__/useDashboard.compute.test.ts
// REDESAIN T7 — computeDashboard: perbaikan percabangan KRS/SLK (T4 §3 butir 6, T5 §3) dan A14 (grafik 6 bulan).
// Zona kustom harus ikut terhitung di statistik, insight, tunggakan dan grafik; zona tersembunyi tidak.
import { describe, it, expect, vi } from 'vitest';

// store → lib/db → lib/firebase menginisialisasi Auth; di jsdom tanpa API key itu melempar. Sama dengan test layar lain.
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
import { computeDashboard, zoneTotal, lastMonths } from '../useDashboard';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData, AppSettings } from '@/types';

const Y = 2026, M = 9; // Oktober 2026

function makeData(): AppData {
  return {
    krsMembers: ['ABIL', 'ADIT'],
    slkMembers: ['SARI'],
    zoneMembers: { TIMUR: ['BUDI', 'CITRA'], UTARA: ['DEDI'] },
    payments: {
      [`KRS__ABIL__${Y}__${M}`]: 100,
      [`SLK__SARI__${Y}__${M}`]: 80,
      [`TIMUR__BUDI__${Y}__${M}`]: 90,
      [`TIMUR__BUDI__${Y}__${M - 1}`]: 90,
      [`UTARA__DEDI__${Y}__${M}`]: 50,
    },
    memberInfo: {},
    activityLog: [],
    freeMembers: { 'TIMUR__CITRA': { active: true, fromYear: 2023, fromMonth: 0 } }, // gratis sejak awal data: tidak ada tunggakan
    deletedMembers: {},
    operasional: { [`${Y}_${M}`]: { items: [{ name: 'Listrik', nominal: 40 }] } as never },
  };
}

const settings = (patch: Partial<AppSettings> = {}): AppSettings => ({
  ...DEFAULT_SETTINGS,
  customZones: [
    { key: 'TIMUR', name: 'Timur', color: '#10B981' },
    { key: 'UTARA', name: 'Utara', color: '#F59E0B' },
  ],
  hiddenZones: [],
  ...patch,
});

describe('zoneTotal — zona kustom TIDAK dihitung dari anggota SLK', () => {
  const d = makeData();
  it('KRS', () => expect(zoneTotal(d, 'KRS', Y, M)).toBe(100));
  it('SLK', () => expect(zoneTotal(d, 'SLK', Y, M)).toBe(80));
  it('TIMUR memakai zoneMembers sendiri', () => expect(zoneTotal(d, 'TIMUR', Y, M)).toBe(90));
  it('zona tanpa anggota = 0', () => expect(zoneTotal(d, 'KOSONG', Y, M)).toBe(0));
});

describe('computeDashboard — zona aktif', () => {
  it('menyertakan KRS, SLK dan semua zona kustom yang tidak disembunyikan', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    expect(r.zones.map(z => z.zone)).toEqual(['KRS', 'SLK', 'TIMUR', 'UTARA']);
  });
  it('zona tersembunyi tidak ikut', () => {
    const r = computeDashboard(makeData(), settings({ hiddenZones: ['UTARA'] }), Y, M);
    expect(r.zones.map(z => z.zone)).toEqual(['KRS', 'SLK', 'TIMUR']);
    expect(r.totalIncome).toBe(100 + 80 + 90);
  });
  it('total pendapatan = jumlah semua zona aktif (bukan hanya KRS + SLK)', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    expect(r.totalIncome).toBe(100 + 80 + 90 + 50);
  });
  it('bersih = pendapatan dikurangi operasional', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    expect(r.totalOps).toBe(40);
    expect(r.netIncome).toBe(320 - 40);
  });
});

describe('computeDashboard — hitungan status (Opsi A: gratis termasuk lunas, bukan belum)', () => {
  const r = computeDashboard(makeData(), settings(), Y, M);
  const by = (z: string) => r.zones.find(x => x.zone === z)!;
  it('KRS: 1 lunas, 1 belum', () => { expect(by('KRS')).toMatchObject({ members: 2, lunas: 1, belum: 1, free: 0, lunasPct: 50 }); });
  it('TIMUR: BUDI lunas, CITRA gratis (lunas, bukan belum)', () => {
    expect(by('TIMUR')).toMatchObject({ members: 2, lunas: 2, belum: 0, free: 1, lunasPct: 100 });
  });
  it('total lintas zona', () => {
    expect(r.totalMembers).toBe(6);
    expect(r.totalLunas).toBe(5);
    expect(r.totalBelum).toBe(1);
    expect(r.totalFree).toBe(1);
  });
  it('perubahan vs bulan lalu per zona: TIMUR 90 → 90 = 0%, KRS tanpa baseline = null', () => {
    expect(by('TIMUR').pct).toBe(0);
    expect(by('KRS').pct).toBeNull();
  });
});

describe('computeDashboard — tunggakan terbanyak lintas zona', () => {
  it('anggota zona kustom muncul dengan kunci zona yang benar', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    const zones = new Set(r.topTunggak.map(x => x.z));
    expect(zones.has('KRS')).toBe(true);   // ADIT belum pernah bayar
    expect(zones.has('TIMUR')).toBe(true); // BUDI bolong di bulan-bulan sebelumnya
    expect(r.topTunggak.find(x => x.name === 'CITRA')).toBeUndefined(); // gratis: tidak menunggak
  });
  it('terurut turun menurut jumlah bulan', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    const counts = r.topTunggak.map(x => x.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
  it('zona tersembunyi tidak menyumbang tunggakan', () => {
    const d = makeData();
    d.zoneMembers = { ...d.zoneMembers, UTARA: ['DEDI'] };
    const r = computeDashboard(d, settings({ hiddenZones: ['UTARA', 'TIMUR'] }), Y, M);
    expect(r.topTunggak.some(x => x.z === 'UTARA' || x.z === 'TIMUR')).toBe(false);
  });
});

describe('A14 — grafik batang 6 bulan (tanpa field baru)', () => {
  it('lastMonths: 6 bulan berakhir di periode, urut lama → baru, wrap tahun', () => {
    expect(lastMonths(2026, 1, 6)).toEqual([
      { y: 2025, m: 8 }, { y: 2025, m: 9 }, { y: 2025, m: 10 },
      { y: 2025, m: 11 }, { y: 2026, m: 0 }, { y: 2026, m: 1 },
    ]);
  });
  it('history berisi 6 titik; bulan terpilih = total pendapatan; bulan lalu = total bulan lalu semua zona', () => {
    const r = computeDashboard(makeData(), settings(), Y, M);
    expect(r.history).toHaveLength(6);
    expect(r.history[5]).toEqual({ y: Y, m: M, total: r.totalIncome });
    expect(r.history[4]).toEqual({ y: Y, m: M - 1, total: 90 });
    expect(r.history[0].total).toBe(0);
  });
});

describe('computeDashboard — data kosong tidak membagi nol', () => {
  it('tanpa member: semua nol, persen 0 / null', () => {
    const empty: AppData = {
      krsMembers: [], slkMembers: [], payments: {}, memberInfo: {}, activityLog: [],
      freeMembers: {}, deletedMembers: {}, operasional: {},
    };
    const r = computeDashboard(empty, settings({ customZones: [] }), Y, M);
    expect(r.totalMembers).toBe(0);
    expect(r.lunasPctNow).toBe(0);
    expect(r.totalPct).toBeNull();
    expect(r.topTunggak).toEqual([]);
    expect(r.zones.every(z => z.lunasPct === 0 && z.pct === null)).toBe(true);
  });
});
