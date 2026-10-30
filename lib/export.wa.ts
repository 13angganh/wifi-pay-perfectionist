// ══════════════════════════════════════════
// lib/export.wa.ts — WhatsApp summary export
// Dipecah dari export.ts (task 1.15)
// ══════════════════════════════════════════

import type { AppData } from '@/types';
import { MONTHS } from './constants';
import { isFree, getZoneTotal, getMonthStatus, getArrears } from './payment';
import { getMembersForZone } from './member';
import { zonesFromData } from './export.excel';

// ── WA Summary ──
// REDESAIN T10 (perbaikan zona kustom): ringkasan satu blok per zona aktif (bukan KRS/SLK tetap).
// `zones` = zona aktif (getAllActiveZones); bila tidak diberikan dipakai zonesFromData(data).
// Teks pesan WA ke luar aplikasi tetap persis format zip (termasuk penanda di pesan) — hanya bagian per-zona yang dinamis.
// REDESAIN T12: member Belum terdaftar / Nonaktif pada bulan itu (tanpa pembayaran) = N/A: tidak masuk "Belum Bayar"
// maupun "Ada Tunggakan" (getArrears hanya menghitung bulan berstatus "belum"). Pendapatan tetap dari pembayaran.
export function doWASummary(data: AppData, year?: number, month?: number, zones?: string[]): void {
  const now = new Date();
  const dy  = year  ?? now.getFullYear();
  const dm  = month ?? now.getMonth();
  const bulan = `${MONTHS[dm]} ${dy}`;
  const list = zones && zones.length ? zones : zonesFromData(data);

  const rows = list.map(z => {
    const mems = getMembersForZone(z, data);
    return {
      z,
      total:  getZoneTotal(data, z, dy, dm),
      lunas:  mems.filter(m => getMonthStatus(data, z, m, dy, dm) === 'lunas').length,
      belum:  mems.filter(m => getMonthStatus(data, z, m, dy, dm) === 'belum').length,
      tunggak: mems.filter(m => getArrears(data, z, m, dy, dm).filter(u => !isFree(data, z, m, u.y, u.mi)).length > 0).length,
    };
  });
  const total = rows.reduce((s, r) => s + r.total, 0);

  const opsData   = data.operasional?.[`${dy}_${dm}`] || { items:[] };
  const totalOps  = (opsData.items||[]).reduce((s,it) => s+(+it.nominal||0), 0);
  const netIncome = total - totalOps;
  const fmt = (v: number) => (v * 1000).toLocaleString('id-ID');
  const perZone = (pick: (r: typeof rows[number]) => string | number) => rows.map(r => `${r.z}: ${pick(r)}`).join(' | ');

  const msg = `📶 *WiFi Pay – Rekap ${bulan}*\n\n💰 *Pendapatan*\n${rows.map(r => `  ${r.z} : Rp ${fmt(r.total)}`).join('\n')}\n  Total: Rp ${fmt(total)}\n\n✅ *Lunas*\n  ${perZone(r => r.lunas)}\n\n⚠️ *Belum Bayar ${bulan}*\n  ${perZone(r => r.belum)}\n\n🔴 *Ada Tunggakan*\n  ${perZone(r => r.tunggak)}\n\n💸 Operasional : Rp ${fmt(totalOps)}\n✨ Bersih         : Rp ${fmt(netIncome)}\n\n_WiFi Pay – ${new Date().toLocaleString('id-ID')}_`;

  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

// ── WA Blast per-member: pesan tunggakan individual ──
export function doWABlast(
  name:   string,
  zone:   string,
  unpaid: { label: string }[],
  tarif:  number,
): void {
  if (unpaid.length === 0) return;
  const months   = unpaid.map(u => u.label).join(', ');
  const total    = unpaid.length * tarif * 1000;
  const totalFmt = total.toLocaleString('id-ID');
  const msg = [
    `Halo *${name}*,`,
    ``,
    `Tagihan WiFi zona *${zone}* bulan *${months}* (${unpaid.length} bulan)`,
    `sebesar *Rp ${totalFmt}* belum dibayar.`,
    ``,
    `Mohon segera melakukan pembayaran. Terima kasih 🙏`,
  ].join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}
