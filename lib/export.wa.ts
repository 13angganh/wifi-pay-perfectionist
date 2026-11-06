// ══════════════════════════════════════════
// lib/export.wa.ts — WhatsApp summary export
// Dipecah dari export.ts (task 1.15)
// ══════════════════════════════════════════

import type { AppData } from '@/types';
import { MONTHS, MONTHS_EN } from './constants';
import { getActiveLang, createTranslator, fillText } from './i18n';
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
  // v11.11.1: pesan mengikuti bahasa app (teks bahasa Indonesia TIDAK berubah dari sebelumnya).
  const lang = getActiveLang();
  const t = createTranslator(lang);
  const bulan = `${(lang === 'en' ? MONTHS_EN : MONTHS)[dm]} ${dy}`;
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

  const dateText = new Date().toLocaleString(lang === 'en' ? 'en-US' : 'id-ID');
  const msg = `📶 *${fillText(t('wa.summary.title'), { period: bulan })}*\n\n💰 *${t('wa.summary.income')}*\n${rows.map(r => `  ${r.z} : Rp ${fmt(r.total)}`).join('\n')}\n  ${t('wa.summary.total')} Rp ${fmt(total)}\n\n✅ *${t('wa.summary.paid')}*\n  ${perZone(r => r.lunas)}\n\n⚠️ *${fillText(t('wa.summary.unpaid'), { period: bulan })}*\n  ${perZone(r => r.belum)}\n\n🔴 *${t('wa.summary.arrears')}*\n  ${perZone(r => r.tunggak)}\n\n💸 ${t('wa.summary.opsLabel')} Rp ${fmt(totalOps)}\n✨ ${t('wa.summary.netLabel')} Rp ${fmt(netIncome)}\n\n_WiFi Pay – ${dateText}_`;

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
  const t        = createTranslator(getActiveLang());
  const months   = unpaid.map(u => u.label).join(', ');
  const total    = unpaid.length * tarif * 1000;
  const totalFmt = total.toLocaleString('id-ID');
  const msg = [
    fillText(t('wa.blast.hello'), { name }),
    ``,
    fillText(t('wa.blast.line1'), { zone, months, count: unpaid.length }),
    fillText(t('wa.blast.line2'), { total: totalFmt }),
    ``,
    `${t('wa.blast.line3')} 🙏`,
  ].join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}
