// components/features/settings/SettingsView.tsx — Fase 3: assembler only
// SettingsView hanya merakit section-section yang sudah dipecah
'use client';

import { Settings } from 'lucide-react';
import { useT } from '@/hooks/useT';
import SettingsPinSection    from './SettingsPinSection';
import SettingsZoneSection   from './SettingsZoneSection';
import SettingsTarifSection  from './SettingsTarifSection';
import SettingsAppSection    from './SettingsAppSection';

export default function SettingsView() {
  const t = useT();

  return (
    <div>
      <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:'var(--fs-display)', marginBottom:16, color:'var(--txt)', display:'flex', alignItems:'center', gap:8 }}>
        <Settings size={18} strokeWidth={1.5} /> {t('settings.pageTitle')}
      </div>

      {/* KRITIS: PIN Security */}
      <SettingsPinSection />

      {/* KRITIS: Zona Management */}
      <SettingsZoneSection />

      {/* PREFERENSI: Export, Share, Quick Pay */}
      <SettingsTarifSection />

      {/* PREFERENSI: Bahasa, Tanggal, App Info */}
      <SettingsAppSection />
    </div>
  );
}
