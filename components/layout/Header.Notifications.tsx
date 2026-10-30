// ══════════════════════════════════════════
// components/layout/Header.Notifications.tsx — Pusat Notifikasi (Register Tambahan A3)
// REDESAIN T6: HANYA KERANGKA — lonceng + panel + status kosong.
// Isi daftar, penanda sudah-dibaca dan lencana jumlah dikerjakan di T10
// (rancangan: serah-terima T5 keputusan D12). Slot yang disiapkan:
//   - prop `unreadCount`  → lencana angka di lonceng (default 0 = tanpa lencana)
//   - prop `children`     → isi daftar (T10); kosong = tampilan "belum ada notifikasi"
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, BellSlash, X } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import IconButton from '@/components/ui/IconButton';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  unreadCount?: number;
  /** REDESAIN T10 (revisi eksplisit): boleh fungsi (menerima `close` untuk menutup panel setelah item diketuk). */
  children?: ReactNode | ((close: () => void) => ReactNode);
}

export default function HeaderNotifications({ unreadCount = 0, children }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="hdr-notif">
      <IconButton
        icon={Bell}
        label={t('notif.title')}
        round
        weight={open ? 'fill' : 'regular'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(o => !o)}
        badge={unreadCount > 0 ? <i className="hdr-bdg" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</i> : undefined}
      />
      {open && (
        <div className="hdr-notif__panel" role="dialog" aria-label={t('notif.title')}>
          <div className="hdr-notif__head">
            <b className="wp-t-head">{t('notif.title')}</b>
            <IconButton icon={X} label={t('common.close')} size="sm" onClick={() => setOpen(false)} />
          </div>
          {(typeof children === 'function' ? children(() => setOpen(false)) : children) ?? (
            <EmptyState size="sm" icon={BellSlash} title={t('notif.empty')} description={t('notif.emptyDesc')} />
          )}
        </div>
      )}
    </div>
  );
}
