// components/ui/Confirm.tsx — Dialog konfirmasi (REDESAIN T6, CORE BLOCK v3 .confirm)
// - State tetap di Zustand uiSlice; helper imperatif showConfirm() TIDAK berubah.
// - `icon` (string) kini KUNCI SEMANTIK: 'trash' | 'lock' | 'warning' | 'switch' | 'signout' |
//   'question' | 'info'. Nilai lama dari pemanggil yang belum dimigrasi (emoji, simbol, '[PURGE]',
//   kosong) dipetakan ke ikon Phosphor yang setara — TIDAK PERNAH dirender sebagai teks/emoji.
//   Pemanggil diganti ke kunci semantik di tahap pemilik layarnya (lihat docs/REDESAIN-MANIFEST.md).
'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowsLeftRight, Info, Lock, Question, SignOut, Trash, Warning,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { Button } from './Button';
import type { AnyIcon } from './icons';

// ── Helper imperatif — bisa dipanggil dari mana saja tanpa React context ──
export function showConfirm(
  icon: string,
  title: string,
  yesLabel: string,
  cb: () => void,
  options?: {
    description?: string;
    highlight?:   string;
    highlightColor?: string;
  }
) {
  useAppStore.getState().showConfirmDialog({
    icon,
    title,
    yesLabel,
    cb,
    description:     options?.description,
    highlight:       options?.highlight,
    highlightColor:  options?.highlightColor,
  });
}

type Tone = 'danger' | 'info';
interface Resolved { Icon: AnyIcon; tone: Tone }

const SEMANTIC: Record<string, Resolved> = {
  trash:    { Icon: Trash,           tone: 'danger' },
  lock:     { Icon: Lock,            tone: 'danger' },
  warning:  { Icon: Warning,         tone: 'danger' },
  signout:  { Icon: SignOut,         tone: 'danger' },
  switch:   { Icon: ArrowsLeftRight, tone: 'info'   },
  question: { Icon: Question,        tone: 'info'   },
  info:     { Icon: Info,            tone: 'info'   },
};

// Pemetaan nilai lama (dipakai pemanggil yang belum dimigrasi). Ditulis sebagai escape
// unicode supaya tidak ada emoji literal di source.
const LEGACY: Array<[string, string]> = [
  ['\u{1F5D1}', 'trash'],   // ikon tempat sampah
  ['[PURGE]',   'trash'],
  ['\u{1F512}', 'lock'],    // ikon gembok
  ['\u2194',    'switch'],  // panah dua arah
];

export function resolveConfirmIcon(icon?: string): Resolved {
  const raw = (icon ?? '').trim();
  const direct = SEMANTIC[raw.toLowerCase()];
  if (direct) return direct;
  const legacy = LEGACY.find(([needle]) => raw.includes(needle));
  if (legacy) return SEMANTIC[legacy[1]];
  return SEMANTIC.warning;
}

// ── Komponen modal — ditempatkan di AppShell ──
export default function Confirm() {
  const { confirmDialog, closeConfirmDialog } = useAppStore();
  const { open, icon, title, description, highlight, highlightColor, yesLabel, cb } = confirmDialog;
  const t = useT();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeConfirmDialog(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeConfirmDialog]);

  if (!open) return null;

  const { Icon, tone } = resolveConfirmIcon(icon);

  function handleConfirm() {
    const saved = cb;
    closeConfirmDialog();
    saved?.();
  }

  return (
    <div className="wp-backdrop" onClick={closeConfirmDialog}>
      <div
        className={`wp-confirm${tone === 'info' ? ' wp-confirm--info' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wp-confirm-title"
        aria-describedby={description ? 'wp-confirm-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wp-confirm__ico" aria-hidden="true"><Icon size="1em" weight="fill" /></div>

        {/* title — plain text, aman dari XSS */}
        <div id="wp-confirm-title" className="wp-confirm__title">{title}</div>

        {/* description — plain text opsional */}
        {description && <p id="wp-confirm-desc" className="wp-confirm__desc">{description}</p>}

        {/* highlight — teks penting (nama member, dll) */}
        {highlight && (
          <div className="wp-confirm__hl" style={highlightColor ? { color: highlightColor } : undefined}>
            {highlight}
          </div>
        )}

        <div className="wp-confirm__row">
          <Button ref={cancelRef} variant="secondary" size="lg" onClick={closeConfirmDialog}>{t('common.cancel')}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="lg" onClick={handleConfirm}>{yesLabel}</Button>
        </div>
      </div>
    </div>
  );
}
