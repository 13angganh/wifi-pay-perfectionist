// lib/__tests__/helpers.test.ts
// Task 4.02 — unit tests fungsi kritis: getKey, getPay, isFree, isLunas,
//             getEffectivePay, getArrears, rp, rpShort, formatDate, fbKey, fuzzyMatch
// Task 4.03 — unit tests konstanta: getYears, MONTHS
import { describe, it, expect } from 'vitest';
import type { AppData } from '@/types';
import { getKey, getPay, isFree, isLunas, getEffectivePay, getArrears } from '@/lib/payment';
import { rp, rpShort, formatDate } from '@/lib/format';
import { fbKey } from '@/lib/firebase-key';
import { fuzzyMatch } from '@/lib/member';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';

// ── Fixture factory ──────────────────────────────────────────────────────────

function makeData(overrides: Partial<AppData> = {}): AppData {
  return {
    krsMembers:     ['BUDI', 'ANI'],
    slkMembers:     ['DONI'],
    payments:       {},
    memberInfo:     {},
    activityLog:    [],
    freeMembers:    {},
    deletedMembers: {},
    operasional:    {},
    zoneMembers:    {},
    ...overrides,
  };
}

/** Buat payments untuk semua bulan dari getYears()[0] s/d upToYear/upToMonth */
function payAllUntil(
  zone: string, name: string, upToYear: number, upToMonth: number,
): Record<string, number> {
  const payments: Record<string, number> = {};
  for (const y of getYears()) {
    if (y > upToYear) break;
    const maxM = y === upToYear ? upToMonth : 11;
    for (let mi = 0; mi <= maxM; mi++) {
      payments[`${zone}__${name}__${y}__${mi}`] = 100;
    }
  }
  return payments;
}

// ── fbKey ────────────────────────────────────────────────────────────────────

describe('fbKey', () => {
  it('mengganti karakter terlarang Firebase dengan tanda hubung', () => {
    expect(fbKey('a.b#c$d[e]f/g')).toBe('a-b-c-d-e-f-g');
  });
  it('string tanpa karakter terlarang tidak berubah', () => {
    expect(fbKey('BUDI')).toBe('BUDI');
  });
  it('string kosong tetap kosong', () => {
    expect(fbKey('')).toBe('');
  });
});

// ── getKey ───────────────────────────────────────────────────────────────────

describe('getKey', () => {
  it('format: zone__name__year__month', () => {
    expect(getKey('KRS', 'BUDI', 2025, 0)).toBe('KRS__BUDI__2025__0');
  });
  it('nama dengan titik di-sanitize via fbKey', () => {
    expect(getKey('KRS', 'A.B', 2025, 0)).toBe('KRS__A-B__2025__0');
  });
  it('zone SLK menghasilkan prefix SLK', () => {
    expect(getKey('SLK', 'DONI', 2024, 11)).toBe('SLK__DONI__2024__11');
  });
});

// ── getPay ───────────────────────────────────────────────────────────────────

describe('getPay', () => {
  it('null jika belum ada data pembayaran', () => {
    expect(getPay(makeData(), 'KRS', 'BUDI', 2025, 0)).toBeNull();
  });
  it('mengembalikan nilai yang tersimpan', () => {
    const d = makeData({ payments: { 'KRS__BUDI__2025__0': 100 } });
    expect(getPay(d, 'KRS', 'BUDI', 2025, 0)).toBe(100);
  });
  it('key tidak ada mengembalikan null (bukan undefined)', () => {
    const d = makeData({ payments: { 'KRS__BUDI__2025__1': 80 } });
    expect(getPay(d, 'KRS', 'BUDI', 2025, 0)).toBeNull();
  });
});

// ── isFree ───────────────────────────────────────────────────────────────────

describe('isFree', () => {
  it('false jika member tidak ada di freeMembers', () => {
    expect(isFree(makeData(), 'KRS', 'BUDI', 2025, 0)).toBe(false);
  });
  it('false jika freeMember tidak aktif', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: false, fromYear: 2024, fromMonth: 0 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 0)).toBe(false);
  });
  it('true jika bulan masuk rentang bebas tanpa batas akhir', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 3)).toBe(true);
  });
  it('false jika bulan sebelum fromYear/fromMonth', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 6 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 3)).toBe(false);
  });
  it('false jika bulan setelah toYear/toMonth', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0, toYear: 2025, toMonth: 5 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 6)).toBe(false);
  });
  it('true pada bulan batas akhir (inklusif)', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0, toYear: 2025, toMonth: 5 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 5)).toBe(true);
  });
  it('true pada bulan pertama (fromMonth exact)', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 3 },
    }});
    expect(isFree(d, 'KRS', 'BUDI', 2025, 3)).toBe(true);
  });
});

// ── isLunas ──────────────────────────────────────────────────────────────────

describe('isLunas', () => {
  it('false jika belum bayar dan bukan free', () => {
    expect(isLunas(makeData(), 'KRS', 'BUDI', 2025, 0)).toBe(false);
  });
  it('true jika sudah bayar', () => {
    const d = makeData({ payments: { 'KRS__BUDI__2025__0': 100 } });
    expect(isLunas(d, 'KRS', 'BUDI', 2025, 0)).toBe(true);
  });
  it('true jika member free (task 1.01 fix — tidak dianggap tunggakan)', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0 },
    }});
    expect(isLunas(d, 'KRS', 'BUDI', 2025, 0)).toBe(true);
  });
  it('false jika nominal 0 (not stored = null)', () => {
    // 0 tidak disimpan di payments, hanya nilai > 0
    expect(isLunas(makeData(), 'SLK', 'DONI', 2025, 0)).toBe(false);
  });
});

// ── getEffectivePay ──────────────────────────────────────────────────────────

describe('getEffectivePay', () => {
  it('0 jika member free (gratis = 0, bukan null)', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0 },
    }});
    expect(getEffectivePay(d, 'KRS', 'BUDI', 2025, 0)).toBe(0);
  });
  it('null jika belum bayar dan bukan free', () => {
    expect(getEffectivePay(makeData(), 'KRS', 'BUDI', 2025, 0)).toBeNull();
  });
  it('nilai bayar jika sudah lunas', () => {
    const d = makeData({ payments: { 'KRS__BUDI__2025__0': 150 } });
    expect(getEffectivePay(d, 'KRS', 'BUDI', 2025, 0)).toBe(150);
  });
});

// ── getArrears ───────────────────────────────────────────────────────────────

describe('getArrears', () => {
  it('array kosong jika semua bulan dari getYears()[0] s/d upTo sudah lunas', () => {
    const d = makeData({ payments: payAllUntil('KRS', 'BUDI', 2025, 3) });
    expect(getArrears(d, 'KRS', 'BUDI', 2025, 3)).toHaveLength(0);
  });

  it('mendeteksi satu bulan yang belum dibayar', () => {
    const payments = payAllUntil('KRS', 'BUDI', 2025, 1);
    delete payments['KRS__BUDI__2025__0'];   // kosongkan Jan 2025
    const d = makeData({ payments });
    const result = getArrears(d, 'KRS', 'BUDI', 2025, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ y: 2025, mi: 0 });
  });

  it('member free seluruh periode → array kosong (task 1.01 fix)', () => {
    const d = makeData({ freeMembers: {
      'KRS__BUDI': { active: true, fromYear: 2023, fromMonth: 0 },
    }});
    expect(getArrears(d, 'KRS', 'BUDI', 2025, 3)).toHaveLength(0);
  });

  it('tidak melebihi bulan upToYear/upToMonth', () => {
    const d = makeData();
    const result = getArrears(d, 'KRS', 'BUDI', 2025, 0);
    const future = result.filter(r => r.y > 2025 || (r.y === 2025 && r.mi > 0));
    expect(future).toHaveLength(0);
  });

  it('setiap item memiliki properti label, y, mi', () => {
    const d = makeData();
    const result = getArrears(d, 'KRS', 'BUDI', 2023, 0);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('label');
    expect(result[0]).toHaveProperty('y');
    expect(result[0]).toHaveProperty('mi');
  });
});

// ── rp ───────────────────────────────────────────────────────────────────────

describe('rp', () => {
  it('memformat 100 → "Rp 100.000"', () => {
    expect(rp(100)).toBe('Rp 100.000');
  });
  it('memformat 0 → "Rp 0"', () => {
    expect(rp(0)).toBe('Rp 0');
  });
  it('memformat 1500 → "Rp 1.500.000"', () => {
    expect(rp(1500)).toBe('Rp 1.500.000');
  });
});

// ── rpShort ──────────────────────────────────────────────────────────────────

describe('rpShort', () => {
  it('100 → "100.000"', () => {
    expect(rpShort(100)).toBe('100.000');
  });
  it('null → "—"', () => {
    expect(rpShort(null)).toBe('—');
  });
  it('undefined → "—"', () => {
    expect(rpShort(undefined)).toBe('—');
  });
  it('0 → "0"', () => {
    expect(rpShort(0)).toBe('0');
  });
});

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('null → "—"', () => {
    expect(formatDate(null)).toBe('—');
  });
  it('undefined → "—"', () => {
    expect(formatDate(undefined)).toBe('—');
  });
  it('ISO string valid → format tanggal berisi tahun 2025', () => {
    const result = formatDate('2025-04-01T00:00:00.000Z');
    expect(result).toMatch(/2025/);
  });
  it('string bukan tanggal → dikembalikan apa adanya', () => {
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal');
  });
});

// ── fuzzyMatch ───────────────────────────────────────────────────────────────

describe('fuzzyMatch', () => {
  it('query kosong selalu match', () => {
    expect(fuzzyMatch('ANGGA', '')).toBe(true);
  });
  it('exact match (case-insensitive)', () => {
    expect(fuzzyMatch('BUDI', 'budi')).toBe(true);
  });
  it('subsequence match: "ag" cocok ke "ANGGA"', () => {
    expect(fuzzyMatch('ANGGA', 'ag')).toBe(true);
  });
  it('tidak match jika karakter tidak ada', () => {
    expect(fuzzyMatch('BUDI', 'xyz')).toBe(false);
  });
  it('tidak match jika urutan salah', () => {
    expect(fuzzyMatch('BUDI', 'ib')).toBe(false);
  });
  it('angka dalam nama dapat dicari', () => {
    expect(fuzzyMatch('BUDI123', '123')).toBe(true);
  });
});

// ── MONTHS ───────────────────────────────────────────────────────────────────

describe('MONTHS (task 4.03)', () => {
  it('terdiri dari 12 bulan', () => {
    expect(MONTHS).toHaveLength(12);
  });
  it('menggunakan "Agu" untuk Agustus (task 1.10 fix — bukan "Agt")', () => {
    expect(MONTHS[7]).toBe('Agu');
  });
  it('tidak ada duplikat', () => {
    expect(new Set(MONTHS).size).toBe(12);
  });
  it('index 0 adalah Jan', () => {
    expect(MONTHS[0]).toBe('Jan');
  });
  it('index 11 adalah Des', () => {
    expect(MONTHS[11]).toBe('Des');
  });
});

describe('MONTHS_EN', () => {
  it('terdiri dari 12 bulan', () => {
    expect(MONTHS_EN).toHaveLength(12);
  });
  it('index 0 adalah Jan', () => {
    expect(MONTHS_EN[0]).toBe('Jan');
  });
  it('index 11 adalah Dec', () => {
    expect(MONTHS_EN[11]).toBe('Dec');
  });
});

// ── getYears ─────────────────────────────────────────────────────────────────

describe('getYears (task 4.03)', () => {
  it('dimulai dari 2023', () => {
    expect(getYears()[0]).toBe(2023);
  });
  it('berakhir di tahun berjalan + 2', () => {
    const years = getYears();
    const expected = new Date().getFullYear() + 2;
    expect(years[years.length - 1]).toBe(expected);
  });
  it('array berurutan tanpa celah', () => {
    const years = getYears();
    for (let i = 1; i < years.length; i++) {
      expect(years[i] - years[i - 1]).toBe(1);
    }
  });
  it('selalu memasukkan tahun berjalan', () => {
    expect(getYears()).toContain(new Date().getFullYear());
  });
  it('tidak frozen di build time — memasukkan tahun berjalan + 2', () => {
    const thisYear = new Date().getFullYear();
    expect(getYears()).toContain(thisYear + 2);
  });
});
