// ══════════════════════════════════════════
// lib/export.wa.ts — WhatsApp summary export
// Dipecah dari export.ts (task 1.15)
// ══════════════════════════════════════════

import type { AppData } from '@/types';
import { MONTHS } from './constants';
import { getPay, isFree, getZoneTotal, isLunas, getArrears } from './payment';

// ── WA Summary ──
export function doWASummary(data: AppData, year?: number, month?: number): void {
  const now = new Date();
  const dy  = year  ?? now.getFullYear();
  const dm  = month ?? now.getMonth();
  const bulan = `${MONTHS[dm]} ${dy}`;

  const krsTotal = getZoneTotal(data,'KRS',dy,dm);
  const slkTotal = getZoneTotal(data,'SLK',dy,dm);
  const total    = krsTotal + slkTotal;

  const krsLunas  = (data.krsMembers||[]).filter(m => isLunas(data,'KRS',m,dy,dm) && !isFree(data,'KRS',m,dy,dm)).length;
  const slkLunas  = (data.slkMembers||[]).filter(m => isLunas(data,'SLK',m,dy,dm) && !isFree(data,'SLK',m,dy,dm)).length;
  const krsBelum  = (data.krsMembers||[]).filter(m => getPay(data,'KRS',m,dy,dm)===null && !isFree(data,'KRS',m,dy,dm)).length;
  const slkBelum  = (data.slkMembers||[]).filter(m => getPay(data,'SLK',m,dy,dm)===null && !isFree(data,'SLK',m,dy,dm)).length;

  const opsData   = data.operasional?.[`${dy}_${dm}`] || { items:[] };
  const totalOps  = (opsData.items||[]).reduce((s,it) => s+(+it.nominal||0), 0);
  const netIncome = total - totalOps;

  const tunggakKRS = (data.krsMembers||[]).filter(m => getArrears(data,'KRS',m,dy,dm).filter(u => !isFree(data,'KRS',m,u.y,u.mi)).length > 0).length;
  const tunggakSLK = (data.slkMembers||[]).filter(m => getArrears(data,'SLK',m,dy,dm).filter(u => !isFree(data,'SLK',m,u.y,u.mi)).length > 0).length;

  const msg = `📶 *WiFi Pay – Rekap ${bulan}*\n\n💰 *Pendapatan*\n  KRS : Rp ${(krsTotal*1000).toLocaleString('id-ID')}\n  SLK : Rp ${(slkTotal*1000).toLocaleString('id-ID')}\n  Total: Rp ${(total*1000).toLocaleString('id-ID')}\n\n✅ *Lunas*\n  KRS: ${krsLunas} | SLK: ${slkLunas}\n\n⚠️ *Belum Bayar ${bulan}*\n  KRS: ${krsBelum} | SLK: ${slkBelum}\n\n🔴 *Ada Tunggakan*\n  KRS: ${tunggakKRS} | SLK: ${tunggakSLK}\n\n💸 Operasional : Rp ${(totalOps*1000).toLocaleString('id-ID')}\n✨ Bersih         : Rp ${(netIncome*1000).toLocaleString('id-ID')}\n\n_WiFi Pay – ${new Date().toLocaleString('id-ID')}_`;

  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}
