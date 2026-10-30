// ══════════════════════════════════════════
// components/layout/shellLogic.ts — logika murni kecil untuk AppShell (REDESAIN T11)
// ══════════════════════════════════════════
import { useEffect } from 'react';
import type { AppData, AppSettings } from '@/types';
import { getAllActiveZones, getMembersForZone } from '@/lib/member';

/**
 * Apakah ada member di zona MANA PUN? Pemicu cek auto-backup. Sebelumnya hanya `krsMembers.length`, sehingga akun
 * yang seluruh membernya ada di zona kustom tidak pernah memicu auto-backup. Zona kustom = KRS/SLK (kontrak T0
 * butir 9): zona aktif + setiap zona yang punya daftar di `zoneMembers` (termasuk yang disembunyikan).
 */
export function hasAnyMembers(appData: AppData, settings: AppSettings): boolean {
  const zones = new Set([...getAllActiveZones(settings), ...Object.keys(appData.zoneMembers ?? {})]);
  for (const z of zones) if (getMembersForZone(z, appData).length > 0) return true;
  return false;
}

/**
 * Esc menutup panel yang sedang terbuka (drawer Sidebar). Aktif hanya selama `open`; listener dilepas saat tutup/unmount.
 * (Sheet, Confirm, dan Pusat Notifikasi sudah menangani Esc sendiri; drawer Sidebar sebelumnya hanya bisa ditutup
 * dengan klik latar.)
 */
export function useEscapeClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}
