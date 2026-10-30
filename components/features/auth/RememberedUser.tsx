// ══════════════════════════════════════════
// components/features/auth/RememberedUser.tsx
// Dipecah dari app/login/page.tsx (task 1.15). REDESAIN T6: tampilan baru, logika di page.tsx.
// ══════════════════════════════════════════
'use client';

import { useT } from '@/hooks/useT';
import Button from '@/components/ui/Button';
import GoogleButton from './GoogleButton';

interface Props {
  greeterName:   string | null | undefined;
  loading:       boolean;
  googleLoading: boolean;
  error:         string;
  onContinue:    () => void;
  onGoogle:      () => void;
  onSwitch:      () => void;
}

export default function RememberedUser({ greeterName, loading, googleLoading, error, onContinue, onGoogle, onSwitch }: Props) {
  const t = useT();
  return (
    <div className="auth-form">
      <div className="auth-head">
        <b className="wp-t-display">
          {greeterName ? <>{t('login.greeting')}, {greeterName}</> : <>{t('login.greetingNew')}</>}
        </b>
      </div>

      <Button variant="primary" size="lg" block onClick={onContinue} loading={loading}>
        {loading ? t('common.loading') : t('login.continue')}
      </Button>

      <div className="wp-sep">{t('login.or')}</div>
      <GoogleButton onClick={onGoogle} loading={googleLoading} />
      <Button variant="secondary" size="lg" block onClick={onSwitch}>{t('login.changeAccount')}</Button>

      {error && <div className="auth-err" role="alert">{error}</div>}
    </div>
  );
}
