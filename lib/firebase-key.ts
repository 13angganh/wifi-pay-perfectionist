// ══════════════════════════════════════════
// lib/firebase-key.ts — Firebase key sanitizer
// Dipecah dari helpers.ts (task 1.15)
// Fase 2: Hapus enc/dec (base64 bukan enkripsi — task 2.01)
// ══════════════════════════════════════════

// ── Firebase key sanitizer ──
export function fbKey(s: string): string {
  return s.replace(/\./g,'-').replace(/#/g,'-').replace(/\$/g,'-')
          .replace(/\[/g,'-').replace(/]/g,'-').replace(/\//g,'-');
}

// FIX v11.5.6: validator untuk dipakai di TITIK INPUT (form Add/Edit Member), bukan
// cuma sanitizer pasif. Root cause bug "HAJI ZAINI → H.ZAINI selalu gagal tersimpan":
// nama member dipakai LANGSUNG sebagai bagian dari Firebase object key di memberInfo,
// payments, freeMembers, dan deletedMembers (mis. `${zone}__${name}`) di banyak file
// (MembersView, MemberCard, RekapView, RekapModal, FreeMemberModal, EntryView, dll) —
// TANPA pernah dilewatkan ke fbKey() di titik-titik tersebut (fbKey() cuma dipakai di
// payment.ts getKey() untuk PAYMENT key, bukan untuk key memberInfo/freeMembers/dst).
// Firebase RTDB MENOLAK SELURUH set() jika ADA SATU SAJA object key yang mengandung
// karakter . # $ [ ] — bukan cuma menolak field itu, tapi seluruh write gagal total.
// Daripada menambal setiap titik pembentukan key satu-satu (rawan ada yang terlewat
// lagi di masa depan), validasi ini mencegah nama bermasalah masuk SAMA SEKALI sejak
// dari form input — supaya tidak pernah ada nama tidak valid yang sempat dipakai
// sebagai key di mana pun dalam app.
const INVALID_FIREBASE_KEY_CHARS = /[.#$[\]/]/;
export function hasInvalidFirebaseKeyChars(s: string): boolean {
  return INVALID_FIREBASE_KEY_CHARS.test(s);
}
