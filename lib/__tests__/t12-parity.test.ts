// lib/__tests__/t12-parity.test.ts — REDESAIN T12 (S5): PARITAS dengan T11 untuk dataset lama (satu periode free, tanpa
// terdaftar/nonaktif). Rumus T11 disalin apa adanya sebagai pembanding (Dashboard, komposisi Grafik, status/chip/sel Rekap,
// eligibilitas batch, daftar Tunggakan, Ringkasan WA, label ekspor); data acak dengan PRNG tetap (deterministik).
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData, FreeMember } from '@/types';
import { getKey, getPay, calcPctDelta } from '@/lib/payment';
import { getMembersForZone } from '@/lib/member';
import { computeDashboard } from '@/hooks/useDashboard';
import { buildTunggakan } from '@/hooks/useTunggakan';
import { statusBreakdown } from '@/components/features/grafik/grafik.logic';
import { isBatchEligible } from '@/components/features/entry/batch';
import { cellKind, columnTotals, filterByStatus, refStatus, rowTotal, statusCounts } from '@/components/features/rekap/rekap.logic';
import { doWASummary } from '@/lib/export.wa';
import { exportStatusLabel } from '@/lib/export.excel';

// ── Rumus T11 (pembanding) ──
const legacyFree = (d: AppData, z: string, n: string, y: number, m: number): boolean => {
  const fm: FreeMember | undefined = d.freeMembers?.[z + '__' + n];
  if (!fm || !fm.active) return false;
  const ym = y * 12 + m;
  const toYm = (fm.toYear != null && fm.toMonth != null) ? fm.toYear * 12 + fm.toMonth : Infinity;
  return ym >= fm.fromYear * 12 + fm.fromMonth && ym <= toYm;
};
const paid = (d: AppData, z: string, n: string, y: number, m: number) => getPay(d, z, n, y, m) !== null;
const legacyLunas = (d: AppData, z: string, n: string, y: number, m: number) => legacyFree(d, z, n, y, m) || paid(d, z, n, y, m);
const legacyArrearsCount = (d: AppData, z: string, n: string, upY: number, upM: number) => {
  let c = 0;
  for (let y = 2023; y <= upY; y++) for (let mi = 0; mi <= (y === upY ? upM : 11); mi++) if (!legacyLunas(d, z, n, y, mi)) c++;
  return c;
};
const legacyRefStatus = (d: AppData, z: string, n: string, y: number, m: number) =>
  legacyFree(d, z, n, y, m) ? 'free' : paid(d, z, n, y, m) ? 'lunas' : 'belum';
const legacyCellKind = (d: AppData, z: string, n: string, y: number, mi: number, ref: number) =>
  legacyFree(d, z, n, y, mi) ? 'free' : getPay(d, z, n, y, mi) === null ? (mi <= ref ? 'due' : 'future') : getPay(d, z, n, y, mi) === 0 ? 'akm' : 'paid';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const KRS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SLK = ['P', 'Q', 'R', 'S'];

function dataset(seed: number): AppData {
  const rnd = mulberry32(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const freeMembers: Record<string, FreeMember> = {};
  const payments: Record<string, number> = {};
  const memberInfo: Record<string, { tarif: number }> = {};
  for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) {
    for (const n of names) {
      memberInfo[`${z}__${n}`] = { tarif: int(5, 12) * 10 };
      if (rnd() < 0.5) {
        const fm: FreeMember = { active: rnd() < 0.9, fromYear: int(2023, 2027), fromMonth: int(0, 11) };
        const k = rnd();
        if (k < 0.5) { fm.toYear = int(2023, 2028); fm.toMonth = int(0, 11); } else if (k < 0.6) fm.toYear = int(2023, 2028);
        freeMembers[`${z}__${n}`] = fm;
      }
      for (let y = 2023; y <= 2027; y++) for (let m = 0; m < 12; m++) if (rnd() < 0.55) payments[getKey(z, n, y, m)] = rnd() < 0.08 ? 0 : int(1, 9) * 50;
    }
  }
  return { ...DEFAULT_APP_DATA, krsMembers: KRS, slkMembers: SLK, zoneMembers: {}, payments, freeMembers, memberInfo, memberPeriods: {} };
}
const settings = { ...DEFAULT_SETTINGS, customZones: [], hiddenZones: [] as string[] };
const seeds = Array.from({ length: 20 }, (_, i) => 31 + i * 104729);
const refs: [number, number][] = [[2024, 3], [2026, 9], [2027, 0], [2023, 0]];

describe.each(seeds)('S5 paritas T11 — seed %i', (seed) => {
  const d = dataset(seed);

  it('Dashboard: ZoneStat, total, persen sekarang/sebelumnya, delta tunggakan identik', () => {
    for (const [y, m] of refs) {
      const r = computeDashboard(d, settings, y, m);
      let totLunas = 0, totBelum = 0, totFree = 0, totMem = 0, lunasPrev = 0, belumPrev = 0;
      const [py, pm] = m === 0 ? [y - 1, 11] : [y, m - 1];
      for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) {
        const lunas = names.filter(n => legacyLunas(d, z, n, y, m)).length;
        const free = names.filter(n => legacyFree(d, z, n, y, m)).length;
        const belum = names.filter(n => !legacyFree(d, z, n, y, m) && getPay(d, z, n, y, m) === null).length;
        const zs = r.zones.find(x => x.zone === z)!;
        expect({ members: zs.members, lunas: zs.lunas, belum: zs.belum, free: zs.free }).toEqual({ members: names.length, lunas, belum, free });
        totLunas += lunas; totBelum += belum; totFree += free; totMem += names.length;
        lunasPrev += names.filter(n => legacyLunas(d, z, n, py, pm)).length;
        belumPrev += names.filter(n => getPay(d, z, n, py, pm) === null && !legacyFree(d, z, n, py, pm)).length;
      }
      expect(r).toMatchObject({ totalLunas: totLunas, totalBelum: totBelum, totalFree: totFree, totalMembers: totMem, totalListed: totMem });
      const pctNow = totMem ? Math.round((totLunas / totMem) * 100) : 0;
      const pctPrev = totMem ? Math.round((lunasPrev / totMem) * 100) : 0;
      expect(r.lunasPctNow).toBe(pctNow);
      expect(r.lunasPctDelta).toBe(pctNow - pctPrev);
      expect(r.tunggakanDelta).toEqual(calcPctDelta(totBelum, belumPrev));
    }
  });

  it('Grafik: komposisi status (free dulu, lalu lunas, sisanya belum) identik', () => {
    for (const [y, m] of refs) {
      let lunas = 0, belum = 0, free = 0, total = 0;
      for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) for (const n of names) {
        total++;
        if (legacyFree(d, z, n, y, m)) free++; else if (legacyLunas(d, z, n, y, m)) lunas++; else belum++;
      }
      expect(statusBreakdown(d, ['KRS', 'SLK'], y, m)).toEqual({ lunas, belum, free, total });
    }
  });

  it('Rekap: refStatus, hitungan chip, filter, jenis sel, total baris/kolom identik; batch hanya sel belum', () => {
    for (const [y, m] of refs) {
      for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) {
        const ls = names.map(n => legacyRefStatus(d, z, n, y, m));
        expect(names.map(n => refStatus(d, z, n, y, m))).toEqual(ls);
        expect(statusCounts(d, z, names, y, m)).toEqual({
          all: names.length, lunas: ls.filter(s => s === 'lunas').length, belum: ls.filter(s => s === 'belum').length, free: ls.filter(s => s === 'free').length,
        });
        for (const f of ['lunas', 'belum', 'free'] as const) {
          expect(filterByStatus(d, z, names, y, m, f)).toEqual(names.filter((_, i) => ls[i] === f));
        }
        for (const n of names) {
          expect(isBatchEligible(d, z, n, y, m)).toBe(getPay(d, z, n, y, m) === null && !legacyFree(d, z, n, y, m));
          for (let mi = 0; mi < 12; mi++) expect(cellKind(d, z, n, y, mi, m)).toBe(legacyCellKind(d, z, n, y, mi, m));
          let sum = 0;
          for (let mi = 0; mi < 12; mi++) { if (legacyFree(d, z, n, y, mi)) continue; sum += getPay(d, z, n, y, mi) || 0; }
          expect(rowTotal(d, z, n, y)).toBe(sum);
        }
        const cols = Array.from({ length: 12 }, (_, mi) => names.reduce((s, n) => s + (getPay(d, z, n, y, mi) || 0), 0));
        expect(columnTotals(d, z, names, y)).toEqual(cols);
      }
    }
  });

  it('Tunggakan: daftar penunggak (nama + jumlah bulan), Rajin, dan Free identik', () => {
    for (const [y, m] of refs) {
      const r = buildTunggakan(d, ['KRS', 'SLK'], y, m, '', 100);
      const expectedArrears: Record<string, number> = {};
      const rajin: string[] = [], free: string[] = [];
      for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) for (const n of names) {
        const c = legacyArrearsCount(d, z, n, y, m);
        if (c > 0) expectedArrears[`${z}__${n}`] = c;
        if (legacyFree(d, z, n, y, m)) free.push(`${z}__${n}`); else if (c === 0) rajin.push(`${z}__${n}`);
      }
      expect(Object.fromEntries(r.arrears.map(a => [`${a.zone}__${a.name}`, a.count]))).toEqual(expectedArrears);
      expect(r.rajin.map(x => `${x.zone}__${x.name}`).sort()).toEqual(rajin.sort());
      expect(r.free.map(x => `${x.zone}__${x.name}`).sort()).toEqual(free.sort());
      expect(r.aging.total).toBe(r.arrears.length);
    }
  });

  it('Ringkasan WA (jumlah Lunas / Belum Bayar / Tunggakan) dan label status ekspor identik (kecuali Free tanpa bayar: Belum → Gratis)', () => {
    const [y, m] = [2026, 9];
    for (const [z, names] of [['KRS', KRS], ['SLK', SLK]] as const) {
      let opened = '';
      const spy = vi.spyOn(window, 'open').mockImplementation((u?: string | URL) => { opened = decodeURIComponent(String(u)); return null; });
      doWASummary(d, y, m, [z]);
      spy.mockRestore();
      const lunas = names.filter(n => legacyLunas(d, z, n, y, m) && !legacyFree(d, z, n, y, m)).length;
      const belum = names.filter(n => getPay(d, z, n, y, m) === null && !legacyFree(d, z, n, y, m)).length;
      const tunggak = names.filter(n => legacyArrearsCount(d, z, n, y, m) > 0).length;
      expect(opened).toMatch(new RegExp(`Lunas\\*\\s+${z}: ${lunas}\\b`));
      expect(opened).toMatch(new RegExp(`Belum Bayar[^*]*\\*\\s+${z}: ${belum}\\b`));
      expect(opened).toMatch(new RegExp(`Ada Tunggakan\\*\\s+${z}: ${tunggak}\\b`));
      for (const n of names) {
        const expected = getPay(d, z, n, y, m) !== null ? 'Lunas' : legacyFree(d, z, n, y, m) ? 'Gratis' : 'Belum';
        expect(exportStatusLabel(d, z, n, y, m)).toBe(expected);
      }
    }
    expect(getMembersForZone('KRS', d)).toEqual(KRS);
  });
});
