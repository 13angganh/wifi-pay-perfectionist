// ══════════════════════════════════════════
// lib/export.excel.ts — PDF & Excel exports
// Dipecah dari export.ts (task 1.15)
// CDN-loaded jsPDF + SheetJS — any justified: no public TS typings for CDN globals
// ══════════════════════════════════════════

import type { AppData } from '@/types';
import { MONTHS } from './constants';
import { getPay } from './payment';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface WindowWithLibs extends Window {
  jspdf: { jsPDF: new (...args: any[]) => any };
  XLSX: any;
}
const win = (typeof window !== 'undefined' ? window : {}) as WindowWithLibs;

// ── Download helper ──
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── PDF ──
export async function generatePDF(
  data: AppData, zone: string, year: number, month: number | null
): Promise<{ blob: Blob; filename: string }> {
  const { jsPDF } = win.jspdf;
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });

  const mems =
    zone === 'ALL'
      ? [...data.krsMembers.map(n => ({ n, z:'KRS' })), ...data.slkMembers.map(n => ({ n, z:'SLK' }))]
      : (zone === 'KRS' ? data.krsMembers : data.slkMembers).map(n => ({ n, z: zone }));

  const title = month !== null
    ? `Rekap WiFi Pay ${zone} - ${MONTHS[month]} ${year}`
    : `Rekap WiFi Pay ${zone} - ${year}`;

  doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text(title, 14, 16);
  doc.setFontSize(9);  doc.setFont('helvetica','normal'); doc.setTextColor(150);
  doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')}`, 14, 22); doc.setTextColor(0);

  let head: string[][], body: (string|number)[][], foot: (string|number)[][];

  if (month !== null) {
    head = [['#','Nama','Zona','Tgl Bayar','Jumlah','Status']];
    body = mems.map(({ n, z }, i) => {
      const v    = getPay(data, z, n, year, month);
      const info = data.memberInfo?.[z+'__'+n] || {};
      const dt   = (info[`date_${year}_${month}`] as string) || '—';
      return [i+1, n, z, dt, v !== null ? 'Rp '+v.toLocaleString('id-ID') : '—', v !== null ? 'Lunas' : 'Belum'];
    });
    const total = mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, month) || 0), 0);
    foot = [['','','','TOTAL','Rp '+total.toLocaleString('id-ID'),'']];
  } else {
    head = [['#','Nama',...MONTHS,'Total']];
    body = mems.map(({ n, z }, i) => {
      let t = 0;
      const cols = MONTHS.map((_, mi) => { const v = getPay(data, z, n, year, mi); t += v || 0; return v !== null ? v : '—'; });
      return [i+1, n, ...cols, t.toLocaleString('id-ID')];
    });
    const totals = MONTHS.map((_, mi) => mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, mi) || 0), 0));
    foot = [['','TOTAL',...totals.map(t => t.toLocaleString('id-ID')), totals.reduce((a,b) => a+b, 0).toLocaleString('id-ID')]];
  }

  doc.autoTable({
    head, body, foot, startY: 26,
    styles:          { fontSize:8, cellPadding:2 },
    headStyles:      { fillColor:[30,34,49],  textColor:[170,170,160] },
    footStyles:      { fillColor:[20,24,36],  textColor:[90,200,160], fontStyle:'bold' },
    alternateRowStyles: { fillColor:[15,18,28] },
    margin:          { left:14, right:14 },
  });

  const blob     = doc.output('blob');
  const filename = `wifi-pay-${zone}-${month !== null ? MONTHS[month]+'-' : ''}${year}.pdf`;
  return { blob, filename };
}

// ── Excel ──
export function generateExcel(
  data: AppData, zone: string, year: number, month: number | null
): { blob: Blob; filename: string } {
  const XLSX = win.XLSX;
  const mems =
    zone === 'ALL'
      ? [...data.krsMembers.map(n => ({ n, z:'KRS' })), ...data.slkMembers.map(n => ({ n, z:'SLK' }))]
      : (zone === 'KRS' ? data.krsMembers : data.slkMembers).map(n => ({ n, z: zone }));

  const wb = XLSX.utils.book_new();
  let ws: any;

  if (month !== null) {
    const rows: any[][] = [['#','Nama','Zona','Tgl Bayar','Jumlah','Status']];
    mems.forEach(({ n, z }, i) => {
      const v    = getPay(data, z, n, year, month);
      const info = data.memberInfo?.[z+'__'+n] || {};
      rows.push([i+1, n, z, (info[`date_${year}_${month}`] as string)||'', v !== null ? v : 0, v !== null ? 'Lunas' : 'Belum']);
    });
    const total = mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, month) || 0), 0);
    rows.push(['','','','TOTAL', total,'']);
    ws = XLSX.utils.aoa_to_sheet(rows);
  } else {
    const rows: any[][] = [['#','Nama','Zona',...MONTHS,'Total']];
    mems.forEach(({ n, z }, i) => {
      let t = 0;
      const cols = MONTHS.map((_, mi) => { const v = getPay(data, z, n, year, mi); t += v||0; return v||0; });
      rows.push([i+1, n, z, ...cols, t]);
    });
    const totals = MONTHS.map((_, mi) => mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, mi)||0), 0));
    rows.push(['','TOTAL','',...totals, totals.reduce((a,b)=>a+b,0)]);
    ws = XLSX.utils.aoa_to_sheet(rows);
  }

  const sheetName = month !== null ? `${MONTHS[month]} ${year}` : `Tahun ${year}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const blob = new Blob(
    [XLSX.write(wb, { bookType:'xlsx', type:'array' })],
    { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const filename = `wifi-pay-${zone}-${month !== null ? MONTHS[month]+'-' : ''}${year}.xlsx`;
  return { blob, filename };
}

// ── Download PDF helper (untuk ExportModal) ──
export function downloadBlob(blob: Blob, filename: string) {
  download(blob, filename);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
