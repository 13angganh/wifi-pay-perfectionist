// lib/__tests__/memberPeriods.test.ts — REDESAIN T12 (S1): periode member (Terdaftar sejak · Free multi-periode · Nonaktif/Reaktivasi)
// Menguji fungsi murni lib/memberPeriods.ts: rentang inklusif, sanitasi, migrasi idempoten dari freeMembers lama,
// penulisan (tanpa nilai undefined), serta operasi Tambah/Ubah/Hapus/Nonaktifkan/Aktifkan kembali.
import { describe, it, expect } from 'vitest';
import type { AppData, MemberPeriods } from '@/types';
import {
  periodContains, inAnyPeriod, isBeforeJoined, periodsOverlap, sortPeriods, makePeriod, isValidPeriod,
  legacyFreeToPeriods, migrateFreeMembers, sanitizeMemberPeriods, cleanMemberPeriods,
  getMemberPeriods, setMemberPeriods, renameMemberPeriods, takeMemberPeriods,
  addPeriod, updatePeriod, removePeriod, setJoined, crossOverlap,
  deactivateFrom, reactivateFrom, getPeriodActions, findOpenInactiveIndex, ymFromIndex,
} from '@/lib/memberPeriods';

function makeData(over: Partial<AppData> = {}): AppData {
  return {
    krsMembers: ['BUDI', 'ANI'], slkMembers: [], payments: {}, memberInfo: {}, activityLog: [],
    freeMembers: {}, deletedMembers: {}, operasional: {}, zoneMembers: {}, memberPeriods: {}, ...over,
  };
}

/** Pastikan tidak ada nilai undefined di mana pun (Firebase set() menolaknya). */
function hasUndefined(v: unknown): boolean {
  if (v === undefined) return true;
  if (Array.isArray(v)) return v.some(hasUndefined);
  if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).some(hasUndefined);
  return false;
}

describe('rentang periode (inklusif, bulan 0–11)', () => {
  const p = makePeriod(2026, 3, { y: 2026, m: 5 }); // Apr–Jun 2026
  it('batas awal dan akhir ikut terhitung; di luar rentang tidak', () => {
    expect(periodContains(p, 2026, 2)).toBe(false);
    expect(periodContains(p, 2026, 3)).toBe(true);
    expect(periodContains(p, 2026, 5)).toBe(true);
    expect(periodContains(p, 2026, 6)).toBe(false);
  });
  it('periode tanpa akhir = terbuka (tanpa kunci undefined)', () => {
    const open = makePeriod(2026, 8);
    expect(open).toEqual({ fromY: 2026, fromM: 8 });
    expect('toY' in open).toBe(false);
    expect(periodContains(open, 2026, 7)).toBe(false);
    expect(periodContains(open, 2099, 0)).toBe(true);
  });
  it('lintas tahun dihitung benar (Nov 2025 – Feb 2026)', () => {
    const q = makePeriod(2025, 10, { y: 2026, m: 1 });
    expect([periodContains(q, 2025, 9), periodContains(q, 2025, 11), periodContains(q, 2026, 0), periodContains(q, 2026, 2)]).toEqual([false, true, true, false]);
  });
  it('inAnyPeriod: daftar kosong/undefined = false; salah satu cocok = true', () => {
    expect(inAnyPeriod(undefined, 2026, 0)).toBe(false);
    expect(inAnyPeriod([], 2026, 0)).toBe(false);
    expect(inAnyPeriod([makePeriod(2023, 0, { y: 2023, m: 1 }), makePeriod(2026, 0)], 2026, 6)).toBe(true);
  });
  it('isBeforeJoined: tanpa joined = sejak awal (selalu false)', () => {
    expect(isBeforeJoined(undefined, 2023, 0)).toBe(false);
    expect(isBeforeJoined({ free: [] }, 2023, 0)).toBe(false);
    const mp: MemberPeriods = { joined: { y: 2026, m: 9 } };
    expect(isBeforeJoined(mp, 2026, 8)).toBe(true);
    expect(isBeforeJoined(mp, 2026, 9)).toBe(false);
  });
  it('periodsOverlap: bersebelahan TIDAK tumpang tindih; berbagi satu bulan = tumpang tindih; terbuka menelan yang sesudahnya', () => {
    const a = makePeriod(2026, 0, { y: 2026, m: 3 });
    expect(periodsOverlap(a, makePeriod(2026, 4, { y: 2026, m: 6 }))).toBe(false);
    expect(periodsOverlap(a, makePeriod(2026, 3, { y: 2026, m: 6 }))).toBe(true);
    expect(periodsOverlap(makePeriod(2026, 9), makePeriod(2027, 0, { y: 2027, m: 1 }))).toBe(true);
  });
  it('sortPeriods urut awal lalu akhir (terbuka terakhir) dan tidak mengubah masukan', () => {
    const input = [makePeriod(2026, 9), makePeriod(2023, 0, { y: 2026, m: 3 }), makePeriod(2026, 4, { y: 2026, m: 7 })];
    const snapshot = JSON.stringify(input);
    expect(sortPeriods(input).map(x => `${x.fromY}-${x.fromM}`)).toEqual(['2023-0', '2026-4', '2026-9']);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
  it('isValidPeriod: akhir sebelum awal, bulan di luar 0–11, dan akhir setengah-terisi ditolak', () => {
    expect(isValidPeriod(makePeriod(2026, 5, { y: 2026, m: 4 }))).toBe(false);
    expect(isValidPeriod({ fromY: 2026, fromM: 12 })).toBe(false);
    expect(isValidPeriod({ fromY: 2026, fromM: 1, toY: 2026 })).toBe(false);
    expect(isValidPeriod(makePeriod(2026, 5, { y: 2026, m: 5 }))).toBe(true);
    expect(isValidPeriod(makePeriod(2026, 5))).toBe(true);
  });
  it('ymFromIndex kebalikan dari y*12+m', () => {
    expect(ymFromIndex(2026 * 12 + 11)).toEqual({ y: 2026, m: 11 });
    expect(ymFromIndex(2026 * 12 - 1)).toEqual({ y: 2025, m: 11 });
  });
});

describe('rekaman free lama → periode baru (meniru isFree lama)', () => {
  it('aktif dengan akhir → satu periode tertutup', () => {
    expect(legacyFreeToPeriods({ active: true, fromYear: 2026, fromMonth: 6, toYear: 2026, toMonth: 8 }))
      .toEqual({ free: [{ fromY: 2026, fromM: 6, toY: 2026, toM: 8 }] });
  });
  it('aktif tanpa akhir → terbuka', () => {
    expect(legacyFreeToPeriods({ active: true, fromYear: 2025, fromMonth: 0 })).toEqual({ free: [{ fromY: 2025, fromM: 0 }] });
  });
  it('akhir hanya berlaku bila toYear DAN toMonth ada (selain itu terbuka, seperti isFree lama)', () => {
    expect(legacyFreeToPeriods({ active: true, fromYear: 2025, fromMonth: 0, toYear: 2026 })).toEqual({ free: [{ fromY: 2025, fromM: 0 }] });
  });
  it('tidak aktif / cacat / bukan objek → undefined (tidak dianggap free)', () => {
    expect(legacyFreeToPeriods({ active: false, fromYear: 2025, fromMonth: 0 })).toBeUndefined();
    expect(legacyFreeToPeriods(true)).toBeUndefined();
    expect(legacyFreeToPeriods(null)).toBeUndefined();
    expect(legacyFreeToPeriods({ active: true, fromYear: 'x', fromMonth: 0 })).toBeUndefined();
    expect(legacyFreeToPeriods({ active: true, fromYear: 2026, fromMonth: 5, toYear: 2026, toMonth: 2 })).toBeUndefined(); // akhir < awal: tak pernah cocok
  });
});

describe('sanitasi dan migrasi', () => {
  it('sanitizeMemberPeriods membuang entri/periode cacat, mengurutkan, dan menerima bentuk objek RTDB berindeks bolong', () => {
    const raw = {
      'KRS__A': { joined: { y: 2026, m: 9 }, free: { 0: { fromY: 2026, fromM: 5 }, 2: { fromY: 2023, fromM: 0, toY: 2023, toM: 3 } }, inactive: [{ fromY: 2026, fromM: 20 }] },
      'KRS__B': { free: [] },
      'KRS__C': 'cacat',
      'KRS__D': { free: [{ fromY: 2026, fromM: 2, toY: 2026 }] }, // akhir setengah → periode dibuang, bukan dilebarkan
    };
    const out = sanitizeMemberPeriods(raw);
    expect(Object.keys(out)).toEqual(['KRS__A']);
    expect(out['KRS__A']).toEqual({ joined: { y: 2026, m: 9 }, free: [{ fromY: 2023, fromM: 0, toY: 2023, toM: 3 }, { fromY: 2026, fromM: 5 }] });
    expect(hasUndefined(out)).toBe(false);
  });
  it('sanitizeMemberPeriods: masukan bukan objek → {}', () => {
    expect(sanitizeMemberPeriods(null)).toEqual({});
    expect(sanitizeMemberPeriods([])).toEqual({});
    expect(sanitizeMemberPeriods('x')).toEqual({});
  });
  it('migrateFreeMembers memindahkan rekaman lama dan MELEWATI nilai cacat', () => {
    const out = migrateFreeMembers(undefined, {
      'KRS__A': { active: true, fromYear: 2025, fromMonth: 1 },
      'KRS__B': true, 'KRS__C': { active: false, fromYear: 2025, fromMonth: 1 },
    });
    expect(out).toEqual({ 'KRS__A': { free: [{ fromY: 2025, fromM: 1 }] } });
  });
  it('IDEMPOTEN: migrasi kedua kali sama persis, dan entri baru tidak pernah ditimpa rekaman lama', () => {
    const legacy = { 'KRS__A': { active: true, fromYear: 2025, fromMonth: 1 }, 'KRS__B': { active: true, fromYear: 2024, fromMonth: 0 } };
    const once = migrateFreeMembers({}, legacy);
    expect(migrateFreeMembers(once, legacy)).toEqual(once);
    // A sudah diubah di struktur baru (free dikosongkan, hanya joined): rekaman lama TIDAK boleh menghidupkannya lagi
    const edited = { ...once, 'KRS__A': { joined: { y: 2026, m: 0 } } };
    const again = migrateFreeMembers(edited, legacy);
    expect(again['KRS__A']).toEqual({ joined: { y: 2026, m: 0 } });
    expect(again['KRS__B']).toEqual(once['KRS__B']);
  });
  it('cleanMemberPeriods: entri kosong → undefined', () => {
    expect(cleanMemberPeriods({})).toBeUndefined();
    expect(cleanMemberPeriods({ free: [], inactive: [] })).toBeUndefined();
  });
});

describe('akses dan penulisan entri', () => {
  it('getMemberPeriods: entri baru menang; cadangan ke rekaman lama; tanpa keduanya = undefined', () => {
    const d = makeData({
      memberPeriods: { 'KRS__BUDI': { joined: { y: 2026, m: 0 } } },
      freeMembers: { 'KRS__BUDI': { active: true, fromYear: 2020, fromMonth: 0 }, 'KRS__ANI': { active: true, fromYear: 2025, fromMonth: 0 } },
    });
    expect(getMemberPeriods(d, 'KRS', 'BUDI')).toEqual({ joined: { y: 2026, m: 0 } });
    expect(getMemberPeriods(d, 'KRS', 'ANI')).toEqual({ free: [{ fromY: 2025, fromM: 0 }] });
    expect(getMemberPeriods(d, 'KRS', 'NOBODY')).toBeUndefined();
  });
  it('zona kustom memakai kunci ZONA__NAMA yang sama (tanpa percabangan zona)', () => {
    const d = makeData({ memberPeriods: { 'TIMUR__CITRA': { joined: { y: 2026, m: 2 } } } });
    expect(getMemberPeriods(d, 'TIMUR', 'CITRA')).toEqual({ joined: { y: 2026, m: 2 } });
    expect(getMemberPeriods(d, 'KRS', 'CITRA')).toBeUndefined();
  });
  it('setMemberPeriods menulis, tidak mengubah masukan, dan tidak memuat nilai undefined', () => {
    const d = makeData();
    const snap = JSON.stringify(d);
    const out = setMemberPeriods(d, 'KRS', 'BUDI', { joined: { y: 2026, m: 9 }, free: [makePeriod(2026, 0, { y: 2026, m: 2 })] });
    expect(JSON.stringify(d)).toBe(snap);
    expect(out.memberPeriods!['KRS__BUDI']).toEqual({ joined: { y: 2026, m: 9 }, free: [{ fromY: 2026, fromM: 0, toY: 2026, toM: 2 }] });
    expect(hasUndefined(out.memberPeriods)).toBe(false);
  });
  it('setMemberPeriods dengan entri kosong MENGHAPUS kuncinya (RTDB tidak menyimpan objek kosong)', () => {
    const d = makeData({ memberPeriods: { 'KRS__BUDI': { joined: { y: 2026, m: 0 } } } });
    expect(setMemberPeriods(d, 'KRS', 'BUDI', {}).memberPeriods).toEqual({});
    expect(setMemberPeriods(d, 'KRS', 'BUDI', undefined).memberPeriods).toEqual({});
  });
  it('setMemberPeriods MENGONSUMSI rekaman free lama kunci itu (tidak bisa hidup lagi lewat migrasi)', () => {
    const d = makeData({ freeMembers: { 'KRS__BUDI': { active: true, fromYear: 2025, fromMonth: 0 }, 'KRS__ANI': { active: true, fromYear: 2025, fromMonth: 0 } } });
    const out = setMemberPeriods(d, 'KRS', 'BUDI', undefined);
    expect(out.freeMembers).toEqual({ 'KRS__ANI': { active: true, fromYear: 2025, fromMonth: 0 } });
    expect(migrateFreeMembers(out.memberPeriods, out.freeMembers)['KRS__BUDI']).toBeUndefined();
  });
  it('renameMemberPeriods memindahkan entri (termasuk yang masih berupa rekaman lama) ke nama baru', () => {
    const d = makeData({
      memberPeriods: { 'KRS__BUDI': { joined: { y: 2026, m: 3 }, inactive: [makePeriod(2026, 5, { y: 2026, m: 6 })] } },
      freeMembers: { 'KRS__ANI': { active: true, fromYear: 2025, fromMonth: 0 } },
    });
    const r1 = renameMemberPeriods(d, 'KRS', 'BUDI', 'BUDIMAN');
    expect(r1.memberPeriods!['KRS__BUDI']).toBeUndefined();
    expect(r1.memberPeriods!['KRS__BUDIMAN']).toEqual(d.memberPeriods!['KRS__BUDI']);
    const r2 = renameMemberPeriods(d, 'KRS', 'ANI', 'ANA');
    expect(r2.memberPeriods!['KRS__ANA']).toEqual({ free: [{ fromY: 2025, fromM: 0 }] });
    expect(r2.freeMembers).toEqual({});
    expect(renameMemberPeriods(d, 'KRS', 'BUDI', 'BUDI')).toBe(d);
  });
  it('takeMemberPeriods mengambil periode efektif dan membuang kuncinya dari data aktif', () => {
    const d = makeData({ memberPeriods: { 'KRS__BUDI': { joined: { y: 2026, m: 3 } } }, freeMembers: { 'KRS__ANI': { active: true, fromYear: 2025, fromMonth: 0 } } });
    const t1 = takeMemberPeriods(d, 'KRS', 'BUDI');
    expect(t1.periods).toEqual({ joined: { y: 2026, m: 3 } });
    expect(t1.data.memberPeriods).toEqual({});
    const t2 = takeMemberPeriods(d, 'KRS', 'ANI');
    expect(t2.periods).toEqual({ free: [{ fromY: 2025, fromM: 0 }] });
    expect(t2.data.freeMembers).toEqual({});
    expect(takeMemberPeriods(d, 'KRS', 'TIDAK ADA').periods).toBeUndefined();
  });
});

describe('Tambah / Ubah / Hapus periode', () => {
  it('Free multi-periode: contoh user (Jan 2023–Apr 2026, lalu Sep–Okt 2026) diterima; sejenis tidak boleh tumpang tindih', () => {
    let mp: MemberPeriods | undefined;
    const r1 = addPeriod(mp, 'free', makePeriod(2023, 0, { y: 2026, m: 3 }));
    expect(r1.ok).toBe(true); if (r1.ok) mp = r1.value;
    const r2 = addPeriod(mp, 'free', makePeriod(2026, 8, { y: 2026, m: 9 }));
    expect(r2.ok).toBe(true); if (r2.ok) mp = r2.value;
    expect(mp!.free).toEqual([{ fromY: 2023, fromM: 0, toY: 2026, toM: 3 }, { fromY: 2026, fromM: 8, toY: 2026, toM: 9 }]);
    expect(addPeriod(mp, 'free', makePeriod(2026, 3, { y: 2026, m: 5 }))).toEqual({ ok: false, error: 'overlap' });   // berbagi Apr 2026
    expect(addPeriod(mp, 'free', makePeriod(2026, 10))).toMatchObject({ ok: true });                                  // Nov 2026 terbuka: bersebelahan
  });
  it('akhir sebelum awal ditolak (invalidRange)', () => {
    expect(addPeriod(undefined, 'free', makePeriod(2026, 5, { y: 2026, m: 2 }))).toEqual({ ok: false, error: 'invalidRange' });
  });
  it('Ubah periode: tidak bentrok dengan dirinya sendiri; bentrok dengan tetangga ditolak; indeks salah = notFound', () => {
    const base: MemberPeriods = { free: [makePeriod(2026, 0, { y: 2026, m: 2 }), makePeriod(2026, 6, { y: 2026, m: 8 })] };
    expect(updatePeriod(base, 'free', 0, makePeriod(2026, 0, { y: 2026, m: 4 }))).toMatchObject({ ok: true });
    expect(updatePeriod(base, 'free', 0, makePeriod(2026, 0, { y: 2026, m: 7 }))).toEqual({ ok: false, error: 'overlap' });
    expect(updatePeriod(base, 'free', 5, makePeriod(2026, 0))).toEqual({ ok: false, error: 'notFound' });
  });
  it('Hapus periode: daftar kosong membuang kuncinya; indeks salah = notFound', () => {
    const base: MemberPeriods = { joined: { y: 2026, m: 0 }, free: [makePeriod(2026, 0, { y: 2026, m: 2 })] };
    const r = removePeriod(base, 'free', 0);
    expect(r).toEqual({ ok: true, value: { joined: { y: 2026, m: 0 } } });
    expect(removePeriod(base, 'free', 3)).toEqual({ ok: false, error: 'notFound' });
  });
  it('Terdaftar sejak: set dan hapus (null = sejak awal); bulan di luar 0–11 ditolak', () => {
    const r = setJoined({ free: [makePeriod(2026, 0)] }, { y: 2026, m: 9 });
    expect(r).toEqual({ ok: true, value: { free: [{ fromY: 2026, fromM: 0 }], joined: { y: 2026, m: 9 } } });
    expect(setJoined({ joined: { y: 2026, m: 9 } }, null)).toEqual({ ok: true, value: {} });
    expect(setJoined(undefined, { y: 2026, m: 13 })).toEqual({ ok: false, error: 'invalidRange' });
  });
  it('crossOverlap: Free vs Nonaktif boleh bertumpuk tetapi terdeteksi (untuk peringatan UI)', () => {
    const mp: MemberPeriods = { inactive: [makePeriod(2026, 3, { y: 2026, m: 5 })] };
    expect(crossOverlap(mp, 'free', makePeriod(2026, 4, { y: 2026, m: 8 }))).toBe(true);
    expect(crossOverlap(mp, 'free', makePeriod(2026, 6, { y: 2026, m: 8 }))).toBe(false);
    expect(crossOverlap(undefined, 'inactive', makePeriod(2026, 0))).toBe(false);
    expect(addPeriod(mp, 'free', makePeriod(2026, 4, { y: 2026, m: 8 }))).toMatchObject({ ok: true }); // tidak ditolak
  });
});

describe('Nonaktifkan / Aktifkan kembali (skenario S3)', () => {
  const joinedJan: MemberPeriods = { joined: { y: 2026, m: 0 } };

  it('S3: "Nonaktifkan mulai Apr" lalu "Aktifkan kembali mulai Mei" ⇒ {Apr–Apr}; lalu Sep/Okt ⇒ {Sep–Sep}', () => {
    const d1 = deactivateFrom(joinedJan, 2026, 3);
    expect(d1.ok).toBe(true); if (!d1.ok) return;
    expect(d1.value.inactive).toEqual([{ fromY: 2026, fromM: 3 }]);
    expect(findOpenInactiveIndex(d1.value)).not.toBe(-1);
    const r1 = reactivateFrom(d1.value, 2026, 4);
    expect(r1.ok).toBe(true); if (!r1.ok) return;
    expect(r1.value.inactive).toEqual([{ fromY: 2026, fromM: 3, toY: 2026, toM: 3 }]);
    expect(findOpenInactiveIndex(r1.value)).toBe(-1);
    const d2 = deactivateFrom(r1.value, 2026, 8);
    expect(d2.ok).toBe(true); if (!d2.ok) return;
    const r2 = reactivateFrom(d2.value, 2026, 9);
    expect(r2.ok).toBe(true); if (!r2.ok) return;
    expect(r2.value.inactive).toEqual([
      { fromY: 2026, fromM: 3, toY: 2026, toM: 3 },
      { fromY: 2026, fromM: 8, toY: 2026, toM: 8 },
    ]);
    expect(r2.value.joined).toEqual({ y: 2026, m: 0 });
    expect(hasUndefined(r2.value)).toBe(false);
  });
  it('Reaktivasi tidak ada bila tidak ada periode nonaktif terbuka (hanya muncul bila sebelumnya dinonaktifkan)', () => {
    expect(reactivateFrom(joinedJan, 2026, 4)).toEqual({ ok: false, error: 'noOpenInactive' });
    expect(getPeriodActions(joinedJan, 2026, 4)).toEqual({ canDeactivate: true, canReactivate: false });
    const closed: MemberPeriods = { inactive: [makePeriod(2026, 3, { y: 2026, m: 3 })] };
    expect(getPeriodActions(closed, 2026, 8).canReactivate).toBe(false);
  });
  it('relevansi tombol pada bulan terpilih: dalam periode terbuka → hanya Aktifkan kembali; sebelum awal terbuka → tak satu pun', () => {
    const open: MemberPeriods = { joined: { y: 2026, m: 0 }, inactive: [makePeriod(2026, 3)] };
    expect(getPeriodActions(open, 2026, 5)).toEqual({ canDeactivate: false, canReactivate: true });
    expect(getPeriodActions(open, 2026, 3)).toEqual({ canDeactivate: false, canReactivate: false }); // reaktivasi harus SETELAH bulan mulai
    expect(getPeriodActions(open, 2026, 1)).toEqual({ canDeactivate: false, canReactivate: false }); // periode terbuka dimulai sesudahnya
  });
  it('Nonaktifkan sebelum "Terdaftar sejak" ditolak; di dalam periode tertutup = overlap; di dalam terbuka = alreadyInactive', () => {
    expect(deactivateFrom({ joined: { y: 2026, m: 5 } }, 2026, 3)).toEqual({ ok: false, error: 'beforeJoined' });
    const mp: MemberPeriods = { inactive: [makePeriod(2026, 3, { y: 2026, m: 5 }), makePeriod(2026, 10)] };
    expect(deactivateFrom(mp, 2026, 4)).toEqual({ ok: false, error: 'overlap' });
    expect(deactivateFrom(mp, 2026, 11)).toEqual({ ok: false, error: 'alreadyInactive' });
    expect(deactivateFrom(mp, 2026, 8)).toEqual({ ok: false, error: 'overlap' }); // periode terbuka Nov akan bertabrakan dengan yang dimulai sesudahnya
  });
  it('findOpenInactiveIndex memilih periode terbuka yang paling akhir dimulai', () => {
    expect(findOpenInactiveIndex({ inactive: [makePeriod(2026, 1), makePeriod(2026, 5)] })).toBe(1);
    expect(findOpenInactiveIndex(undefined)).toBe(-1);
  });
});
