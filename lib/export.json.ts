// ══════════════════════════════════════════
// lib/export.json.ts — JSON backup export
// v11.3: tambah shareJSON via Web Share API
// ══════════════════════════════════════════

import type { AppData } from '@/types';

// ── Download helper ──
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeBackupBlob(data: AppData): { blob: Blob; filename: string } {
  const blob = new Blob(
    [JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' }
  );
  const filename = `wifi-pay-backup-${new Date().toISOString().slice(0,10)}.json`;
  return { blob, filename };
}

function markBackupDone() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wp_last_backup', Date.now().toString());
  }
}

// ── Download ke storage HP ──
export function doJSONBackup(data: AppData): void {
  const { blob, filename } = makeBackupBlob(data);
  download(blob, filename);
  markBackupDone();
}

// ── Share via Web Share API (Gmail, WhatsApp, Drive, dll) ──
// Return true jika berhasil, false jika tidak support atau dibatalkan
export async function doJSONShare(data: AppData): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!navigator.share) return false;

  const { blob, filename } = makeBackupBlob(data);
  const file = new File([blob], filename, { type: 'application/json' });

  // Cek apakah browser support share file
  if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) return false;

  try {
    await navigator.share({
      title: 'WiFi Pay Backup',
      text:  `Backup data WiFi Pay — ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`,
      files: [file],
    });
    markBackupDone();
    return true;
  } catch {
    // User membatalkan share — bukan error
    return false;
  }
}

// ── Cek apakah Web Share API tersedia ──
export function isShareSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof navigator.share === 'function';
}
