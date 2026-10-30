// components/ui/Sheet.tsx — bottom sheet / dialog (CORE usulan T3 `.md3`)
// Dipakai: RiwayatModal, RekapModal, sheet Member/Operasional/Log (T8–T10).
// Perilaku: Esc menutup, klik latar menutup (kecuali dismissible=false), fokus dikembalikan,
// scroll body dikunci, Tab terjebak di dalam dialog, dirender lewat portal ke <body>.
'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { IconButton } from './IconButton';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** elemen di sebelah kiri judul (mis. <IconTile/>) */
  leading?: ReactNode;
  children: ReactNode;
  /** 'sheet' = menempel di bawah; 'dialog' = kartu di tengah-atas */
  variant?: 'sheet' | 'dialog';
  wide?: boolean;
  dismissible?: boolean;
  className?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({
  open, onClose, title, subtitle, leading, children,
  variant = 'sheet', wide, dismissible = true, className,
}: SheetProps) {
  const t = useT();
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const box = boxRef.current;
    const first = box?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? box)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, dismissible]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={clsx('wp-md', variant === 'dialog' && 'wp-md--c', wide && 'wp-md--wide')}
      onClick={() => { if (dismissible) onClose(); }}
    >
      <div
        ref={boxRef}
        className={clsx('wp-md__bx', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || leading) && (
          <div className="wp-md__mh">
            {leading}
            <div className="wp-md__tx">
              {title && <div id={titleId} className="wp-t-head">{title}</div>}
              {subtitle && <div className="wp-t-cap">{subtitle}</div>}
            </div>
            {dismissible && <IconButton icon={X} label={t('common.close')} round onClick={onClose} />}
          </div>
        )}
        <div className="wp-md__mb">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Sheet;
