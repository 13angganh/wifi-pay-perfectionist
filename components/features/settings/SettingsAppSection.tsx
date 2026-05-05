'use client';

import Image from 'next/image';
// components/features/settings/SettingsAppSection.tsx — Fase 4: 3-mode theme (Sun/Moon/Sparkles)
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { useT } from '@/hooks/useT';
import { Globe, Calendar, Check, Sun, Moon, Sparkles } from 'lucide-react';
import type { ThemeMode } from '@/store/slices/uiSlice';
import type React from 'react';

// ── ToggleChip top-level (task 4.11) ──
function ToggleChip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'8px', borderRadius:'var(--r-sm)',
      border:`1px solid ${active ? 'var(--zc)' : 'var(--border)'}`,
      background: active ? 'var(--zcdim)' : 'var(--bg3)',
      color: active ? 'var(--zc)' : 'var(--txt2)',
      cursor:'pointer', fontSize:12, fontWeight: active ? 600 : 400,
      transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
    }}>
      {active && <Check size={11} />}
      {label}
    </button>
  );
}

export default function SettingsAppSection() {
  const { settings, updateSettings, theme, setTheme } = useAppStore();
  const t = useT();

  const cardStyle: React.CSSProperties = {
    background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
    padding:16, marginBottom:10, boxShadow:'var(--shadow-xs)',
  };

  const themes: { key: ThemeMode; labelId: string; labelEn: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'light',
      labelId: t('settings.theme.light'),
      labelEn: 'Light',
      icon: <Sun size={14} strokeWidth={1.5} />,
      desc: t('settings.theme.lightDesc'),
    },
    {
      key: 'dark',
      labelId: t('settings.theme.dark'),
      labelEn: 'Dark',
      icon: <Moon size={14} strokeWidth={1.5} />,
      desc: t('settings.theme.darkDesc'),
    },
    {
      key: 'gold',
      labelId: t('settings.theme.gold'),
      labelEn: 'Gold',
      icon: <Sparkles size={14} strokeWidth={1.5} />,
      desc: t('settings.theme.goldDesc'),
    },
  ];

  function handleTheme(mode: ThemeMode) {
    setTheme(mode);
    const labels: Record<ThemeMode, string> = {
      light: settings.language === 'en' ? 'Light mode' : 'Mode Terang',
      dark:  settings.language === 'en' ? 'Dark mode'  : 'Mode Gelap',
      gold:  settings.language === 'en' ? 'Gold mode'  : 'Mode Emas',
    };
    showToast(labels[mode]);
  }

  return (
    <>
      {/* Tema */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}>
            {theme === 'light' ? <Sun size={16} strokeWidth={1.5} />
             : theme === 'gold' ? <Sparkles size={16} strokeWidth={1.5} />
             : <Moon size={16} strokeWidth={1.5} />}
          </div>
          <div>
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>
              {t('settings.theme')}
            </div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
              {themes.find(x => x.key === theme)?.desc}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {themes.map(th => (
            <button
              key={th.key}
              onClick={() => handleTheme(th.key)}
              style={{
                flex:1, padding:'10px 6px',
                borderRadius:'var(--r-sm)',
                border: theme === th.key
                  ? th.key === 'gold'
                    ? '1px solid rgba(201,149,42,0.6)'
                    : '1px solid var(--zc)'
                  : '1px solid var(--border)',
                background: theme === th.key
                  ? th.key === 'gold'
                    ? 'rgba(201,149,42,0.15)'
                    : 'var(--zcdim)'
                  : 'var(--bg3)',
                color: theme === th.key
                  ? th.key === 'gold'
                    ? '#C9952A'
                    : 'var(--zc)'
                  : 'var(--txt3)',
                cursor:'pointer',
                transition:'all var(--t-fast)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                fontFamily:"var(--font-sans),sans-serif",
                fontSize:11, fontWeight: theme === th.key ? 700 : 400,
              }}
            >
              {th.icon}
              {th.labelId}
            </button>
          ))}
        </div>
      </div>

      {/* Bahasa */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Globe size={16} strokeWidth={1.5} /></div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.language')}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <ToggleChip label="Indonesia" active={settings.language !== 'en'} onClick={() => { updateSettings({ ...settings, language: 'id' }); showToast('Bahasa: Indonesia'); }} />
          <ToggleChip label="English"   active={settings.language === 'en'} onClick={() => { updateSettings({ ...settings, language: 'en' }); showToast('Language: English'); }} />
        </div>
      </div>

      {/* Tanggal Bayar */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Calendar size={16} strokeWidth={1.5} /></div>
          <div>
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.autoDate')}</div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
              {settings.autoDate ? t('settings.autoDate.descAuto') : t('settings.autoDate.descManual')}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <ToggleChip label={t('settings.autoDate.auto')}   active={settings.autoDate === true}  onClick={() => { updateSettings({ autoDate: true });  showToast(t('settings.autoDate.toastAuto'));   }} />
          <ToggleChip label={t('settings.autoDate.manual')} active={settings.autoDate !== true}  onClick={() => { updateSettings({ autoDate: false }); showToast(t('settings.autoDate.toastManual')); }} />
        </div>
        <div style={{ fontSize:10, color:'var(--txt4)', marginTop:8, lineHeight:1.5 }}>
          {settings.autoDate ? t('settings.autoDate.noteAuto') : t('settings.autoDate.noteManual')}
        </div>
      </div>

      {/* App Info */}
      <div style={{ ...cardStyle, textAlign:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{
            width:52, height:52, borderRadius:13, overflow:'hidden',
            marginBottom:6, boxShadow:'0 4px 16px rgba(201,149,42,0.2)',
          }}>
            <Image src="/icon-512.png" alt="WiFi Pay" width={512} height={512} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:15, color:'var(--txt)' }}>WiFi Pay</div>
          <div style={{ fontSize:11, color:'var(--txt4)', lineHeight:2 }}>
            <div>{t('settings.version')} v11.2 Next</div>
            <div>Firebase: wifi-pay-online</div>
            <div>Server: Singapore</div>
          </div>
        </div>
      </div>
    </>
  );
}
