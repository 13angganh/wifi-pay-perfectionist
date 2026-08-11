// ══════════════════════════════════════════
// lib/rollback.ts — Selective rollback untuk optimistic AppData updates
// v11.5.7: dibuat untuk memperbaiki bug data-loss yang berulang di banyak file
// ══════════════════════════════════════════
//
// KONTEKS BUG: Pola optimistic-update + rollback-on-failure yang dipakai di seluruh
// codebase ini (MemberCard, EntryView, Header, MembersView, RekapView, RekapModal,
// OperasionalView, FreeMemberModal, SettingsIPSection, SettingsZoneSection) semuanya
// mengikuti bentuk yang sama:
//
//   const prevData = appData;      // snapshot SEBELUM optimistic update
//   setAppData(newData);           // optimistic update — UI langsung berubah
//   try {
//     await saveDB(...);           // network request, bisa makan waktu (khususnya di
//                                   // koneksi lambat — persis kondisi yang membuat bug
//                                   // ini lebih terasa)
//   } catch {
//     setAppData(prevData);        // ❌ BUG: replace TOTAL ke snapshot lama
//   }
//
// Masalahnya: `prevData` adalah snapshot dari SATU titik waktu di masa lalu. Jika ADA
// operasi LAIN yang berhasil setAppData() dengan datanya sendiri SELAMA network request
// di atas masih berjalan (mis. user quick-pay member lain di kartu berbeda, atau toast
// undo 4 detik yang closure-nya tertunda), maka replace total ke `prevData` akan
// MENGHAPUS perubahan itu juga — silent data-loss, bukan cuma soal urutan/timing.
//
// FIX: rollback SELEKTIF. Baca state PALING TERBARU (via useAppStore.getState()) tepat
// saat rollback benar-benar dieksekusi, lalu untuk SETIAP top-level field AppData,
// bandingkan reference antara `prevData` (sebelum) dan `newData` (yang gagal disimpan):
//   - Jika reference field itu BERBEDA → field ini yang diubah oleh operasi yang gagal
//     ini → kembalikan ke nilai `prevData` (batalkan HANYA perubahan operasi ini).
//   - Jika reference SAMA → field ini tidak disentuh operasi ini → pertahankan nilai
//     dari `latest` (state terbaru saat ini), yang mungkin sudah berisi perubahan lain
//     yang berhasil tersimpan di antaranya.
//
// Deteksi reference-equality ini valid karena SETIAP call site di codebase ini secara
// konsisten membangun `newData` via immutable spread (`{ ...appData, field: {...} }`)
// setiap kali mengubah sebuah field — pola yang sudah dipakai di mana-mana, bukan
// asumsi baru. Field yang tidak diubah selalu tetap reference yang sama dari appData asal.

import type { AppData } from '@/types';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Rollback selektif untuk SATU field map-type (Record<string, X>) — mis. `payments`,
 * `memberInfo`. Beroperasi per-KEY, bukan per-field, karena entry berbeda di dalam map
 * yang sama (mis. payment member A vs payment member B) bisa berasal dari operasi yang
 * sepenuhnya independen dan tidak boleh saling menimpa saat salah satunya di-rollback.
 */
function rollbackMapField<T>(
  latestMap: Record<string, T> | undefined,
  prevMap:   Record<string, T> | undefined,
  newMap:    Record<string, T> | undefined,
): Record<string, T> {
  const result: Record<string, T> = { ...(latestMap ?? {}) };
  const prev = prevMap ?? {};
  const next = newMap  ?? {};
  const touchedKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  touchedKeys.forEach((k) => {
    if (next[k] !== prev[k]) {
      // Key ini disentuh oleh operasi yang gagal — kembalikan ke nilai prevData.
      // Jika key tidak ada di prevData sama sekali (baru ditambahkan operasi ini), hapus.
      if (k in prev) result[k] = prev[k];
      else delete result[k];
    }
    // Jika next[k] === prev[k], key ini tidak disentuh operasi ini — biarkan nilai
    // `latest` (yang sudah ada di `result` dari spread di atas) apa adanya.
  });
  return result;
}

/**
 * Menghasilkan AppData hasil rollback yang aman terhadap concurrent update.
 *
 * @param latest   State AppData PALING TERBARU (dari useAppStore.getState().appData),
 *                 dibaca tepat saat rollback dieksekusi — BUKAN dari closure lama.
 * @param prevData Snapshot AppData dari SEBELUM optimistic update yang gagal ini dimulai.
 * @param newData  AppData yang tadi di-optimistic-update tapi gagal tersimpan ke server.
 * @returns        AppData baru: perubahan spesifik dari operasi gagal ini dibatalkan;
 *                  field/entry lain dipertahankan dari `latest` apa adanya.
 *
 * Field map-type (Record<string,X>: payments, memberInfo, freeMembers, deletedMembers,
 * operasional, _lockedEntries, zoneMembers) di-rollback per-KEY — supaya perubahan pada
 * entry lain di map yang sama (mis. payment member berbeda) yang berhasil tersimpan
 * concurrent tidak ikut terhapus. Field non-map (krsMembers, slkMembers, activityLog,
 * _globalLocked) di-rollback sebagai satu kesatuan field, karena field itu merepresentasikan
 * satu struktur kohesif (mis. urutan & isi array member) yang tidak bisa dipecah per-entry.
 */
export function selectiveRollback(latest: AppData, prevData: AppData, newData: AppData): AppData {
  const result: AppData = { ...latest };
  (Object.keys(prevData) as (keyof AppData)[]).forEach((key) => {
    const prevVal = prevData[key];
    const newVal  = newData[key];
    if (newVal === prevVal) return; // field ini tidak disentuh operasi ini sama sekali

    if (isPlainObject(prevVal) && isPlainObject(newVal)) {
      (result as Record<keyof AppData, unknown>)[key] = rollbackMapField(
        result[key] as Record<string, unknown> | undefined,
        prevVal,
        newVal,
      );
    } else {
      (result as Record<keyof AppData, unknown>)[key] = prevVal;
    }
  });
  return result;
}
