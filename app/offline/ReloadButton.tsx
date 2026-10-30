'use client';

// REDESAIN T6: dipakai app/offline/page.tsx (sebelumnya yatim, tombol ditulis ganda di page).
// Gaya (.wp-offline-btn) ada di blok <style> self-contained milik page.
import { ArrowClockwise } from '@phosphor-icons/react';

export default function ReloadButton({ label }: { label: string }) {
  return (
    <button type="button" className="wp-offline-btn" onClick={() => window.location.reload()}>
      <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
      {label}
    </button>
  );
}
