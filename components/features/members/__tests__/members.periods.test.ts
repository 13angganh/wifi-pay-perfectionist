// components/features/members/__tests__/members.periods.test.ts — REDESAIN T12 (S5, D6, D11)
// Tambah/Edit/Hapus/Pulihkan membawa periode member: "Terdaftar sejak", Free multi-periode, Nonaktif.
// Menutup celah lama: rename → status free hilang; hapus → free tertinggal yatim dan diwarisi member baru bernama sama.
import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { getMemberPeriods, migrateFreeMembers } from '@/lib/memberPeriods';
import type { AppData, MemberPeriods } from '@/types';
import { EMPTY_FORM, buildAddMember, buildDeleteMember, buildEditMember, buildRestoreMember } from '../members.logic';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

const PERIODS: MemberPeriods = {
  joined: { y: 2026, m: 0 },
  free: [{ fromY: 2026, fromM: 4, toY: 2026, toM: 5 }],
  inactive: [{ fromY: 2026, fromM: 7, toY: 2026, toM: 7 }, { fromY: 2026, fromM: 10 }],
};

const mk = (over: Partial<AppData> = {}): AppData => ({
  ...DEFAULT_APP_DATA,
  krsMembers: ['ABIL', 'ADIT'], slkMembers: [], zoneMembers: { TIMUR: ['BUDI'] },
  memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 100 }, TIMUR__BUDI: { tarif: 60 } },
  payments: { KRS__ABIL__2026__9: 100, TIMUR__BUDI__2026__9: 60 },
  deletedMembers: {}, freeMembers: {}, memberPeriods: { KRS__ABIL: PERIODS, TIMUR__BUDI: { joined: { y: 2026, m: 3 } } },
  ...over,
});
const form = (over: Partial<typeof EMPTY_FORM> & { joined?: { y: number; m: number } | null } = {}) => ({ ...EMPTY_FORM, ...over });
const noUndefined = (v: unknown): boolean => JSON.stringify(v) === JSON.stringify(JSON.parse(JSON.stringify(v)));

describe('Tambah member — "Terdaftar sejak" (D6)', () => {
  it('dengan bulan terdaftar → entri periode hanya berisi joined', () => {
    const r = buildAddMember(mk(), 'KRS', form({ name: 'baru', joined: { y: 2026, m: 9 } }));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.data.memberPeriods!.KRS__BARU).toEqual({ joined: { y: 2026, m: 9 } });
    expect(r.data.memberPeriods!.KRS__ABIL).toEqual(PERIODS);               // member lain tidak tersentuh
  });
  it('"Sejak awal" (null) atau tanpa pilihan → tidak ada entri; data periode lain utuh', () => {
    for (const joined of [null, undefined]) {
      const r = buildAddMember(mk(), 'KRS', form({ name: 'baru', joined }));
      expect(r.ok).toBe(true); if (!r.ok) return;
      expect(r.data.memberPeriods!.KRS__BARU).toBeUndefined();
      expect(r.data.memberPeriods).toEqual(mk().memberPeriods);
    }
  });
  it('member BARU tidak mewarisi sisa periode nama yang sama (free lama yang yatim dan entri periode yatim)', () => {
    const base = mk({
      freeMembers: { KRS__BARU: { active: true, fromYear: 2023, fromMonth: 0 } },
      memberPeriods: { KRS__BARU: { inactive: [{ fromY: 2025, fromM: 0 }] } },
    });
    const r = buildAddMember(base, 'KRS', form({ name: 'baru' }));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(getMemberPeriods(r.data, 'KRS', 'BARU')).toBeUndefined();
    expect(r.data.freeMembers!.KRS__BARU).toBeUndefined();
    expect(migrateFreeMembers(r.data.memberPeriods, r.data.freeMembers).KRS__BARU).toBeUndefined();
  });
  it('zona kustom diperlakukan sama (kunci ZONA__NAMA)', () => {
    const r = buildAddMember(mk(), 'TIMUR', form({ name: 'citra', joined: { y: 2026, m: 5 } }));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.data.memberPeriods!.TIMUR__CITRA).toEqual({ joined: { y: 2026, m: 5 } });
    expect(r.data.krsMembers).toEqual(['ABIL', 'ADIT']);
  });
});

describe('Ubah member — rename dan "Terdaftar sejak"', () => {
  it('rename memindahkan SEMUA periode ke nama baru (celah lama "rename → free hilang" tertutup)', () => {
    const r = buildEditMember(mk(), 'KRS', 'ABIL', form({ name: 'abilah' }));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.data.memberPeriods!.KRS__ABILAH).toEqual(PERIODS);
    expect(r.data.memberPeriods!.KRS__ABIL).toBeUndefined();
  });
  it('rename juga memindahkan rekaman free LAMA yang belum dimigrasikan, dan tidak meninggalkan sisa', () => {
    const base = mk({ memberPeriods: {}, freeMembers: { KRS__ABIL: { active: true, fromYear: 2025, fromMonth: 1 } } });
    const r = buildEditMember(base, 'KRS', 'ABIL', form({ name: 'abilah' }));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(getMemberPeriods(r.data, 'KRS', 'ABILAH')).toEqual({ free: [{ fromY: 2025, fromM: 1 }] });
    expect(r.data.freeMembers!.KRS__ABIL).toBeUndefined();
    expect(getMemberPeriods(r.data, 'KRS', 'ABIL')).toBeUndefined();
  });
  it('joined: objek = diset (periode lain utuh); null = dihapus; undefined = tidak diubah', () => {
    const set = buildEditMember(mk(), 'KRS', 'ABIL', form({ name: 'ABIL', joined: { y: 2026, m: 5 } }));
    expect(set.ok && set.data.memberPeriods!.KRS__ABIL).toEqual({ ...PERIODS, joined: { y: 2026, m: 5 } });
    const clr = buildEditMember(mk(), 'KRS', 'ABIL', form({ name: 'ABIL', joined: null }));
    expect(clr.ok && clr.data.memberPeriods!.KRS__ABIL).toEqual({ free: PERIODS.free, inactive: PERIODS.inactive });
    const keep = buildEditMember(mk(), 'KRS', 'ABIL', form({ name: 'ABIL' }));
    expect(keep.ok && keep.data.memberPeriods!.KRS__ABIL).toEqual(PERIODS);
  });
  it('member tanpa periode: mengosongkan joined tidak membuat entri kosong', () => {
    const r = buildEditMember(mk(), 'KRS', 'ADIT', form({ name: 'ADIT', joined: null }));
    expect(r.ok && r.data.memberPeriods!.KRS__ADIT).toBeUndefined();
  });
});

describe('Hapus → Recycle Bin → pulihkan membawa periode (D11)', () => {
  it('hapus: periode ikut ke entri bin dan keluar dari data aktif (termasuk rekaman free lama)', () => {
    const d = buildDeleteMember(mk(), 'KRS', 'ABIL', 123);
    expect(d.deletedMembers!.KRS__ABIL.periods).toEqual(PERIODS);
    expect(d.memberPeriods!.KRS__ABIL).toBeUndefined();
    expect(d.memberPeriods!.TIMUR__BUDI).toEqual({ joined: { y: 2026, m: 3 } });   // member lain utuh

    const legacy = buildDeleteMember(mk({ memberPeriods: {}, freeMembers: { KRS__ABIL: { active: true, fromYear: 2025, fromMonth: 1 } } }), 'KRS', 'ABIL', 123);
    expect(legacy.deletedMembers!.KRS__ABIL.periods).toEqual({ free: [{ fromY: 2025, fromM: 1 }] });
    expect(legacy.freeMembers!.KRS__ABIL).toBeUndefined();
  });
  it('entri bin tanpa periode tidak memuat kunci `periods` (tanpa nilai undefined untuk Firebase)', () => {
    const d = buildDeleteMember(mk(), 'KRS', 'ADIT', 123);
    expect('periods' in d.deletedMembers!.KRS__ADIT).toBe(false);
    expect(noUndefined(d.deletedMembers)).toBe(true);
  });
  it('pulihkan: periode kembali persis seperti sebelum dihapus (hapus lalu pulihkan = bolak-balik)', () => {
    const base = mk();
    const del = buildDeleteMember(base, 'KRS', 'ABIL', 123);
    const res = buildRestoreMember(del, 'KRS__ABIL');
    expect(res).not.toBeNull();
    expect(res!.data.memberPeriods!.KRS__ABIL).toEqual(PERIODS);
    expect(res!.data.krsMembers).toEqual(['ABIL', 'ADIT']);
    expect(res!.data.deletedMembers!.KRS__ABIL).toBeUndefined();
  });
  it('pulihkan: yang dipulihkan menang atas entri periode nama yang sama saat ini (seperti pembayaran)', () => {
    const del = buildDeleteMember(mk(), 'KRS', 'ABIL', 123);
    const clash: AppData = { ...del, memberPeriods: { ...del.memberPeriods, KRS__ABIL: { joined: { y: 2027, m: 0 } } } };
    expect(buildRestoreMember(clash, 'KRS__ABIL')!.data.memberPeriods!.KRS__ABIL).toEqual(PERIODS);
  });
  it('entri bin lama (sebelum T12, tanpa `periods`): pulihkan tidak mengubah periode apa pun', () => {
    const base = mk({ deletedMembers: { KRS__LAMA: { zone: 'KRS', name: 'LAMA', deletedAt: 1, payments: { KRS__LAMA__2026__1: 50 } } } });
    const res = buildRestoreMember(base, 'KRS__LAMA')!;
    expect(res.data.memberPeriods).toEqual(base.memberPeriods);
    expect(res.data.payments['KRS__LAMA__2026__1']).toBe(50);
  });
  it('zona kustom: hapus dan pulihkan membawa periode yang sama', () => {
    const del = buildDeleteMember(mk(), 'TIMUR', 'BUDI', 123);
    expect(del.deletedMembers!.TIMUR__BUDI.periods).toEqual({ joined: { y: 2026, m: 3 } });
    expect(buildRestoreMember(del, 'TIMUR__BUDI')!.data.memberPeriods!.TIMUR__BUDI).toEqual({ joined: { y: 2026, m: 3 } });
  });
});
