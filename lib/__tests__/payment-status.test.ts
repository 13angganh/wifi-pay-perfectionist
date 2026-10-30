// lib/__tests__/payment-status.test.ts — REDESAIN T12 (S1/S5): resolver status bulan + paritas dengan perilaku T11.
// Skenario baku dari prompt T12 (bulan 0–11, periode inklusif; "berbayar" = tertagih, lunas bila ada pembayaran).
import { describe, it, expect } from 'vitest';
import type { AppData, FreeMember, MemberPeriods } from '@/types';
import { getKey, getPay, getMonthStatus, isFree, isLunas, isNotApplicable, getEffectivePay, getArrears, billableMonths, resolveMonthStatus } from '@/lib/payment';
import { migrateFreeMembers, makePeriod } from '@/lib/memberPeriods';

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    krsMembers: ['BUDI'], slkMembers: [], payments: {}, memberInfo: {}, activityLog: [],
    freeMembers: {}, deletedMembers: {}, operasional: {}, zoneMembers: {}, memberPeriods: {}, ...over,
  };
}
const withPeriods = (mp: MemberPeriods, over: Partial<AppData> = {}): AppData =>
  makeData({ memberPeriods: { 'KRS__BUDI': mp }, ...over });
const isTracked = (d: AppData, z: string, n: string, y: number, m: number) => !isNotApplicable(getMonthStatus(d, z, n, y, m));
const statuses = (d: AppData, y: number, months: number[]) => months.map(m => getMonthStatus(d, 'KRS', 'BUDI', y, m));

describe('S1 — Free multi-periode', () => {
  // Free 2023-01…2026-04; berbayar 2026-05…2026-08; free 2026-09…2026-10; berbayar mulai 2026-11
  const d = withPeriods({ free: [makePeriod(2023, 0, { y: 2026, m: 3 }), makePeriod(2026, 8, { y: 2026, m: 9 })] });

  it('status per bulan benar di setiap segmen', () => {
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2023, 0)).toBe('free');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2025, 6)).toBe('free');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 3)).toBe('free');   // Apr 2026 (batas akhir inklusif)
    expect(statuses(d, 2026, [4, 5, 6, 7])).toEqual(['belum', 'belum', 'belum', 'belum']); // Mei–Agu
    expect(statuses(d, 2026, [8, 9])).toEqual(['free', 'free']);       // Sep–Okt
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 10)).toBe('belum');  // Nov 2026
  });
  it('tunggakan per Nov 2026 hanya bulan berbayar tanpa pembayaran (Mei–Agu, Nov); Sep–Okt = Free bukan Belum', () => {
    const labels = getArrears(d, 'KRS', 'BUDI', 2026, 10).map(a => `${a.y}-${a.mi}`);
    expect(labels).toEqual(['2026-4', '2026-5', '2026-6', '2026-7', '2026-10']);
    expect(isLunas(d, 'KRS', 'BUDI', 2026, 8)).toBe(true);
    expect(isFree(d, 'KRS', 'BUDI', 2026, 9)).toBe(true);
    expect(getEffectivePay(d, 'KRS', 'BUDI', 2026, 8)).toBe(0);
  });
  it('pembayaran Mei–Agu melunasi bulan itu; bulan Free tidak pernah menjadi tunggakan', () => {
    const paid = withPeriods(d.memberPeriods!['KRS__BUDI'], {
      payments: Object.fromEntries([4, 5, 6, 7].map(m => [getKey('KRS', 'BUDI', 2026, m), 100000])),
    });
    expect(getArrears(paid, 'KRS', 'BUDI', 2026, 10).map(a => a.mi)).toEqual([10]);
  });
});

describe('S2 — Terdaftar sejak 2026-10', () => {
  const d = withPeriods({ joined: { y: 2026, m: 9 } });
  it('bulan sebelum terdaftar = belumTerdaftar (N/A): tidak terhitung', () => {
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 8)).toBe('belumTerdaftar');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2023, 0)).toBe('belumTerdaftar');
    expect(isTracked(d, 'KRS', 'BUDI', 2026, 8)).toBe(false);
    expect(isTracked(d, 'KRS', 'BUDI', 2026, 9)).toBe(true);
  });
  it('per Okt 2026 dengan Okt belum bayar → tunggakan tepat 1 bulan; bulan sebelumnya tidak ikut', () => {
    const arrears = getArrears(d, 'KRS', 'BUDI', 2026, 9);
    expect(arrears).toHaveLength(1);
    expect(arrears[0]).toMatchObject({ y: 2026, mi: 9 });
    expect(billableMonths(d, 'KRS', 'BUDI', 2026, 9).map(b => b.mi)).toEqual([9]);
  });
  it('tanpa "terdaftar sejak" (member lama) = sejak awal: angka lama tidak berubah', () => {
    const old = makeData();
    expect(getArrears(old, 'KRS', 'BUDI', 2026, 9)).toHaveLength(46); // Jan 2023 … Okt 2026, tanpa satu bulan pun dibuang
  });
});

describe('S3 — Nonaktif berulang', () => {
  const d = withPeriods({
    joined: { y: 2026, m: 0 },
    inactive: [makePeriod(2026, 3, { y: 2026, m: 3 }), makePeriod(2026, 8, { y: 2026, m: 8 })], // Apr dan Sep
  });
  it('Apr dan Sep = nonaktif (N/A); bulan lain tertagih', () => {
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 3)).toBe('nonaktif');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 8)).toBe('nonaktif');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 4)).toBe('belum');
  });
  it('tunggakan per Okt 2026 tidak menghitung Apr dan Sep', () => {
    expect(getArrears(d, 'KRS', 'BUDI', 2026, 9).map(a => a.mi)).toEqual([0, 1, 2, 4, 5, 6, 7, 9]);
  });
});

describe('D2 — prioritas bila periode tumpang tindih', () => {
  it('Belum terdaftar > Nonaktif > Free > pembayaran', () => {
    const d = withPeriods({
      joined: { y: 2026, m: 4 },
      free: [makePeriod(2026, 0, { y: 2026, m: 11 })],
      inactive: [makePeriod(2026, 6, { y: 2026, m: 7 })],
    });
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 2)).toBe('belumTerdaftar'); // free menutupi, tetapi belum terdaftar menang
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 6)).toBe('nonaktif');       // free vs nonaktif → nonaktif menang
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 5)).toBe('free');
  });
  it('Free tetap menang atas pembayaran (sama seperti sebelum T12): efektif Rp 0', () => {
    const d = withPeriods({ free: [makePeriod(2026, 0, { y: 2026, m: 11 })] }, { payments: { [getKey('KRS', 'BUDI', 2026, 2)]: 100000 } });
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 2)).toBe('free');
    expect(getEffectivePay(d, 'KRS', 'BUDI', 2026, 2)).toBe(0);
    expect(getPay(d, 'KRS', 'BUDI', 2026, 2)).toBe(100000);
  });
});

describe('D3 — pembayaran yang sudah tercatat di bulan N/A tetap dihitung', () => {
  it('belum terdaftar / nonaktif + pembayaran → lunas dengan nominalnya; tanpa pembayaran → N/A', () => {
    const d = withPeriods(
      { joined: { y: 2026, m: 5 }, inactive: [makePeriod(2026, 8, { y: 2026, m: 9 })] },
      { payments: { [getKey('KRS', 'BUDI', 2026, 2)]: 100000, [getKey('KRS', 'BUDI', 2026, 8)]: 50000 } },
    );
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 2)).toBe('lunas');
    expect(getEffectivePay(d, 'KRS', 'BUDI', 2026, 2)).toBe(100000);
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 8)).toBe('lunas');
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 9)).toBe('nonaktif');
    expect(isTracked(d, 'KRS', 'BUDI', 2026, 2)).toBe(true);
  });
  it('pembayaran Rp 0 (akumulasi) juga dianggap tercatat', () => {
    const d = withPeriods({ joined: { y: 2026, m: 5 } }, { payments: { [getKey('KRS', 'BUDI', 2026, 2)]: 0 } });
    expect(getMonthStatus(d, 'KRS', 'BUDI', 2026, 2)).toBe('lunas');
  });
});

describe('zona kustom = KRS/SLK (kunci ZONA__NAMA, tanpa percabangan zona)', () => {
  it('status dan tunggakan zona kustom memakai periodenya sendiri', () => {
    const d = makeData({ zoneMembers: { TIMUR: ['CITRA'] }, memberPeriods: { 'TIMUR__CITRA': { joined: { y: 2026, m: 8 } } } });
    expect(getMonthStatus(d, 'TIMUR', 'CITRA', 2026, 7)).toBe('belumTerdaftar');
    expect(getArrears(d, 'TIMUR', 'CITRA', 2026, 9).map(a => a.mi)).toEqual([8, 9]);
    expect(getMonthStatus(d, 'KRS', 'CITRA', 2026, 7)).toBe('belum'); // zona lain tidak terpengaruh
  });
});

describe('resolveMonthStatus (murni)', () => {
  it('tanpa entri periode: lunas bila ada pembayaran, selain itu belum', () => {
    expect(resolveMonthStatus(undefined, true, 2026, 0)).toBe('lunas');
    expect(resolveMonthStatus(undefined, false, 2026, 0)).toBe('belum');
  });
});

// ════════════════════════════════════════════════════════════
// S5 — PARITAS: dataset lama (satu periode free, tanpa terdaftar/nonaktif) → keluaran SAMA dengan T11.
// Implementasi T11 disalin apa adanya sebagai pembanding; data acak dengan PRNG tetap (deterministik).
// ════════════════════════════════════════════════════════════
function legacyIsFree(data: AppData, zone: string, name: string, year: number, month: number): boolean {
  const fm: FreeMember | undefined = data.freeMembers?.[zone + '__' + name];
  if (!fm || !fm.active) return false;
  const ym = year * 12 + month;
  const fromYm = fm.fromYear * 12 + fm.fromMonth;
  const toYm = (fm.toYear != null && fm.toMonth != null) ? fm.toYear * 12 + fm.toMonth : Infinity;
  return ym >= fromYm && ym <= toYm;
}
const legacyIsLunas = (d: AppData, z: string, n: string, y: number, m: number) => legacyIsFree(d, z, n, y, m) || getPay(d, z, n, y, m) !== null;
const legacyEffectivePay = (d: AppData, z: string, n: string, y: number, m: number) =>
  legacyIsFree(d, z, n, y, m) ? 0 : (d.payments?.[getKey(z, n, y, m)] ?? null);
function legacyArrears(d: AppData, z: string, n: string, upY: number, upM: number) {
  const out: { y: number; mi: number }[] = [];
  for (let y = 2023; y <= upY; y++) {
    const maxM = y === upY ? upM : 11;
    for (let mi = 0; mi <= maxM; mi++) if (!legacyIsLunas(d, z, n, y, mi)) out.push({ y, mi });
  }
  return out;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomLegacyDataset(seed: number): AppData {
  const rnd = mulberry32(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  const freeMembers: Record<string, FreeMember> = {};
  const payments: Record<string, number> = {};
  for (const n of names) {
    const r = rnd();
    if (r < 0.75) {
      const fm: FreeMember = { active: rnd() < 0.85, fromYear: int(2023, 2027), fromMonth: int(0, 11) };
      const kind = rnd();
      if (kind < 0.5) { fm.toYear = int(2023, 2028); fm.toMonth = int(0, 11); }  // dapat saja akhir < awal (tak pernah cocok)
      else if (kind < 0.6) { fm.toYear = int(2023, 2028); }                       // setengah-terisi → terbuka (perilaku lama)
      freeMembers[`KRS__${n}`] = fm;
    }
    for (let y = 2023; y <= 2027; y++) for (let m = 0; m < 12; m++) if (rnd() < 0.45) payments[getKey('KRS', n, y, m)] = rnd() < 0.1 ? 0 : int(1, 9) * 50000;
  }
  return makeData({ krsMembers: names, payments, freeMembers, memberPeriods: {} });
}

describe('S5 — paritas dengan T11 untuk dataset lama (property test atas fixture acak)', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];

  it.each(seeds)('seed %i: isFree / isLunas / getEffectivePay identik untuk setiap member dan bulan 2023–2028', (seed) => {
    const d = randomLegacyDataset(seed);
    const migrated: AppData = { ...d, memberPeriods: migrateFreeMembers(d.memberPeriods, d.freeMembers), freeMembers: {} };
    for (const n of names) for (let y = 2023; y <= 2028; y++) for (let m = 0; m < 12; m++) {
      const f = legacyIsFree(d, 'KRS', n, y, m);
      // 1) langsung dari rekaman lama (cadangan baca)   2) setelah migrasi ke memberPeriods
      for (const data of [d, migrated]) {
        if (isFree(data, 'KRS', n, y, m) !== f) throw new Error(`isFree beda: seed ${seed} ${n} ${y}-${m}`);
        if (isLunas(data, 'KRS', n, y, m) !== legacyIsLunas(d, 'KRS', n, y, m)) throw new Error(`isLunas beda: seed ${seed} ${n} ${y}-${m}`);
        if (getEffectivePay(data, 'KRS', n, y, m) !== legacyEffectivePay(d, 'KRS', n, y, m)) throw new Error(`getEffectivePay beda: seed ${seed} ${n} ${y}-${m}`);
        if (!isTracked(data, 'KRS', n, y, m)) throw new Error(`dataset lama tidak boleh punya bulan N/A: seed ${seed} ${n} ${y}-${m}`);
      }
    }
    expect(true).toBe(true);
  });

  it.each(seeds)('seed %i: getArrears identik (daftar bulan, urutan, dan jumlah)', (seed) => {
    const d = randomLegacyDataset(seed);
    const migrated: AppData = { ...d, memberPeriods: migrateFreeMembers(d.memberPeriods, d.freeMembers), freeMembers: {} };
    for (const n of names) for (const [uy, um] of [[2023, 0], [2025, 5], [2026, 9], [2027, 11]]) {
      const expected = legacyArrears(d, 'KRS', n, uy, um);
      for (const data of [d, migrated]) {
        const got = getArrears(data, 'KRS', n, uy, um).map(a => ({ y: a.y, mi: a.mi }));
        expect(got).toEqual(expected);
      }
    }
  });

  it('migrasi tidak mengubah apa pun pada keluaran dan idempoten bila diulang', () => {
    const d = randomLegacyDataset(424242);
    const once = migrateFreeMembers(d.memberPeriods, d.freeMembers);
    expect(migrateFreeMembers(once, d.freeMembers)).toEqual(once);
    expect(migrateFreeMembers(once, {})).toEqual(once);
  });
});
