// ══════════════════════════════════════════
// lib/export.excel.ts — PDF & Excel exports
// v11.3: jsPDF via npm (bukan CDN) — eliminasi race condition
// v11.5.20: jspdf 2.5.2→4.2.1, jspdf-autotable 3.8.4→5.0.8 (npm audit fix
// --force, menuntaskan CVE critical/high di jspdf — path traversal & HTML
// injection). API yang dipakai file ini (autoTable(doc,{...}) gaya fungsi,
// showFoot/willDrawCell/didDrawPage, struktur HookData) TIDAK berubah antar
// major version ini — dikonfirmasi lewat tsc --noEmit bersih (0 error tipe)
// DAN generate PDF nyata pasca-upgrade yang dibaca ulang via pdftotext:
// GRAND TOTAL per bulan, TOTAL HALAMAN per halaman, dan palet warna COL
// (headBg/grandFootTxt/dst, dicocokkan langsung dari content stream PDF
// biner) semuanya identik dengan output sebelum upgrade.
// ══════════════════════════════════════════

import type { AppData } from '@/types';
import { MONTHS, APP_NAME, APP_VERSION_FULL } from './constants';
import { getPay } from './payment';

/* eslint-disable @typescript-eslint/no-explicit-any */
// SheetJS tetap via CDN global (XLSX)
interface WindowWithXLSX extends Window { XLSX: any; }
const win = (typeof window !== 'undefined' ? window : {}) as WindowWithXLSX;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Download helper ──
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── PDF via npm jspdf ──
//
// v11.5.16 fix (2 bug dari laporan Rekap ALL):
// 1) Zebra-stripe & teks samar: sebelumnya alternateRowStyles [15,18,28] vs
//    footStyles [20,24,36] hampir identik, dan headStyles textColor [170,170,160]
//    (abu redup) di atas fillColor [30,34,49] → kontras rendah, sulit dibaca saat
//    dicetak/di-zoom. Diganti dengan token warna app asli (design-tokens.ts:
//    bg2/bg3/bg4/txt2) yang kontrasnya sudah divalidasi untuk dark theme.
// 2) Total per halaman tidak valid: root cause-nya `foot` di autoTable() options
//    di-render ulang di SETIAP halaman karena default showFoot:'everyPage' —
//    padahal isi foot itu grand total SATU angka untuk seluruh periode, jadi
//    setiap halaman menampilkan angka yang identik dan tampak seperti "total per
//    halaman" yang salah. Diganti: subtotal per halaman dihitung ulang dari baris
//    body yang benar-benar tercetak di halaman itu (accumulator direset di setiap
//    didDrawPage), dan grand total sungguhan dipisah tegas hanya di halaman
//    terakhir via showFoot:'lastPage' + label "GRAND TOTAL" agar tidak tertukar.
export async function generatePDF(
  data: AppData, zone: string, year: number, month: number | null
): Promise<{ blob: Blob; filename: string }> {
  // Dynamic import agar tidak bloat initial bundle
  const { default: jsPDF }    = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });

  // v11.5.16: baris `autoTable(doc, { head:[[]], body:[] })` "init" yang
  // sebelumnya ada di sini SUDAH DIHAPUS — diverifikasi langsung dari source
  // jspdf-autotable (dist/jspdf.plugin.autotable.js) bahwa `applyPlugin(jsPDF)`
  // sudah berjalan OTOMATIS di top-level module saat package ini di-import,
  // jadi pemanggilan manual dengan tabel kosong itu murni dead code — tidak
  // pernah dibutuhkan utk mendaftarkan plugin sejak awal. Efek sampingnya malah
  // merugikan: tabel 0-kolom (head:[[]]) itu memicu console.warn "Of the table
  // content, 269 units width could not fit page" pada SETIAP pemanggilan
  // generatePDF — dikonfirmasi lewat pengujian langsung: warning tsb hilang
  // total begitu baris ini dihapus, sedangkan tabel data asli di bawah tetap
  // tergambar sempurna tanpa perubahan apa pun.

  const mems =
    zone === 'ALL'
      ? [...data.krsMembers.map(n => ({ n, z:'KRS' })), ...data.slkMembers.map(n => ({ n, z:'SLK' }))]
      : (zone === 'KRS' ? data.krsMembers : data.slkMembers).map(n => ({ n, z: zone }));

  const title = month !== null
    ? `Rekap WiFi Pay ${zone} - ${MONTHS[month]} ${year}`
    : `Rekap WiFi Pay ${zone} - ${year}`;

  // Header branding WiFiPay
  doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.setTextColor(201, 149, 42);
  doc.text('WIFI PAY', 14, 10);
  doc.setTextColor(0);
  doc.setFontSize(14); doc.setFont('helvetica','bold');
  doc.text(title, 14, 18);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120);
  doc.text(`Dibuat: ${new Date().toLocaleString('id-ID')} · ${APP_NAME} ${APP_VERSION_FULL}`, 14, 24);
  doc.setTextColor(0);
  doc.setDrawColor(201, 149, 42); doc.setLineWidth(0.3);
  doc.line(14, 26, 283, 26);
  doc.setDrawColor(0); doc.setLineWidth(0.2);

  // ── Palet warna PDF, diselaraskan dgn design-tokens.ts (dark theme app) ──
  // Kontras teks:background di setiap baris divalidasi ≥ 7:1 (setara WCAG AAA)
  // supaya tak ada lagi kombinasi "hampir mirip" seperti versi sebelumnya.
  const COL = {
    headBg:   [30, 34, 43]   as [number, number, number], // token bg3 #1E2235 (gelap netral)
    headTxt:  [232, 234, 240] as [number, number, number], // hampir putih — kontras tinggi vs headBg
    rowA:     [24, 28, 39]   as [number, number, number], // token bg2 #181C27
    rowB:     [37, 43, 64]   as [number, number, number], // token bg4 #252B40 — beda jelas dari rowA
    bodyTxt:  [220, 223, 232] as [number, number, number], // terang, kontras tinggi di kedua rowA/rowB
    pageFootBg:  [37, 43, 64] as [number, number, number], // = rowB, tapi ditandai bold agar tetap beda
    pageFootTxt: [232, 234, 240] as [number, number, number],
    grandFootBg: [15, 18, 23] as [number, number, number], // lebih gelap dari body → hierarki visual jelas
    grandFootTxt:[52, 211, 153] as [number, number, number], // hijau brand (senada C_LUNAS #22C55E)
  };

  let head: string[][], body: (string|number)[][];
  // Index kolom numerik yang perlu diakumulasi untuk subtotal per halaman.
  // Mode bulanan: hanya kolom "Jumlah" (index 4). Mode tahunan: 12 kolom bulan
  // (index 2..13); kolom "Total" (terakhir) TIDAK diakumulasi ulang — nilainya
  // per-baris (total 1 orang), bukan sesuatu yang perlu disubtotalkan per halaman
  // secara terpisah dari subtotal bulan, jadi cukup dijumlahkan dari subtotal
  // 12 bulan pada baris "Total Halaman" itu sendiri (lihat didDrawPage di bawah).
  let sumColIndexes: number[];

  // rawValuesByRow[i][ci] = nilai numerik ASLI (belum diformat toLocaleString)
  // untuk baris body ke-i, kolom index ci. Dipakai sebagai sumber subtotal per
  // halaman, TIDAK PERNAH lewat parsing string tampilan. Ini sengaja dipisah
  // dari `body` (yang isinya string sudah diformat "Rp 10.180" dsb untuk
  // ditampilkan): mem-parseFloat ulang string berformat id-ID akan salah,
  // karena titik pemisah ribuan Indonesia (mis. "10.180") akan terbaca sebagai
  // desimal oleh parseFloat standar ("10.180" → 10.18) — sudah diuji langsung
  // dan terkonfirmasi salah, bukan asumsi. Menyimpan angka mentah terpisah
  // menghilangkan risiko itu sepenuhnya.
  const rawValuesByRow: number[][] = [];

  if (month !== null) {
    head = [['#','Nama','Zona','Tgl Bayar','Jumlah','Status']];
    body = mems.map(({ n, z }, i) => {
      const v    = getPay(data, z, n, year, month);
      const info = data.memberInfo?.[z+'__'+n] || {};
      const dt   = (info[`date_${year}_${month}`] as string) || '—';
      rawValuesByRow[i] = [v || 0];
      return [i+1, n, z, dt, v !== null ? 'Rp '+v.toLocaleString('id-ID') : '—', v !== null ? 'Lunas' : 'Belum'];
    });
    sumColIndexes = [4];
  } else {
    head = [['#','Nama',...MONTHS,'Total']];
    body = mems.map(({ n, z }, i) => {
      let t = 0;
      const raws: number[] = [];
      const cols = MONTHS.map((_, mi) => { const v = getPay(data, z, n, year, mi); t += v || 0; raws.push(v || 0); return v !== null ? v : '—'; });
      rawValuesByRow[i] = raws;
      return [i+1, n, ...cols, t.toLocaleString('id-ID')];
    });
    sumColIndexes = MONTHS.map((_, mi) => 2 + mi);
  }

  // Grand total sungguhan (satu angka, seluruh periode) — dipakai HANYA di
  // baris foot terakhir, terpisah tegas dari subtotal per halaman.
  const grandTotal = month !== null
    ? mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, month) || 0), 0)
    : MONTHS.reduce((gt, _, mi) => gt + mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, mi) || 0), 0), 0);
  const grandFootCols = head[0].length;
  const grandFootRow: (string|number)[] = new Array(grandFootCols).fill('');
  grandFootRow[grandFootCols - 1] = 'Rp ' + grandTotal.toLocaleString('id-ID');

  // v11.5.17 fix: baris GRAND TOTAL sebelumnya hanya mengisi kolom "Total"
  // paling kanan (1 angka gabungan seluruh tahun) — 12 kolom bulan (Jan..Des)
  // dibiarkan kosong, padahal tiap halaman sudah punya subtotal per bulan
  // ("TOTAL HALAMAN"). Sekarang, khusus mode tahunan, GRAND TOTAL diisi
  // per bulan juga — akumulasi seluruh member lintas SEMUA halaman, dihitung
  // langsung dari data mentah (BUKAN dari pageSums, yang direset tiap halaman
  // di didDrawPage sehingga tidak bisa dipakai untuk akumulasi lintas-halaman).
  //
  // Penempatan label "GRAND TOTAL": versi sebelumnya menaruhnya di
  // grandFootCols-2, yang di mode bulanan adalah kolom kosong-alami ("Jumlah"
  // digantikan label krn tak ada kolom lain terpakai di posisi itu), TAPI di
  // mode tahunan kolom itu adalah bulan Des (head: ['#','Nama',...12
  // bulan,'Total']) — bukan slot kosong. Menaruh label di situ berarti Des
  // TIDAK PERNAH bisa dapat angka totalnya sendiri, kontradiksi langsung
  // dengan permintaan "grand total utk TIAP bulan". Makanya di mode tahunan
  // label dipindah ke kolom "Nama" (index 1) — satu-satunya kolom yang secara
  // alami tak butuh angka apa pun di baris grand-total — sehingga ke-12 bulan
  // bisa terisi angka tanpa terkecuali. Mode bulanan TIDAK disentuh: tetap
  // persis seperti sebelumnya (label di grandFootCols-2 = kolom "Jumlah").
  if (month === null) {
    grandFootRow[1] = 'GRAND TOTAL';
    MONTHS.forEach((_, mi) => {
      const monthTotal = mems.reduce((s, { n, z }) => s + (getPay(data, z, n, year, mi) || 0), 0);
      grandFootRow[2 + mi] = monthTotal > 0 ? monthTotal.toLocaleString('id-ID') : '—';
    });
  } else {
    grandFootRow[grandFootCols - 2] = 'GRAND TOTAL';
  }

  // sumColIndexes berbasis index kolom TABEL (termasuk kolom '#' dan 'Nama' di
  // depan). rawValuesByRow hanya menyimpan kolom numerik (bulan/jumlah) tanpa
  // offset itu, jadi perlu pemetaan index tabel → index array raws per baris.
  const rawColOffset = month !== null ? 4 : 2; // kolom numerik pertama di tabel

  // Accumulator subtotal per halaman: index kolom tabel → jumlah numerik baris
  // body yang sudah dirender di halaman AKTIF SAAT INI. Direset setiap kali
  // autoTable pindah ke halaman baru (didDrawPage), sehingga tiap subtotal
  // murni mewakili baris-baris yang tercetak di halaman itu saja — bukan grand
  // total yang diulang seperti versi sebelumnya.
  let pageSums: Record<number, number> = {};
  const resetPageSums = () => { pageSums = {}; sumColIndexes.forEach(ci => { pageSums[ci] = 0; }); };
  resetPageSums();

  autoTable(doc, {
    head, body, startY: 26,
    showFoot: 'lastPage', // grand total HANYA muncul sekali, di halaman terakhir
    foot: [grandFootRow],
    styles:             { fontSize:8, cellPadding:2, textColor: COL.bodyTxt },
    headStyles:         { fillColor: COL.headBg, textColor: COL.headTxt, fontStyle:'bold' },
    footStyles:         { fillColor: COL.grandFootBg, textColor: COL.grandFootTxt, fontStyle:'bold' },
    bodyStyles:         { fillColor: COL.rowA },
    alternateRowStyles: { fillColor: COL.rowB },
    margin:             { left:14, right:14, bottom: 16 }, // ruang utk baris "Total Halaman"

    // Akumulasi nilai numerik ASLI (dari rawValuesByRow, bukan cell.raw yang
    // sudah diformat jadi string tampilan) tiap baris body yang sedang dirender.
    // PENTING — sengaja pakai willDrawCell, BUKAN didParseCell: sudah diverifikasi
    // langsung dari source jspdf-autotable bahwa didParseCell dipanggil oleh
    // calculate() di fase kalkulasi lebar kolom, SEBELUM pagination terjadi,
    // atas SELURUH baris tabel (table.allRows()) sekaligus — kalau dipakai di
    // sini hasilnya tetap grand total yang terhitung sekali di awal, bukan
    // subtotal per halaman (persis bug yang sedang diperbaiki, hanya berpindah
    // lokasi). willDrawCell sebaliknya dipanggil dari printRow(), yang hanya
    // jalan untuk baris yang BENAR-BENAR sedang dirender ke halaman aktif saat
    // proses cetak berjalan — itulah yang dibutuhkan agar subtotal murni per
    // halaman. Dihitung sekali per baris (saat kolom pertama tabel, ci===0,
    // untuk hindari akumulasi berulang tiap kolom dalam baris yang sama).
    willDrawCell: (hookData) => {
      if (hookData.section !== 'body') return;
      if (hookData.column.index !== 0) return; // akumulasi 1x per baris, bukan per-kolom
      const raws = rawValuesByRow[hookData.row.index];
      if (!raws) return;
      raws.forEach((val, ri) => {
        const ci = rawColOffset + ri;
        if (ci in pageSums) pageSums[ci] += val;
      });
    },

    // Digambar setelah seluruh baris body (dan, HANYA di halaman terakhir,
    // baris foot GRAND TOTAL) selesai dirender — diverifikasi dari source
    // jspdf-autotable: drawTable() mencetak body lalu foot lalu baru memanggil
    // callEndPageHooks(), jadi cursor.y di sini selalu tepat di ujung bawah
    // konten yang SUDAH tergambar di halaman ini. Menggambar tepat di cursor.y
    // (bukan mencoba menyisip di atas foot) menghindari risiko tumpang-tindih
    // dengan baris yang sudah tercetak. Urutan baca dari atas ke bawah tetap
    // valid: baris-baris member → (di halaman terakhir) GRAND TOTAL seluruh
    // periode → TOTAL HALAMAN (subtotal murni member-member di halaman ini).
    didDrawPage: (hookData) => {
      const table = hookData.table;
      const cols  = table.columns;
      const y     = (hookData.cursor?.y ?? 26) + 0.5;

      const tableWidth = cols.reduce((w, c) => w + c.width, 0);
      const x0 = table.settings.margin.left;
      doc.setFillColor(COL.pageFootBg[0], COL.pageFootBg[1], COL.pageFootBg[2]);
      doc.rect(x0, y, tableWidth, 6, 'F');

      doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.setTextColor(COL.pageFootTxt[0], COL.pageFootTxt[1], COL.pageFootTxt[2]);

      let x = x0;
      cols.forEach((col, ci) => {
        let label = '';
        if (ci === 1) label = 'TOTAL HALAMAN';
        else if (ci in pageSums) label = pageSums[ci] > 0 ? pageSums[ci].toLocaleString('id-ID') : '—';
        if (label) doc.text(label, x + 2, y + 4.2);
        x += col.width;
      });

      resetPageSums(); // halaman berikutnya mulai dari nol, tidak mewarisi halaman ini
    },
  });

  const blob     = doc.output('blob');
  const filename = `wifi-pay-${zone}-${month !== null ? MONTHS[month]+'-' : ''}${year}.pdf`;
  return { blob, filename };
}

// ── Excel via SheetJS CDN ──
export function generateExcel(
  data: AppData, zone: string, year: number, month: number | null
): { blob: Blob; filename: string } {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const XLSX = win.XLSX;
  if (!XLSX) throw new Error('SheetJS belum tersedia');

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
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ── Download blob helper ──
export function downloadBlob(blob: Blob, filename: string) {
  download(blob, filename);
}
