// lib/backup.ts
// Auto backup tanggal 1 + manual backup

import type { AppData } from '@/types';
import { doJSONBackup } from './export';

export function checkAutoBackup(data: AppData): void {
  if (typeof window === 'undefined') return;
  const now = new Date();
  if (now.getDate() !== 1) return;

  const last      = localStorage.getItem('wp_last_backup');
  const lastDate  = last ? new Date(+last) : null;
  const sameMonth = lastDate
    ? lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear()
    : false;
  if (sameMonth) return;

  // Auto backup setelah 3 detik
  setTimeout(() => {
    doJSONBackup(data);
  }, 3000);
}
