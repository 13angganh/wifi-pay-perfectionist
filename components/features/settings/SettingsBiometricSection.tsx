// ══════════════════════════════════════════
// components/features/settings/SettingsBiometricSection.tsx — Biometrik (REDESAIN T10, D8)
// Logika zip utuh: cek perangkat (loading → didukung / tidak), aktifkan (butuh PIN aktif) lewat registerBiometric,
// uji lewat verifyBiometric (sukses membuka kunci), daftar ulang bila kredensial hilang, nonaktifkan lewat Confirm.
// Tampilan: kartu status + Notice + tombol (Button primitive); tanpa ikon Lucide.
// ══════════════════════════════════════════
'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Scan, WarningCircle } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { isBiometricAvailable, registerBiometric, verifyBiometric, clearBiometricCred, hasBiometricCred } from '@/lib/biometric';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import s from './settings.module.css';

export default function SettingsBiometricSection() {
  const { settings, updateSettings, setPinUnlocked } = useAppStore();
  const t = useT();
  const [supported, setSupported] = useState<boolean | null>(null); // null = memeriksa perangkat
  const [credExists, setCredExists] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(ok => {
      setSupported(ok);
      if (ok) setCredExists(hasBiometricCred());
    });
  }, []);

  // Biometrik hanya berguna jika PIN juga aktif (PIN = master lock)
  const pinActive = settings.pinEnabled;
  const on = !!settings.biometricEnabled;

  async function handleEnable() {
    if (!pinActive) { showToast(t('biometric.enablePinFirst'), 'err'); return; }
    setBusy(true);
    try {
      const ok = await registerBiometric();
      if (ok) {
        updateSettings({ biometricEnabled: true });
        setCredExists(true);
        showToast(t('biometric.enabled'));
      } else {
        showToast(t('biometric.registerFailed'), 'err');
      }
    } catch {
      showToast(t('biometric.notSupportedOrCancel'), 'err');
    } finally {
      setBusy(false);
    }
  }

  function handleDisable() {
    showConfirm('lock', t('biometric.disableConfirm'), t('biometric.disableYes'), () => {
      updateSettings({ biometricEnabled: false });
      clearBiometricCred();
      setCredExists(false);
      showToast(t('biometric.disabled'));
    });
  }

  async function handleTest() {
    setBusy(true);
    try {
      const ok = await verifyBiometric();
      if (ok) { setPinUnlocked(true); showToast(t('biometric.verifySuccess')); }
      else showToast(t('biometric.verifyFailed'), 'err');
    } catch {
      showToast(t('biometric.cancelled'), 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={s.card}>
      <div className={s.chd}>
        <IconTile icon={Fingerprint} tone={on ? 'lunas' : 'purple'} />
        <div><b>{t('biometric.title')}</b><div className={s.cap}>{t('biometric.subtitle')}</div></div>
        <Badge variant={on ? 'lunas' : 'neutral'}>{on ? t('common.active') : t('common.inactive')}</Badge>
      </div>

      {supported === null && (
        <div role="status" aria-label={t('biometric.checkingDevice')}>
          <Skeleton height="40px" rounded="md" />
          <span className={s.cap}>{t('biometric.checkingDevice')}</span>
        </div>
      )}

      {supported === false && <Notice tone="bad" icon={WarningCircle}>{t('biometric.notSupported')}</Notice>}

      {supported === true && (
        <>
          {!pinActive && <Notice tone="warn">{t('biometric.enablePinWarning')}</Notice>}
          {!on ? (
            <Button variant="primary" block loading={busy} disabled={!pinActive || busy} onClick={handleEnable}>
              <Fingerprint aria-hidden="true" /> {t('biometric.enableBtn')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" block loading={busy} disabled={busy} onClick={handleTest}>
                <Scan aria-hidden="true" /> {t('biometric.testBtn')}
              </Button>
              {!credExists && (
                <Button variant="primary" block disabled={busy} onClick={handleEnable}>
                  <Fingerprint aria-hidden="true" /> {t('biometric.reregisterBtn')}
                </Button>
              )}
              <Button variant="danger" block disabled={busy} onClick={handleDisable}>{t('biometric.disableBtn')}</Button>
            </>
          )}
          <span className={s.capSm}>{t('biometric.privacyNote')}</span>
        </>
      )}
    </Card>
  );
}
