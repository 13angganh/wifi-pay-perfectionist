// ══════════════════════════════════════════
// components/features/auth/RememberedUser.tsx
// Dipecah dari app/login/page.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import Image from 'next/image';
import { useT } from '@/hooks/useT';

interface Props {
  greeterName: string | null | undefined;
  loading:     boolean;
  error:       string;
  onContinue:  () => void;
  onSwitch:    () => void;
}

export default function RememberedUser({ greeterName, loading, error, onContinue, onSwitch }: Props) {
  const t = useT();
  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ width:56, height:56, borderRadius:14, overflow:'hidden', margin:'0 auto 14px', boxShadow:'0 4px 16px rgba(201,149,42,0.25)' }}>
          <Image src="/icon-512.png" alt="WiFi Pay" width={512} height={512} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        </div>
        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:22, color:'var(--txt)', letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:6 }}>
          {greeterName ? <>{t('login.greeting')}, {greeterName}</> : <>{t('login.greetingNew')}</>}
        </div>
      </div>
      <button className="lf-btn" onClick={onContinue} disabled={loading}>
        {loading ? t('common.loading') : t('login.continue')}
      </button>
      <div style={{ textAlign:'center', margin:'12px 0', fontSize:11, color:'var(--txt4)' }}>{t('login.or')}</div>
      <button className="lf-btn secondary" onClick={onSwitch} style={{ fontSize:12 }}>
        {t('login.changeAccount')}
      </button>
      {error && <div className="lf-err">{error}</div>}
    </div>
  );
}
