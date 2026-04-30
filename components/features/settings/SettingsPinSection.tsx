// components/features/settings/SettingsPinSection.tsx — Fase 3: dipecah dari SettingsView
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { useT } from '@/hooks/useT';
import { Shield, Check } from 'lucide-react';

type PinStep = 'menu' | 'enable-new' | 'enable-confirm' | 'disable-verify' | 'change-old' | 'change-new' | 'change-confirm';

const TIMEOUT_KEYS = [
  { key: 'settings.timeout.never', value: 0 },
  { key: 'settings.timeout.5m',    value: 5 },
  { key: 'settings.timeout.10m',   value: 10 },
  { key: 'settings.timeout.30m',   value: 30 },
  { key: 'settings.timeout.1h',    value: 60 },
];

const cardCritStyle: React.CSSProperties = {
  background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-md)',
  padding:16, marginBottom:10, boxShadow:'var(--shadow-md)',
};

export default function SettingsPinSection() {
  const { settings, updateSettings } = useAppStore();
  const t = useT();

  const [pinStep, setPinStep] = useState<PinStep>('menu');
  const [pin1, setPin1]       = useState('');
  const [pin2, setPin2]       = useState('');
  const [pinErr, setPinErr]   = useState('');

  function simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return String(Math.abs(h));
  }
  function verifyPin(input: string) { return simpleHash(input) === settings.pin; }
  function validatePin(p: string): boolean {
    if (p.length !== 4 || !/^\d{4}$/.test(p)) { setPinErr(t('pin.notMatch')); return false; }
    return true;
  }
  function startEnable() { setPinStep('enable-new'); setPin1(''); setPin2(''); setPinErr(''); }
  function handleEnableNew() { if (!validatePin(pin1)) return; setPinStep('enable-confirm'); setPin2(''); setPinErr(''); }
  function handleEnableConfirm() {
    if (pin2 !== pin1) { setPinErr(t('pin.notMatch')); setPin2(''); return; }
    updateSettings({ pinEnabled: true, pin: simpleHash(pin1) });
    showToast(t('settings.pin.toastEnabled')); setPinStep('menu'); setPin1(''); setPin2('');
  }
  function startDisable() { setPinStep('disable-verify'); setPin1(''); setPinErr(''); }
  function handleDisableVerify() {
    if (!verifyPin(pin1)) { setPinErr(t('pin.wrong')); setPin1(''); return; }
    showConfirm('', t('settings.pin.disableConfirm'), t('action.confirm'), () => {
      updateSettings({ pinEnabled: false, pin: '' });
      showToast(t('settings.pin.toastDisabled')); setPinStep('menu'); setPin1('');
    });
  }
  function startChange() { setPinStep('change-old'); setPin1(''); setPin2(''); setPinErr(''); }
  function handleChangeOld() { if (!verifyPin(pin1)) { setPinErr(t('pin.wrong')); setPin1(''); return; } setPinStep('change-new'); setPin1(''); setPinErr(''); }
  function handleChangeNew() { if (!validatePin(pin1)) return; setPinStep('change-confirm'); setPin2(''); setPinErr(''); }
  function handleChangeConfirm() {
    if (pin2 !== pin1) { setPinErr(t('pin.notMatch')); setPin2(''); return; }
    updateSettings({ pin: simpleHash(pin1) }); showToast(t('settings.pin.toastChanged')); setPinStep('menu'); setPin1(''); setPin2('');
  }

  const inputStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    padding:'10px 14px', borderRadius:'var(--r-sm)', fontSize:14, width:'100%', textAlign:'center',
    fontFamily:"'DM Mono',monospace", letterSpacing:8,
  };

  function PinInput({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
    return (
      <input type="password" inputMode="numeric" maxLength={4} value={value} placeholder="••••"
        onChange={e => onChange(e.target.value.replace(/\D/g,'').slice(0,4))}
        style={inputStyle} autoFocus />
    );
  }

  function Btn({ label, onClick, danger=false, secondary=false, icon }: { label:string; onClick:()=>void; danger?:boolean; secondary?:boolean; icon?: React.ReactNode }) {
    return (
      <button onClick={onClick} style={{
        width:'100%', padding:'10px 14px', borderRadius:'var(--r-sm)', cursor:'pointer',
        fontSize:13, fontWeight:600, marginTop:8, transition:'all var(--t-fast)',
        border: danger ? '1px solid rgba(239,68,68,0.3)' : secondary ? '1px solid var(--border)' : 'none',
        background: danger ? 'rgba(239,68,68,0.1)' : secondary ? 'var(--bg3)' : 'var(--zc)',
        color: danger ? 'var(--c-belum)' : secondary ? 'var(--txt2)' : '#fff',
        boxShadow: (!danger && !secondary) ? 'var(--shadow-z)' : undefined,
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        {icon} {label}
      </button>
    );
  }

  function PinCard({ title, desc, children }: { title:string; desc?:string; children:React.ReactNode }) {
    return (
      <div style={cardCritStyle}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, marginBottom:4, color:'var(--txt)' }}>{title}</div>
        {desc && <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:12 }}>{desc}</div>}
        {children}
        {pinErr && <div style={{ fontSize:11, color:'var(--c-belum)', textAlign:'center', marginTop:8 }}>{pinErr}</div>}
      </div>
    );
  }

  return (
    <>
      {pinStep === 'menu' && (
        <div style={cardCritStyle}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
            <div style={{ color:'var(--zc)', marginTop:2 }}><Shield size={16} strokeWidth={1.5} /></div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.pin')}</div>
              <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
                {settings.pinEnabled ? t('Aktif — app terkunci saat dibuka') : t('Nonaktif — app langsung terbuka')}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12, marginTop:-8 }}>
            <span style={{ fontSize:11, fontWeight:700, color: settings.pinEnabled ? 'var(--c-lunas)' : 'var(--txt4)', display:'flex', alignItems:'center', gap:4 }}>
              {settings.pinEnabled ? <Check size={12} /> : null}
              {settings.pinEnabled ? t('settings.pinStatus.active') : t('settings.pinStatus.inactive')}
            </span>
          </div>
          {!settings.pinEnabled
            ? <Btn label={t('settings.pinEnable')} onClick={startEnable} icon={<Shield size={13} />} />
            : <>
                <Btn label={t('settings.pinChange')} onClick={startChange} secondary />
                <Btn label={t('settings.pinDisable')} onClick={startDisable} danger />
              </>
          }
          {settings.pinEnabled && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border2)' }}>
              <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:10 }}>{t('settings.autoLock')}</div>
              <div style={{ fontSize:11, color:'var(--txt4)', marginBottom:8, lineHeight:1.5 }}>
                {t('settings.autoLockDesc')}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {TIMEOUT_KEYS.map(opt => (
                  <button key={opt.value} onClick={() => { updateSettings({ pinTimeoutMinutes: opt.value }); showToast(`Auto-lock: ${t(opt.key)}`); }}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'8px 12px', borderRadius:'var(--r-sm)',
                      border:`1px solid ${settings.pinTimeoutMinutes===opt.value ? 'var(--zc)' : 'var(--border)'}`,
                      background: settings.pinTimeoutMinutes===opt.value ? 'var(--zcdim)' : 'var(--bg3)',
                      color: settings.pinTimeoutMinutes===opt.value ? 'var(--zc)' : 'var(--txt2)',
                      cursor:'pointer', fontSize:12, transition:'all var(--t-fast)',
                    }}>
                    <span>{t(opt.key)}</span>
                    {settings.pinTimeoutMinutes===opt.value && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pinStep === 'enable-new' && (
        <PinCard title={t('settings.pin.newTitle')} desc={t('settings.pin.enterNew')}>
          <PinInput value={pin1} onChange={setPin1} />
          <Btn label={t('action.confirm')} onClick={handleEnableNew} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
      {pinStep === 'enable-confirm' && (
        <PinCard title={t('pin.confirm')} desc={t('settings.pin.reenterNew')}>
          <PinInput value={pin2} onChange={setPin2} />
          <Btn label={t('settings.pinSave')} onClick={handleEnableConfirm} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
      {pinStep === 'disable-verify' && (
        <PinCard title={t('settings.pinDisable')} desc={t('settings.pin.enterCurrent')}>
          <PinInput value={pin1} onChange={setPin1} />
          <Btn label={t('action.confirm')} onClick={handleDisableVerify} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
      {pinStep === 'change-old' && (
        <PinCard title={t('settings.pinChange')} desc={t('settings.pin.enterOld')}>
          <PinInput value={pin1} onChange={setPin1} />
          <Btn label={t('action.confirm')} onClick={handleChangeOld} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
      {pinStep === 'change-new' && (
        <PinCard title={t('settings.pin.newTitle')} desc={t('settings.pin.enterNew')}>
          <PinInput value={pin1} onChange={setPin1} />
          <Btn label={t('action.confirm')} onClick={handleChangeNew} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
      {pinStep === 'change-confirm' && (
        <PinCard title={t('pin.confirm')} desc={t('settings.pin.reenterNew')}>
          <PinInput value={pin2} onChange={setPin2} />
          <Btn label={t('settings.pinSave')} onClick={handleChangeConfirm} />
          <Btn label={t('action.cancel')} onClick={() => setPinStep('menu')} secondary />
        </PinCard>
      )}
    </>
  );
}
