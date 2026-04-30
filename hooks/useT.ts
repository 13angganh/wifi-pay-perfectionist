// hooks/useT.ts — v11.2: hook translator reactive dari Zustand settings
// Pakai ini di komponen: const t = useT();  lalu: t('nav.dashboard')
'use client';

import { useAppStore } from '@/store/useAppStore';
import { createTranslator } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

export function useT() {
  const lang = (useAppStore(s => s.settings.language) ?? 'id') as Language;
  return createTranslator(lang);
}
