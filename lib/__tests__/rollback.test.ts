// lib/__tests__/rollback.test.ts
// v11.5.7 — unit tests untuk selectiveRollback: fix bug data-loss pada rollback
// optimistic update yang dulunya me-replace TOTAL appData ke snapshot lama, berpotensi
// menghapus perubahan lain yang berhasil tersimpan concurrent selagi network request
// yang gagal itu masih berjalan.

import { describe, it, expect } from 'vitest';
import type { AppData } from '@/types';
import { selectiveRollback } from '@/lib/rollback';

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

describe('selectiveRollback', () => {
  it('field yang diubah operasi gagal → dikembalikan ke nilai prevData', () => {
    const prevData = makeData({ payments: { A: 100 } });
    const newData  = makeData({ payments: { A: 100, B: 50 } }); // B baru ditambahkan, gagal simpan
    const latest   = newData; // tidak ada operasi lain di antaranya — latest == newData

    const result = selectiveRollback(latest, prevData, newData);
    expect(result.payments).toEqual({ A: 100 }); // B dibatalkan, kembali ke sebelum operasi ini
  });

  it('SKENARIO RACE CONDITION UTAMA: operasi lain berhasil concurrent → TIDAK ikut terhapus', () => {
    // Ini persis skenario bug yang dilaporkan tersirat: quick-pay member A dimulai (network
    // sedang berjalan), SEBELUM selesai, quick-pay member B (kartu berbeda) juga dijalankan
    // dan BERHASIL tersimpan. Lalu request A gagal (mis. timeout).
    const prevData = makeData({ payments: {} });                        // sebelum A dimulai
    const newDataA  = makeData({ payments: { A: 100 } });                // optimistic update A (gagal)
    const latest    = makeData({ payments: { A: 100, B: 50 } });          // state TERKINI: A + B (B berhasil!)

    const result = selectiveRollback(latest, prevData, newDataA);
    // A harus dibatalkan (operasi yang gagal), TAPI B harus TETAP ADA (bukan bagian dari
    // operasi yang gagal, berhasil tersimpan sendiri secara independen).
    expect(result.payments).toEqual({ B: 50 });
  });

  it('field yang TIDAK diubah operasi ini (reference sama) → tetap pakai nilai latest, bukan prevData', () => {
    const sharedMemberInfo = { 'KRS__BUDI': { tarif: 100 } };
    const prevData = makeData({ payments: {}, memberInfo: sharedMemberInfo });
    const newData  = makeData({ payments: { A: 100 }, memberInfo: sharedMemberInfo }); // memberInfo TIDAK disentuh
    // latest: memberInfo sudah berubah oleh operasi LAIN yang tidak berhubungan dengan operasi payments ini
    const latestMemberInfo = { 'KRS__BUDI': { tarif: 150 } };
    const latest = makeData({ payments: { A: 100 }, memberInfo: latestMemberInfo });

    const result = selectiveRollback(latest, prevData, newData);
    expect(result.payments).toEqual({}); // payments dirollback (ini yang gagal)
    expect(result.memberInfo).toBe(latestMemberInfo); // memberInfo TIDAK disentuh — pakai latest, bukan prevData
  });

  it('multi-field: beberapa field berubah bersamaan dalam satu operasi (mis. quickPay dengan autoDate)', () => {
    const prevData = makeData({ payments: {}, memberInfo: {} });
    const newData  = makeData({
      payments:   { A: 100 },
      memberInfo: { 'KRS__A': { 'date_2026_3': '2026-04-15' } },
    });
    const latest = newData; // tidak ada operasi lain

    const result = selectiveRollback(latest, prevData, newData);
    expect(result.payments).toEqual({});
    expect(result.memberInfo).toEqual({});
  });

  it('rename member (krsMembers array berubah) → field itu ikut terdeteksi dan dirollback', () => {
    // Kasus MembersView.tsx: edit nama member mengubah array krsMembers, bukan payments.
    const prevData = makeData({ krsMembers: ['BUDI', 'ANI'] });
    const newData  = makeData({ krsMembers: ['H.ZAINI', 'ANI'] }); // BUDI di-rename, gagal simpan
    const latest   = newData;

    const result = selectiveRollback(latest, prevData, newData);
    expect(result.krsMembers).toEqual(['BUDI', 'ANI']); // rename dibatalkan
  });

  it('tidak ada field yang berubah sama sekali (no-op) → hasil identik dengan latest', () => {
    const data   = makeData({ payments: { A: 100 } });
    const latest = makeData({ payments: { A: 100, C: 200 } }); // ada perubahan lain di latest

    const result = selectiveRollback(latest, data, data); // prevData === newData, tidak ada yang gagal berubah
    expect(result).toEqual(latest);
  });

  it('boolean field (_globalLocked) ikut terdeteksi dan dirollback dengan benar', () => {
    const prevData = makeData({ _globalLocked: false });
    const newData  = makeData({ _globalLocked: true });
    const latest   = makeData({ _globalLocked: true, payments: { A: 100 } }); // payment lain berhasil di antaranya

    const result = selectiveRollback(latest, prevData, newData);
    expect(result._globalLocked).toBe(false); // toggle lock dibatalkan
    expect(result.payments).toEqual({ A: 100 }); // payment concurrent TETAP ada
  });

  it('key yang benar-benar baru (tidak ada di prevData sama sekali) → dihapus total saat rollback, bukan diisi undefined', () => {
    const prevData = makeData({ payments: {} }); // key A belum pernah ada
    const newData  = makeData({ payments: { A: 100 } }); // A baru ditambahkan, gagal simpan
    const latest   = makeData({ payments: { A: 100, B: 50 } }); // B berhasil concurrent, tak berhubungan

    const result = selectiveRollback(latest, prevData, newData);
    expect('A' in result.payments).toBe(false); // A benar-benar hilang dari object, bukan A: undefined
    expect(result.payments).toEqual({ B: 50 });
  });

  it('dua entry berbeda di map yang SAMA berubah oleh operasi TIDAK terkait → hanya entry milik operasi gagal yang dirollback', () => {
    // Kasus paling representatif dari bug asli: dua member berbeda, keduanya menyentuh
    // field `payments` yang sama, tapi merupakan operasi independen sepenuhnya.
    const prevData = makeData({ payments: { A: 100 } });                  // sebelum edit B dimulai
    const newData  = makeData({ payments: { A: 100, B: 999 } });          // B diubah jadi 999, gagal simpan
    const latest   = makeData({ payments: { A: 200, B: 999 } });          // A diubah jadi 200 oleh operasi LAIN, berhasil

    const result = selectiveRollback(latest, prevData, newData);
    expect(result.payments.A).toBe(200); // perubahan A (operasi lain, berhasil) tetap terjaga
    expect(result.payments.B).toBeUndefined(); // B dihapus karena belum ada di prevData, operasi B gagal
  });
});
