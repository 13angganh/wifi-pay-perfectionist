// ══════════════════════════════════════════
// components/features/settings/SettingsEmailSection.tsx — Akun Saya: Email & Reset Password (REDESAIN T10, D3)
// Logika zip utuh: validasi email (kosong/sama/format), doUpdateEmail (verifyBeforeUpdateEmail), doResetPassword,
// v11.11.1: galat reset NYATA ditampilkan, teks "terkirim" jujur (Jika email terdaftar...) + jeda kirim ulang 60 dtk;
// kartu Reset hanya untuk akun yang punya kata sandi (akun khusus Google tidak punya); kartu baru Masuk dengan Google.
// Tampilan: kartu Email, Reset Password, dan Masuk dengan Google.
// ══════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { Envelope, GoogleLogo, Key, PaperPlaneTilt } from '@phosphor-icons/react';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { doUpdateEmail, doResetPassword, doLinkGoogle, getLinkedProviders } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import s from './settings.module.css';

/** Email akun Google yang tertaut ke akun aktif (kosong bila tidak ada). */
function getGoogleEmail(): string {
  try { return auth.currentUser?.providerData.find(p => p.providerId === 'google.com')?.email || ''; } catch { return ''; }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsEmailSection() {
  const { userEmail } = useAppStore();
  const t = useT();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLoad, setResetLoad] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [providers, setProviders] = useState<string[]>(() => getLinkedProviders());
  const [linking, setLinking] = useState(false);
  // Jeda kirim ulang: pesan "terkirim" tetap tampil selama jeda berjalan (resetCooldown > 0), lalu hilang bersama jeda.
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const id = setTimeout(() => setResetCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resetCooldown]);

  const hasGoogle  = providers.includes('google.com');
  // Daftar provider kosong (tidak diketahui) diperlakukan seperti akun bersandi — perilaku lama dipertahankan.
  const googleOnly = providers.length > 0 && !providers.includes('password');
  const googleEmail = !hasGoogle ? '' : (getGoogleEmail() || '');

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
    if (!userEmail || resetLoad || resetCooldown > 0) return;
    setResetLoad(true);
    const res = await doResetPassword(userEmail);
    setResetLoad(false);
    // v11.11.1: galat NYATA ditampilkan (dulu hasil diabaikan dan selalu tampil "terkirim").
    if (res.error) { showToast(res.error, 'err'); return; }
    setResetCooldown(60);
  }

  async function handleLinkGoogle() {
    setLinking(true);
    const res = await doLinkGoogle();
    setLinking(false);
    if (res.error) { showToast(res.error, 'err'); return; }
    setProviders(getLinkedProviders());
    showToast(t('account.googleLinkedToast'));
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

      {googleOnly ? (
        <Card className={s.card}>
          <div className={s.chd}>
            <IconTile icon={GoogleLogo} tone="blue" />
            <div className={s.cap}>{t('emailSection.googleOnlyNote')}</div>
          </div>
        </Card>
      ) : (
        <Card className={s.card}>
          <div className={s.chd}>
            <IconTile icon={Key} tone="orange" />
            <div className={s.cap}>{t('emailSection.forgotPassword')}</div>
          </div>
          {resetCooldown > 0 && (
            <Notice tone="ok">{t('emailSection.resetSentHonest').replace('{email}', userEmail || '')}</Notice>
          )}
          <Button variant="secondary" block loading={resetLoad} disabled={resetCooldown > 0} onClick={handleReset}>
            {resetLoad
              ? t('emailSection.sending')
              : resetCooldown > 0
                ? t('emailSection.resetCooldown').replace('{n}', String(resetCooldown))
                : <><Key aria-hidden="true" /> {t('emailSection.sendResetBtn')}</>}
          </Button>
        </Card>
      )}

      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={GoogleLogo} tone="blue" />
          <div>
            <b>{t('emailSection.googleTitle')}</b>
            <div className={s.cap}>{hasGoogle ? t('account.googleLinked') : t('emailSection.googleDesc')}</div>
          </div>
        </div>
        {hasGoogle ? (
          googleEmail ? <span className={s.capSm}>{t('emailSection.googleEmailLabel')} <b className={s.mono}>{googleEmail}</b></span> : null
        ) : (
          <Button variant="secondary" block loading={linking} onClick={handleLinkGoogle}>
            {linking ? t('account.linking') : <><GoogleLogo aria-hidden="true" /> {t('account.linkGoogle')}</>}
          </Button>
        )}
      </Card>
    </>
  );
}
