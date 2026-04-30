// components/layout/Header.tsx — Fase 4: sync pill + Lucide + touch target
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { saveDB } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import GlobalSearch from '@/components/modals/GlobalSearch';
import { useT } from '@/hooks/useT';
import {
  Wifi, Menu, Lock, LockOpen, Search, Sun, Moon,
  Cloud, RotateCw, AlertTriangle, WifiOff,
} from 'lucide-react';

interface Props { onToggleSidebar: () => void; }

export default function Header({ onToggleSidebar }: Props) {
  const {
    activeZone, setZone,
    globalLocked, setGlobalLocked,
    syncStatus, darkMode, toggleTheme,
    appData, uid, setSyncStatus,
    settings, setAppData,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const t = useT();

  function handleZone(z: string) {
    setZone(z);
    // Cari color dari customZones jika bukan KRS/SLK
    const customZones: { key: string; color: string }[] = settings.customZones ?? [];
    const color = z === 'KRS' ? '#3B82F6'
                : z === 'SLK' ? '#F97316'
                : (customZones.find(c => c.key === z)?.color ?? '#8B5CF6');
    // Parse hex ke RGB
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    document.documentElement.style.setProperty('--zc', color);
    document.documentElement.style.setProperty('--zc-rgb', `${r},${g},${b}`);
    document.documentElement.style.setProperty('--zcdim', color + '22');
  }

  async function toggleGlobalLock() {
    const next = !globalLocked;
    setGlobalLocked(next);
    setAppData({ ...appData, _globalLocked: next }); // BUG-001: sync appData agar tidak stale
    if (uid) {
      try {
        setSyncStatus('loading');
        await saveDB(uid, { ...appData, _globalLocked: next });
        setSyncStatus('ok');
      } catch { setSyncStatus('err'); }
    }
    showToast(next ? t('header.entryLocked') : t('header.entryUnlocked'), next ? 'info' : 'ok');
  }

  // Sync pill config
  const syncConfigs = {
    ok:      { icon: <Cloud size={12} strokeWidth={1.5} />,         label: t('common.saved'),   cls: 'sync-pill ok'      },
    loading: { icon: <RotateCw size={12} strokeWidth={1.5} />,      label: t('common.saving'),  cls: 'sync-pill loading' },
    err:     { icon: <AlertTriangle size={12} strokeWidth={1.5} />, label: t('sync.error'),     cls: 'sync-pill err'     },
    offline: { icon: <WifiOff size={12} strokeWidth={1.5} />,       label: t('common.offline'), cls: 'sync-pill offline' },
  };
  const syncCfg = syncConfigs[syncStatus as keyof typeof syncConfigs] ?? syncConfigs.ok;

  return (
    <>
      <div id="header">
        {/* Row 1: hamburger + logo + zone switch */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <button
            id="hamburger"
            className="hbtn"
            style={{ padding:'0 8px', flexShrink:0, minWidth:40, minHeight:40, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={onToggleSidebar}
            aria-label="Buka menu"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:'linear-gradient(135deg,var(--zc),color-mix(in srgb,var(--zc) 70%,#000))',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, boxShadow:'var(--shadow-z)',
            }}>
              <Wifi size={16} color="#fff" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, letterSpacing:'-.02em' }}>
                WiFi Pay
              </div>
              <div style={{ fontSize:9, color:'var(--txt4)' }}>v11.2 Next</div>
            </div>
          </div>

          {/* Zone switch — KRS + SLK + zona custom, filter hidden */}
          <div className="zone-sw" style={{ marginLeft:'auto' }}>
            {(() => {
              const hiddenZones: string[] = settings.hiddenZones ?? [];
              const customZones: { key: string; color: string }[] = settings.customZones ?? [];
              const allZ = [
                { key: 'KRS', cls: 'krs' },
                { key: 'SLK', cls: 'slk' },
                ...customZones.map(c => ({ key: c.key, cls: 'custom' })),
              ].filter(z => !hiddenZones.includes(z.key));
              return allZ.map(z => (
                <button
                  key={z.key}
                  className={`zbtn ${activeZone === z.key ? z.cls : ''}`}
                  onClick={() => handleZone(z.key)}
                  aria-label={`Zona ${z.key}`}
                  style={activeZone === z.key && z.cls === 'custom' ? {
                    background: (customZones.find(c=>c.key===z.key)?.color ?? '#8B5CF6'),
                    color: '#fff', borderColor: 'transparent',
                  } : {}}
                >{z.key}</button>
              ));
            })()}
          </div>
        </div>

        {/* Row 2: sync pill + action buttons */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {/* Sync pill */}
          <div
            className={syncCfg.cls}
            role="status"
            aria-live="polite"
            aria-label={`Status sync: ${syncCfg.label}`}
          >
            <span className={syncStatus === 'loading' ? 'sync-spin' : ''}>
              {syncCfg.icon}
            </span>
            <span>{syncCfg.label}</span>
          </div>

          <span style={{ flex:1 }} />

          {/* Kunci/Buka entry */}
          <button
            className="hbtn"
            style={{
              color: globalLocked ? 'var(--c-belum)' : 'var(--c-lunas)',
              display:'flex', alignItems:'center', gap:4,
              minWidth:40, minHeight:40,
            }}
            onClick={toggleGlobalLock}
            aria-label={globalLocked ? 'Buka kunci entry' : 'Kunci entry'}
            title={globalLocked ? 'Buka kunci entry' : 'Kunci entry'}
          >
            {globalLocked
              ? <Lock size={14} strokeWidth={1.5} />
              : <LockOpen size={14} strokeWidth={1.5} />
            }
            <span style={{ fontSize:9 }}>{globalLocked ? t('header.lock') : t('header.unlock')}</span>
          </button>

          {/* Pencarian */}
          <button
            className="hbtn"
            style={{ minWidth:40, minHeight:40, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => setSearchOpen(true)}
            aria-label="Cari member"
            title="Cari member"
          >
            <Search size={16} strokeWidth={1.5} />
          </button>

          {/* Toggle tema */}
          <button
            className="hbtn"
            style={{ minWidth:40, minHeight:40, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={toggleTheme}
            aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={darkMode ? 'Mode terang' : 'Mode gelap'}
          >
            {darkMode
              ? <Sun size={16} strokeWidth={1.5} />
              : <Moon size={16} strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
