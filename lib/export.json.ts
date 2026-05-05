// ══════════════════════════════════════════
// lib/export.json.ts — JSON backup export
// Dipecah dari export.ts (task 1.15)
// ══════════════════════════════════════════

import type { AppData } from '@/types';

// ── Download helper ──
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── JSON Backup ──
export function doJSONBackup(data: AppData): void {
  const blob = new Blob(
    [JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  );
  download(blob, `wifi-pay-backup-${new Date().toISOString().slice(0,10)}.json`);
  if (typeof window !== 'undefined') {
    localStorage.setItem('wp_last_backup', Date.now().toString());
  }
}
