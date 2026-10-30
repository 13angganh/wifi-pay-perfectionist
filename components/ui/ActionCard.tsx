// components/ui/ActionCard.tsx — kartu aksi besar (T5 `.bigact`). Pemakai: Export & Import.
'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { IconTile, type TileTone } from './IconTile';
import type { AnyIcon } from './icons';

export function ActionGrid({ children }: { children: ReactNode }) {
  return <div className="wp-g2x">{children}</div>;
}

export interface ActionCardProps {
  icon: AnyIcon;
  title: string;
  description?: string;
  tone?: TileTone;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ActionCard({ icon, title, description, tone = 'accent', onClick, disabled, className }: ActionCardProps) {
  return (
    <button
      type="button"
      className={clsx('wp-card wp-bigact', className)}
      disabled={disabled}
      onClick={onClick}
    >
      <IconTile icon={icon} tone={tone} size="sm" />
      <b>{title}</b>
      {description && <span className="wp-t-cap">{description}</span>}
    </button>
  );
}

export default ActionCard;
