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
