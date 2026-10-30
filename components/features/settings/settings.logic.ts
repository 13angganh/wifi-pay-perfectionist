// ══════════════════════════════════════════
// components/features/settings/settings.logic.ts — logika murni bersama halaman Pengaturan (REDESAIN T10)
// Zona: satu sumber daftar zona (dasar + kustom) untuk Zona, Export/Share, dan Akun Penagih — tanpa daftar tertanam.
// Zona dasar diambil dari getAllActiveZones (lib/member.ts) agar tidak ada literal zona di layar.
// ══════════════════════════════════════════
import type { AppData, AppSettings } from '@/types';
import { getAllActiveZones, getMembersForZone } from '@/lib/member';
import { zonesFromData } from '@/lib/export.excel';

/** Semua zona untuk pengelolaan (dasar + kustom), termasuk yang disembunyikan. Urutan: dasar lalu kustom. */
export function allZoneKeys(settings: AppSettings): string[] {
  const base = getAllActiveZones({ ...settings, customZones: [], hiddenZones: [] });
  return [...base, ...(settings.customZones ?? []).map(z => z.key)];
}

/** Pilihan zona untuk Export/Share = zona aktif (getAllActiveZones) + opsi ALL (opsional). */
export function zoneChoices(settings: AppSettings, withAll: boolean): string[] {
  const active = getAllActiveZones(settings);
  return withAll ? [...active, 'ALL'] : active;
}

// ── Ringkasan Import (Confirm + toast): satu bagian per zona yang punya data, termasuk zona kustom ──
/** [{zone, count}] untuk SEMUA zona di data impor (zona dasar + kunci zoneMembers), urutan tetap. */
export function importZoneCounts(data: AppData): { zone: string; count: number }[] {
  return zonesFromData(data).map(zone => ({ zone, count: getMembersForZone(zone, data).length }));
}

/** "3 KRS · 2 SLK · 4 TIMUR · 120 pembayaran" — `paymentsLabel` = kata "pembayaran" yang sudah diterjemahkan. */
export function importSummary(data: AppData, paymentsLabel: string, sep = ' · '): string {
  const parts = importZoneCounts(data).map(z => `${z.count} ${z.zone}`);
  parts.push(`${Object.keys(data.payments).length} ${paymentsLabel}`);
  return parts.join(sep);
}
