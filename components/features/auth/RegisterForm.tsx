// ══════════════════════════════════════════
// components/features/auth/RegisterForm.tsx
// Dipecah dari app/login/page.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useT } from '@/hooks/useT';

interface Props {
  rEmail:   string;
  rPass:    string;
  rName:    string;
  rErr:     string;
  rLoading: boolean;
  onREmail:    (v: string) => void;
  onRPass:     (v: string) => void;
  onRName:     (v: string) => void;
  onRegister:  () => void;
  onBackToLogin: () => void;
}

const inputStyle: React.CSSProperties = {
  width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
  color:'var(--txt)', padding:'10px 14px', borderRadius:'var(--r-sm)', fontSize:14,
  marginBottom:14, fontFamily:"var(--font-mono),monospace", outline:'none',
  transition:'border .2s', boxSizing:'border-box',
};

export default function RegisterForm({ rEmail, rPass, rName, rErr, rLoading, onREmail, onRPass, onRName, onRegister, onBackToLogin }: Props) {
  const t = useT();
  const fields = [
    { label: t('login.email').toUpperCase(),       type:'email'    as const, val:rEmail, set:onREmail, ph:'email@gmail.com',       ac:'email'            as const },
    { label: t('login.passwordMin6').toUpperCase(), type:'password' as const, val:rPass,  set:onRPass,  ph:'••••••••',               ac:'current-password' as const },
    { label: t('login.username').toUpperCase(),    type:'text'     as const, val:rName,  set:onRName,  ph:t('login.namePlaceholder'), ac:'name'            as const },
  ];

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:20, color:'var(--txt)', letterSpacing:'-0.02em' }}>
          {t('login.createAccount')}
        </div>
      </div>

      {fields.map(f => (
        <div key={f.label}>
          <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>{f.label}</div>
          <input
            style={inputStyle} type={f.type} autoComplete={f.ac} placeholder={f.ph}
            value={f.val} onChange={e => f.set(e.target.value)}
            onFocus={e => ((e.target as HTMLInputElement).style.borderColor = 'var(--zc)')}
            onBlur={e  => ((e.target as HTMLInputElement).style.borderColor = 'var(--border)')}
          />
        </div>
      ))}

      {rErr && <div className="lf-err">{rErr}</div>}
      <button className="lf-btn" onClick={onRegister} disabled={rLoading}>
        {rLoading ? t('common.loading') : t('login.registerSubmit')}
      </button>

      <div style={{ textAlign:'center', margin:'12px 0', fontSize:10, color:'var(--txt5)', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:'50%', right:0, height:1, background:'var(--border)' }} />
        <span style={{ background:'var(--bg2)', padding:'0 10px', position:'relative' }}>{t('login.or')}</span>
      </div>
      <div style={{ fontSize:11, color:'var(--txt3)', textAlign:'center' }}>
        {t('login.hasAccount')}{' '}
        <span style={{ color:'var(--zc)', cursor:'pointer' }} onClick={onBackToLogin}>
          {t('login.loginHere')}
        </span>
      </div>
    </div>
  );
}
