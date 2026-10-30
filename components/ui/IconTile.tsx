// components/ui/IconTile.tsx — tile ikon berwarna (CORE BLOCK v3 .tile)
// Dipakai: Dashboard (stat, aktivitas), Entry/Rekap/Member (kartu), Log, Pengaturan (baris).
'use client';

import { clsx } from 'clsx';
import type { AnyIcon, IconWeight } from './icons';

export type TileTone =
  | 'accent' | 'lunas' | 'belum' | 'free' | 'blue' | 'warn' | 'orange'
  | 'purple' | 'teal' | 'slate' | 'night' | 'gold' | 'soft';

export interface IconTileProps {
  icon: AnyIcon;
  tone?: TileTone;
  size?: 'md' | 'sm' | 'lg';
  weight?: IconWeight;
  className?: string;
}

export function IconTile({ icon: Icon, tone = 'accent', size = 'md', weight = 'fill', className }: IconTileProps) {
  return (
    <span
      className={clsx('wp-tile', size === 'sm' && 'wp-tile--sm', size === 'lg' && 'wp-tile--lg', tone !== 'accent' && `wp-tile--${tone}`, className)}
      aria-hidden="true"
    >
      <Icon size="1em" weight={weight} />
    </span>
  );
}

export default IconTile;
