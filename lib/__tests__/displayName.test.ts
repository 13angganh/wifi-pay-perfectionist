import { describe, it, expect } from 'vitest';
import { DISPLAY_NAME_MAX, normalizeDisplayName } from '@/lib/displayName';

describe('normalizeDisplayName', () => {
  it.each([
    ['  Budi  ', 'Budi'],
    ['Budi   Santoso', 'Budi Santoso'],
    ['Bu\ndi\tS', 'Bu di S'],
    ['\u0000\u0007', ''],
    ['', ''],
  ])('%j → %j', (raw, out) => { expect(normalizeDisplayName(raw)).toBe(out); });
  it('null/undefined → kosong; dipangkas ke batas dan tanpa spasi di ujung', () => {
    expect(normalizeDisplayName(null)).toBe('');
    expect(normalizeDisplayName(undefined)).toBe('');
    const long = `${'A'.repeat(DISPLAY_NAME_MAX - 1)} ${'B'.repeat(10)}`;
    const out = normalizeDisplayName(long);
    expect(out.length).toBeLessThanOrEqual(DISPLAY_NAME_MAX);
    expect(out).toBe(out.trim());
  });
  it('mempertahankan huruf non-Latin dan emoji dasar tidak diproses khusus', () => {
    expect(normalizeDisplayName('  Hakim ﷲ ')).toBe('Hakim ﷲ');
  });
});
