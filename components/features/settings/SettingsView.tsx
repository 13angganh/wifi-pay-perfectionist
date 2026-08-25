// components/features/settings/SettingsView.tsx
// Restrukturisasi 2-level (sesi audit UI/UX setelah v11.6.1): 5 grup besar level 1
// (Akun, Keamanan, Manajemen, Data, Tampilan) via CollapsibleGroup, masing-masing
// berisi CollapsibleSection individual level 2 SAMA PERSIS seperti sebelumnya (badge
// status tetap di level 2 saja — TIDAK diringkas ulang di level 1 saat collapsed,
// sesuai keputusan user). Info Aplikasi BERDIRI SENDIRI di paling bawah, bukan
// collapsible sama sekali (kontennya sudah berupa kartu visual lengkap).
'use client';

import {
  Settings, User, KeySquare, SlidersHorizontal, Database, Palette,
  Shield, Fingerprint, Mail, Map, ArrowUpDown, MessageCircle, Zap, Sun, Globe, Calendar, Network, UserPlus,
} from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/store/useAppStore';
import SettingsPinSection      from './SettingsPinSection';
import SettingsBiometricSection from './SettingsBiometricSection';
import SettingsEmailSection     from './SettingsEmailSection';
import SettingsZoneSection      from './SettingsZoneSection';
import SettingsTarifSection     from './SettingsTarifSection';
import SettingsAppSection       from './SettingsAppSection';
import SettingsIPSection        from './SettingsIPSection';
import SettingsTenantSection    from './SettingsTenantSection';
import CollapsibleSection       from './CollapsibleSection';
import CollapsibleGroup         from './CollapsibleGroup';

export default function SettingsView() {
  const t      = useT();
  const { settings, theme } = useAppStore();

  return (
    <div>
      <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:'var(--fs-display)', marginBottom:16, color:'var(--txt)', display:'flex', alignItems:'center', gap:8 }}>
        <Settings size={18} strokeWidth={1.5} /> {t('settings.pageTitle')}
      </div>

      {/* ═══ Grup 1: Akun ═══ */}
      <CollapsibleGroup title={t('settings.group.account')} icon={<User size={18} strokeWidth={1.5} />}>
        {/* Sub-label "Akun Saya" — pemisah visual, BUKAN section tersendiri, supaya
            tidak tertukar dgn "Akun Penagih" di bawahnya (dua hal beda: atur akun
            sendiri vs bikin akun utk orang lain). */}
        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:'var(--fs-label)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--txt4)', padding:'4px 4px 6px' }}>
          {t('settings.group.accountMine')}
        </div>
        <CollapsibleSection
          title={t('settings.emailSectionTitle')}
          icon={<Mail size={16} strokeWidth={1.5} />}
        >
          <SettingsEmailSection />
        </CollapsibleSection>

        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:'var(--fs-label)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--txt4)', padding:'10px 4px 6px' }}>
          {t('settings.group.accountTenant')}
        </div>
        <CollapsibleSection
          title={t('settings.tenant.sectionTitle')}
          icon={<UserPlus size={16} strokeWidth={1.5} />}
        >
          <SettingsTenantSection />
        </CollapsibleSection>
      </CollapsibleGroup>

      {/* ═══ Grup 2: Keamanan ═══ */}
      <CollapsibleGroup title={t('settings.group.security')} icon={<KeySquare size={18} strokeWidth={1.5} />}>
        <CollapsibleSection
          title={t('settings.pinSectionTitle')}
          icon={<Shield size={16} strokeWidth={1.5} />}
          badge={settings.pinEnabled ? t('common.active') : t('common.inactive')}
          badgeColor={settings.pinEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
        >
          <SettingsPinSection />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('settings.biometricSectionTitle')}
          icon={<Fingerprint size={16} strokeWidth={1.5} />}
          badge={settings.biometricEnabled ? t('common.active') : t('common.inactive')}
          badgeColor={settings.biometricEnabled ? 'var(--c-lunas)' : 'var(--txt4)'}
        >
          <SettingsBiometricSection />
        </CollapsibleSection>
      </CollapsibleGroup>

      {/* ═══ Grup 3: Manajemen ═══ */}
      <CollapsibleGroup title={t('settings.group.management')} icon={<SlidersHorizontal size={18} strokeWidth={1.5} />}>
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

        <CollapsibleSection
          title={t('settings.quickPaySectionTitle')}
          icon={<Zap size={16} strokeWidth={1.5} />}
        >
          <SettingsTarifSection section="quickpay" />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('settings.autoDateSectionTitle')}
          icon={<Calendar size={16} strokeWidth={1.5} />}
          badge={settings.autoDate ? t('settings.autoDateBadgeAuto') : t('settings.autoDateBadgeManual')}
          badgeColor={settings.autoDate ? 'var(--c-lunas)' : 'var(--txt4)'}
        >
          <SettingsAppSection section="autodate" />
        </CollapsibleSection>
      </CollapsibleGroup>

      {/* ═══ Grup 4: Data ═══ */}
      <CollapsibleGroup title={t('settings.group.data')} icon={<Database size={18} strokeWidth={1.5} />}>
        {/* v11.5.14: Export & Import Data — hanya komponen ExportSection dari SettingsTarifSection.
            Judul digabung (dulu "Export Data") supaya header collapsed jujur mencerminkan isinya —
            sebelumnya Import ada di dalam tapi tidak terlihat dari nama section sebelum di-expand. */}
        <CollapsibleSection
          title={t('settings.export')}
          icon={<ArrowUpDown size={16} strokeWidth={1.5} />}
        >
          <SettingsTarifSection section="export" />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('settings.waSummaryTitle')}
          icon={<MessageCircle size={16} strokeWidth={1.5} />}
        >
          <SettingsTarifSection section="wa" />
        </CollapsibleSection>
      </CollapsibleGroup>

      {/* ═══ Grup 5: Tampilan ═══ */}
      <CollapsibleGroup title={t('settings.group.appearance')} icon={<Palette size={18} strokeWidth={1.5} />}>
        <CollapsibleSection
          title={t('settings.theme')}
          icon={<Sun size={16} strokeWidth={1.5} />}
          badge={theme === 'light' ? t('settings.theme.light') : theme === 'gold' ? t('settings.theme.gold') : t('settings.theme.dark')}
          badgeColor="var(--c-lunas)"
        >
          <SettingsAppSection section="theme" />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('settings.language')}
          icon={<Globe size={16} strokeWidth={1.5} />}
          badge={settings.language === 'en' ? t('settings.languageBadgeEn') : t('settings.languageBadgeId')}
          badgeColor="var(--c-lunas)"
        >
          <SettingsAppSection section="language" />
        </CollapsibleSection>
      </CollapsibleGroup>

      {/* ═══ Info Aplikasi — berdiri sendiri, BUKAN collapsible sama sekali ═══ */}
      <SettingsAppSection section="info" />
    </div>
  );
}
