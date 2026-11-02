// ══════════════════════════════════════════
// lib/displayName.ts — v11.11.0
// Nama tampilan akun (sapaan Beranda, avatar, menu akun). Disimpan di profil Firebase Auth (displayName) sehingga ikut akun
// di semua perangkat. TIDAK PERNAH diturunkan dari awalan email — kosong = tanpa nama (avatar ikon, sapaan tanpa nama).
// ══════════════════════════════════════════
export const DISPLAY_NAME_MAX = 30;

/** Bersihkan input nama: buang karakter kontrol, rapatkan spasi, pangkas, batasi panjang. */
export function normalizeDisplayName(raw: string | null | undefined): string {
  return (raw ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX)
    .trim();
}
