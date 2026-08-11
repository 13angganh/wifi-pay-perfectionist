// components/features/settings/SettingsView.tsx
'use client';

import { Settings, Shield, Fingerprint, Mail, Map, ArrowUpDown, MessageCircle, Zap, Sun, Globe, Calendar, Info, Network } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/store/useAppStore';
import SettingsPinSection      from './SettingsPinSection';
import SettingsBiometricSection from './SettingsBiometricSection';
import SettingsEmailSection     from './SettingsEmailSection';
import SettingsZoneSection      from './SettingsZoneSection';
import SettingsTarifSection     from './SettingsTarifSection';
import SettingsAppSection       from './SettingsAppSection';
import SettingsIPSection        from './SettingsIPSection';
import CollapsibleSection       from './CollapsibleSection';

export default function SettingsView() {
  const t      = useT();
  const { settings, theme } = useAppStore();

  return (
    <div>
      <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:'var(--fs-display)', marginBottom:16, color:'var(--txt)', display:'flex', alignItems:'center', gap:8 }}>
        <Settings size={18} strokeWidth={1.5} /> {t('settings.pageTitle')}
      </div>

      {/* PIN Keamanan */}
      <CollapsibleSection
        title={t('settings.pinSectionTitle')}
        icon={<Shield size={16} strokeWidth={1.5} />}
        badge={settings.pinEnabled ? t('common.active') : t('common.inactive')}
        badgeColor={settings.pinEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsPinSection />
      </CollapsibleSection>

      {/* Sidik Jari & Face ID */}
      <CollapsibleSection
        title={t('settings.biometricSectionTitle')}
        icon={<Fingerprint size={16} strokeWidth={1.5} />}
        badge={settings.biometricEnabled ? t('common.active') : t('common.inactive')}
        badgeColor={settings.biometricEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsBiometricSection />
      </CollapsibleSection>

      {/* Email & Password */}
      <CollapsibleSection
        title={t('settings.emailSectionTitle')}
        icon={<Mail size={16} strokeWidth={1.5} />}
      >
        <SettingsEmailSection />
      </CollapsibleSection>

      {/* Manajemen Zona */}
      <CollapsibleSection
        title={t('settings.zones')}
        icon={<Map size={16} strokeWidth={1.5} />}
      >
        <SettingsZoneSection />
      </CollapsibleSection>

      {/* Konversi IP — v11.5: dipindah dari menu Members, kini fleksibel (bukan hanya oktet ke-2) */}
      <CollapsibleSection
        title={t('settings.ipSectionTitle')}
        icon={<Network size={16} strokeWidth={1.5} />}
      >
        <SettingsIPSection />
      </CollapsibleSection>

      {/* v11.5.14: Export & Import Data — hanya komponen ExportSection dari SettingsTarifSection.
          Judul digabung (dulu "Export Data") supaya header collapsed jujur mencerminkan isinya —
          sebelumnya Import ada di dalam tapi tidak terlihat dari nama section sebelum di-expand. */}
      <CollapsibleSection
        title={t('settings.export')}
        icon={<ArrowUpDown size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="export" />
      </CollapsibleSection>

      {/* Ringkasan WhatsApp */}
      <CollapsibleSection
        title={t('settings.waSummaryTitle')}
        icon={<MessageCircle size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="wa" />
      </CollapsibleSection>

      {/* Quick Pay */}
      <CollapsibleSection
        title={t('settings.quickPaySectionTitle')}
        icon={<Zap size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="quickpay" />
      </CollapsibleSection>

      {/* Tema Tampilan */}
      <CollapsibleSection
        title={t('settings.theme')}
        icon={<Sun size={16} strokeWidth={1.5} />}
        badge={theme === 'light' ? t('settings.theme.light') : theme === 'gold' ? t('settings.theme.gold') : t('settings.theme.dark')}
        badgeColor="var(--c-lunas)"
      >
        <SettingsAppSection section="theme" />
      </CollapsibleSection>

      {/* Bahasa */}
      <CollapsibleSection
        title={t('settings.language')}
        icon={<Globe size={16} strokeWidth={1.5} />}
        badge={settings.language === 'en' ? t('settings.languageBadgeEn') : t('settings.languageBadgeId')}
        badgeColor="var(--c-lunas)"
      >
        <SettingsAppSection section="language" />
      </CollapsibleSection>

      {/* Tanggal Otomatis */}
      <CollapsibleSection
        title={t('settings.autoDateSectionTitle')}
        icon={<Calendar size={16} strokeWidth={1.5} />}
        badge={settings.autoDate ? t('settings.autoDateBadgeAuto') : t('settings.autoDateBadgeManual')}
        badgeColor={settings.autoDate ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsAppSection section="autodate" />
      </CollapsibleSection>

      {/* Info Aplikasi */}
      <CollapsibleSection
        title={t('settings.appInfo')}
        icon={<Info size={16} strokeWidth={1.5} />}
      >
        <SettingsAppSection section="info" />
      </CollapsibleSection>
    </div>
  );
}
