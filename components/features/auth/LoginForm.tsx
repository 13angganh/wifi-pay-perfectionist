// ══════════════════════════════════════════
// components/features/auth/LoginForm.tsx
// Dipecah dari app/login/page.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useT } from '@/hooks/useT';

interface Props {
  email:       string;
  pass:        string;
  error:       string;
  loading:     boolean;
  hasRemembered: boolean;
  onEmail:     (v: string) => void;
  onPass:      (v: string) => void;
  onLogin:     () => void;
  onBack:      () => void;
  onRegister:  () => void;
}

const inputStyle: React.CSSProperties = {
  width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
  color:'var(--txt)', padding:'10px 14px', borderRadius:'var(--r-sm)', fontSize:14,
  marginBottom:14, fontFamily:"var(--font-mono),monospace", outline:'none',
  transition:'border .2s', boxSizing:'border-box',
};

export default function LoginForm({ email, pass, error, loading, hasRemembered, onEmail, onPass, onLogin, onBack, onRegister }: Props) {
  const t = useT();
  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:20, color:'var(--txt)', letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:4 }}>
          {t('login.greetingNew')}
        </div>
        <div style={{ fontSize:12, color:'var(--txt3)' }}>{t('login.continuePrompt')}</div>
      </div>

      {hasRemembered && (
        <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--txt3)', fontSize:11, cursor:'pointer', marginBottom:12, display:'block' }}>
          ← {t('action.back')}
        </button>
      )}

      <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>EMAIL</div>
      <input
        style={inputStyle} type="email" inputMode="email" placeholder="email@gmail.com"
        value={email} onChange={e => onEmail(e.target.value)} autoComplete="email"
        onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--zc)')}
        onBlur={e  => ((e.target as HTMLInputElement).style.borderColor = 'var(--border)')}
      />
      <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>PASSWORD</div>
      <input
        style={inputStyle} type="password" placeholder="••••••••"
        value={pass} onChange={e => onPass(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onLogin()}
        onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--zc)')}
        onBlur={e  => ((e.target as HTMLInputElement).style.borderColor = 'var(--border)')}
      />
      {error && <div className="lf-err">{error}</div>}
      <button className="lf-btn" onClick={onLogin} disabled={loading}>
        {loading ? t('common.loading') : t('login.submit')}
      </button>

      <div style={{ textAlign:'center', margin:'12px 0', fontSize:10, color:'var(--txt5)', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:'50%', right:0, height:1, background:'var(--border)' }} />
        <span style={{ background:'var(--bg2)', padding:'0 10px', position:'relative' }}>{t('login.or')}</span>
      </div>
      <div style={{ fontSize:11, color:'var(--txt3)', textAlign:'center' }}>
        {t('login.noAccount')}{' '}
        <span style={{ color:'var(--zc)', cursor:'pointer' }} onClick={onRegister}>
          {t('login.registerHere')}
        </span>
      </div>
    </div>
  );
}
