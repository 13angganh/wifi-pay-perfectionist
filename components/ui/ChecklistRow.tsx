// components/ui/ChecklistRow.tsx — baris daftar centang (T5 `.tmr/.tzh`)
// Pemakai: pilih member untuk Akun Penagih. Seluruh baris = satu checkbox (role=checkbox).
'use client';

import type { ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';

export function ChecklistHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="wp-tzh"><b>{children}</b>{action}</div>;
}

export interface ChecklistRowProps {
  checked: boolean;
  onToggle: (next: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function ChecklistRow({ checked, onToggle, children, disabled }: ChecklistRowProps) {
  return (
    <div
      className="wp-tmr"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) onToggle(!checked); }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(!checked); }
      }}
    >
      <span className={`wp-cbx${checked ? ' wp-cbx--on' : ''}${disabled ? ' wp-cbx--dis' : ''}`} aria-hidden="true">
        {checked && <Check size="1em" weight="bold" />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </div>
  );
}

export default ChecklistRow;
