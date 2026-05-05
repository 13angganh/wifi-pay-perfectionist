// ══════════════════════════════════════════
// components/ui/PinLock.Numpad.tsx
// Dipecah dari PinLock.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { Delete } from 'lucide-react';

interface Props {
  onPress: (key: string) => void;
}

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','DEL'];

export default function PinNumpad({ onPress }: Props) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 56px)', gap:10 }}>
      {PAD_KEYS.map((k, i) => (
        <button
          key={i}
          disabled={k === ''}
          onClick={() => k && onPress(k)}
          style={{
            width: 56, height: 56,
            borderRadius: '50%',
            border: k === '' ? 'none' : '1px solid var(--border)',
            background: k === '' ? 'transparent' : 'var(--bg3)',
            color: 'var(--txt)',
            fontSize: k === 'DEL' ? 12 : 20,
            fontFamily: "var(--font-mono), monospace",
            fontWeight: 500,
            cursor: k === '' ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--t-fast-smooth)',
            opacity: k === '' ? 0 : 1,
          }}
          aria-label={k === 'DEL' ? 'Hapus digit terakhir' : k === '' ? undefined : `Tekan ${k}`}
        >
          {k === 'DEL' ? <Delete size={18} strokeWidth={1.5} /> : k}
        </button>
      ))}
    </div>
  );
}
