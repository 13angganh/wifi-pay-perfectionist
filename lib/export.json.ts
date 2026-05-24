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
export async function doJSONShare(data: AppData): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) return false;

  const { blob, filename } = makeBackupBlob(data);

  try {
    // Coba share dengan file terlebih dulu
    const file = new File([blob], filename, { type: 'application/json' });
    const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

    if (canShareFile) {
      await navigator.share({
        title: 'WiFi Pay Backup',
        text:  `Backup data WiFi Pay — ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`,
        files: [file],
      });
    } else {
      // Fallback: share URL object (beberapa browser tidak support file share)
      const url = URL.createObjectURL(blob);
      await navigator.share({
        title: 'WiFi Pay Backup',
        text:  `Backup data WiFi Pay — ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
File: ${filename}`,
        url,
      });
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    markBackupDone();
    return true;
  } catch (e: unknown) {
    // AbortError = user cancel — bukan error
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') {
      return false;
    }
    // Jika share sama sekali gagal, fallback ke download
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    markBackupDone();
    return true; // anggap sukses karena sudah download
  }
}

// ── Cek apakah Web Share API tersedia ──
export function isShareSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof navigator.share === 'function';
}
