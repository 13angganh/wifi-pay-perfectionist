// components/ui/Numpad.tsx — keypad angka 3x4 (T5 `.npad`)
// Tanpa logika PIN: memanggil onDigit/onBackspace. Slot kiri-bawah = `extra` (mis. tombol biometrik).
'use client';

import { Backspace } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export interface NumpadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  backspaceLabel: string;
  disabled?: boolean;
  /** isi slot kiri-bawah; kosong = sel kosong */
  extra?: ReactNode;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Numpad({ onDigit, onBackspace, backspaceLabel, disabled, extra }: NumpadProps) {
  return (
    <div className="wp-npad">
      {DIGITS.map(d => (
        <button key={d} type="button" disabled={disabled} onClick={() => onDigit(d)}>{d}</button>
      ))}
      {extra ?? <span aria-hidden="true" />}
      <button type="button" disabled={disabled} onClick={() => onDigit('0')}>0</button>
      <button type="button" disabled={disabled} aria-label={backspaceLabel} onClick={onBackspace}>
        <Backspace size="1em" weight="regular" aria-hidden="true" />
      </button>
    </div>
  );
}

export default Numpad;
