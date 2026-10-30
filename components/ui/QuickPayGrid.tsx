// components/ui/QuickPayGrid.tsx — grid nominal cepat (.qk). Dipakai Entry (T7) + RekapModal (T8).
// Tanpa logika bisnis: hanya menampilkan nominal & memanggil onPick. `tarif` = nominal yang
// disorot (tarif member). `formatLabel` dioper pemanggil (mis. rp() dari lib/format).
'use client';

export interface QuickPayGridProps {
  amounts: readonly number[];
  tarif?: number | null;
  onPick: (amount: number) => void;
  formatLabel?: (amount: number) => string;
  disabled?: boolean;
  ariaLabel: string;
}

export function QuickPayGrid({ amounts, tarif, onPick, formatLabel = String, disabled, ariaLabel }: QuickPayGridProps) {
  return (
    <div className="wp-qk" role="group" aria-label={ariaLabel}>
      {amounts.map(a => (
        <button
          key={a}
          type="button"
          disabled={disabled}
          data-tarif={tarif != null && tarif === a ? 'true' : undefined}
          onClick={() => onPick(a)}
        >
          {formatLabel(a)}
        </button>
      ))}
    </div>
  );
}

export default QuickPayGrid;
