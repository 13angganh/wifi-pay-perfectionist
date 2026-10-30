'use client';
// Floating Action Button: aksi tambah utama per layar (Member, Operasional). Posisi tetap di pojok kanan bawah, di atas Bottom Nav.
import { Plus } from '@phosphor-icons/react';
import type { ElementType } from 'react';

export function Fab({ label, onClick, icon: Icon = Plus }: { label: string; onClick: () => void; icon?: ElementType }) {
  return (
    <button type="button" className="wp-fab" aria-label={label} title={label} onClick={onClick}>
      <Icon weight="bold" aria-hidden="true" />
    </button>
  );
}
/** Ruang kosong di akhir daftar agar FAB tidak menutupi item terakhir. */
export function FabSpace() { return <div className="wp-fab-space" aria-hidden="true" />; }
