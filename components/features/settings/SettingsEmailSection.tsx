// ══════════════════════════════════════════
// components/features/settings/SettingsEmailSection.tsx — Akun Saya: Email & Reset Password (REDESAIN T10, D3)
// Logika zip utuh: validasi email (kosong/sama/format), doUpdateEmail (verifyBeforeUpdateEmail), doResetPassword,
// teks sukses reset hilang setelah 8 detik. Tampilan: dua kartu (Email, Reset Password) + Notice sukses.
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState } from 'react';
import { Envelope, Key, PaperPlaneTilt } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { doUpdateEmail, doResetPassword } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import s from './settings.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsEmailSection() {
  const { userEmail } = useAppStore();
  const t = useT();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoad, setResetLoad] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleUpdate() {
    const v = newEmail.trim();
    if (!v) { showToast(t('emailSection.enterNew'), 'err'); return; }
    if (v === userEmail) { showToast(t('emailSection.sameAsCurrent'), 'err'); return; }
    if (!EMAIL_RE.test(newEmail)) { showToast(t('emailSection.invalidFormat'), 'err'); return; }
    setLoading(true);
    const res = await doUpdateEmail(v);
    setLoading(false);
    if (res.error) { showToast(res.error, 'err'); return; }
    setSent(true);
    setNewEmail('');
    showToast(t('emailSection.verifySent') + v);
  }

  async function handleReset() {
    if (!userEmail) return;
    setResetLoad(true);
    await doResetPassword(userEmail);
    setResetLoad(false);
    setResetSent(true);
    timer.current = setTimeout(() => setResetSent(false), 8000);
  }

  return (
    <>
      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={Envelope} tone="blue" />
          <div>
            <b>{t('emailSection.title')}</b>
            <div className={s.cap}>{t('emailSection.currentLabel')} <b className={s.mono}>{userEmail}</b></div>
          </div>
        </div>
        {sent ? (
          <Notice tone="ok">{t('emailSection.verifySentDesc')}</Notice>
        ) : (
          <>
            <Input
              label={t('emailSection.newEmailLabel')}
              type="email" inputMode="email" placeholder="email@gmail.com" autoComplete="off"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            />
            <span className={s.capSm}>{t('emailSection.firebaseNote')}</span>
            <Button variant="primary" block loading={loading} disabled={!newEmail.trim()} onClick={handleUpdate}>
              {loading ? t('emailSection.sending') : <><PaperPlaneTilt aria-hidden="true" /> {t('emailSection.sendVerifyBtn')}</>}
            </Button>
          </>
        )}
      </Card>

      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={Key} tone="orange" />
          <div className={s.cap}>{t('emailSection.forgotPassword')}</div>
        </div>
        {resetSent ? (
          <Notice tone="ok">{t('emailSection.resetSentDesc')} <b>{userEmail}</b></Notice>
        ) : (
          <Button variant="secondary" block loading={resetLoad} onClick={handleReset}>
            {resetLoad ? t('emailSection.sending') : <><Key aria-hidden="true" /> {t('emailSection.sendResetBtn')}</>}
          </Button>
        )}
      </Card>
    </>
  );
}
