// ══════════════════════════════════════════
// components/features/settings/SettingsRow.tsx — baris level-2 Pengaturan (REDESAIN T10, D1/D2)
// ListRow + lencana status opsional (PIN Aktif/Nonaktif, jumlah zona, Tanggal Otomatis/Manual, Tema, Bahasa).
// `badgeColor` = warna token (mis. var(--c-lunas) untuk aktif, var(--txt4) untuk nonaktif). Mengetuk baris
// membuka halaman isi (drill-down) — ditangani SettingsView.
// ══════════════════════════════════════════
'use client';

import { Badge } from '@/components/ui/Badge';
import { ListRow } from '@/components/ui/ListRow';
import type { AnyIcon } from '@/components/ui/icons';
import type { TileTone } from '@/components/ui/IconTile';

export interface SettingsRowProps {
  icon: AnyIcon;
  tone?: TileTone;
  title: string;
  description?: string;
  badge?: string | number;
  badgeColor?: string;
  onOpen: () => void;
}

export default function SettingsRow({ icon, tone, title, description, badge, badgeColor, onOpen }: SettingsRowProps) {
  return (
    <ListRow
      icon={icon}
      tone={tone}
      title={title}
      description={description}
      trailing={badge !== undefined && badge !== '' ? <Badge variant="neutral" size="xs" color={badgeColor}>{badge}</Badge> : undefined}
      onClick={onOpen}
    />
  );
}
