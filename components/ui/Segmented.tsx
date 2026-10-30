// components/ui/Segmented.tsx — kontrol segmen (CORE usulan T3 `.sg`)
// Dipakai: mode Tunggakan, segmen zona Member, tab Grafik/Log/Operasional.
// mode 'filter' (default): tombol aria-pressed. mode 'tabs': role tablist + aria-selected.
'use client';

import { clsx } from 'clsx';
import type { CSSProperties, ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** angka kecil di sebelah label (mis. jumlah) */
  count?: number | string;
  /** warna segmen aktif (mis. warna zona); default = aksen tema */
  color?: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  mode?: 'filter' | 'tabs';
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel, mode = 'filter', className }: SegmentedProps<T>) {
  const tabs = mode === 'tabs';
  return (
    <div className={clsx('wp-sg', className)} role={tabs ? 'tablist' : 'group'} aria-label={ariaLabel}>
      {options.map(o => {
        const on = o.value === value;
        const style = on && o.color ? ({ ['--sc' as string]: o.color } as CSSProperties) : undefined;
        return (
          <button
            key={o.value}
            type="button"
            role={tabs ? 'tab' : undefined}
            aria-selected={tabs ? on : undefined}
            aria-pressed={tabs ? undefined : on}
            disabled={o.disabled}
            style={style}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.count !== undefined && <span className="wp-sg__c">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
