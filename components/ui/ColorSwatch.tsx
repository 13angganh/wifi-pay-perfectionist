// components/ui/ColorSwatch.tsx — pilihan warna bulat (T5 `.swt`). Pemakai: Pengaturan > Zona.
'use client';

import { Check } from '@phosphor-icons/react';
import { clsx } from 'clsx';

export interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onSelect: (color: string) => void;
  /** nama aksesibel, mis. "Ungu" atau "#8B5CF6" */
  label: string;
}

export function ColorSwatch({ color, selected, onSelect, label }: ColorSwatchProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      aria-label={label}
      className={clsx('wp-swt', selected && 'wp-swt--on')}
      style={{ background: color }}
      onClick={() => onSelect(color)}
    >
      {selected && <Check size="1em" weight="bold" aria-hidden="true" />}
    </button>
  );
}

export default ColorSwatch;
