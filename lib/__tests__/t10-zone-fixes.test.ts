// lib/__tests__/t10-zone-fixes.test.ts — REDESAIN T10: perbaikan zona kustom di lib + logika bersama Pengaturan
// (Import membawa zoneMembers & mendaftarkan zona, Export PDF/Excel & Ringkasan WA per zona aktif, daftar zona bersama).
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { DEFAULT_APP_DATA, normalizeImportedData, extractImportedCustomZones, zonesToRegister } from '@/lib/db';
import { zoneRows, zonesFromData } from '@/lib/export.excel';
import { doWASummary } from '@/lib/export.wa';
import { allZoneKeys, zoneChoices, importZoneCounts, importSummary } from '@/components/features/settings/settings.logic';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';

const Y = 2026, M = 9;
const data: AppData = {
  ...DEFAULT_APP_DATA,
  krsMembers: ['ABIL', 'ADIT'], slkMembers: ['SARI'], zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
  payments: { [`KRS__ABIL__${Y}__${M}`]: 100, [`TIMUR__BUDI__${Y}__${M}`]: 60 },
  memberInfo: {}, freeMembers: {}, deletedMembers: {}, operasional: {},
};
const settings = { ...DEFAULT_SETTINGS, customZones: [{ key: 'TIMUR', name: 'Timur', color: '#10B981' }], hiddenZones: [] as string[] };

describe('Import membawa member zona kustom', () => {
  it('normalizeImportedData membaca zoneMembers (hanya array nama bertipe string)', () => {
    const n = normalizeImportedData({ krsMembers: ['A'], payments: {}, zoneMembers: { TIMUR: ['BUDI', 5, null, 'CITRA'], RUSAK: 'bukan array' } })!;
    expect(n.zoneMembers).toEqual({ TIMUR: ['BUDI', 'CITRA'] });
  });
  it('tanpa zoneMembers → objek kosong (bukan undefined)', () => {
    expect(normalizeImportedData({ krsMembers: ['A'] })!.zoneMembers).toEqual({});
    expect(normalizeImportedData({ krsMembers: ['A'], zoneMembers: [1, 2] })!.zoneMembers).toEqual({});
  });
  it('extractImportedCustomZones: dari settings.customZones atau customZones; item tak valid dibuang', () => {
    expect(extractImportedCustomZones({ settings: { customZones: [{ key: 'TIMUR', name: 'Timur', color: '#fff' }, { name: 'tanpa key' }, null] } })).toEqual([{ key: 'TIMUR', name: 'Timur', color: '#fff' }]);
    expect(extractImportedCustomZones({ customZones: [{ key: 'UTARA' }] })).toEqual([{ key: 'UTARA', name: 'UTARA', color: '' }]);
    expect(extractImportedCustomZones(null)).toEqual([]);
    expect(extractImportedCustomZones({})).toEqual([]);
  });
  it('zonesToRegister: zona dari zoneMembers yang belum terdaftar didaftarkan; yang sudah ada / zona dasar tidak', () => {
    const reg = zonesToRegister([{ key: 'TIMUR', name: 'T', color: '#111111' }], { TIMUR: ['A'], UTARA: ['B'], KRS: ['salah'] });
    expect(reg.map(z => z.key)).toEqual(['UTARA']);
    expect(reg[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
  it('zonesToRegister memakai warna dari file bila ada', () => {
    expect(zonesToRegister([], { UTARA: ['B'] }, [{ key: 'UTARA', name: 'Utara', color: '#abcdef' }])[0]).toEqual({ key: 'UTARA', name: 'Utara', color: '#abcdef' });
  });
});

describe('Export PDF/Excel — baris member per zona tanpa cabang zona', () => {
  it('zonesFromData: zona dasar + kunci zoneMembers', () => expect(zonesFromData(data)).toEqual(['KRS', 'SLK', 'TIMUR']));
  it('satu zona kustom', () => expect(zoneRows(data, 'TIMUR')).toEqual([{ n: 'BUDI', z: 'TIMUR' }, { n: 'CITRA', z: 'TIMUR' }]));
  it('ALL = semua zona (data) atau daftar zona yang diberikan', () => {
    expect(zoneRows(data, 'ALL')).toHaveLength(5);
    expect(zoneRows(data, 'ALL', ['SLK', 'TIMUR']).map(r => r.z)).toEqual(['SLK', 'TIMUR', 'TIMUR']);
  });
  it('zona dasar tetap bekerja', () => expect(zoneRows(data, 'KRS').map(r => r.n)).toEqual(['ABIL', 'ADIT']));
});

describe('Ringkasan WA — satu blok per zona aktif', () => {
  let opened = '';
  beforeEach(() => { opened = ''; vi.spyOn(window, 'open').mockImplementation((u?: string | URL) => { opened = decodeURIComponent(String(u)); return null; }); });
  it('memuat zona kustom (pendapatan dan jumlah belum bayar)', () => {
    doWASummary(data, Y, M);
    expect(opened).toContain('KRS : Rp 100.000');
    expect(opened).toContain('TIMUR : Rp 60.000');
    expect(opened).toMatch(/Total: Rp 160\.000/);
    expect(opened).toMatch(/TIMUR: 1/); // CITRA belum bayar
  });
  it('hanya zona yang diberikan (zona aktif)', () => {
    doWASummary(data, Y, M, ['KRS', 'SLK']);
    expect(opened).not.toContain('TIMUR');
    expect(opened).toMatch(/Total: Rp 100\.000/);
  });
});

describe('daftar zona bersama Pengaturan', () => {
  it('allZoneKeys: dasar lalu kustom, termasuk yang tersembunyi', () => {
    expect(allZoneKeys(settings)).toEqual(['KRS', 'SLK', 'TIMUR']);
    expect(allZoneKeys({ ...settings, hiddenZones: ['TIMUR'] })).toEqual(['KRS', 'SLK', 'TIMUR']);
  });
  it('zoneChoices: zona aktif (+ ALL)', () => {
    expect(zoneChoices(settings, false)).toEqual(['KRS', 'SLK', 'TIMUR']);
    expect(zoneChoices(settings, true)).toEqual(['KRS', 'SLK', 'TIMUR', 'ALL']);
    expect(zoneChoices({ ...settings, hiddenZones: ['TIMUR'] }, false)).toEqual(['KRS', 'SLK']);
  });
  it('ringkasan Import per zona', () => {
    expect(importZoneCounts(data)).toEqual([{ zone: 'KRS', count: 2 }, { zone: 'SLK', count: 1 }, { zone: 'TIMUR', count: 2 }]);
    expect(importSummary(data, 'pembayaran')).toBe('2 KRS · 1 SLK · 2 TIMUR · 2 pembayaran');
  });
});
