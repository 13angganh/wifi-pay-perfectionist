// lib/__tests__/memberPeriods-db.test.ts — REDESAIN T12 (S1/S5/S6): lapisan data periode member.
// listenDB (migrasi saat load), normalizeImportedData (backup lama tetap bisa diimpor), importToDB (rekaman lama tidak
// ditulis lagi), buildClonePatch (periode ikut ke akun penagih), export→impor bolak-balik.
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { AppData } from '@/types';
import type { listenDB as ListenDBType, normalizeImportedData as NormalizeType, importToDB as ImportToDBType, buildClonePatch as ClonePatchType } from '@/lib/db';

let mockSnapshotValue: Record<string, unknown> | null = null;

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  onValue: vi.fn((_ref: unknown, callback: (snap: { val: () => unknown }) => void) => {
    callback({ val: () => mockSnapshotValue });
    return () => {};
  }),
  off: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  getDatabase: vi.fn(() => ({})),
}));

let listenDB: typeof ListenDBType;
let normalizeImportedData: typeof NormalizeType;
let importToDB: typeof ImportToDBType;
let buildClonePatch: typeof ClonePatchType;
let DEFAULT_APP_DATA: AppData;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'https://test-default-rtdb.firebaseio.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test.appspot.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '000000000000');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:000000000000:web:0000000000000000000000');
  ({ listenDB, normalizeImportedData, importToDB, buildClonePatch, DEFAULT_APP_DATA } = await import('@/lib/db'));
});

beforeEach(() => { mockSnapshotValue = null; });

function load(payload: Record<string, unknown> | null): AppData {
  mockSnapshotValue = payload;
  let received: AppData | null = null;
  listenDB('uid', (d) => { received = d; }, () => {});
  return received as unknown as AppData;
}

describe('DEFAULT_APP_DATA', () => {
  it('menyertakan memberPeriods: {} eksplisit (semua field AppData punya nilai default)', () => {
    expect(DEFAULT_APP_DATA.memberPeriods).toEqual({});
    expect(DEFAULT_APP_DATA.freeMembers).toEqual({});
  });
});

describe('listenDB — migrasi saat load', () => {
  it('rekaman free lama dimigrasikan ke memberPeriods; rekaman lama tetap diteruskan apa adanya (kompatibilitas)', () => {
    const r = load({
      krsMembers: ['A', 'B'], payments: {},
      freeMembers: { 'KRS__A': { active: true, fromYear: 2025, fromMonth: 2, toYear: 2025, toMonth: 4 }, 'KRS__B': true },
    });
    expect(r.memberPeriods).toEqual({ 'KRS__A': { free: [{ fromY: 2025, fromM: 2, toY: 2025, toM: 4 }] } });
    expect(r.freeMembers).toEqual({ 'KRS__A': { active: true, fromYear: 2025, fromMonth: 2, toYear: 2025, toMonth: 4 }, 'KRS__B': true });
  });
  it('IDEMPOTEN: entri memberPeriods yang sudah ada menang atas rekaman lama; array RTDB bolong dipulihkan; nilai cacat dibuang', () => {
    const r = load({
      krsMembers: ['A'], payments: {},
      freeMembers: { 'KRS__A': { active: true, fromYear: 2020, fromMonth: 0 } },
      memberPeriods: {
        'KRS__A': { joined: { y: 2026, m: 9 }, inactive: { 0: { fromY: 2026, fromM: 10 } } },
        'KRS__Z': { free: [{ fromY: 'x' }] },
      },
    });
    expect(r.memberPeriods).toEqual({ 'KRS__A': { joined: { y: 2026, m: 9 }, inactive: [{ fromY: 2026, fromM: 10 }] } });
  });
  it('tanpa freeMembers/memberPeriods di payload → memberPeriods = {} (bukan undefined)', () => {
    const r = load({ krsMembers: ['A'], payments: {} });
    expect(r.memberPeriods).toEqual({});
  });
  it('payload kosong (akun baru) → DEFAULT_APP_DATA', () => {
    expect(load(null).memberPeriods).toEqual({});
  });
});

describe('normalizeImportedData — backup lama tetap bisa diimpor (S6)', () => {
  it('backup v11.8.0 (hanya freeMembers) → memberPeriods terisi dari migrasi', () => {
    const r = normalizeImportedData({ krsMembers: ['ADIT'], payments: {}, freeMembers: { 'KRS__ADIT': { active: true, fromYear: 2026, fromMonth: 0 } } });
    expect(r!.memberPeriods).toEqual({ 'KRS__ADIT': { free: [{ fromY: 2026, fromM: 0 }] } });
    expect(r!.freeMembers).toEqual({ 'KRS__ADIT': { active: true, fromYear: 2026, fromMonth: 0 } }); // normalisasi lama tetap
  });
  it('berkas baru membawa memberPeriods dan menang atas rekaman lama pada kunci yang sama', () => {
    const r = normalizeImportedData({
      krsMembers: ['ADIT'], payments: {},
      freeMembers: { 'KRS__ADIT': { active: true, fromYear: 2020, fromMonth: 0 } },
      memberPeriods: { 'KRS__ADIT': { free: [{ fromY: 2026, fromM: 3, toY: 2026, toM: 5 }] } },
    });
    expect(r!.memberPeriods).toEqual({ 'KRS__ADIT': { free: [{ fromY: 2026, fromM: 3, toY: 2026, toM: 5 }] } });
  });
  it('memberPeriods salah tipe/cacat → diabaikan, TIDAK menggagalkan impor', () => {
    const r = normalizeImportedData({ krsMembers: ['A'], payments: {}, memberPeriods: 'bukan objek' });
    expect(r).not.toBeNull();
    expect(r!.memberPeriods).toEqual({});
  });
  it('Recycle Bin: periods valid ikut dan dibersihkan; periods cacat dibuang; entri tanpa periods tidak berubah', () => {
    const r = normalizeImportedData({
      krsMembers: [], payments: {},
      deletedMembers: {
        'KRS__X': { zone: 'KRS', name: 'X', deletedAt: 5, payments: {}, periods: { free: [{ fromY: 2026, fromM: 1 }, { fromY: 'x' }] } },
        'KRS__Y': { zone: 'KRS', name: 'Y', deletedAt: 6, payments: {}, periods: 'cacat' },
        'KRS__W': { zone: 'KRS', name: 'W', deletedAt: 7, payments: { 'KRS__W__2026__0': 1 } },
      },
    });
    expect(r!.deletedMembers['KRS__X'].periods).toEqual({ free: [{ fromY: 2026, fromM: 1 }] });
    expect('periods' in r!.deletedMembers['KRS__Y']).toBe(false);
    expect(r!.deletedMembers['KRS__W']).toEqual({ zone: 'KRS', name: 'W', deletedAt: 7, payments: { 'KRS__W__2026__0': 1 } });
  });
  it('export→impor bolak-balik: memberPeriods (termasuk zona kustom) sama persis', () => {
    const data: AppData = {
      krsMembers: ['A'], slkMembers: [], payments: {}, memberInfo: {}, activityLog: [], freeMembers: {}, deletedMembers: {}, operasional: {},
      zoneMembers: { TIMUR: ['CITRA'] },
      memberPeriods: {
        'KRS__A': { joined: { y: 2026, m: 0 }, free: [{ fromY: 2026, fromM: 4, toY: 2026, toM: 5 }, { fromY: 2026, fromM: 10 }], inactive: [{ fromY: 2026, fromM: 3, toY: 2026, toM: 3 }] },
        'TIMUR__CITRA': { joined: { y: 2026, m: 8 } },
      },
    };
    const round = normalizeImportedData(JSON.parse(JSON.stringify(data)));
    expect(round!.memberPeriods).toEqual(data.memberPeriods);
  });
});

describe('importToDB — rekaman free lama tidak ditulis lagi', () => {
  it('patch memuat memberPeriods hasil migrasi dan mengosongkan freeMembers', async () => {
    const { update } = await import('firebase/database');
    vi.mocked(update).mockClear();
    await importToDB('uid', { krsMembers: ['A'], payments: {}, freeMembers: { 'KRS__A': { active: true, fromYear: 2026, fromMonth: 1 } } } as unknown as AppData);
    const patch = vi.mocked(update).mock.calls[0][1] as Record<string, unknown>;
    expect(patch.memberPeriods).toEqual({ 'KRS__A': { free: [{ fromY: 2026, fromM: 1 }] } });
    expect(patch.freeMembers).toEqual({});
    expect(patch.zoneMembers).toEqual({});
  });
});

describe('buildClonePatch — periode member ikut ke akun penagih (D11)', () => {
  const source = (over: Partial<AppData> = {}): AppData => ({
    krsMembers: ['ABIL', 'ADIT'], slkMembers: [], payments: {}, memberInfo: {}, activityLog: [], freeMembers: {}, deletedMembers: {}, operasional: {},
    zoneMembers: { TIMUR: ['CITRA'] }, memberPeriods: {}, ...over,
  });
  it('Terdaftar sejak, Free, dan Nonaktif member terpilih ikut UTUH; yang tidak dipilih tidak ikut; tanpa freeMembers', () => {
    const periods = { joined: { y: 2026, m: 0 }, free: [{ fromY: 2026, fromM: 4, toY: 2026, toM: 5 }], inactive: [{ fromY: 2026, fromM: 7 }] };
    const patch = buildClonePatch(source({ memberPeriods: { 'KRS__ABIL': periods, 'KRS__ADIT': { joined: { y: 2025, m: 1 } } } }), [{ zone: 'KRS', name: 'ABIL' }]);
    expect(patch.memberPeriods).toEqual({ 'KRS__ABIL': periods });
    expect(patch.freeMembers).toBeUndefined();
  });
  it('sumber yang masih memakai rekaman lama dimigrasikan di patch (migrasi saat clone)', () => {
    const patch = buildClonePatch(
      source({ freeMembers: { 'KRS__ABIL': { active: true, fromYear: 2026, fromMonth: 6, toYear: 2026, toMonth: 8 } } }),
      [{ zone: 'KRS', name: 'ABIL' }],
    );
    expect(patch.memberPeriods).toEqual({ 'KRS__ABIL': { free: [{ fromY: 2026, fromM: 6, toY: 2026, toM: 8 }] } });
    expect(patch.freeMembers).toBeUndefined();
  });
  it('zona kustom diperlakukan sama (kunci ZONA__NAMA)', () => {
    const patch = buildClonePatch(source({ memberPeriods: { 'TIMUR__CITRA': { joined: { y: 2026, m: 8 } } } }), [{ zone: 'TIMUR', name: 'CITRA' }]);
    expect(patch.memberPeriods).toEqual({ 'TIMUR__CITRA': { joined: { y: 2026, m: 8 } } });
    expect(patch.zoneMembers).toEqual({ TIMUR: ['CITRA'] });
  });
  it('member tanpa periode → patch tidak memuat memberPeriods', () => {
    expect(buildClonePatch(source(), [{ zone: 'KRS', name: 'ABIL' }]).memberPeriods).toBeUndefined();
  });
});
