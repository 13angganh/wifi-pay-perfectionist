// components/features/members/__tests__/members.logic.test.ts — REDESAIN T9
// Logika murni Member: urutan 6 mode, pencarian A21, tambah/edit/hapus/pulihkan/hapus permanen, dan
// PERBAIKAN ZONA KUSTOM (tambah/edit/hapus/pulihkan tidak mengubah krsMembers/slkMembers; 2 sampai 5 zona).
import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { getMembersForZone } from '@/lib/member';
import type { AppData } from '@/types';
import {
  EMPTY_FORM, SORT_MODES, buildAddMember, buildDeleteMember, buildEditMember, buildPurgeMember,
  buildRestoreMember, deletedForZone, matchesQuery, memberInfoOf, routerHref, sortMembers,
} from '../members.logic';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

const mk = (over: Partial<AppData> = {}): AppData => ({
  ...DEFAULT_APP_DATA,
  krsMembers: ['ABIL', 'ADIT'],
  slkMembers: ['SARI'],
  zoneMembers: { TIMUR: ['BUDI', 'CITRA'] },
  memberInfo: {
    KRS__ABIL: { id: 'KRS-010', ip: '192.168.1.10', tarif: 100 },
    KRS__ADIT: { id: 'KRS-002', ip: 'http://10.0.0.2', notes: 'catatan' },
    TIMUR__BUDI: { id: 'TMR-001', ip: '192.168.9.1' },
  },
  payments: {
    KRS__ABIL__2026__8: 100, KRS__ABIL__2026__9: 100,
    TIMUR__BUDI__2026__9: 60,
  },
  deletedMembers: {}, freeMembers: {},
  ...over,
});
const form = (o: Partial<typeof EMPTY_FORM>) => ({ ...EMPTY_FORM, ...o });

describe('sortMembers — 6 mode seperti zip', () => {
  const d = mk({ krsMembers: ['B', 'A', 'C'], memberInfo: { KRS__A: { id: 'KRS-10', ip: '10.0.0.10' }, KRS__B: { id: 'KRS-2', ip: '10.0.0.2' } } });
  const info = (n: string) => memberInfoOf(d, 'KRS', n);
  const names = ['B', 'A', 'C'];
  it('nama naik/turun', () => {
    expect(sortMembers(names, info, 'name-asc')).toEqual(['A', 'B', 'C']);
    expect(sortMembers(names, info, 'name-desc')).toEqual(['C', 'B', 'A']);
  });
  it('ID naik: numerik, ID kosong di akhir ("zzz")', () => {
    expect(sortMembers(names, info, 'id-asc')).toEqual(['B', 'A', 'C']);
  });
  it('ID turun: ID kosong di akhir daftar turun', () => {
    expect(sortMembers(names, info, 'id-desc')).toEqual(['A', 'B', 'C']);
  });
  it('IP naik/turun', () => {
    expect(sortMembers(names, info, 'ip-asc')).toEqual(['B', 'A', 'C']);
    expect(sortMembers(names, info, 'ip-desc')).toEqual(['A', 'B', 'C']);
  });
  it('tidak memutasi masukan dan ada 6 mode', () => {
    const src = ['B', 'A'];
    sortMembers(src, info, 'name-asc');
    expect(src).toEqual(['B', 'A']);
    expect(SORT_MODES).toHaveLength(6);
  });
});

describe('A21 matchesQuery — nama, ID, atau IP', () => {
  it('cocok lewat nama, ID, IP; tidak peka huruf besar; spasi tepi diabaikan', () => {
    expect(matchesQuery('ABIL', { id: 'KRS-010', ip: '192.168.1.10' }, 'abi')).toBe(true);
    expect(matchesQuery('ABIL', { id: 'KRS-010', ip: '192.168.1.10' }, 'krs-01')).toBe(true);
    expect(matchesQuery('ABIL', { id: 'KRS-010', ip: '192.168.1.10' }, '168.1.10')).toBe(true);
    expect(matchesQuery('ABIL', { id: 'KRS-010', ip: '192.168.1.10' }, '  ABIL ')).toBe(true);
  });
  it('query kosong cocok; tidak ada yang cocok = false; info kosong aman', () => {
    expect(matchesQuery('ABIL', {}, '')).toBe(true);
    expect(matchesQuery('ABIL', {}, 'zzz')).toBe(false);
    expect(matchesQuery('ABIL', { id: undefined, ip: undefined }, 'undefined')).toBe(false);
  });
  it('routerHref: http dipertahankan, selain itu diberi http://', () => {
    expect(routerHref('http://a.b')).toBe('http://a.b');
    expect(routerHref('192.168.1.1')).toBe('http://192.168.1.1');
  });
});

describe('buildAddMember — validasi zip + A23 catatan', () => {
  it('nama wajib, karakter terlarang, duplikat (urutan sama dengan zip)', () => {
    const d = mk();
    expect(buildAddMember(d, 'KRS', form({ name: '   ' }))).toEqual({ ok: false, error: 'nameRequired' });
    for (const bad of ['A.B', 'A#B', 'A$B', 'A[B', 'A]B', 'A/B']) {
      expect(buildAddMember(d, 'KRS', form({ name: bad }))).toEqual({ ok: false, error: 'nameInvalidChar' });
    }
    expect(buildAddMember(d, 'KRS', form({ name: 'abil' }))).toEqual({ ok: false, error: 'nameDuplicate' });
  });
  it('nama otomatis huruf besar, daftar terurut, info tersimpan; tarif kosong = tanpa field tarif', () => {
    const r = buildAddMember(mk(), 'KRS', form({ name: ' budi baru ', id: ' K-1 ', ip: ' 10.1.1.1 ' }));
    if (!r.ok) throw new Error('harus ok');
    expect(r.name).toBe('BUDI BARU');
    expect(r.data.krsMembers).toEqual(['ABIL', 'ADIT', 'BUDI BARU']);
    expect(r.data.memberInfo!['KRS__BUDI BARU']).toEqual({ id: 'K-1', ip: '10.1.1.1' });
  });
  it('tarif terisi tersimpan sebagai angka; A23 catatan tersimpan saat Tambah', () => {
    const r = buildAddMember(mk(), 'SLK', form({ name: 'x', tarif: '120', notes: '  pindahan  ' }));
    if (!r.ok) throw new Error('harus ok');
    expect(r.data.memberInfo!['SLK__X']).toEqual({ id: '', ip: '', tarif: 120, notes: 'pindahan' });
  });
  it('tidak memutasi appData asli', () => {
    const d = mk(); const snap = JSON.stringify(d);
    buildAddMember(d, 'KRS', form({ name: 'baru' }));
    expect(JSON.stringify(d)).toBe(snap);
  });
});

describe('buildEditMember', () => {
  it('nama sama: info diperbarui; tarif/catatan dikosongkan = dihapus', () => {
    const r = buildEditMember(mk(), 'KRS', 'ADIT', form({ name: 'adit', id: 'KRS-777', ip: '1.1.1.1' }));
    if (!r.ok) throw new Error('harus ok');
    expect(r.data.memberInfo!.KRS__ADIT).toEqual({ id: 'KRS-777', ip: '1.1.1.1' });
  });
  it('rename memindahkan data bayar dan info ke nama baru, daftar terurut', () => {
    const r = buildEditMember(mk(), 'KRS', 'ABIL', form({ name: 'zaki', id: 'KRS-010', ip: '192.168.1.10', tarif: '100' }));
    if (!r.ok) throw new Error('harus ok');
    expect(r.data.krsMembers).toEqual(['ADIT', 'ZAKI']);
    expect(Object.keys(r.data.payments).filter(k => k.includes('__ABIL__'))).toEqual([]);
    expect(r.data.payments.KRS__ZAKI__2026__8).toBe(100);
    expect(r.data.payments.KRS__ZAKI__2026__9).toBe(100);
    expect(r.data.memberInfo!.KRS__ABIL).toBeUndefined();
    expect(r.data.memberInfo!.KRS__ZAKI).toMatchObject({ id: 'KRS-010', tarif: 100 });
  });
  it('galat: kosong, karakter terlarang, tidak ditemukan, duplikat', () => {
    const d = mk();
    expect(buildEditMember(d, 'KRS', 'ABIL', form({ name: '' }))).toEqual({ ok: false, error: 'nameRequired' });
    expect(buildEditMember(d, 'KRS', 'ABIL', form({ name: 'A/B' }))).toEqual({ ok: false, error: 'nameInvalidChar' });
    expect(buildEditMember(d, 'KRS', 'TIDAKADA', form({ name: 'X' }))).toEqual({ ok: false, error: 'notFound' });
    expect(buildEditMember(d, 'KRS', 'ABIL', form({ name: 'adit' }))).toEqual({ ok: false, error: 'nameDuplicate' });
  });
});

describe('hapus → Recycle Bin → pulihkan / hapus permanen', () => {
  it('hapus: keluar dari daftar, pembayaran pindah ke deletedMembers, member lain utuh', () => {
    const d = mk();
    const n = buildDeleteMember(d, 'KRS', 'ABIL', 1234);
    expect(n.krsMembers).toEqual(['ADIT']);
    expect(Object.keys(n.payments).filter(k => k.startsWith('KRS__ABIL__'))).toEqual([]);
    expect(n.payments.TIMUR__BUDI__2026__9).toBe(60);
    expect(n.deletedMembers.KRS__ABIL).toEqual({
      zone: 'KRS', name: 'ABIL', deletedAt: 1234, payments: { KRS__ABIL__2026__8: 100, KRS__ABIL__2026__9: 100 },
    });
  });
  it('pulihkan: kembali ke daftar zona asal (terurut), pembayaran kembali, entri bin hilang', () => {
    const d = buildDeleteMember(mk(), 'KRS', 'ABIL', 1);
    const r = buildRestoreMember(d, 'KRS__ABIL');
    expect(r).not.toBeNull();
    expect(r!.data.krsMembers).toEqual(['ABIL', 'ADIT']);
    expect(r!.data.payments.KRS__ABIL__2026__9).toBe(100);
    expect(r!.data.deletedMembers).toEqual({});
    expect(r!.entry.name).toBe('ABIL');
  });
  it('pulihkan kunci yang tidak ada = null; nama yang sudah ada di daftar tidak digandakan', () => {
    expect(buildRestoreMember(mk(), 'KRS__GHAIB')).toBeNull();
    const d = { ...buildDeleteMember(mk(), 'KRS', 'ABIL', 1), krsMembers: ['ABIL', 'ADIT'] } as AppData;
    expect(buildRestoreMember(d, 'KRS__ABIL')!.data.krsMembers).toEqual(['ABIL', 'ADIT']);
  });
  it('hapus permanen hanya membuang entri bin itu', () => {
    let d = buildDeleteMember(mk(), 'KRS', 'ABIL', 1);
    d = buildDeleteMember(d, 'KRS', 'ADIT', 2);
    const n = buildPurgeMember(d, 'KRS__ABIL');
    expect(Object.keys(n.deletedMembers)).toEqual(['KRS__ADIT']);
  });
  it('deletedForZone: hanya zona itu, terbaru dulu', () => {
    let d = buildDeleteMember(mk(), 'KRS', 'ABIL', 100);
    d = buildDeleteMember(d, 'KRS', 'ADIT', 300);
    d = buildDeleteMember(d, 'TIMUR', 'BUDI', 200);
    expect(deletedForZone(d, 'KRS').map(([, x]) => x.name)).toEqual(['ADIT', 'ABIL']);
    expect(deletedForZone(d, 'TIMUR').map(([, x]) => x.name)).toEqual(['BUDI']);
    expect(deletedForZone(d, 'SLK')).toEqual([]);
  });
});

describe('PERBAIKAN ZONA KUSTOM — zona kustom berlogika sama dengan KRS/SLK (2 sampai 5 zona)', () => {
  const customNames = ['TIMUR', 'BARAT', 'UTARA', 'SELATAN', 'PUSAT'];
  for (let n = 1; n <= 5; n++) {
    const zones = customNames.slice(0, n);
    const data = () => mk({
      zoneMembers: Object.fromEntries(zones.map(z => [z, [`${z}-1`, `${z}-2`]])),
      memberInfo: {}, payments: {},
    });

    it(`${n + 2} zona: tambah di tiap zona kustom hanya mengubah zona itu`, () => {
      for (const z of zones) {
        const d = data();
        const r = buildAddMember(d, z, form({ name: 'baru', tarif: '90' }));
        if (!r.ok) throw new Error('harus ok');
        expect(r.data.krsMembers).toEqual(d.krsMembers);
        expect(r.data.slkMembers).toEqual(d.slkMembers);
        expect(getMembersForZone(z, r.data)).toEqual(['BARU', `${z}-1`, `${z}-2`].sort());
        for (const other of zones.filter(x => x !== z)) expect(getMembersForZone(other, r.data)).toEqual(d.zoneMembers![other]);
        expect(r.data.memberInfo![`${z}__BARU`]).toMatchObject({ tarif: 90 });
      }
    });

    it(`${n + 2} zona: edit (rename + pindah data bayar), hapus, pulihkan di zona kustom tidak menyentuh KRS/SLK`, () => {
      for (const z of zones) {
        const d = { ...data(), payments: { [`${z}__${z}-1__2026__9`]: 50 } } as AppData;
        const ed = buildEditMember(d, z, `${z}-1`, form({ name: 'renamed' }));
        if (!ed.ok) throw new Error('harus ok');
        expect(ed.data.krsMembers).toEqual(d.krsMembers);
        expect(ed.data.slkMembers).toEqual(d.slkMembers);
        expect(getMembersForZone(z, ed.data)).toContain('RENAMED');
        expect(ed.data.payments[`${z}__RENAMED__2026__9`]).toBe(50);

        const del = buildDeleteMember(d, z, `${z}-2`, 5);
        expect(del.krsMembers).toEqual(d.krsMembers);
        expect(del.slkMembers).toEqual(d.slkMembers);
        expect(getMembersForZone(z, del)).toEqual([`${z}-1`]);
        expect(del.deletedMembers[`${z}__${z}-2`].zone).toBe(z);

        const back = buildRestoreMember(del, `${z}__${z}-2`)!;
        expect(back.data.krsMembers).toEqual(d.krsMembers);
        expect(back.data.slkMembers).toEqual(d.slkMembers);
        expect(getMembersForZone(z, back.data)).toEqual([`${z}-1`, `${z}-2`]);
      }
    });
  }
});
