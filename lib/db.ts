// ══════════════════════════════════════════
// lib/db.ts — Firebase Realtime DB operations
// ══════════════════════════════════════════

import { ref, set, onValue, off, DatabaseReference, update } from 'firebase/database';
import { db } from './firebase';
import { AppData, ActivityLog } from '@/types';
import { DEFAULT_KRS, DEFAULT_SLK } from './constants';
import { cleanOldEditLogs } from './helpers';

export const DEFAULT_APP_DATA: AppData = {
  krsMembers:     [...DEFAULT_KRS],
  slkMembers:     [...DEFAULT_SLK],
  zoneMembers:    {}, // task 1.02
  payments:       {},
  memberInfo:     {},
  activityLog:    [],
  freeMembers:    {},
  deletedMembers: {},
  operasional:    {},
};

// ── Get DB ref untuk user ──
export function getUserRef(uid: string): DatabaseReference {
  return ref(db, `users/${uid}/data`);
}

// ── Listen realtime ──
export function listenDB(
  uid: string,
  onData: (data: AppData) => void,
  onError: () => void,
  onLockChange?: (globalLocked: boolean, lockedEntries: Record<string, boolean>) => void
): () => void {
  const userRef = getUserRef(uid);

  // Listener utama
  onValue(userRef, (snap) => {
    const val = snap.val();
    if (val && (val.krsMembers || val.payments)) {
      const raw: AppData = {
        krsMembers:     val.krsMembers     || [],
        slkMembers:     val.slkMembers     || [],
        zoneMembers:    val.zoneMembers    || {}, // task 1.03
        payments:       val.payments       || {},
        memberInfo:     val.memberInfo     || {},
        activityLog:    val.activityLog    || [],
        freeMembers:    val.freeMembers    || {},
        deletedMembers: val.deletedMembers || {},
        operasional:    val.operasional    || {},
        _globalLocked:  val._globalLocked,
        _lockedEntries: val._lockedEntries || {},
      };
      const cleaned = cleanOldEditLogs(raw);
      onData(cleaned);
      if (onLockChange) {
        onLockChange(val._globalLocked === true, val._lockedEntries || {});
      }
    } else if (!val) {
      onData({ ...DEFAULT_APP_DATA });
    }
  }, () => onError());

  // Return cleanup function
  return () => off(userRef);
}

// ── Save seluruh appData ──
export async function saveDB(
  uid: string,
  data: AppData,
  logEntry?: Omit<ActivityLog, 'ts' | 'user'>,
  userEmail?: string
): Promise<void> {
  const userRef = getUserRef(uid);
  let finalData = { ...data };

  if (logEntry) {
    const log: ActivityLog = {
      ...logEntry,
      ts:   Date.now(),
      user: userEmail || '—',
    };
    const logs = [log, ...(finalData.activityLog || [])].slice(0, 200);
    finalData = { ...finalData, activityLog: logs };
  }

  await set(userRef, finalData);
}

// ── persistPayment: shared helper — selalu ambil lock state dari store, bukan appData spread ──
// BUG-001 fix: mencegah stale _globalLocked ter-write ke Firebase
export async function persistPayment(
  uid: string,
  newData: AppData,
  logEntry: Omit<ActivityLog, 'ts' | 'user'>,
  userEmail: string,
  getCurrentLockState: () => { globalLocked: boolean; lockedEntries: Record<string, boolean> }
): Promise<void> {
  const { globalLocked, lockedEntries } = getCurrentLockState();
  const safeData: AppData = {
    ...newData,
    _globalLocked:  globalLocked,
    _lockedEntries: lockedEntries,
  };
  await saveDB(uid, safeData, logEntry, userEmail);
}


// ── task 3.04: Granular write — update satu payment key saja ──
// Dipakai oleh EntryView/MemberCard saat bayar/edit nominal bulan tertentu.
// Jauh lebih efisien dari saveDB() yang menulis seluruh AppData (~50KB+).
export async function updatePayment(
  uid:   string,
  key:   string,   // format dari fbKey(zone, name, year, month)
  value: number | null,
): Promise<void> {
  // null → hapus key dari Firebase (anggap belum bayar)
  const patch: Record<string, number | null> = { [key]: value };
  await update(ref(db, `users/${uid}/data/payments`), patch);
}

// ── v11.5.7: Granular write untuk operasi pembayaran — menyelesaikan bug "delay saat
// mengetik/menyimpan nominal" yang dilaporkan. Root cause TERUKUR (bukan cuma persepsi
// UX): saveDB()/persistPayment() SELALU mengirim SELURUH objek AppData ke Firebase —
// termasuk krsMembers, slkMembers, memberInfo, freeMembers, deletedMembers, operasional
// — meski perubahan sesungguhnya cuma SATU angka pembayaran. Untuk user dengan ratusan
// member dan riwayat multi-tahun, field `payments` sendiri diperkirakan ~88% dari total
// payload (lihat perhitungan di riwayat sesi). Mengirim ulang payload sebesar itu untuk
// setiap perubahan satu nominal, di koneksi lambat (terlihat dari upload speed di
// screenshot device), menghasilkan jeda nyata sebelum toast hasil muncul — bukan
// inkonsistensi UX semata.
//
// Fungsi ini menulis HANYA `payments/{key}` yang berubah + entry activityLog baru (prepend,
// slice 200 seperti saveDB) + sinkronisasi lock-state (pola sama seperti persistPayment,
// BUG-001 fix) — semuanya dalam SATU Firebase multi-path update() call yang atomik. Field
// besar lain (krsMembers, slkMembers, memberInfo, dst) TIDAK disentuh sama sekali karena
// memang tidak berubah oleh operasi pembayaran, sehingga tidak perlu dikirim ulang.
//
// updatePayment() (di atas) sengaja TIDAK dipakai langsung karena ia tidak menulis
// activityLog — memakainya apa adanya akan menghilangkan audit trail pembayaran yang
// sudah jadi fitur inti aplikasi ini.
// ── v11.5.7: pure builder untuk patch granular payment — dipisah dari efek samping
// Firebase agar bisa di-unit-test tanpa perlu mock SDK Firebase sama sekali.
export function buildGranularPaymentPatch(
  paymentKey: string,
  paymentValue: number | null,
  currentActivityLog: ActivityLog[],
  logEntry: Omit<ActivityLog, 'ts' | 'user'>,
  userEmail: string,
  lockState: { globalLocked: boolean; lockedEntries: Record<string, boolean> },
  now: number = Date.now(),
): Record<string, unknown> {
  // Defense-in-depth: paymentKey harus sudah disanitasi via getKey()/fbKey() sebelum
  // sampai ke sini (yang menghapus . # $ [ ] /). Sebuah '/' mentah di key path multi-path
  // update() TIDAK akan gagal — ia diam-diam ditafsirkan sebagai segmen path tambahan,
  // menulis ke lokasi yang salah alih-alih error yang jelas. Cek eksplisit di sini
  // memastikan itu gagal keras kalau suatu saat ada caller baru yang lupa sanitasi,
  // daripada bergantung sepenuhnya pada disiplin setiap pemanggil di masa depan.
  if (paymentKey.includes('/')) {
    throw new Error(`persistPaymentGranular: paymentKey mengandung '/' yang tidak valid: ${paymentKey}`);
  }
  const log: ActivityLog = { ...logEntry, ts: now, user: userEmail || '—' };
  const newActivityLog = [log, ...(currentActivityLog || [])].slice(0, 200);

  return {
    [`payments/${paymentKey}`]: paymentValue,
    activityLog:                newActivityLog,
    _globalLocked:               lockState.globalLocked,
    _lockedEntries:              lockState.lockedEntries,
  };
}

// ── v11.5.7: Granular write untuk operasi pembayaran — menyelesaikan bug "delay saat
// mengetik/menyimpan nominal" yang dilaporkan. Root cause TERUKUR (bukan cuma persepsi
// UX): saveDB()/persistPayment() SELALU mengirim SELURUH objek AppData ke Firebase —
// termasuk krsMembers, slkMembers, memberInfo, freeMembers, deletedMembers, operasional
// — meski perubahan sesungguhnya cuma SATU angka pembayaran. Untuk user dengan ratusan
// member dan riwayat multi-tahun, field `payments` sendiri diperkirakan ~88% dari total
// payload (lihat perhitungan di riwayat sesi). Mengirim ulang payload sebesar itu untuk
// setiap perubahan satu nominal, di koneksi lambat (terlihat dari upload speed di
// screenshot device), menghasilkan jeda nyata sebelum toast hasil muncul — bukan
// inkonsistensi UX semata.
//
// Fungsi ini menulis HANYA `payments/{key}` yang berubah + entry activityLog baru (prepend,
// slice 200 seperti saveDB) + sinkronisasi lock-state (pola sama seperti persistPayment,
// BUG-001 fix) — semuanya dalam SATU Firebase multi-path update() call yang atomik. Field
// besar lain (krsMembers, slkMembers, memberInfo, dst) TIDAK disentuh sama sekali karena
// memang tidak berubah oleh operasi pembayaran, sehingga tidak perlu dikirim ulang.
//
// updatePayment() (di atas) sengaja TIDAK dipakai langsung karena ia tidak menulis
// activityLog — memakainya apa adanya akan menghilangkan audit trail pembayaran yang
// sudah jadi fitur inti aplikasi ini.
export async function persistPaymentGranular(
  uid: string,
  paymentKey: string,
  paymentValue: number | null,          // null → hapus key (batal bayar)
  currentActivityLog: ActivityLog[],    // appData.activityLog TERKINI, untuk prepend
  logEntry: Omit<ActivityLog, 'ts' | 'user'>,
  userEmail: string,
  getCurrentLockState: () => { globalLocked: boolean; lockedEntries: Record<string, boolean> },
): Promise<void> {
  const patch = buildGranularPaymentPatch(
    paymentKey, paymentValue, currentActivityLog, logEntry, userEmail, getCurrentLockState(),
  );
  await update(getUserRef(uid), patch);
}

// ── task 3.04: Granular write — update lock state saja ──
// Dipakai oleh lock/unlock action tanpa memerlukan full AppData write.
export async function updateLockState(
  uid:          string,
  globalLocked: boolean,
  lockedEntries: Record<string, boolean>,
): Promise<void> {
  await update(ref(db, `users/${uid}/data`), {
    _globalLocked:  globalLocked,
    _lockedEntries: lockedEntries,
  });
}

// ── Import data (chunked untuk payments besar) ──
// v11.5.13: importToDB ditulis ulang sebagai SATU multi-path update() atomik, bukan
// set() diikuti loop update() chunk terpisah. Pola lama rentan meninggalkan database
// dalam kondisi separuh-jalan (field non-payment sudah ter-replace tapi payments belum
// selesai ditulis) kalau proses terhenti di tengah — koneksi putus, tab ditutup, dst.
// Untuk fitur yang memang dimaksudkan sebagai jaring pengaman preventif ("data terhapus,
// tinggal import"), risiko separuh-jalan seperti itu adalah kegagalan yang justru harus
// dihindari sepenuhnya. Firebase RTDB multi-path update() bersifat atomik (semua-atau-
// tidak-sama-sekali dalam satu request) — jauh lebih aman untuk kasus ini. Ukuran data
// realistis aplikasi ini (bahkan skala produksi Hakiki sendiri, ratusan KB) jauh di bawah
// batas 16MB single-write dari Firebase SDK, jadi menggabungkan semua ke satu call aman.
// v11.5.13: Validasi + normalisasi data yang diimpor dari file JSON — diekstrak dari
// ImportModal.tsx sebagai pure function agar bisa di-unit-test tanpa perlu mock
// FileReader/DOM. Mengembalikan null jika data tidak valid sama sekali (bukan objek,
// atau tidak punya field krsMembers maupun payments — indikasi ini bukan file backup
// WiFi Pay). Field yang ada tapi salah tipe (bukan array/object seharusnya) di-default
// ke kosong, bukan menyebabkan seluruh import gagal — file backup lama/parsial tetap
// bisa diimpor sebisanya, bukan ditolak total karena satu field cacat.
export function normalizeImportedData(data: unknown): AppData | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Partial<AppData>;
  if (!d.krsMembers && !d.payments) return null;

  return {
    krsMembers:     Array.isArray(d.krsMembers) ? d.krsMembers : [],
    slkMembers:     Array.isArray(d.slkMembers) ? d.slkMembers : [],
    payments:       (d.payments && typeof d.payments === 'object') ? d.payments : {},
    memberInfo:     (d.memberInfo && typeof d.memberInfo === 'object') ? d.memberInfo : {},
    activityLog:    [],
    freeMembers:    (d.freeMembers && typeof d.freeMembers === 'object') ? d.freeMembers : {},
    deletedMembers: (d.deletedMembers && typeof d.deletedMembers === 'object') ? d.deletedMembers : {},
    operasional:    (d.operasional && typeof d.operasional === 'object') ? d.operasional : {},
  };
}

// v11.5.13: importToDB ditulis ulang sebagai SATU multi-path update() atomik, bukan
// set() diikuti loop update() chunk terpisah. Pola lama rentan meninggalkan database
// dalam kondisi separuh-jalan (field non-payment sudah ter-replace tapi payments belum
// selesai ditulis) kalau proses terhenti di tengah — koneksi putus, tab ditutup, dst.
// Untuk fitur yang memang dimaksudkan sebagai jaring pengaman preventif ("data terhapus,
// tinggal import"), risiko separuh-jalan seperti itu adalah kegagalan yang justru harus
// dihindari sepenuhnya. Firebase RTDB multi-path update() bersifat atomik (semua-atau-
// tidak-sama-sekali dalam satu request) — jauh lebih aman untuk kasus ini. Ukuran data
// realistis aplikasi ini (bahkan skala produksi Hakiki sendiri, ratusan KB) jauh di bawah
// batas 16MB single-write dari Firebase SDK, jadi menggabungkan semua ke satu call aman.
// Input di-normalisasi ulang lewat normalizeImportedData() agar konsisten dengan apa
// yang divalidasi di client, terlepas dari apakah caller sudah melakukannya sendiri.
export async function importToDB(uid: string, data: AppData): Promise<void> {
  const normalized = normalizeImportedData(data);
  if (!normalized) throw new Error('Data tidak valid untuk diimpor');
  const patch: Record<string, unknown> = {
    krsMembers:     normalized.krsMembers,
    slkMembers:     normalized.slkMembers,
    payments:       normalized.payments,
    memberInfo:     normalized.memberInfo,
    activityLog:    [],
    freeMembers:    normalized.freeMembers,
    deletedMembers: normalized.deletedMembers,
    operasional:    normalized.operasional,
  };
  await update(getUserRef(uid), patch);
}
