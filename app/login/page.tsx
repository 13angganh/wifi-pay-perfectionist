'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doLogin, doRegister, doLoginGoogle, doResetPassword, switchAccount, getRememberedCred } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';

type LoginState = 'remembered' | 'form' | 'register';

// Tombol Google — komponen terpisah agar tidak re-render parent
function GoogleButton({ onClick, loading, label }: {
  onClick: () => void; loading: boolean; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        padding:'11px 14px', borderRadius:'var(--r-sm)', cursor: loading ? 'not-allowed' : 'pointer',
        background:'var(--bg)', border:'1px solid var(--border)',
        color:'var(--txt)', fontSize:13, fontWeight:600,
        fontFamily:"var(--font-sans),sans-serif",
        transition:'all var(--t-fast)', opacity: loading ? 0.6 : 1,
        marginBottom: 0,
      }}
    >
      {/* Google G icon */}
      <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.6 6.4 6.3 14.7z"/>
        <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.6-5.3l-6.8-5.6C29.8 36.8 27 37.8 24 37.8c-6 0-11.1-4-12.9-9.5l-7 5.4C7.5 42.1 15.2 46 24 46z"/>
        <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1.6 4.4-5.8 7.5-11.8 7.5-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" opacity="0"/>
      </svg>
      {loading ? 'Menghubungkan...' : label}
    </button>
  );
}

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
    const res = await doLogin(email, pass, true);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleLoginGoogle() {
    setGLoading(true); setErr('');
    const res = await doLoginGoogle();
    setGLoading(false);
    if (res.error) { setErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleReset() {
    if (!email) { setErr('Masukkan email dulu.'); return; }
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

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
    color:'var(--txt)', padding:'10px 14px', borderRadius:'var(--r-sm)', fontSize:14,
    marginBottom:14, fontFamily:"var(--font-mono),monospace", outline:'none',
    transition:'border .2s', boxSizing:'border-box',
  };

  const divider = (
    <div style={{ textAlign:'center', margin:'14px 0', fontSize:10, color:'var(--txt5)', position:'relative' }}>
      <div style={{ position:'absolute', left:0, top:'50%', right:0, height:1, background:'var(--border)' }} />
      <span style={{ background:'var(--bg2)', padding:'0 10px', position:'relative' }}>atau</span>
    </div>
  );

  const greeterName = remembered?.name || remembered?.email?.split('@')[0];

  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:24, zIndex:200, overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{ width:80, height:80, borderRadius:20, overflow:'hidden', marginBottom:16, boxShadow:'0 8px 32px rgba(201,149,42,0.3), 0 0 0 1px rgba(255,255,255,0.06)' }}>
        <Image src="/icon-512.png" alt="WiFi Pay" width={512} height={512} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>
      <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:26, fontWeight:800, letterSpacing:'-0.03em', marginBottom:2 }}>
        WiFi Pay
      </div>
      <div style={{ fontSize:10, color:'var(--txt4)', letterSpacing:'.12em', marginBottom:28 }}>v11.2 Next</div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:24, width:'100%', maxWidth:360, boxShadow:'var(--shadow-md)' }}>

        {/* STATE A — Remembered */}
        {state === 'remembered' && (
          <div>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:56, height:56, borderRadius:14, overflow:'hidden', margin:'0 auto 14px', boxShadow:'0 4px 16px rgba(201,149,42,0.25)' }}>
                <Image src="/icon-512.png" alt="WiFi Pay" width={512} height={512} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:22, color:'var(--txt)', letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:6 }}>
                {greeterName ? <>{t('login.greeting')}, {greeterName}</> : <>{t('login.greetingNew')}</>}
              </div>
            </div>
            <button className="lf-btn" onClick={handleLanjutkan} disabled={loading}>
              {loading ? t('common.loading') : t('login.continue')}
            </button>
            {divider}
            <GoogleButton onClick={handleLoginGoogle} loading={gLoading} label="Masuk dengan Google" />
            <div style={{ marginTop:10 }}>
              <button className="lf-btn secondary" onClick={handleSwitchAccount} style={{ fontSize:12 }}>
                {t('login.changeAccount')}
              </button>
            </div>
            {err && <div className="lf-err">{err}</div>}
          </div>
        )}

        {/* STATE B — Form Login */}
        {state === 'form' && (
          <div>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:20, color:'var(--txt)', letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:4 }}>
                {t('login.greetingNew')}
              </div>
              <div style={{ fontSize:12, color:'var(--txt3)' }}>{t('login.continuePrompt')}</div>
            </div>

            {remembered && (
              <button onClick={() => setState('remembered')} style={{ background:'none', border:'none', color:'var(--txt3)', fontSize:11, cursor:'pointer', marginBottom:12, display:'block' }}>
                ← {t('action.back')}
              </button>
            )}

            <GoogleButton onClick={handleLoginGoogle} loading={gLoading} label="Masuk dengan Google" />
            {divider}

            <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>EMAIL</div>
            <input
              style={inputStyle} type="email" inputMode="email" placeholder="email@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
              onFocus={e => (e.target as HTMLInputElement).style.borderColor='var(--zc)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor='var(--border)'}
            />
            <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>PASSWORD</div>
            <input
              style={inputStyle} type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor='var(--zc)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor='var(--border)'}
            />
            {err && <div className="lf-err">{err}</div>}
            <button className="lf-btn" onClick={handleLogin} disabled={loading}>
              {loading ? t('common.loading') : t('login.submit')}
            </button>
            {resetSent && (
              <div style={{ fontSize:11, color:'var(--c-lunas)', textAlign:'center', padding:'8px 12px', background:'rgba(34,197,94,0.07)', borderRadius:'var(--r-sm)', border:'1px solid rgba(34,197,94,0.2)', marginBottom:8 }}>
                ✓ Link reset dikirim ke {email} — cek inbox
              </div>
            )}
            <div style={{ textAlign:'center', marginTop:4, marginBottom:10 }}>
              <span
                style={{ fontSize:11, color:'var(--txt3)', cursor:'pointer', textDecoration:'underline' }}
                onClick={handleReset}
              >
                {resetLoading ? 'Mengirim...' : 'Lupa password?'}
              </span>
            </div>
            <div style={{ textAlign:'center', marginTop:4, fontSize:11, color:'var(--txt3)' }}>
              {t('login.noAccount')}{' '}
              <span style={{ color:'var(--zc)', cursor:'pointer' }} onClick={() => { setState('register'); setErr(''); }}>
                {t('login.registerHere')}
              </span>
            </div>
          </div>
        )}

        {/* STATE C — Register */}
        {state === 'register' && (
          <div>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:20, color:'var(--txt)', letterSpacing:'-0.02em' }}>
                {t('login.createAccount')}
              </div>
            </div>

            <GoogleButton onClick={handleLoginGoogle} loading={gLoading} label="Daftar dengan Google" />
            {divider}

            {([t('login.email').toUpperCase(), t('login.passwordMin6').toUpperCase(), t('login.username').toUpperCase()] as const).map((label, i) => {
              const vals  = [rEmail, rPass, rName];
              const types = ['email','password','text'] as const;
              const modes = ['email','current-password','name'] as const;
              const sets  = [setREmail, setRPass, setRName];
              return (
                <div key={label}>
                  <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>{label}</div>
                  <input
                    style={inputStyle} type={types[i]} autoComplete={modes[i]}
                    placeholder={i===0?'email@gmail.com':i===1?'••••••••':t('login.namePlaceholder')}
                    value={vals[i]} onChange={e => sets[i](e.target.value)}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor='var(--zc)'}
                    onBlur={e  => (e.target as HTMLInputElement).style.borderColor='var(--border)'}
                  />
                </div>
              );
            })}
            {rErr && <div className="lf-err">{rErr}</div>}
            <button className="lf-btn" onClick={handleRegister} disabled={rLoading}>
              {rLoading ? t('common.loading') : t('login.registerSubmit')}
            </button>
            <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'var(--txt3)' }}>
              {t('login.hasAccount')}{' '}
              <span style={{ color:'var(--zc)', cursor:'pointer' }} onClick={() => { setState('form'); setRErr(''); }}>
                {t('login.loginHere')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
