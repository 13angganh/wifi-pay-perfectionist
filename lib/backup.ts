// lib/backup.ts
// Auto backup tanggal 1 setiap bulan — hanya sekali per bulan

import type { AppData } from '@/types';
import { doJSONBackup } from './export';

export function checkAutoBackup(data: AppData): void {
  if (typeof window === 'undefined') return;

  const now = new Date();

  // Hanya jalan di tanggal 1
  if (now.getDate() !== 1) return;

  const last     = localStorage.getItem('wp_last_backup');
  const lastMs   = last ? parseInt(last, 10) : 0;
  const lastDate = lastMs ? new Date(lastMs) : null;

  // Sudah backup bulan ini? Skip
  const alreadyBackedUpThisMonth =
    lastDate !== null &&
    lastDate.getFullYear() === now.getFullYear() &&
    lastDate.getMonth()    === now.getMonth();

  if (alreadyBackedUpThisMonth) return;

  // Auto backup setelah 5 detik dengan toast info
  setTimeout(() => {
    doJSONBackup(data);
    // toast dipanggil dari doJSONBackup via localStorage timestamp
    // tidak import showToast di sini untuk hindari circular dep
  }, 5000);
}
