// components/features/settings/SettingsView.tsx — Fase 3: assembler only
// SettingsView hanya merakit section-section yang sudah dipecah
'use client';

import { Settings, Shield, Fingerprint, Mail, Map, Tag, Sliders } from 'lucide-react';
import { useT } from '@/hooks/useT';
import SettingsPinSection      from './SettingsPinSection';
import SettingsBiometricSection from './SettingsBiometricSection';
import SettingsEmailSection      from './SettingsEmailSection';
import SettingsZoneSection      from './SettingsZoneSection';
import SettingsTarifSection     from './SettingsTarifSection';
import SettingsAppSection       from './SettingsAppSection';
import CollapsibleSection       from './CollapsibleSection';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsView() {
  const t = useT();

  const { settings } = useAppStore();

  return (
    <div>
      <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:'var(--fs-display)', marginBottom:16, color:'var(--txt)', display:'flex', alignItems:'center', gap:8 }}>
        <Settings size={18} strokeWidth={1.5} /> {t('settings.pageTitle')}
      </div>

      {/* PIN Security */}
      <CollapsibleSection
        title="PIN Keamanan"
        icon={<Shield size={16} strokeWidth={1.5} />}
        badge={settings.pinEnabled ? 'Aktif' : 'Nonaktif'}
        badgeColor={settings.pinEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
        defaultOpen={false}
      >
        <SettingsPinSection />
      </CollapsibleSection>

      {/* Biometrik */}
      <CollapsibleSection
        title="Sidik Jari & Face ID"
        icon={<Fingerprint size={16} strokeWidth={1.5} />}
        badge={settings.biometricEnabled ? 'Aktif' : 'Nonaktif'}
        badgeColor={settings.biometricEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
        defaultOpen={false}
      >
        <SettingsBiometricSection />
      </CollapsibleSection>

      {/* Ubah Email */}
      <CollapsibleSection
        title="Ubah Email Akun"
        icon={<Mail size={16} strokeWidth={1.5} />}
        defaultOpen={false}
      >
        <SettingsEmailSection />
      </CollapsibleSection>

      {/* Manajemen Zona */}
      <CollapsibleSection
        title="Manajemen Zona"
        icon={<Map size={16} strokeWidth={1.5} />}
        defaultOpen={false}
      >
        <SettingsZoneSection />
      </CollapsibleSection>

      {/* Tarif & Quick Pay */}
      <CollapsibleSection
        title="Tarif & Quick Pay"
        icon={<Tag size={16} strokeWidth={1.5} />}
        defaultOpen={false}
      >
        <SettingsTarifSection />
      </CollapsibleSection>

      {/* Preferensi Aplikasi */}
      <CollapsibleSection
        title="Preferensi Aplikasi"
        icon={<Sliders size={16} strokeWidth={1.5} />}
        defaultOpen={false}
      >
        <SettingsAppSection />
      </CollapsibleSection>
    </div>
  );
}
