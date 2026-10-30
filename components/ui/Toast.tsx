// components/ui/Toast.tsx — Toast global (REDESAIN T6, CORE BLOCK v3 .toast)
// Register Tambahan A2: posisi Atas/Bawah (store: toastPosition). Di posisi Bawah + mode
// navigasi Bottom, toast berada DI ATAS bottom nav (offset --bnav-h).
// API lama dipertahankan (backward compatible, 25 pemakai):
//   showToast(msg, type?)  — type: 'ok' | 'err' | 'info' (+ 'warn' baru)
//   showToastUndo(msg, onUndo)
// Tambahan opsional: showToast(msg, type, description) → baris teks pendukung.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, Check, Info, Warning, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';

export type ToastType = 'ok' | 'err' | 'info' | 'warn';

interface ToastMsg {
  msg:    string;
  desc?:  string;
  type:   ToastType;
  id:     number;
  visible: boolean;
  onUndo?: (() => void) | undefined;
}

// ── Singletons ──
let _showToast:     ((msg: string, type?: ToastType, desc?: string) => void) | null = null;
let _showToastUndo: ((msg: string, onUndo: () => void) => void)              | null = null;

/** Tampilkan toast biasa — backward compatible. */
export function showToast(msg: string, type: ToastType = 'ok', description?: string) {
  _showToast?.(msg, type, description);
}

/** Tampilkan toast dengan tombol Batalkan selama 4 detik. */
export function showToastUndo(msg: string, onUndo: () => void) {
  _showToastUndo?.(msg, onUndo);
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  ok:   <Check   size="1em" weight="bold" />,
  err:  <X       size="1em" weight="bold" />,
  warn: <Warning size="1em" weight="fill" />,
  info: <Info    size="1em" weight="fill" />,
};

export const TOAST_DURATION      = 2400;
export const TOAST_UNDO_DURATION = 4000; // lebih lama untuk undo
export const TOAST_EXIT_DURATION = 220;
const MAX_TOASTS = 3;

export default function Toast() {
  const t = useT();
  const toastPosition = useAppStore(s => s.toastPosition);
  const navMode = useAppStore(s => s.navMode);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const later = useCallback((fn: () => void, ms: number) => {
    const h = setTimeout(() => { timers.current.delete(h); fn(); }, ms);
    timers.current.add(h);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(x => x.id === id ? { ...x, visible: false } : x));
    later(() => setToasts(prev => prev.filter(x => x.id !== id)), TOAST_EXIT_DURATION);
  }, [later]);

  useEffect(() => {
    const pending = timers.current;
    _showToast = (msg, type = 'ok', desc) => {
      const id = ++counter.current;
      setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { msg, desc, type, id, visible: true }]);
      later(() => dismiss(id), TOAST_DURATION);
    };
    _showToastUndo = (msg, onUndo) => {
      const id = ++counter.current;
      setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), { msg, type: 'ok', id, visible: true, onUndo }]);
      later(() => dismiss(id), TOAST_UNDO_DURATION);
    };
    return () => {
      _showToast = null; _showToastUndo = null;
      pending.forEach(clearTimeout); pending.clear();
    };
  }, [later, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="wp-toast-wrap" data-pos={toastPosition} data-nav={navMode}>
      {toasts.map(x => (
        <div
          key={x.id}
          className={`wp-toast wp-toast--${x.type}${x.visible ? '' : ' wp-toast--out'}`}
          role={x.type === 'err' ? 'alert' : 'status'}
          aria-live={x.type === 'err' ? 'assertive' : 'polite'}
        >
          <span className="wp-toast__ti" aria-hidden="true">{toastIcons[x.type]}</span>
          <span className="wp-toast__tb">
            <b>{x.msg}</b>
            {x.desc && <span>{x.desc}</span>}
          </span>
          {x.onUndo && (
            <button
              type="button"
              className="wp-toast__act"
              onClick={() => { x.onUndo?.(); dismiss(x.id); }}
            >
              <ArrowCounterClockwise size={12} weight="bold" aria-hidden="true" />
              {t('toast.undo')}
            </button>
          )}
          <button type="button" className="wp-toast__x" aria-label={t('common.close')} onClick={() => dismiss(x.id)}>
            <X size="1em" weight="bold" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
