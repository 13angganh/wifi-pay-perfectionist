// ══════════════════════════════════════════
// app/(app)/not-found.tsx — halaman 404 (REDESAIN T11: primitive + Phosphor + i18n; perilaku zip utuh)
// ══════════════════════════════════════════
'use client';

import Link from 'next/link';
import { House, MagnifyingGlass } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonVariants } from '@/components/ui/Button';
import s from './boundary.module.css';

export default function NotFound() {
  const t = useT();
  return (
    <div className={s.wrap}>
      <EmptyState
        size="lg"
        icon={MagnifyingGlass}
        title={t('notfound.title')}
        description={t('notfound.desc')}
        action={(
          <Link href="/dashboard" className={buttonVariants({ variant: 'primary' })}>
            <House aria-hidden="true" /> {t('notfound.toDashboard')}
          </Link>
        )}
      />
    </div>
  );
}
