// ══════════════════════════════════════════
// lib/member.ts — Member query helpers
// Dipecah dari helpers.ts (task 1.15)
// ══════════════════════════════════════════

import { AppData, AppSettings, MemberInfo } from '@/types';

// ── Get all active zones (base + custom, excluding hidden) ──
export function getAllActiveZones(settings: AppSettings): string[] {
  const base = ['KRS', 'SLK'];
  const custom = (settings.customZones || [])
    .filter(z => !(settings.hiddenZones || []).includes(z.key))
    .map(z => z.key);
  return [...base, ...custom];
}

// ── Get member list for a given zone ──
export function getMembersForZone(zone: string, appData: AppData): string[] {
  if (zone === 'KRS') return appData.krsMembers || [];
  if (zone === 'SLK') return appData.slkMembers || [];
  return appData.zoneMembers?.[zone] || [];
}

// ── Fuzzy match (subsequence matching) ──
// Contoh: query "ag" → match "Angga", "Agus"
// PENTING — kapan pakai fuzzyMatch vs textMatch (di bawah):
// fuzzyMatch cocok untuk mencari di STRING PENDEK yang isinya murni satu hal yang
// dicari (nama member, misal "Angga", "SIFA") — di situ subsequence match membantu
// (user ketik "wldn" tetap ketemu "WILDAN"), dan hasilnya jarang salah karena tidak
// ada kata "noise" tambahan untuk kebetulan menyerap huruf-huruf query.
// TAPI JANGAN pakai fuzzyMatch untuk mencari di KALIMAT PANJANG yang isinya campuran
// beberapa kata (log activity: "[PAY] Quick Pay Rekap KRS - WILDAN") — subsequence
// match pada kalimat panjang kehilangan presisi drastis, karena kata umum yang
// berulang di SETIAP entry (di sini: "Quick Pay") sendirian sudah cukup mengandung
// huruf apa saja secara berurutan untuk query pendek manapun, membuat hasil match ke
// hampir semua entry terlepas nama sebenarnya. v11.5.11: bug nyata ditemukan — cari
// "uci" di Log activity match ke WILDAN/VIO/VINA/SIFA (semua mengandung u,i,c dari
// kata "Quick" sendiri), padahal tidak ada satupun nama itu yang relevan dengan "uci".
// Untuk kasus kalimat panjang, pakai textMatch (substring match presisi) di bawah.
export function fuzzyMatch(str: string, query: string): boolean {
  if (!query) return true;
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    while (si < s.length && s[si] !== q[qi]) si++;
    if (si >= s.length) return false;
    si++;
  }
  return true;
}

// ── v11.5.11: Text match (substring, case-insensitive) — presisi untuk kalimat panjang.
// Berbeda dari fuzzyMatch (subsequence, longgar), ini murni "apakah query muncul persis
// berurutan sebagai substring" — cocok untuk mencari di log activity, detail transaksi,
// atau string panjang campuran lainnya, di mana presisi lebih penting dari toleransi typo. ──
export function textMatch(str: string, query: string): boolean {
  if (!query) return true;
  return str.toLowerCase().includes(query.toLowerCase());
}

// ── v11.5: Konversi IP member secara generik (find & replace substring) ──
// Dipakai oleh SettingsIPSection — dipisah sebagai fungsi murni agar testable.
// Sebelumnya (v11.4 dan lebih lama) konversi IP HANYA bisa mengganti oktet ke-2
// dari ".13" ke ".90" (hardcoded). Sekarang bisa cari/ganti substring apapun di
// field IP — oktet manapun, atau bagian teks lain dari URL/IP router.
//
// `find` WAJIB tidak kosong (caller harus validasi sebelum panggil ini).
// Mengembalikan { newInfo, count } — newInfo adalah salinan memberInfo yang sudah
// diupdate (immutable, tidak memutasi `info` asli), count adalah jumlah member yang IP-nya berubah.
export function convertMemberIPs(
  info: Record<string, MemberInfo>,
  zoneMembers: string[],
  zone: string,
  find: string,
  replace: string
): { newInfo: Record<string, MemberInfo>; count: number } {
  const newInfo = { ...info };
  let count = 0;

  zoneMembers.forEach(name => {
    const key = `${zone}__${name}`;
    const ip  = String(newInfo[key]?.ip || '');
    if (!ip || !ip.includes(find)) return;
    // split().join() dipakai (bukan regex replaceAll) agar aman terhadap karakter
    // spesial regex pada string IP seperti titik "." — tidak perlu escaping.
    newInfo[key] = { ...newInfo[key], ip: ip.split(find).join(replace) };
    count++;
  });

  return { newInfo, count };
}
