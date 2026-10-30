// ══════════════════════════════════════════
// components/features/settings/SettingsAppSection.tsx — Tampilan + Tanggal Bayar Otomatis + Info Aplikasi (REDESAIN T10)
// Seksi: 'theme' | 'nav' (A1) | 'toast' (A2) | 'language' | 'autodate' | 'info'. Logika zip utuh:
// setTheme/updateSettings({language}/{autoDate}) + toast konfirmasi. Pemilih Mode Navigasi/Posisi Toast = satu-satunya
// entri di app (DisplayPrefs, T6). Tema/Bahasa/Tanggal Otomatis = pilihan tunggal ChoiceRows.
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { Crown, Moon, Sun, Translate, CalendarCheck, HandPointing } from '@phosphor-icons/react';
import { showToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { AppLogo } from '@/components/ui/AppLogo';
import { ChoiceRows } from '@/components/ui/ListRow';
import { NavModePicker, TextSizePicker, ToastPositionPicker } from '@/components/layout/DisplayPrefs';
import type { ThemeMode } from '@/store/slices/uiSlice';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';
import s from './settings.module.css';

export type AppSectionKey = 'theme' | 'textsize' | 'nav' | 'toast' | 'language' | 'autodate' | 'info';

export default function SettingsAppSection({ section }: { section: AppSectionKey }) {
  const { settings, updateSettings, theme, setTheme } = useAppStore();
  const t = useT();

  if (section === 'textsize') return <Card className={s.card}><TextSizePicker /></Card>;
  if (section === 'nav') return <Card className={s.card}><NavModePicker /></Card>;
  if (section === 'toast') return <Card className={s.card}><ToastPositionPicker /></Card>;

  if (section === 'theme') {
    return (
      <Card className={s.card}>
        <ChoiceRows<ThemeMode>
          label={t('settings.theme')}
          value={theme}
          onChange={mode => { setTheme(mode); showToast(t(`header.themeToast.${mode}`)); }}
          options={[
            { value: 'light', title: t('settings.theme.light'), description: t('settings.theme.lightDesc'), icon: Sun },
            { value: 'dark',  title: t('settings.theme.dark'),  description: t('settings.theme.darkDesc'),  icon: Moon },
            { value: 'gold',  title: t('settings.theme.gold'),  description: t('settings.theme.goldDesc'),  icon: Crown, tone: 'gold' },
          ]}
        />
      </Card>
    );
  }

  if (section === 'language') {
    const lang = settings.language === 'en' ? 'en' : 'id';
    return (
      <Card className={s.card}>
        <ChoiceRows<'id' | 'en'>
          label={t('settings.language')}
          value={lang}
          onChange={v => {
            updateSettings({ ...settings, language: v });
            showToast(t(v === 'en' ? 'settings.langToastEn' : 'settings.langToastId'));
          }}
          options={[
            { value: 'id', title: 'Indonesia', icon: Translate },
            { value: 'en', title: 'English', icon: Translate },
          ]}
        />
      </Card>
    );
  }

  if (section === 'autodate') {
    const auto = settings.autoDate === true;
    return (
      <Card className={s.card}>
        <ChoiceRows<'auto' | 'manual'>
          label={t('settings.autoDate')}
          value={auto ? 'auto' : 'manual'}
          onChange={v => {
            updateSettings({ autoDate: v === 'auto' });
            showToast(t(v === 'auto' ? 'settings.autoDate.toastAuto' : 'settings.autoDate.toastManual'));
          }}
          options={[
            { value: 'auto',   title: t('settings.autoDate.auto'),   description: t('settings.autoDate.descAuto'),   icon: CalendarCheck },
            { value: 'manual', title: t('settings.autoDate.manual'), description: t('settings.autoDate.descManual'), icon: HandPointing },
          ]}
        />
        <p className={s.capSm}>{auto ? t('settings.autoDate.noteAutoAll') : t('settings.autoDate.noteManualAll')}</p>
      </Card>
    );
  }

  // info — kartu logo, versi, Firebase, Server (nilai tetap dari zip)
  return (
    <Card className={s.ibox}>
      <div className={s.ibh}>
        <AppLogo size="l" />
        <div>
          <b className="wp-t-head">{APP_NAME}</b>
          <div className={s.cap}>{t('settings.version')} {APP_VERSION_FULL}</div>
        </div>
      </div>
      <div className={s.ibr}><span>Firebase</span><b>wifi-pay-online</b></div>
      <div className={s.ibr}><span>Server</span><b>Singapore</b></div>
    </Card>
  );
}
