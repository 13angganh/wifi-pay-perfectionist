// ══════════════════════════════════════════
// lib/format.ts — Currency & date formatters
// Dipecah dari helpers.ts (task 1.15)
// ══════════════════════════════════════════

import { MONTHS } from './constants';

// ── Currency format ──
export function rp(v: number): string {
  return 'Rp ' + (v * 1000).toLocaleString('id-ID');
}

export function rpShort(v: number | null | undefined): string {
  return v !== null && v !== undefined ? (v * 1000).toLocaleString('id-ID') : '—';
}

// ── Format tanggal — "1 Apr 2026" ──
export function formatDate(dateStr: string | number | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}
