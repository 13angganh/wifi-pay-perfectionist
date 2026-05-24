// components/features/settings/SettingsView.tsx
'use client';

import { Settings, Shield, Fingerprint, Mail, Map, Download, MessageCircle, Zap, Sun, Globe, Calendar, Info } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/store/useAppStore';
import SettingsPinSection      from './SettingsPinSection';
import SettingsBiometricSection from './SettingsBiometricSection';
import SettingsEmailSection     from './SettingsEmailSection';
import SettingsZoneSection      from './SettingsZoneSection';
import SettingsTarifSection     from './SettingsTarifSection';
import SettingsAppSection       from './SettingsAppSection';
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
        title="PIN Keamanan"
        icon={<Shield size={16} strokeWidth={1.5} />}
        badge={settings.pinEnabled ? 'Aktif' : 'Nonaktif'}
        badgeColor={settings.pinEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsPinSection />
      </CollapsibleSection>

      {/* Sidik Jari & Face ID */}
      <CollapsibleSection
        title="Sidik Jari & Face ID"
        icon={<Fingerprint size={16} strokeWidth={1.5} />}
        badge={settings.biometricEnabled ? 'Aktif' : 'Nonaktif'}
        badgeColor={settings.biometricEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsBiometricSection />
      </CollapsibleSection>

      {/* Email & Password */}
      <CollapsibleSection
        title="Email & Reset Password"
        icon={<Mail size={16} strokeWidth={1.5} />}
      >
        <SettingsEmailSection />
      </CollapsibleSection>

      {/* Manajemen Zona */}
      <CollapsibleSection
        title="Manajemen Zona"
        icon={<Map size={16} strokeWidth={1.5} />}
      >
        <SettingsZoneSection />
      </CollapsibleSection>

      {/* Export Data — hanya komponen ExportSection dari SettingsTarifSection */}
      <CollapsibleSection
        title="Export Data"
        icon={<Download size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="export" />
      </CollapsibleSection>

      {/* Ringkasan WhatsApp */}
      <CollapsibleSection
        title="Ringkasan WhatsApp"
        icon={<MessageCircle size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="wa" />
      </CollapsibleSection>

      {/* Quick Pay */}
      <CollapsibleSection
        title="Quick Pay"
        icon={<Zap size={16} strokeWidth={1.5} />}
      >
        <SettingsTarifSection section="quickpay" />
      </CollapsibleSection>

      {/* Tema Tampilan */}
      <CollapsibleSection
        title="Tema Tampilan"
        icon={<Sun size={16} strokeWidth={1.5} />}
        badge={theme === 'light' ? 'Terang' : theme === 'gold' ? 'Emas' : 'Gelap'}
      >
        <SettingsAppSection section="theme" />
      </CollapsibleSection>

      {/* Bahasa */}
      <CollapsibleSection
        title="Bahasa"
        icon={<Globe size={16} strokeWidth={1.5} />}
        badge={settings.language === 'en' ? 'English' : 'Indonesia'}
      >
        <SettingsAppSection section="language" />
      </CollapsibleSection>

      {/* Tanggal Otomatis */}
      <CollapsibleSection
        title="Tanggal Bayar Otomatis"
        icon={<Calendar size={16} strokeWidth={1.5} />}
        badge={settings.autoDate ? 'Otomatis' : 'Manual'}
        badgeColor={settings.autoDate ? 'var(--c-lunas)' : 'var(--txt4)'}
      >
        <SettingsAppSection section="autodate" />
      </CollapsibleSection>

      {/* Info Aplikasi */}
      <CollapsibleSection
        title="Info Aplikasi"
        icon={<Info size={16} strokeWidth={1.5} />}
      >
        <SettingsAppSection section="info" />
      </CollapsibleSection>
    </div>
  );
}
