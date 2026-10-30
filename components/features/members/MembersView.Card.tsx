// ══════════════════════════════════════════
// components/features/members/MembersView.Card.tsx — kartu member layar Member (REDESAIN T9)
// Pola `.mc` T2/T7 (garis kiri menurut status). Atas: tile inisial, nama bernomor, chip ID, ikon catatan, tarif,
// badge status A20 (Lunas/Belum/Gratis, bulan acuan); ketuk bagian atas = RiwayatModal (zip: ketuk nama).
// REDESAIN T12: badge juga Nonaktif / Belum terdaftar (N/A, redup); ikon hadiah = SATU pintu ke sheet "Status & Periode".
// Bawah: tautan IP (membuka link router, zip) + salin IP (A22), lalu Status & Periode, Edit, Hapus. Terkunci: aksi disembunyikan.
// Komponen presentasi: semua aksi dioper dari MembersView (satu pemilik logika).
// ══════════════════════════════════════════
'use client';

import { Vis } from '@/components/ui/CardFilter';
import { clsx } from 'clsx';
import { CalendarCheck, CopySimple, LinkSimple, NotePencil, PencilSimple, Trash } from '@phosphor-icons/react';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { IdChip } from '@/components/ui/Chip';
import type { MemberInfo } from '@/types';
import type { RekapStatus } from '../rekap/rekap.logic';
import { routerHref } from './members.logic';
import m from './members.module.css';

export interface MemberRowProps {
  index: number;
  name: string;
  info: MemberInfo;
  status: RekapStatus;
  locked: boolean;
  onOpenRiwayat: () => void;
  onCopyIp: (ip: string) => void;
  onPeriods: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberRow({ index, name, info, status, locked, onOpenRiwayat, onCopyIp, onPeriods, onEdit, onDelete }: MemberRowProps) {
  const t = useT();
  const ip = String(info.ip || '');
  const idText = info.id ? String(info.id) : '';
  const tarif = info.tarif as number | undefined;
  const isFreeNow = status === 'free';
  const isNA = status === 'nonaktif' || status === 'belumTerdaftar';

  return (
    <Card padding="none" className={clsx(m.mc, m[status])} data-testid="member-row" data-name={name} data-status={status}>
      <div
        className={m.head}
        role="button"
        tabIndex={0}
        aria-label={`${t('riwayat.open')}: ${name}`}
        onClick={onOpenRiwayat}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpenRiwayat(); }
        }}
      >
        <span className={clsx('wp-tile', 'wp-tile--sm', isNA ? 'wp-tile--slate' : `wp-tile--${status}`, m.letter)} aria-hidden="true">
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <div className={m.tx}>
          <b className={m.name}>
            <span className={m.nm}>{index + 1}. {name}</span>
            {/* v11.5.2: indikator catatan — ikon saja; isi catatan hanya terlihat saat Edit dibuka */}
            {info.notes && (
              <span className={m.note} title={t('members.hasNotesHint')} aria-label={t('members.hasNotesHint')}>
                <NotePencil aria-hidden="true" />
              </span>
            )}
          </b>
          <IdChip muted={!idText}>{idText || '—'}</IdChip>
        </div>
        <div className={m.end}>
          {tarif ? <b className="wp-num">{rp(tarif)}</b> : null}
          <Badge variant={isNA ? 'neutral' : status}>{t(`status.${status}`)}</Badge>
        </div>
      </div>

      <div className={m.foot}>
        <Vis screen="members" id="ip">
        {ip ? (
          <>
            <a className={m.ipl} href={routerHref(ip)} target="_blank" rel="noreferrer" title={ip} onClick={e => e.stopPropagation()}>
              <LinkSimple aria-hidden="true" /><span>{ip}</span>
            </a>
            <IconButton icon={CopySimple} size="sm" label={`${t('members.copyIp')}: ${name}`} title={t('members.copyIp')} onClick={() => onCopyIp(ip)} />
          </>
        ) : (
          <span className="wp-t-micro" aria-hidden="true">—</span>
        )}
        </Vis>
        <span className={m.sp} />
        {!locked && (
          <>
            <Button variant="secondary" size="sm" aria-label={`${t('members.periodsAria')}: ${name}`} onClick={onPeriods}>
              <CalendarCheck aria-hidden="true" weight={isFreeNow ? 'fill' : 'regular'} /> {t('members.statusBtn')}
            </Button>
            <Button variant="secondary" size="sm" aria-label={`${t('members.editAria')}: ${name}`} onClick={onEdit}>
              <PencilSimple aria-hidden="true" /> {t('action.edit')}
            </Button>
            <IconButton icon={Trash} size="sm" tone="danger" label={`${t('members.deleteAria')}: ${name}`} onClick={onDelete} />
          </>
        )}
      </div>
    </Card>
  );
}

export default MemberRow;
