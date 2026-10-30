// ══════════════════════════════════════════
// app/(app)/error.tsx — halaman galat rute (REDESAIN T11: primitive + Phosphor + i18n; perilaku zip utuh)
// Pesan error asli tetap ditampilkan (operator tunggal butuh detailnya); Coba Lagi = reset(); Dashboard = router.push.
// ══════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowCounterClockwise, House, WarningCircle } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import s from './boundary.module.css';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    console.error('[WiFi-Pay Error]', error);
  }, [error]);

  return (
    <div className={s.wrap}>
      <EmptyState
        size="lg"
        icon={WarningCircle}
        title={t('errorpage.title')}
        description={error.message || t('errorpage.desc')}
        action={(
          <div className={s.actions}>
            <Button variant="secondary" onClick={reset}>
              <ArrowCounterClockwise aria-hidden="true" /> {t('common.retry')}
            </Button>
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              <House aria-hidden="true" /> {t('nav.dashboard')}
            </Button>
          </div>
        )}
      />
    </div>
  );
}
