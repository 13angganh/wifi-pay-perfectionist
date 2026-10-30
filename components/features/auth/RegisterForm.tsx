// ══════════════════════════════════════════
// components/features/auth/RegisterForm.tsx
// Dipecah dari app/login/page.tsx (task 1.15). REDESAIN T6: tampilan baru, logika di page.tsx.
// ══════════════════════════════════════════
'use client';

import { EnvelopeSimple, User } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import Button from '@/components/ui/Button';
import GoogleButton from './GoogleButton';
import PasswordField from './PasswordField';

interface Props {
  name:          string;
  email:         string;
  pass:          string;
  error:         string;
  loading:       boolean;
  googleLoading: boolean;
  onName:        (v: string) => void;
  onEmail:       (v: string) => void;
  onPass:        (v: string) => void;
  onSubmit:      () => void;
  onGoogle:      () => void;
  onLogin:       () => void;
}

export default function RegisterForm(p: Props) {
  const t = useT();
  return (
    <div className="auth-form">
      <div className="auth-head">
        <b className="wp-t-display">{t('login.createAccount')}</b>
      </div>

      <div className="wp-inpw">
        <span className="wp-inpw__ico" aria-hidden="true"><User size="1em" /></span>
        <input
          className="wp-inp" type="text" autoComplete="name"
          placeholder={t('login.namePlaceholder')} aria-label={t('login.username')}
          value={p.name} onChange={e => p.onName(e.target.value)}
        />
      </div>
      <div className="wp-inpw">
        <span className="wp-inpw__ico" aria-hidden="true"><EnvelopeSimple size="1em" /></span>
        <input
          className="wp-inp" type="email" inputMode="email" autoComplete="email"
          placeholder="email@gmail.com" aria-label={t('login.email')}
          value={p.email} onChange={e => p.onEmail(e.target.value)}
        />
      </div>
      <PasswordField
        value={p.pass} onChange={p.onPass} onEnter={p.onSubmit}
        autoComplete="new-password" ariaLabel={t('login.passwordMin6')}
      />

      {p.error && <div className="auth-err" role="alert">{p.error}</div>}

      <Button variant="primary" size="lg" block onClick={p.onSubmit} loading={p.loading}>
        {p.loading ? t('common.loading') : t('login.registerSubmit')}
      </Button>

      <div className="wp-sep">{t('login.orRegisterWith')}</div>
      <GoogleButton onClick={p.onGoogle} loading={p.googleLoading} />

      <div className="auth-switch">
        {t('login.hasAccount')}{' '}
        <button type="button" className="wp-lnk" style={{ fontSize: 'var(--fs-body)' }} onClick={p.onLogin}>
          {t('login.loginHere')}
        </button>
      </div>
    </div>
  );
}
