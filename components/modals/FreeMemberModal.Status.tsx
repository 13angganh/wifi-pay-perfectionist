// ══════════════════════════════════════════
// components/modals/FreeMemberModal.Status.tsx — tampilan daftar sheet "Status & Periode" (REDESAIN T12, D7)
// Status bulan terpilih, "Terdaftar sejak" (hanya info; pengubahannya satu pintu di form Edit Member), tombol
// "Nonaktifkan mulai {bulan}" / "Aktifkan kembali mulai {bulan}" (hanya yang relevan; Reaktivasi hanya bila ada periode
// nonaktif terbuka), dan dua daftar periode (Free, Nonaktif) dengan Tambah/Ubah/Hapus. Komponen presentasi: state,
// penyimpanan, dan Confirm dimiliki FreeMemberModal. Memakai primitive Badge, Button, IconButton, EmptyState.
// ══════════════════════════════════════════
'use client';

import { PauseCircle, PencilSimple, Play, Plus, Trash } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import type { PeriodKind } from '@/lib/memberPeriods';
import type { MonthStatus } from '@/lib/payment';
import f from './freeMember.module.css';

export interface PeriodRowView { label: string; open: boolean }

interface Props {
  monthLabel: string;           // mis. "Oktober 2026" (bulan terpilih)
  status: MonthStatus;
  joinedLabel: string | null;   // null = sejak awal
  canDeactivate: boolean;
  canReactivate: boolean;
  free: PeriodRowView[];
  inactive: PeriodRowView[];
  onEditJoined?: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onAdd: (kind: PeriodKind) => void;
  onEdit: (kind: PeriodKind, index: number) => void;
  onDelete: (kind: PeriodKind, index: number) => void;
}

function statusBadge(status: MonthStatus) {
  return status === 'free' || status === 'lunas' || status === 'belum' ? status : 'neutral';
}

function PeriodList({ kind, rows, p }: { kind: PeriodKind; rows: PeriodRowView[]; p: Props }) {
  const t = useT();
  const isFree = kind === 'free';
  return (
    <section className={f.section} aria-label={t(isFree ? 'periods.freeTitle' : 'periods.inactiveTitle')}>
      <div className={f.secHead}>
        <h3 className={f.secTitle}>{t(isFree ? 'periods.freeTitle' : 'periods.inactiveTitle')}</h3>
        <Button variant="secondary" size="sm" onClick={() => p.onAdd(kind)}>
          <Plus aria-hidden="true" /> {t(isFree ? 'periods.addFree' : 'periods.addInactive')}
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState size="sm" title={t(isFree ? 'periods.freeEmpty' : 'periods.inactiveEmpty')} />
      ) : (
        <ul className={f.rows}>
          {rows.map((r, i) => (
            <li key={`${kind}-${i}`} className={f.row}>
              <span className={f.rowTx}>{r.label}</span>
              <span className={f.rowAct}>
                <IconButton size="sm" icon={PencilSimple} label={`${t(isFree ? 'periods.editFree' : 'periods.editInactive')}: ${r.label}`} onClick={() => p.onEdit(kind, i)} />
                <IconButton size="sm" icon={Trash} tone="danger" label={`${t(isFree ? 'periods.deleteFree' : 'periods.deleteInactive')}: ${r.label}`} onClick={() => p.onDelete(kind, i)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function FreeMemberStatus(p: Props) {
  const t = useT();
  return (
    <div className={f.body}>
      <div className={f.summary}>
        <div className={f.sumRow}>
          <span className={f.sumLabel}>{t('periods.statusFor')} {p.monthLabel}</span>
          <Badge variant={statusBadge(p.status)}>{t(`status.${p.status}`)}</Badge>
        </div>
        <div className={f.sumRow}>
          <span className={f.sumLabel}>{t('periods.joined')}</span>
          <span className={f.sumVal}>
            {p.joinedLabel ?? t('periods.fromStart')}
            {p.onEditJoined && (
              <Button variant="ghost" size="sm" onClick={p.onEditJoined}>{t('periods.changeJoined')}</Button>
            )}
          </span>
        </div>
      </div>

      {(p.canDeactivate || p.canReactivate) && (
        <div className={f.actions}>
          {p.canDeactivate && (
            <Button variant="secondary" block onClick={p.onDeactivate}>
              <PauseCircle aria-hidden="true" /> {t('periods.deactivateFrom')} {p.monthLabel}
            </Button>
          )}
          {p.canReactivate && (
            <Button variant="primary" block onClick={p.onReactivate}>
              <Play aria-hidden="true" /> {t('periods.reactivateFrom')} {p.monthLabel}
            </Button>
          )}
        </div>
      )}

      <PeriodList kind="free" rows={p.free} p={p} />
      <PeriodList kind="inactive" rows={p.inactive} p={p} />
    </div>
  );
}
