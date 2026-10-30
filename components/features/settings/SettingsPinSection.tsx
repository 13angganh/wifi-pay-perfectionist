// ══════════════════════════════════════════
// components/features/settings/SettingsPinSection.tsx — PIN & Auto-lock (REDESAIN T10, D8)
// Logika zip utuh (simpleHash, 6 digit, aktifkan / ubah / nonaktifkan lewat Confirm, auto-lock 5 pilihan).
// Tampilan: kartu per langkah dengan 6 titik penanda (PinDots) + satu input angka; auto-lock = chip.
// File yatim Setup/Change dihapus: semua langkah ada di sini (satu alur, tanpa duplikasi).
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Check, LockKey, ShieldCheck, ShieldSlash } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/Chip';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { PinDots } from '@/components/ui/PinDots';
import s from './settings.module.css';

type PinStep = 'menu' | 'enable-new' | 'enable-confirm' | 'disable-verify' | 'change-old' | 'change-new' | 'change-confirm';

const TIMEOUT_KEYS = [
  { key: 'settings.timeout.never', value: 0 },
  { key: 'settings.timeout.5m',    value: 5 },
  { key: 'settings.timeout.10m',   value: 10 },
  { key: 'settings.timeout.30m',   value: 30 },
  { key: 'settings.timeout.1h',    value: 60 },
];

/** Hash PIN sama persis dengan PinLock (jangan diubah: PIN yang sudah tersimpan harus tetap valid). */
export function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return String(Math.abs(h));
}

interface StepProps {
  title: string; desc: string; value: string; error: string;
  onChange: (v: string) => void; onOk: () => void; onCancel: () => void; okLabel: string;
}

/** Satu langkah PIN: titik penanda + input angka + tombol (komponen tingkat atas, bukan dibuat saat render). */
function PinStepCard({ title, desc, value, error, onChange, onOk, onCancel, okLabel }: StepProps) {
  const t = useT();
  return (
    <Card className={s.card}>
      <div className={s.chd}>
        <IconTile icon={LockKey} tone="orange" />
        <div><b>{title}</b><div className={s.cap}>{desc}</div></div>
      </div>
      <div className={s.pinBox}>
        <PinDots filled={value.length} label={t('settings.pin')} />
        <Input
          aria-label={title}
          type="password" inputMode="numeric" maxLength={6} numeric autoFocus autoComplete="off"
          placeholder="••••••"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => { if (e.key === 'Enter') onOk(); }}
        />
        <div className={s.pinMsg} role="alert">{error}</div>
      </div>
      <div className={s.rowBtns}>
        <Button variant="secondary" onClick={onCancel}>{t('action.cancel')}</Button>
        <Button variant="primary" onClick={onOk}>{okLabel}</Button>
      </div>
    </Card>
  );
}

export default function SettingsPinSection() {
  const { settings, updateSettings } = useAppStore();
  const t = useT();
  const [pinStep, setPinStep] = useState<PinStep>('menu');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinErr, setPinErr] = useState('');

  const verifyPin = (input: string) => simpleHash(input) === settings.pin;
  function validatePin(p: string): boolean {
    if (p.length !== 6 || !/^\d{6}$/.test(p)) { setPinErr(t('pin.notMatch')); return false; }
    return true;
  }
  const toMenu = () => { setPinStep('menu'); setPin1(''); setPin2(''); setPinErr(''); };
  function startEnable() { setPinStep('enable-new'); setPin1(''); setPin2(''); setPinErr(''); }
  function handleEnableNew() { if (!validatePin(pin1)) return; setPinStep('enable-confirm'); setPin2(''); setPinErr(''); }
  function handleEnableConfirm() {
    if (pin2 !== pin1) { setPinErr(t('pin.notMatch')); setPin2(''); return; }
    updateSettings({ pinEnabled: true, pin: simpleHash(pin1) });
    showToast(t('settings.pin.toastEnabled')); toMenu();
  }
  function startDisable() { setPinStep('disable-verify'); setPin1(''); setPinErr(''); }
  function handleDisableVerify() {
    if (!verifyPin(pin1)) { setPinErr(t('pin.wrong')); setPin1(''); return; }
    showConfirm('lock', t('settings.pin.disableConfirm'), t('action.confirm'), () => {
      updateSettings({ pinEnabled: false, pin: '' });
      showToast(t('settings.pin.toastDisabled')); toMenu();
    }, { description: t('settings.pin.disableConfirmDesc') });
  }
  function startChange() { setPinStep('change-old'); setPin1(''); setPin2(''); setPinErr(''); }
  function handleChangeOld() { if (!verifyPin(pin1)) { setPinErr(t('pin.wrong')); setPin1(''); return; } setPinStep('change-new'); setPin1(''); setPinErr(''); }
  function handleChangeNew() { if (!validatePin(pin1)) return; setPinStep('change-confirm'); setPin2(''); setPinErr(''); }
  function handleChangeConfirm() {
    if (pin2 !== pin1) { setPinErr(t('pin.notMatch')); setPin2(''); return; }
    updateSettings({ pin: simpleHash(pin1) }); showToast(t('settings.pin.toastChanged')); toMenu();
  }

  if (pinStep === 'enable-new')      return <PinStepCard title={t('settings.pin.newTitle')} desc={t('settings.pin.enterNew')} value={pin1} error={pinErr} onChange={setPin1} onOk={handleEnableNew} onCancel={toMenu} okLabel={t('action.confirm')} />;
  if (pinStep === 'enable-confirm')  return <PinStepCard title={t('pin.confirm')} desc={t('settings.pin.reenterNew')} value={pin2} error={pinErr} onChange={setPin2} onOk={handleEnableConfirm} onCancel={toMenu} okLabel={t('settings.pinSave')} />;
  if (pinStep === 'disable-verify')  return <PinStepCard title={t('settings.pinDisable')} desc={t('settings.pin.enterCurrent')} value={pin1} error={pinErr} onChange={setPin1} onOk={handleDisableVerify} onCancel={toMenu} okLabel={t('action.confirm')} />;
  if (pinStep === 'change-old')      return <PinStepCard title={t('settings.pinChange')} desc={t('settings.pin.enterOld')} value={pin1} error={pinErr} onChange={setPin1} onOk={handleChangeOld} onCancel={toMenu} okLabel={t('action.confirm')} />;
  if (pinStep === 'change-new')      return <PinStepCard title={t('settings.pin.newTitle')} desc={t('settings.pin.enterNew')} value={pin1} error={pinErr} onChange={setPin1} onOk={handleChangeNew} onCancel={toMenu} okLabel={t('action.confirm')} />;
  if (pinStep === 'change-confirm')  return <PinStepCard title={t('pin.confirm')} desc={t('settings.pin.reenterNew')} value={pin2} error={pinErr} onChange={setPin2} onOk={handleChangeConfirm} onCancel={toMenu} okLabel={t('settings.pinSave')} />;

  const on = !!settings.pinEnabled;
  return (
    <>
      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={on ? ShieldCheck : ShieldSlash} tone={on ? 'lunas' : 'slate'} />
          <div>
            <b>{t('settings.pin')}</b>
            <div className={s.cap}>{on ? t('settings.pin.descActive') : t('settings.pin.descInactive')}</div>
          </div>
          <Badge variant={on ? 'lunas' : 'neutral'}>{on ? t('settings.pinStatus.active') : t('settings.pinStatus.inactive')}</Badge>
        </div>
        {!on ? (
          <Button variant="primary" block onClick={startEnable}><ShieldCheck aria-hidden="true" /> {t('settings.pinEnable')}</Button>
        ) : (
          <div className={s.rowBtns}>
            <Button variant="secondary" onClick={startChange}>{t('settings.pinChange')}</Button>
            <Button variant="danger" onClick={startDisable}>{t('settings.pinDisable')}</Button>
          </div>
        )}
      </Card>

      {on && (
        <Card className={s.card}>
          <span className={s.sectionLabel}>{t('settings.autoLock')}</span>
          <span className={s.cap}>{t('settings.autoLockDesc')}</span>
          <div className={s.timeouts} role="group" aria-label={t('settings.autoLock')}>
            {TIMEOUT_KEYS.map(opt => (
              <FilterChip key={opt.value} active={settings.pinTimeoutMinutes === opt.value}
                onClick={() => { updateSettings({ pinTimeoutMinutes: opt.value }); showToast(`${t('settings.autoLockToast')}: ${t(opt.key)}`); }}>
                {settings.pinTimeoutMinutes === opt.value && <Check aria-hidden="true" />} {t(opt.key)}
              </FilterChip>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
