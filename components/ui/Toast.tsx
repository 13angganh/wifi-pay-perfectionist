// components/ui/Toast.tsx — Fase 4: posisi atas, slide down, Lucide, glassmorphism
'use client';

import { useEffect, useState } from 'react';
import { Check, X, Info } from 'lucide-react';

export type ToastType = 'ok' | 'err' | 'info';
interface ToastMsg { msg: string; type: ToastType; id: number; visible: boolean; }

let _showToast: ((msg: string, type?: ToastType) => void) | null = null;
export function showToast(msg: string, type: ToastType = 'ok') { _showToast?.(msg, type); }

const toastIcons: Record<ToastType, React.ReactNode> = {
  ok:   <Check size={14} strokeWidth={2} />,
  err:  <X     size={14} strokeWidth={2} />,
  info: <Info  size={14} strokeWidth={1.5} />,
};

const toastColors: Record<ToastType, string> = {
  ok:   'var(--c-lunas)',
  err:  'var(--c-belum)',
  info: 'var(--zc)',
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    _showToast = (msg, type = 'ok') => {
      const id = Date.now();
      setToasts(prev => [...prev.slice(-2), { msg, type, id, visible: true }]);
      // Mulai hide setelah 2.4s
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      }, 2400);
      // Hapus dari DOM setelah animasi
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 2750);
    };
    return () => { _showToast = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:'fixed',
      top:'calc(var(--header-h, 88px) + 8px)',
      left:'50%', transform:'translateX(-50%)',
      zIndex:9000,
      display:'flex', flexDirection:'column',
      alignItems:'center', gap:6,
      pointerEvents:'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'8px 14px',
            borderRadius:'var(--r-full)',
            backdropFilter:'blur(16px)',
            background:'rgba(24,28,39,0.88)',
            border:'1px solid rgba(255,255,255,0.08)',
            boxShadow:'var(--shadow-md)',
            color:'var(--txt)',
            fontSize:13, fontFamily:"var(--font-sans),sans-serif",
            whiteSpace:'nowrap', maxWidth:'90vw',
            overflow:'hidden', textOverflow:'ellipsis',
            animation: t.visible
              ? 'toastIn 220ms var(--ease-out) forwards'
              : 'toastOut 200ms var(--ease-in) forwards',
          }}
        >
          <span style={{ color: toastColors[t.type], flexShrink:0, display:'flex' }}>
            {toastIcons[t.type]}
          </span>
          <span style={{ color:'var(--txt)' }}>{t.msg}</span>
        </div>
      ))}

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform: translateY(-8px) scale(.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity:1; transform: translateY(0) scale(1); }
          to   { opacity:0; transform: translateY(-6px) scale(.96); }
        }
      `}</style>
    </div>
  );
}
