// components/ui/Toast.tsx — Fase 4 + UX Fix
// UX FIX: Tambah showToastUndo() untuk undo payment action
// Backward compatible: showToast(msg, type) tidak berubah
'use client';

import { useEffect, useState } from 'react';
import { Check, X, Info, RotateCcw } from 'lucide-react';

export type ToastType = 'ok' | 'err' | 'info';

interface ToastMsg {
  msg:    string;
  type:   ToastType;
  id:     number;
  visible: boolean;
  onUndo?: (() => void) | undefined;
}

// ── Singletons ──
let _showToast:     ((msg: string, type?: ToastType) => void)             | null = null;
let _showToastUndo: ((msg: string, onUndo: () => void) => void)           | null = null;

/** Tampilkan toast biasa — backward compatible */
export function showToast(msg: string, type: ToastType = 'ok') {
  _showToast?.(msg, type);
}

/** Tampilkan toast dengan tombol Batalkan selama 4 detik */
export function showToastUndo(msg: string, onUndo: () => void) {
  _showToastUndo?.(msg, onUndo);
}

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

const TOAST_DURATION      = 2400;
const TOAST_UNDO_DURATION = 4000; // lebih lama untuk undo
const TOAST_EXIT_DURATION = 350;

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    // Regular toast
    _showToast = (msg, type = 'ok') => {
      const id = Date.now();
      setToasts(prev => [...prev.slice(-2), { msg, type, id, visible: true }]);
      setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t)), TOAST_DURATION);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION + TOAST_EXIT_DURATION);
    };

    // Undo toast
    _showToastUndo = (msg, onUndo) => {
      const id = Date.now();
      setToasts(prev => [...prev.slice(-2), { msg, type: 'ok', id, visible: true, onUndo }]);
      setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t)), TOAST_UNDO_DURATION);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_UNDO_DURATION + TOAST_EXIT_DURATION);
    };

    return () => { _showToast = null; _showToastUndo = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:  'fixed',
      top:       'calc(var(--header-h, 88px) + 8px)',
      left:      '50%',
      transform: 'translateX(-50%)',
      zIndex:    9000,
      display:   'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: t.onUndo ? '8px 8px 8px 14px' : '8px 14px',
            borderRadius: 'var(--r-full)',
            backdropFilter: 'blur(16px)',
            background: 'rgba(24,28,39,0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--txt)',
            fontSize: 13,
            fontFamily: 'var(--font-sans),sans-serif',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: t.onUndo ? 'auto' : 'none',
            animation: t.visible
              ? 'toastIn 220ms var(--ease-out) forwards'
              : 'toastOut 200ms var(--ease-in) forwards',
          }}
        >
          <span style={{ color: toastColors[t.type], flexShrink: 0, display: 'flex' }}>
            {toastIcons[t.type]}
          </span>
          <span style={{ color: 'var(--txt)' }}>{t.msg}</span>

          {/* Tombol Batalkan — hanya muncul jika ada onUndo */}
          {t.onUndo && (
            <button
              onClick={() => {
                t.onUndo?.();
                // Langsung dismiss toast ini
                setToasts(prev => prev.filter(x => x.id !== t.id));
              }}
              style={{
                marginLeft: 4,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--txt)',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                minHeight: 28,
              }}
            >
              <RotateCcw size={10} />
              Batalkan
            </button>
          )}
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
