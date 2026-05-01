// app/login/page.tsx — Fase 4: greeting hero, Lucide Wifi logo
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doLogin, doRegister, loginRemembered } from '@/hooks/useAuth';
import { getSavedCred } from '@/lib/helpers';
import { useT } from '@/hooks/useT';

type LoginState = 'remembered' | 'form' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { uid } = useAppStore();
  const t = useT();

  useEffect(() => {
    if (uid) router.replace('/dashboard');
  }, [uid, router]);

  const savedCred  = typeof window !== 'undefined' ? getSavedCred() : null;
  const savedName  = typeof window !== 'undefined' ? localStorage.getItem('wp_remember_name') : null;

  const [state,    setState]   = useState<LoginState>(savedCred ? 'remembered' : 'form');
  const [email,    setEmail]   = useState(savedCred?.email || '');
  const [pass,     setPass]    = useState(savedCred?.pass  || '');
  const [err,      setErr]     = useState('');
  const [loading,  setLoading] = useState(false);
  const [rEmail,   setREmail]  = useState('');
  const [rPass,    setRPass]   = useState('');
  const [rName,    setRName]   = useState('');
  const [rErr,     setRErr]    = useState('');
  const [rLoading, setRLoading]= useState(false);

  async function handleLanjutkan() {
    setLoading(true); setErr('');
    const res = await loginRemembered();
    setLoading(false);
    if (res.error === 'no_cred') { setState('form'); return; }
    if (res.error) { setErr(res.error); return; }
    router.replace('/dashboard');
  }

  async function handleLogin() {
    if (!email || !pass) { setErr(t('login.requiredFields')); return; }
    setLoading(true); setErr('');
    const res = await doLogin(email, pass);
    setLoading(false);
    if (res.error) { setErr(res.error); return; }
    router.replace('/dashboard');
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

  function handleSwitchAccount() {
    setEmail(savedCred?.email || '');
    setPass(savedCred?.pass   || '');
    setErr('');
    setState('form');
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
    color:'var(--txt)', padding:'10px 14px', borderRadius:'var(--r-sm)', fontSize:14,
    marginBottom:14, fontFamily:"'DM Mono',monospace", outline:'none',
    transition:'border .2s', boxSizing:'border-box',
  };

  // Nama sapaan
  const greeterName = savedName || savedCred?.email?.split('@')[0];

  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:24, zIndex:200,
      overflowY:'auto',
    }}>
      {/* Logo gambar nyata */}
      <div style={{
        width:80, height:80,
        borderRadius:20,
        overflow:'hidden',
        marginBottom:16,
        boxShadow:'0 8px 32px rgba(201,149,42,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        <img src="/icon-512.png" alt="WiFi Pay" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
      </div>

      <div style={{
        fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800,
        letterSpacing:'-0.03em', marginBottom:2,
      }}>
        WiFi Pay
      </div>
      <div style={{ fontSize:10, color:'var(--txt4)', letterSpacing:'.12em', marginBottom:28 }}>
        v11.2 Next
      </div>

      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', padding:24,
        width:'100%', maxWidth:360,
        boxShadow:'var(--shadow-md)',
      }}>

        {/* STATE A — Remembered */}
        {state === 'remembered' && (
          <div>
            {/* Greeting hero */}
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{
                width:56, height:56,
                borderRadius:14,
                overflow:'hidden',
                margin:'0 auto 14px',
                boxShadow:'0 4px 16px rgba(201,149,42,0.25)',
              }}>
                <img src="/icon-512.png" alt="WiFi Pay" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{
                fontFamily:"'Syne',sans-serif", fontWeight:800,
                fontSize:22, color:'var(--txt)',
                letterSpacing:'-0.02em', lineHeight:1.2,
                marginBottom:6,
              }}>
                {greeterName
                  ? <>{t('login.greeting')}, {greeterName}</>
                  : <>{t('login.greetingNew')}</>
                }
              </div>
            </div>

            <button
              className="lf-btn"
              onClick={handleLanjutkan}
              disabled={loading}
              style={{
                background:'#3B82F6',
                boxShadow:'0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              {loading ? t('common.loading') : t('login.continue')}
            </button>
            <div style={{ textAlign:'center', margin:'12px 0', fontSize:11, color:'var(--txt4)' }}>{t('login.or')}</div>
            <button
              className="lf-btn secondary"
              onClick={handleSwitchAccount}
              style={{ fontSize:12 }}
            >
              {t('login.changeAccount')}
            </button>
            {err && <div className="lf-err">{err}</div>}
          </div>
        )}

        {/* STATE B — Form Login */}
        {state === 'form' && (
          <div>
            {/* Greeting hero untuk form biasa */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{
                fontFamily:"'Syne',sans-serif", fontWeight:800,
                fontSize:20, color:'var(--txt)',
                letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:4,
              }}>
                {t('login.greetingNew')}
              </div>
              <div style={{ fontSize:12, color:'var(--txt3)' }}>
                {t('login.continuePrompt')}
              </div>
            </div>

            {savedCred && (
              <button
                onClick={() => setState('remembered')}
                style={{
                  background:'none', border:'none', color:'var(--txt3)',
                  fontSize:11, cursor:'pointer', marginBottom:12, display:'block',
                }}
              >
                ← {t('action.back')}
              </button>
            )}

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
            <button
              className="lf-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                background:'#3B82F6',
                boxShadow:'0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              {loading ? t('common.loading') : t('login.submit')}
            </button>
            <div style={{ textAlign:'center', margin:'12px 0', fontSize:10, color:'var(--txt5)', position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:'50%', right:0, height:1, background:'var(--border)' }} />
              <span style={{ background:'var(--bg2)', padding:'0 10px', position:'relative' }}>{t('login.or')}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--txt3)', textAlign:'center' }}>
              {t('login.noAccount')}{' '}
              <span
                style={{ color:'#3B82F6', cursor:'pointer' }}
                onClick={() => { setState('register'); setErr(''); }}
              >
                {t('login.registerHere')}
              </span>
            </div>
          </div>
        )}

        {/* STATE C — Register */}
        {state === 'register' && (
          <div>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{
                fontFamily:"'Syne',sans-serif", fontWeight:800,
                fontSize:20, color:'var(--txt)', letterSpacing:'-0.02em',
              }}>
                {t('login.createAccount')}
              </div>
            </div>

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
            <button
              className="lf-btn"
              onClick={handleRegister}
              disabled={rLoading}
              style={{
                background:'#3B82F6',
                boxShadow:'0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              {rLoading ? t('common.loading') : t('login.registerSubmit')}
            </button>
            <div style={{ textAlign:'center', margin:'12px 0', fontSize:10, color:'var(--txt5)', position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:'50%', right:0, height:1, background:'var(--border)' }} />
              <span style={{ background:'var(--bg2)', padding:'0 10px', position:'relative' }}>{t('login.or')}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--txt3)', textAlign:'center' }}>
              {t('login.hasAccount')}{' '}
              <span
                style={{ color:'#3B82F6', cursor:'pointer' }}
                onClick={() => { setState('form'); setRErr(''); }}
              >
                {t('login.loginHere')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
