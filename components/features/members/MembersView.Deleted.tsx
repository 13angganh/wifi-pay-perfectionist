// ══════════════════════════════════════════
// components/features/members/MembersView.Deleted.tsx — tab Terhapus / Recycle Bin (REDESAIN T9, T4 keputusan 6)
// Kartu: tile sampah, nama, tanggal hapus + jumlah data, Pulihkan, Hapus Permanen (Confirm ada di MembersView).
// Komponen presentasi; daftar kosong ditangani pemanggil (EmptyState `members.recycleBinEmpty`).
// ══════════════════════════════════════════
'use client';

import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import type { DeletedMember } from '@/types';
import m from './members.module.css';

interface Props {
  entries: [string, DeletedMember][];
  locale: string;
  onRestore: (key: string) => void;
  onPurge: (key: string) => void;
}

export default function DeletedMembers({ entries, locale, onRestore, onPurge }: Props) {
  const t = useT();
  return (
    <div className={m.mlist}>
      {entries.map(([key, d]) => (
        <Card key={key} padding="none" className={m.dc} data-testid="deleted-row">
          <IconTile icon={Trash} tone="belum" size="sm" />
          <div className={m.dcTx}>
            <b>{d.name}</b>
            <span className="wp-t-cap">
              {t('action.delete')}: {new Date(d.deletedAt).toLocaleDateString(locale)} · {Object.keys(d.payments || {}).length} {t('members.records')}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onRestore(key)}>
            <ArrowCounterClockwise aria-hidden="true" /> {t('members.restore')}
          </Button>
          <IconButton icon={Trash} size="sm" tone="danger" label={`${t('members.purgeAria')} ${d.name}`} title={t('members.permDelete')} onClick={() => onPurge(key)} />
        </Card>
      ))}
    </div>
  );
}
