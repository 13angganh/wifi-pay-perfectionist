// components/ui/Spinner.tsx — indikator putar kecil (menggantikan .spin4 prototype)
'use client';

import { clsx } from 'clsx';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      className={clsx('wp-spinner', className)}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

export default Spinner;
