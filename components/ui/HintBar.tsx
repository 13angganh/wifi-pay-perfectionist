// components/ui/HintBar.tsx — bilah petunjuk (.hint), mis. petunjuk scroll tabel Rekap
'use client';

import { Info } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import type { AnyIcon } from './icons';

export function HintBar({ icon: Icon = Info, children, action }: { icon?: AnyIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="wp-hint" role="note">
      <Icon size={16} weight="fill" aria-hidden="true" />
      <span>{children}</span>
      {action}
    </div>
  );
}

export default HintBar;
