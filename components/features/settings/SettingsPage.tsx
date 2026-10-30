// ══════════════════════════════════════════
// components/features/settings/SettingsPage.tsx — kerangka halaman isi Pengaturan (drill-down, REDESAIN T10, D2)
// Judul + tombol kembali di atas isi halaman. Isi = komponen seksi lama (logika zip utuh) dalam kartu-kartu.
// ══════════════════════════════════════════
'use client';

import { ArrowLeft } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useT } from '@/hooks/useT';
import { IconButton } from '@/components/ui/IconButton';
import s from './settings.module.css';

export default function SettingsPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <div className={s.page}>
      <div className={s.pageHead}>
        <IconButton icon={ArrowLeft} label={t('settings.back')} onClick={onBack} />
        <h2 className={s.pageTitle}>{title}</h2>
      </div>
      <div className={s.pageBody}>{children}</div>
    </div>
  );
}
