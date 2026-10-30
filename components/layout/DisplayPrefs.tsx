// ══════════════════════════════════════════
// components/layout/DisplayPrefs.tsx — pemilih Mode Navigasi (A1) + Posisi Toast (A2)
// Dibuat di T6 bersama mekanisme shell-nya (store uiSlice + AppShell + Toast) supaya bisa diuji.
// Satu-satunya entri UI ada di Pengaturan > Tampilan: T10 cukup memasang <NavModePicker/> dan
// <ToastPositionPicker/> di SettingsAppSection (TIDAK ditempatkan di tempat lain, tanpa duplikasi).
// ══════════════════════════════════════════
'use client';

import { DeviceMobile, SidebarSimple, ArrowLineUp, ArrowLineDown, TextAa } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { ChoiceRows } from '@/components/ui/ListRow';
import type { NavMode, TextSize, ToastPosition } from '@/store/slices/uiSlice';

export function NavModePicker() {
  const t = useT();
  const navMode = useAppStore(s => s.navMode);
  const setNavMode = useAppStore(s => s.setNavMode);
  return (
    <ChoiceRows<NavMode>
      label={t('display.navMode')}
      value={navMode}
      onChange={setNavMode}
      options={[
        { value: 'bottom',  title: t('display.navBottom'),  description: t('display.navBottomDesc'),  icon: DeviceMobile  },
        { value: 'sidebar', title: t('display.navSidebar'), description: t('display.navSidebarDesc'), icon: SidebarSimple },
      ]}
    />
  );
}

export function ToastPositionPicker() {
  const t = useT();
  const toastPosition = useAppStore(s => s.toastPosition);
  const setToastPosition = useAppStore(s => s.setToastPosition);
  return (
    <ChoiceRows<ToastPosition>
      label={t('display.toastPos')}
      value={toastPosition}
      onChange={setToastPosition}
      options={[
        { value: 'top',    title: t('display.toastTop'),    description: t('display.toastTopDesc'),    icon: ArrowLineUp   },
        { value: 'bottom', title: t('display.toastBottom'), description: t('display.toastBottomDesc'), icon: ArrowLineDown },
      ]}
    />
  );
}

export function TextSizePicker() {
  const t = useT();
  const textSize = useAppStore(s => s.textSize);
  const setTextSize = useAppStore(s => s.setTextSize);
  return (
    <ChoiceRows<TextSize>
      label={t('display.textSize')}
      value={textSize}
      onChange={setTextSize}
      options={[
        { value: 'normal', title: t('display.textNormal'), description: t('display.textNormalDesc'), icon: TextAa },
        { value: 'large',  title: t('display.textLarge'),  description: t('display.textLargeDesc'),  icon: TextAa },
      ]}
    />
  );
}
