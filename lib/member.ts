// ══════════════════════════════════════════
// lib/member.ts — Member query helpers
// Dipecah dari helpers.ts (task 1.15)
// ══════════════════════════════════════════

import { AppData, AppSettings } from '@/types';

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
