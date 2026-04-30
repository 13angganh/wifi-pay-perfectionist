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

// ── Import data (chunked untuk payments besar) ──
export async function importToDB(uid: string, data: AppData): Promise<void> {
  const userRef = getUserRef(uid);
  // Upload non-payment fields dulu
  await set(userRef, {
    krsMembers:     data.krsMembers,
    slkMembers:     data.slkMembers,
    memberInfo:     data.memberInfo || {},
    activityLog:    [],
    freeMembers:    data.freeMembers || {},
    deletedMembers: data.deletedMembers || {},
    operasional:    data.operasional || {},
  });

  // Upload payments dalam chunk 200
  const entries = Object.entries(data.payments || {});
  const chunkSize = 200;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const obj: Record<string, number> = {};
    chunk.forEach(([k, v]) => { obj[k] = v; });
    await update(ref(db, `users/${uid}/data/payments`), obj);
  }
}
