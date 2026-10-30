// ══════════════════════════════════════════
// components/features/auth/PasswordField.tsx — input password + tombol tampil/sembunyi
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Eye, EyeSlash, LockKey } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  ariaLabel: string;
}

export default function PasswordField({ value, onChange, onEnter, autoComplete, placeholder = '••••••••', ariaLabel }: Props) {
  const t = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="wp-inpw">
      <span className="wp-inpw__ico" aria-hidden="true"><LockKey size="1em" /></span>
      <input
        className="wp-inp"
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); }}
      />
      <button
        type="button"
        className="wp-inpw__end"
        aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
        aria-pressed={show}
        onClick={() => setShow(s => !s)}
      >
        {show ? <EyeSlash size="1em" /> : <Eye size="1em" />}
      </button>
    </div>
  );
}
