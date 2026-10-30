// components/ui/Notice.tsx — banner info sukses/peringatan/bahaya/info (T5 `.okn5/.warn5`)
'use client';

import { CheckCircle, Info, Warning, WarningOctagon } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { AnyIcon } from './icons';

export type NoticeTone = 'ok' | 'warn' | 'bad' | 'info';

const DEFAULT_ICON: Record<NoticeTone, AnyIcon> = {
  ok: CheckCircle, warn: Warning, bad: WarningOctagon, info: Info,
};

export function Notice({ tone = 'ok', icon, children, className }: { tone?: NoticeTone; icon?: AnyIcon; children: ReactNode; className?: string }) {
  const Icon = icon ?? DEFAULT_ICON[tone];
  return (
    <div
      className={clsx('wp-notice', tone !== 'ok' && `wp-notice--${tone}`, className)}
      role={tone === 'bad' || tone === 'warn' ? 'alert' : 'status'}
    >
      <Icon size="1em" weight="fill" aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default Notice;
