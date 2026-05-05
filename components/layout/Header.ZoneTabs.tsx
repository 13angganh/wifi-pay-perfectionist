// ══════════════════════════════════════════
// components/layout/Header.ZoneTabs.tsx
// Dipecah dari Header.tsx (task 1.15)
// ══════════════════════════════════════════
'use client';

import { useAppStore } from '@/store/useAppStore';

interface Props { onZoneChange: (zone: string) => void; }

export default function HeaderZoneTabs({ onZoneChange }: Props) {
  const { activeZone, settings } = useAppStore();
  const hiddenZones: string[]                     = settings.hiddenZones ?? [];
  const customZones: { key: string; color: string }[] = settings.customZones ?? [];

  const allZones = [
    { key: 'KRS', cls: 'krs' },
    { key: 'SLK', cls: 'slk' },
    ...customZones.map(c => ({ key: c.key, cls: 'custom' })),
  ].filter(z => !hiddenZones.includes(z.key));

  return (
    <div className="zone-sw" style={{ marginLeft: 'auto' }}>
      {allZones.map(z => (
        <button
          key={z.key}
          className={`zbtn ${activeZone === z.key ? z.cls : ''}`}
          onClick={() => onZoneChange(z.key)}
          aria-label={`Zona ${z.key}`}
          style={
            activeZone === z.key && z.cls === 'custom'
              ? {
                  background:  customZones.find(c => c.key === z.key)?.color ?? '#8B5CF6',
                  color:       '#fff',
                  borderColor: 'transparent',
                }
              : {}
          }
        >
          {z.key}
        </button>
      ))}
    </div>
  );
}
