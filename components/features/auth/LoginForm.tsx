// ══════════════════════════════════════════
// components/features/auth/LoginForm.tsx
// Dipecah dari app/login/page.tsx (task 1.15). REDESAIN T6: tampilan baru; semua logika
// (login, Google, reset password) tetap di app/login/page.tsx — komponen ini murni tampilan.
// ══════════════════════════════════════════
'use client';

import { ArrowLeft, CheckCircle, EnvelopeSimple } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Notice from '@/components/ui/Notice';
import GoogleButton from './GoogleButton';
import PasswordField from './PasswordField';

interface Props {
  email:         string;
  pass:          string;
  remember:      boolean;
  error:         string;
  loading:       boolean;
  googleLoading: boolean;
  resetSent:     boolean;
  resetLoading:  boolean;
  hasRemembered: boolean;
  onEmail:       (v: string) => void;
  onPass:        (v: string) => void;
  onRemember:    (v: boolean) => void;
  onLogin:       () => void;
  onGoogle:      () => void;
  onReset:       () => void;
  onBack:        () => void;
  onRegister:    () => void;
}

export default function LoginForm(p: Props) {
  const t = useT();
  return (
    <div className="auth-form">
      <div className="auth-head">
        <b className="wp-t-display">{t('login.greetingNew')}</b>
        <span className="wp-t-cap" style={{ fontSize: 'var(--fs-body)' }}>{t('login.continuePrompt')}</span>
      </div>

      {p.hasRemembered && (
        <button type="button" className="auth-back" onClick={p.onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> {t('action.back')}
        </button>
      )}

      <div className="wp-inpw">
        <span className="wp-inpw__ico" aria-hidden="true"><EnvelopeSimple size="1em" /></span>
        <input
          className="wp-inp" type="email" inputMode="email" autoComplete="email"
          placeholder="email@gmail.com" aria-label={t('login.email')}
          value={p.email} onChange={e => p.onEmail(e.target.value)}
        />
      </div>
      <PasswordField
        value={p.pass} onChange={p.onPass} onEnter={p.onLogin}
        autoComplete="current-password" ariaLabel={t('login.password')}
      />

      {p.error && <div className="auth-err" role="alert" data-testid="login-error">{p.error}</div>}

      <div className="auth-row">
        <Checkbox label={t('login.remember')} checked={p.remember} onChange={e => p.onRemember(e.target.checked)} />
        <button type="button" className="wp-lnk" onClick={p.onReset} disabled={p.resetLoading}>
          {p.resetLoading ? t('login.resetSending') : t('login.forgot')}
        </button>
      </div>

      {p.resetSent && (
        <Notice tone="ok" icon={CheckCircle}>
          {t('login.resetSentTo')} {p.email} — {t('login.resetSentCheck')}
        </Notice>
      )}

      <Button variant="primary" size="lg" block onClick={p.onLogin} loading={p.loading} data-testid="login-submit">
        {p.loading ? t('common.loading') : t('login.submit')}
      </Button>

      <div className="wp-sep">{t('login.orWith')}</div>
      <GoogleButton onClick={p.onGoogle} loading={p.googleLoading} />

      <div className="auth-switch">
        {t('login.noAccount')}{' '}
        <button type="button" className="wp-lnk" style={{ fontSize: 'var(--fs-body)' }} onClick={p.onRegister}>
          {t('login.registerHere')}
        </button>
      </div>
    </div>
  );
}
