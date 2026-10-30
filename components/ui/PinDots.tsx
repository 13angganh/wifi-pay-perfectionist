// components/ui/PinDots.tsx — titik progres PIN (T5 `.pdots`)
// Hanya tampilan: `filled` = jumlah digit terisi. `shake` untuk PIN salah (dihormati reduced-motion).
'use client';

import { clsx } from 'clsx';

export interface PinDotsProps {
  length?: number;
  filled: number;
  shake?: boolean;
  small?: boolean;
  /** nama aksesibel, mis. "3 dari 6 digit terisi" (dikirim pemanggil, sudah di-i18n) */
  label?: string;
}

export function PinDots({ length = 6, filled, shake, small, label }: PinDotsProps) {
  return (
    <div
      className={clsx('wp-pdots', small && 'wp-pdots--sm', shake && 'wp-pdots--shake')}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length }, (_, i) => <i key={i} className={i < filled ? 'on' : undefined} />)}
    </div>
  );
}

export default PinDots;
