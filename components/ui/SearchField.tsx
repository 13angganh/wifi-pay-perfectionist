'use client';
// ══════════════════════════════════════════
// components/ui/SearchField.tsx — v11.10.3
// Kolom pencarian member yang SAMA di Entri, Rekap, dan Tunggakan (sebelumnya tiga salinan markup dengan teks berbeda:
// "Cari nama di KRS...", "Cari member...", "Cari nama pelanggan..."). Satu komponen = ikon, teks, label aksesibel, dan
// tombol hapus selalu seragam. Teks placeholder lewat hook useMemberSearchPlaceholder().
// ══════════════════════════════════════════
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  testId?: string;
}

export function SearchField({ value, onChange, placeholder, testId }: Props) {
  const t = useT();
  return (
    <div className="wp-field">
      <div className="wp-inpw">
        <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
        <input
          className="wp-inp"
          data-testid={testId}
          type="text"
          placeholder={placeholder}
          aria-label={t('header.searchMember')}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
        />
        {value && (
          <span className="wp-inpw__end" style={{ pointerEvents: 'auto' }}>
            <button type="button" aria-label={t('entry.clearSearch')} onClick={() => onChange('')}
              style={{ background: 'none', border: 0, color: 'inherit', display: 'flex', cursor: 'pointer' }}>
              <X />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
