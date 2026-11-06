// components/ui/QuickPayGrid.tsx — grid nominal cepat (.qk). Dipakai Entry (T7) + RekapModal (T8).
// Tanpa logika bisnis: hanya menampilkan nominal & memanggil onPick. `tarif` = nominal yang
// disorot (tarif member). `formatLabel` dioper pemanggil (mis. rp() dari lib/format).
'use client';

import { Star } from '@phosphor-icons/react';

export interface QuickPayGridProps {
  amounts: readonly number[];
  tarif?: number | null;
  onPick: (amount: number) => void;
  formatLabel?: (amount: number) => string;
  disabled?: boolean;
  ariaLabel: string;
  /** Teks pembaca layar untuk nominal tarif (mis. "tarif"); dipakai bersama ikon bintang. */
  tarifLabel?: string;
}

export function QuickPayGrid({ amounts, tarif, onPick, formatLabel = String, disabled, ariaLabel, tarifLabel }: QuickPayGridProps) {
  return (
    <div className="wp-qk" role="group" aria-label={ariaLabel}>
      {amounts.map(a => {
        const isTarif = tarif != null && tarif === a;
        return (
          <button
            key={a}
            type="button"
            disabled={disabled}
            data-tarif={isTarif ? 'true' : undefined}
            aria-label={isTarif && tarifLabel ? `${formatLabel(a)}, ${tarifLabel}` : undefined}
            onClick={() => onPick(a)}
          >
            {formatLabel(a)}
            {/* v11.11.1: tanda tarif = ikon bintang (dulu berupa karakter teks di Rekap saja, dan tidak ada di kartu Entri) */}
            {isTarif && <Star className="wp-qk__star" weight="fill" size={11} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export default QuickPayGrid;
