// ══════════════════════════════════════════
// components/layout/Header.ZoneTabs.tsx
// REDESAIN T6: tab zona DINAMIS (KRS, SLK, zona kustom, minus zona tersembunyi).
// Dipakai Header.tsx (sebelumnya yatim + duplikat inline). Tidak ada percabangan KRS/SLK:
// warna lewat zoneColor()/zoneCssVars() di lib/design-tokens.ts.
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { zoneCssColor } from '@/lib/design-tokens';

interface Props { onZoneChange: (zone: string) => void; }

/** Zona yang ditampilkan di tab (urutan: KRS, SLK, lalu kustom; zona tersembunyi dibuang). */
export function visibleZoneKeys(customZones: { key: string }[], hiddenZones: string[]): string[] {
  return ['KRS', 'SLK', ...customZones.map(c => c.key)].filter(k => !hiddenZones.includes(k));
}

export default function HeaderZoneTabs({ onZoneChange }: Props) {
  const t = useT();
  const activeZone  = useAppStore(s => s.activeZone);
  const settings    = useAppStore(s => s.settings);
  const hiddenZones = settings.hiddenZones ?? [];
  const customZones = settings.customZones ?? [];
  const keys = visibleZoneKeys(customZones, hiddenZones);
  const sig = keys.join('|');

  // Pudar tepi kanan (petunjuk "bisa digeser") HANYA bila masih ada tab tersembunyi di kanan.
  // Bila semua tab muat (atau sudah digeser sampai ujung), tidak ada pudar supaya tab terakhir tidak tampak terpotong.
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
    el.addEventListener('scroll', measure, { passive: true });
    // ResizeObserver langsung memanggil measure sekali saat observe(); amati juga tiap tab (ukuran teks/zona berubah)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    Array.from(el.children).forEach(c => ro?.observe(c));
    return () => { el.removeEventListener('scroll', measure); ro?.disconnect(); };
  }, [sig]);

  return (
    <div ref={ref} className="zone-sw" data-more={more ? 'true' : undefined} role="group" aria-label={t('common.zone')}>
      {keys.map(k => {
        const on = activeZone === k;
        // zona bawaan ikut tema (var), zona kustom pakai hex-nya — dari lib/design-tokens.ts
        const bg = zoneCssColor(k, customZones);
        return (
          <button
            key={k}
            type="button"
            className="zbtn"
            aria-pressed={on}
            aria-label={`${t('header.zoneAria')} ${k}`}
            onClick={() => onZoneChange(k)}
            style={on ? ({ ['--zbc' as string]: bg } as CSSProperties) : undefined}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
