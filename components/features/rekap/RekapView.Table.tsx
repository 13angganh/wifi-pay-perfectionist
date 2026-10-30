// ══════════════════════════════════════════
// components/features/rekap/RekapView.Table.tsx — tabel Rekap 12 bulan (REDESAIN T8, T3 keputusan 2, 3, 5)
// Satu <table> dengan header dan kolom # / Nama menempel; scroll di dalam kartu. Baris di-memo dengan
// pembanding kustom (v11.5.7): tanpa itu seluruh baris dirender ulang tiap perubahan kecil.
// Sel: lunas = nominal hijau · Akm = teks kecil · gratis = ikon gift · belum jatuh tempo = latar merah + ikon x ·
// belum belum-jatuh-tempo = "—". Mode pilih: hanya sel belum bayar di kolom terpilih yang bisa diketuk.
// ══════════════════════════════════════════
'use client';

import { memo, useRef } from 'react';
import { clsx } from 'clsx';
import { Check, Gift, Prohibit, X } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { useAxisLock } from '@/hooks/useAxisLock';
import type { CellKind, NaStatus } from './rekap.logic';
import r from './rekap.module.css';

export interface CellData {
  mi: number;
  kind: CellKind;
  /** T12: alasan sel N/A (kind 'na') — dipakai judul/aksesibilitas */
  na?: NaStatus;
  /** nilai mentah (ribuan); null = belum bayar */
  v: number | null;
  isDimmed: boolean;
  isSelected: boolean;
  /** kolom batch aktif tetapi sel ini bukan sel belum-bayar → tidak bisa dipilih */
  notEligible: boolean;
  /** kolom batch aktif dan sel ini bisa dipilih */
  eligible: boolean;
  isExp: boolean;
  isFlashing: boolean;
  flashKey: number;
  monthLabel: string;
}

export interface RowData {
  name: string;
  index: number;
  rowTotal: number;
  cells: CellData[];
}

interface RowProps extends RowData {
  selYear: number;
  onCellClick: (name: string, mi: number) => void;
  onNameClick: (name: string) => void;
}

const fmt = (v: number) => (v * 1000).toLocaleString('id-ID');

function cellDataEqual(a: CellData, b: CellData): boolean {
  return a.v === b.v && a.kind === b.kind && a.na === b.na && a.isDimmed === b.isDimmed
    && a.isSelected === b.isSelected && a.notEligible === b.notEligible && a.eligible === b.eligible
    && a.isExp === b.isExp && a.isFlashing === b.isFlashing && a.flashKey === b.flashKey;
}

const Row = memo(function Row({
  name, index, rowTotal, cells, selYear,
  onCellClick, onNameClick,
}: RowProps) {
  const t = useT();
  return (
    <tr data-name={name}>
      <td className={clsx(r.stk, r.c1)}>{index + 1}</td>
      <td className={clsx(r.stk, r.c2)}>
        <button type="button" className={r.nameBtn} title={t('riwayat.open')} onClick={() => onNameClick(name)}>{name}</button>
      </td>
      {cells.map(c => {
        const cls = clsx(
          r.cell,
          c.kind === 'paid' && r.cv, c.kind === 'akm' && r.cz, c.kind === 'free' && r.cf,
          c.kind === 'due' && r.cb, c.kind === 'future' && r.cn, c.kind === 'na' && r.cna,
          c.isDimmed && r.dm, c.notEligible && r.na, c.eligible && !c.isSelected && r.el,
          c.isSelected && r.sl, c.isExp && r.open,
        );
        const content =
          c.kind === 'free' ? <Gift size={12} weight="duotone" aria-hidden="true" />
          : c.kind === 'akm' ? <span>Akm</span>
          : c.kind === 'paid' ? fmt(c.v as number)
          : c.kind === 'due' ? <X size={10} weight="bold" aria-hidden="true" />
          : c.kind === 'na' ? <Prohibit size={11} aria-hidden="true" />
          : '—';
        return (
          <td
            key={c.mi}
            className={cls}
            aria-disabled={c.notEligible || undefined}
            title={c.notEligible ? t('entry.batchNotEligible') : c.kind === 'free' ? t('rekap.freeMember') : c.kind === 'na' && c.na ? `${c.monthLabel} ${selYear} · ${t(`status.${c.na}`)}` : `${c.monthLabel} ${selYear}`}
            onClick={() => onCellClick(name, c.mi)}
          >
            <span className={r.cellTx}>
              {content}
              {c.isSelected && <Check size={10} weight="fill" aria-hidden="true" style={{ marginLeft: 2 }} />}
            </span>
            {/* v11.5.7: overlay kilat terpisah dari <td> — key boleh berubah untuk restart animasi tanpa remount sel */}
            {c.isFlashing && <span key={`flash-${c.flashKey}`} className={r.flash} />}
          </td>
        );
      })}
      <td className={r.tt}>{rowTotal > 0 ? fmt(rowTotal) : ''}</td>
    </tr>
  );
}, (prev, next) => {
  // Pembanding kustom WAJIB: array `cells` selalu referensi baru tiap render induk.
  if (prev.name !== next.name || prev.index !== next.index || prev.rowTotal !== next.rowTotal
    || prev.selYear !== next.selYear
    || prev.onCellClick !== next.onCellClick || prev.onNameClick !== next.onNameClick) return false;
  if (prev.cells.length !== next.cells.length) return false;
  for (let k = 0; k < prev.cells.length; k++) if (!cellDataEqual(prev.cells[k], next.cells[k])) return false;
  return true;
});

interface TableProps {
  rows: RowData[];
  monthNames: string[];
  selYear: number;
  refMonth: number;
  batchColIdx: number | null;
  /** halaman efektif; subtotal hanya bila lebih dari 1 halaman (T3 keputusan 2) */
  page: number;
  totalPages: number;
  pageColTotals: number[];
  pageSubtotal: number;
  colTotals: number[];
  grand: number;
  onCellClick: (name: string, mi: number) => void;
  onNameClick: (name: string) => void;
}

export function RekapTable({
  rows, monthNames, selYear, refMonth, batchColIdx, page, totalPages,
  pageColTotals, pageSubtotal, colTotals, grand,
  onCellClick, onNameClick,
}: TableProps) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  useAxisLock(wrapRef);
  const batching = batchColIdx !== null;
  return (
    <div ref={wrapRef} className={r.rwc} data-testid="rekap-table">
      <table className={r.rt}>
        <thead>
          <tr>
            <th className={clsx(r.stk, r.c1)}>#</th>
            <th className={clsx(r.stk, r.c2)} style={{ textAlign: 'left' }}>{t('common.name').toUpperCase()}</th>
            {monthNames.map((m, mi) => (
              <th key={mi} className={clsx(mi === refMonth && r.rm, batchColIdx === mi && r.bc)}>{m.slice(0, 3)}</th>
            ))}
            <th className={r.tt}>{t('common.total')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <Row
              key={row.name}
              {...row}
              selYear={selYear}
              onCellClick={onCellClick}
              onNameClick={onNameClick}
            />
          ))}
        </tbody>
        <tfoot>
          {totalPages > 1 && (
            <tr className={r.sb2}>
              <td colSpan={2} className={r.stk} style={{ left: 0 }}>{t('rekap.subtotalPage')} {page}</td>
              {pageColTotals.map((v, mi) => (
                <td key={mi} style={batching && batchColIdx !== mi ? { opacity: 0.2 } : undefined}>{v > 0 ? fmt(v) : ''}</td>
              ))}
              <td>{pageSubtotal > 0 ? fmt(pageSubtotal) : ''}</td>
            </tr>
          )}
          <tr>
            <td colSpan={2} className={r.stk} style={{ left: 0 }}>{t('common.total')}</td>
            {colTotals.map((v, mi) => (
              <td key={mi} style={batching && batchColIdx !== mi ? { opacity: 0.2 } : undefined}>{v > 0 ? fmt(v) : ''}</td>
            ))}
            <td style={{ color: 'var(--zc)' }}>{grand > 0 ? fmt(grand) : ''}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
