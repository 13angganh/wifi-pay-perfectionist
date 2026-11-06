// ══════════════════════════════════════════
// app/login/page.tsx — Login (REDESAIN T6)
// Logika autentikasi TIDAK berubah (doLogin/doRegister/doLoginGoogle/doResetPassword/
// switchAccount/getRememberedCred dari hooks/useAuth.ts). Tampilan dipecah ke
// components/features/auth/*. Checkbox "Ingat saya" kini benar-benar mengoper `remember`
// ke doLogin (sebelumnya selalu true; default tetap dicentang = perilaku lama).
// ══════════════════════════════════════════
'use client';

import { useState, useEffect } from 'react';
import { normalizeDisplayName } from '@/lib/displayName';
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
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0); // v11.11.1: jeda kirim ulang (detik)
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

  // v11.11.1: jeda kirim ulang 60 dtk; pesan "terkirim" hilang bersama jeda itu (bukan 5 dtk), agar sempat terbaca.
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const id = setTimeout(() => setResetCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resetCooldown]);

  async function handleReset() {
    if (resetLoading || resetCooldown > 0) return;
    if (!email) { setErr(t('login.resetEmailRequired')); return; }
    setResetLoading(true); setErr('');
    const res = await doResetPassword(email);
    setResetLoading(false);
    // v11.11.1: galat NYATA ditampilkan (dulu hasil diabaikan dan selalu tampil "terkirim").
    if (res.error) { setErr(res.error); return; }
    setResetCooldown(60);
  }

  async function handleRegister() {
    if (!rEmail || !rPass || !normalizeDisplayName(rName)) { setRErr(t('login.requiredFields')); return; }
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

  // v11.11.0: hanya nama tampilan akun (tanpa awalan email); kosong → sapaan netral "login.greetingNew"
  const greeterName = remembered?.name || null;

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
          resetSent={resetCooldown > 0} resetLoading={resetLoading} resetCooldown={resetCooldown}
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
