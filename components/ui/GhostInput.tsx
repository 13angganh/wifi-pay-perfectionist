// components/ui/GhostInput.tsx — input tanpa bingkai untuk edit di tempat (T5 `.gin/.nomw`)
// Pemakai: Operasional (nama + nominal item). `numeric` = rata kanan, mono, tanpa spinner.
'use client';

import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface GhostInputProps extends InputHTMLAttributes<HTMLInputElement> {
  numeric?: boolean;
  /** nama aksesibel (wajib: tidak ada label visual) */
  'aria-label': string;
}

const GhostInput = forwardRef<HTMLInputElement, GhostInputProps>(
  ({ numeric, className, ...props }, ref) => (
    <input ref={ref} className={clsx('wp-gin', numeric && 'wp-gin--nm', className)} {...props} />
  )
);
GhostInput.displayName = 'GhostInput';

/** Pembungkus nominal: awalan (mis. "Rp") + input + akhiran (mis. ".000"). */
export function NominalWrap({ prefix, suffix, children }: { prefix?: ReactNode; suffix?: ReactNode; children: ReactNode }) {
  return <span className="wp-nomw">{prefix}{children}{suffix}</span>;
}

export { GhostInput };
export default GhostInput;
