// components/ui/CollapsibleGroupHeader.tsx — header grup bisa dilipat level-1 (T5 `.gh5/.gb5`)
// Pemakai: Pengaturan (daftar grup). Header = tombol aria-expanded; isi = CollapsibleBody.
'use client';

import { CaretDown } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { IconTile, type TileTone } from './IconTile';
import type { AnyIcon } from './icons';

export interface CollapsibleGroupHeaderProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  /** id elemen isi (CollapsibleBody) untuk aria-controls */
  controlsId: string;
  icon?: AnyIcon;
  tone?: TileTone;
  /** jumlah item (mis. "4") */
  count?: number | string;
}

export function CollapsibleGroupHeader({ title, open, onToggle, controlsId, icon, tone = 'accent', count }: CollapsibleGroupHeaderProps) {
  return (
    <button type="button" className="wp-gh" aria-expanded={open} aria-controls={controlsId} onClick={onToggle}>
      {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      <b>{title}</b>
      {count !== undefined && <span className="wp-gh__cn">{count}</span>}
      <span className="wp-gh__chev" aria-hidden="true"><CaretDown size="1em" weight="bold" /></span>
    </button>
  );
}

export function CollapsibleBody({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return <div id={id} className="wp-gb" hidden={!open}>{children}</div>;
}

export default CollapsibleGroupHeader;
