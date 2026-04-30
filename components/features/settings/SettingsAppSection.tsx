// components/features/settings/SettingsAppSection.tsx — Fase 3: dipecah dari SettingsView
// Berisi: Bahasa, Tanggal Bayar otomatis, App Info
'use client';

import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { useT } from '@/hooks/useT';
import { Globe, Calendar, Check, Wifi } from 'lucide-react';

export default function SettingsAppSection() {
  const { settings, updateSettings } = useAppStore();
  const t = useT();

  const cardStyle: React.CSSProperties = {
    background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
    padding:16, marginBottom:10, boxShadow:'var(--shadow-xs)',
  };

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

  return (
    <>
      {/* Bahasa */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Globe size={16} strokeWidth={1.5} /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.language')}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <ToggleChip label="Indonesia" active={settings.language !== 'en'} onClick={() => { updateSettings({ ...settings, language: 'id' }); showToast('Bahasa: Indonesia'); }} />
          <ToggleChip label="English" active={settings.language === 'en'} onClick={() => { updateSettings({ ...settings, language: 'en' }); showToast('Language: English'); }} />
        </div>
      </div>

      {/* Tanggal Bayar */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Calendar size={16} strokeWidth={1.5} /></div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.autoDate')}</div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
              {settings.autoDate ? t('settings.autoDate.descAuto') : t('settings.autoDate.descManual')}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <ToggleChip label={t('settings.autoDate.auto')} active={settings.autoDate === true} onClick={() => { updateSettings({ autoDate: true }); showToast(t('settings.autoDate.toastAuto')); }} />
          <ToggleChip label={t('settings.autoDate.manual')} active={settings.autoDate !== true} onClick={() => { updateSettings({ autoDate: false }); showToast(t('settings.autoDate.toastManual')); }} />
        </div>
        <div style={{ fontSize:10, color:'var(--txt4)', marginTop:8, lineHeight:1.5 }}>
          {settings.autoDate ? t('settings.autoDate.noteAuto') : t('settings.autoDate.noteManual')}
        </div>
      </div>

      {/* App Info */}
      <div style={{ ...cardStyle, textAlign:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ color:'var(--zc)', marginBottom:6 }}><Wifi size={22} strokeWidth={1.5} /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'var(--txt)' }}>WiFi Pay</div>
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
