// ══════════════════════════════════════════
// components/features/settings/SettingsView.tsx — layar Pengaturan, DUA LEVEL (REDESAIN T10, prototype T5, D1/D2/D3/D16)
//
// Level 1 = 6 grup yang bisa dilipat (default TERTUTUP, perilaku zip): Akun, Keamanan, Manajemen, Data, Tampilan,
// Info Aplikasi (kartu tanpa baris). Level 2 = baris berlencana status yang membuka HALAMAN ISI (drill-down) berisi
// seksi dengan logika zip utuh. Pemetaan nama (A8): Akun Saya = Email & Reset Password, Akun Penagih = kelola penagih,
// Export & Import Data. Tampilan memuat Tema, Mode Navigasi (A1), Posisi Toast (A2), Bahasa. Badge status memakai
// token: hijau (var(--c-lunas)) saat aktif, redup saat nonaktif. Log/Operasional/Pengaturan TIDAK dikunci kunci global (D15).
// ══════════════════════════════════════════
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  AlignTopSimple, CalendarCheck, Database, DeviceMobile, Envelope, Export, Fingerprint, Info, Lightning, LockKey,
  MapTrifold, Network, Palette, ShieldCheck, Sun, SquaresFour, TextAa, Translate, UserCircle, UserPlus, WhatsappLogo,
} from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/store/useAppStore';
import { CollapsibleBody, CollapsibleGroupHeader } from '@/components/ui/CollapsibleGroupHeader';
import { RowGroup } from '@/components/ui/ListRow';
import type { AnyIcon } from '@/components/ui/icons';
import type { TileTone } from '@/components/ui/IconTile';
import SettingsPinSection from './SettingsPinSection';
import SettingsBiometricSection from './SettingsBiometricSection';
import SettingsEmailSection from './SettingsEmailSection';
import SettingsZoneSection from './SettingsZoneSection';
import SettingsTarifSection from './SettingsTarifSection';
import SettingsAppSection from './SettingsAppSection';
import SettingsIPSection from './SettingsIPSection';
import SettingsTenantSection from './SettingsTenantSection';
import SettingsRow from './SettingsRow';
import SettingsPage from './SettingsPage';
import { SETTINGS_PAGE_EVENT, takePendingSettingsPage, type SettingsPageKey } from './settingsBridge';
import { allZoneKeys } from './settings.logic';
import s from './settings.module.css';

type GroupId = 'account' | 'security' | 'management' | 'data' | 'appearance' | 'info';

export default function SettingsView() {
  const t = useT();
  const { settings, theme, navMode, toastPosition, textSize } = useAppStore();
  const [open, setOpen] = useState<Record<GroupId, boolean>>({ account: false, security: false, management: false, data: false, appearance: false, info: false });
  const [page, setPage] = useState<SettingsPageKey | null>(null);

  // Pusat Notifikasi → halaman tertentu (permintaan tertunda saat dibuka + event saat sudah terbuka)
  useEffect(() => {
    const take = () => { const k = takePendingSettingsPage(); if (k) setPage(k); };
    take();
    window.addEventListener(SETTINGS_PAGE_EVENT, take);
    return () => window.removeEventListener(SETTINGS_PAGE_EVENT, take);
  }, []);

  const toggle = (id: GroupId) => setOpen(o => ({ ...o, [id]: !o[id] }));
  const on = (v: boolean | undefined) => !!v;
  const activeBadge = (v: boolean | undefined) => (on(v) ? t('common.active') : t('common.inactive'));
  const activeColor = (v: boolean | undefined) => (on(v) ? 'var(--c-lunas)' : 'var(--txt4)');

  const titles: Record<SettingsPageKey, string> = {
    email: t('settings.emailSectionTitle'), tenant: t('settings.tenant.sectionTitle'),
    pin: t('settings.pinSectionTitle'), bio: t('settings.biometricSectionTitle'),
    zone: t('settings.zones'), ip: t('settings.ipSectionTitle'), quick: t('settings.quickPaySectionTitle'),
    autodate: t('settings.autoDateSectionTitle'), export: t('settings.export'), wa: t('settings.waSummaryTitle'),
    theme: t('settings.theme'), textsize: t('display.textSize'), nav: t('display.navMode'), toast: t('display.toastPos'), lang: t('settings.language'),
  };
  const pages: Record<SettingsPageKey, ReactNode> = {
    email: <SettingsEmailSection />, tenant: <SettingsTenantSection />,
    pin: <SettingsPinSection />, bio: <SettingsBiometricSection />,
    zone: <SettingsZoneSection />, ip: <SettingsIPSection />,
    quick: <SettingsTarifSection section="quickpay" />, autodate: <SettingsAppSection section="autodate" />,
    export: <SettingsTarifSection section="export" />, wa: <SettingsTarifSection section="wa" />,
    theme: <SettingsAppSection section="theme" />, textsize: <SettingsAppSection section="textsize" />, nav: <SettingsAppSection section="nav" />,
    toast: <SettingsAppSection section="toast" />, lang: <SettingsAppSection section="language" />,
  };

  if (page) {
    return <SettingsPage title={titles[page]} onBack={() => setPage(null)} key={page}>{pages[page]}</SettingsPage>;
  }

  const themeLabel = theme === 'light' ? t('settings.theme.light') : theme === 'gold' ? t('settings.theme.gold') : t('settings.theme.dark');
  const row = (key: SettingsPageKey, icon: AnyIcon, tone: TileTone, extra?: { badge?: string | number; badgeColor?: string; description?: string; title?: string }) => (
    <SettingsRow key={key} icon={icon} tone={tone} title={titles[key]} onOpen={() => setPage(key)} {...extra} />
  );
  const group = (id: GroupId, title: string, icon: AnyIcon, tone: TileTone, count: number | undefined, body: ReactNode) => (
    <section key={id} className={s.group}>
      <CollapsibleGroupHeader title={title} open={open[id]} onToggle={() => toggle(id)} controlsId={`gb-${id}`} icon={icon} tone={tone} count={count} />
      <CollapsibleBody id={`gb-${id}`} open={open[id]}>{body}</CollapsibleBody>
    </section>
  );

  return (
    <div className={s.root}>
      <div className={s.groups}>
        {group('account', t('settings.group.account'), UserCircle, 'blue', 2,
          <RowGroup>
            {row('email', Envelope, 'blue', { title: t('settings.group.accountMine'), description: titles.email })}
            {row('tenant', UserPlus, 'teal', { title: t('settings.group.accountTenant'), description: titles.tenant })}
          </RowGroup>)}

        {group('security', t('settings.group.security'), ShieldCheck, 'lunas', 2,
          <RowGroup>
            {row('pin', LockKey, 'orange', { badge: activeBadge(settings.pinEnabled), badgeColor: activeColor(settings.pinEnabled) })}
            {row('bio', Fingerprint, 'purple', { badge: activeBadge(settings.biometricEnabled), badgeColor: activeColor(settings.biometricEnabled) })}
          </RowGroup>)}

        {group('management', t('settings.group.management'), SquaresFour, 'purple', 4,
          <RowGroup>
            {row('zone', MapTrifold, 'teal', { badge: allZoneKeys(settings).length })}
            {row('ip', Network, 'blue')}
            {row('quick', Lightning, 'orange')}
            {row('autodate', CalendarCheck, 'lunas', {
              badge: settings.autoDate ? t('settings.autoDateBadgeAuto') : t('settings.autoDateBadgeManual'),
              badgeColor: activeColor(settings.autoDate),
            })}
          </RowGroup>)}

        {group('data', t('settings.group.data'), Database, 'slate', 2,
          <RowGroup>{row('export', Export, 'blue')}{row('wa', WhatsappLogo, 'lunas')}</RowGroup>)}

        {group('appearance', t('settings.group.appearance'), Palette, 'orange', 5,
          <RowGroup>
            <SettingsRow icon={Sun} tone="orange" title={titles.theme} description={t('settings.themeDesc')} badge={themeLabel} badgeColor="var(--c-lunas)" onOpen={() => setPage('theme')} />
            {row('textsize', TextAa, 'teal', { badge: textSize === 'large' ? t('display.textLarge') : t('display.textNormal'), description: t('settings.textSizeDesc') })}
            {row('nav', DeviceMobile, 'blue', { badge: navMode === 'sidebar' ? t('display.navSidebar') : t('display.navBottom'), description: t('settings.navModeDesc') })}
            {row('toast', AlignTopSimple, 'purple', { badge: toastPosition === 'bottom' ? t('display.toastBottom') : t('display.toastTop'), description: t('settings.toastPosDesc') })}
            <SettingsRow icon={Translate} tone="teal" title={titles.lang} description={t('settings.languageDesc')} badge={settings.language === 'en' ? t('settings.languageBadgeEn') : t('settings.languageBadgeId')} badgeColor="var(--c-lunas)" onOpen={() => setPage('lang')} />
          </RowGroup>)}

        {group('info', t('settings.appInfo'), Info, 'slate', undefined, <SettingsAppSection section="info" />)}
      </div>
    </div>
  );
}
