// ══════════════════════════════════════════
// app/login/page.tsx — Login (REDESAIN T6)
// Logika autentikasi TIDAK berubah (doLogin/doRegister/doLoginGoogle/doResetPassword/
// switchAccount/getRememberedCred dari hooks/useAuth.ts). Tampilan dipecah ke
// components/features/auth/*. Checkbox "Ingat saya" kini benar-benar mengoper `remember`
// ke doLogin (sebelumnya selalu true; default tetap dicentang = perilaku lama).
// ══════════════════════════════════════════
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doLogin, doRegister, doLoginGoogle, doResetPassword, switchAccount, getRememberedCred } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';
import AuthShell from '@/components/features/auth/AuthShell';
import LoginForm from '@/components/features/auth/LoginForm';
import RegisterForm from '@/components/features/auth/RegisterForm';
import RememberedUser from '@/components/features/auth/RememberedUser';

type LoginState = 'remembered' | 'form' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { uid } = useAppStore();
  const t = useT();

  useEffect(() => {
    if (uid) router.replace('/dashboard');
  }, [uid, router]);

  const remembered = typeof window !== 'undefined' ? getRememberedCred() : null;

  const [state,      setState]      = useState<LoginState>(remembered ? 'remembered' : 'form');
  const [email,      setEmail]      = useState(remembered?.email || '');
  const [pass,       setPass]       = useState(remembered?.pass || '');
  const [remember,   setRemember]   = useState(true);
  const [err,        setErr]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [gLoading,   setGLoading]   = useState(false);
  const [resetSent,   setResetSent]   = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [rEmail,     setREmail]     = useState('');
  const [rPass,      setRPass]      = useState('');
  const [rName,      setRName]      = useState('');
  const [rErr,       setRErr]       = useState('');
  const [rLoading,   setRLoading]   = useState(false);

  async function handleLanjutkan() {
    const currentUid = useAppStore.getState().uid;
    if (currentUid) { router.replace('/dashboard'); return; }
    if (remembered?.email && remembered?.pass) {
      setLoading(true); setErr('');
      const res = await doLogin(remembered.email, remembered.pass, true);
      setLoading(false);
      if (!res.error) { router.replace('/dashboard'); return; }
      setErr(res.error);
    }
    setState('form');
  }

  async function handleLogin() {
    if (!email || !pass) { setErr(t('login.requiredFields')); return; }
    setLoading(true); setErr('');
    const res = await doLogin(email, pass, remember);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleLoginGoogle() {
    setGLoading(true); setErr(''); setRErr('');
    const res = await doLoginGoogle();
    setGLoading(false);
    if (res.error) { if (state === 'register') setRErr(res.error); else setErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleReset() {
    if (!email) { setErr(t('login.resetEmailRequired')); return; }
    setResetLoading(true); setErr('');
    await doResetPassword(email);
    setResetLoading(false);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  }

  async function handleRegister() {
    if (!rEmail || !rPass || !rName) { setRErr(t('login.requiredFields')); return; }
    if (rPass.length < 6) { setRErr(t('login.passwordMin')); return; }
    setRLoading(true); setRErr('');
    const res = await doRegister(rEmail, rPass, rName);
    setRLoading(false);
    if (res.error) { setRErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleSwitchAccount() {
    await switchAccount();
    setErr('');
    setState('form');
  }

  const greeterName = remembered?.name || remembered?.email?.split('@')[0];

  return (
    <AuthShell>
      {state === 'remembered' && (
        <RememberedUser
          greeterName={greeterName} loading={loading} googleLoading={gLoading} error={err}
          onContinue={handleLanjutkan} onGoogle={handleLoginGoogle} onSwitch={handleSwitchAccount}
        />
      )}

      {state === 'form' && (
        <LoginForm
          email={email} pass={pass} remember={remember} error={err}
          loading={loading} googleLoading={gLoading}
          resetSent={resetSent} resetLoading={resetLoading}
          hasRemembered={!!remembered}
          onEmail={setEmail} onPass={setPass} onRemember={setRemember}
          onLogin={handleLogin} onGoogle={handleLoginGoogle} onReset={handleReset}
          onBack={() => setState('remembered')}
          onRegister={() => { setState('register'); setErr(''); }}
        />
      )}

      {state === 'register' && (
        <RegisterForm
          name={rName} email={rEmail} pass={rPass} error={rErr}
          loading={rLoading} googleLoading={gLoading}
          onName={setRName} onEmail={setREmail} onPass={setRPass}
          onSubmit={handleRegister} onGoogle={handleLoginGoogle}
          onLogin={() => { setState('form'); setRErr(''); }}
        />
      )}
    </AuthShell>
  );
}
