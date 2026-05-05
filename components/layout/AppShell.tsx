// ══════════════════════════════════════════
// components/layout/AppShell.tsx (task 1.15: dipecah)
// ══════════════════════════════════════════
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import { useAppStore } from '@/store/useAppStore';
import { checkAutoBackup } from '@/lib/backup';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineDetect } from '@/hooks/useOfflineDetect';
import AppErrorBoundary from './AppErrorBoundary';
import Header        from './Header';
import Sidebar       from './Sidebar';
import LockBanner    from './LockBanner';
import Toast         from '@/components/ui/Toast';
import Confirm       from '@/components/ui/Confirm';
import PinLock       from '@/components/ui/PinLock';
import OnboardingHint from '@/components/ui/OnboardingHint';
import { WifiOff, X } from 'lucide-react';
import type { ViewName } from '@/types';
import { useT } from '@/hooks/useT';

// ─── One-time migration: wp-settings → wp_settings (task 1.05) ──────────────────
if (typeof window !== 'undefined') {
  const legacy = localStorage.getItem('wp-settings');
  if (legacy && !localStorage.getItem('wp_settings')) {
    localStorage.setItem('wp_settings', legacy);
    localStorage.removeItem('wp-settings');
  }
}

// ─── Offline Banner — menggunakan useOfflineDetect hook ──────────────────────────
function OfflineBanner() {
  const { offline, show } = useOfflineDetect();
  const t = useT();
  if (!show) return null;
  return (
    <div
      style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'7px 16px',
        background: offline ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.10)',
        borderBottom: offline ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.2)',
        transition:'background var(--t-base), border-color var(--t-base)',
      }}
      role="status"
      aria-live="polite"
      aria-label={offline ? t('app.offline') : t('app.backOnline')}
    >
      <WifiOff size={13} strokeWidth={1.5} color={offline ? 'var(--c-belum)' : 'var(--c-lunas)'} />
      <span style={{
        fontFamily:"var(--font-sans),sans-serif", fontSize:12,
        color: offline ? 'var(--c-belum)' : 'var(--c-lunas)',
        fontWeight:500,
      }}>
        {offline ? t('app.offline') : t('app.backOnline')}
      </span>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const {
    sidebarOpen, setSidebar, setView, theme, appData,
    setDeferredPrompt, showUpdateBanner,
    deferredPrompt, settings,
  } = useAppStore();

  const t = useT();

  useIdleTimeout(settings.pinTimeoutMinutes);
  usePWA(); // task 1.15: hook hasil pecah dari AppShell

  // Sync route → view
  useEffect(() => {
    const seg = pathname.split('/')[1] as ViewName;
    if (seg) setView(seg);
  }, [pathname, setView]);

  // Apply theme class ke body
  useEffect(() => {
    document.body.classList.remove('light', 'gold');
    if (theme === 'light') document.body.classList.add('light');
    else if (theme === 'gold') document.body.classList.add('gold');
  }, [theme]);

  // Auto backup
  const backupChecked = useRef(false);
  useEffect(() => {
    if (!backupChecked.current && appData.krsMembers?.length) {
      backupChecked.current = true;
      checkAutoBackup(appData);
    }
  }, [appData]);

  const navigate = useCallback((v: ViewName) => {
    setView(v);
    router.push('/'+v);
    setSidebar(false);
  }, [router, setView, setSidebar]);

  return (
    <AppErrorBoundary>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js" strategy="lazyOnload" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="lazyOnload" />

      <PinLock />
      <OnboardingHint />

      {showUpdateBanner && (
        <div className="update-banner">
          <span style={{ fontSize:12, color:'var(--c-lunas)' }}>{t('app.updateAvailable')}</span>
          <button
            onClick={() => navigator.serviceWorker.getRegistration().then(r => {
              r?.waiting?.postMessage({ type:'SKIP_WAITING' }); window.location.reload();
            })}
            style={{
              background:'var(--c-lunas)', color:'#0a0c12', border:'none',
              padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:700,
              cursor:'pointer', flexShrink:0,
            }}
          >
            {t('app.updateNow')}
          </button>
        </div>
      )}

      <div style={{ display:'flex', position:'fixed', inset:0, top: showUpdateBanner ? 44 : 0 }}>
        <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebar(false)} />
        <div id="sidebar" className={sidebarOpen ? 'open' : ''}>
          <Sidebar onNavigate={navigate} />
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <Header onToggleSidebar={() => setSidebar(!sidebarOpen)} />
          <LockBanner />
          <OfflineBanner />
          <div
            id="content"
            style={{
              flex:1, overflowY:'auto',
              WebkitOverflowScrolling:'touch' as React.CSSProperties['WebkitOverflowScrolling'],
              padding:'12px 12px 24px',
              background:'var(--bg)',
            }}
          >
            {children}
          </div>
        </div>
      </div>

      <Toast />
      <Confirm />

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div style={{
          position:'fixed', bottom:0, left:0, right:0, zIndex:9000,
          background: theme === 'gold'
            ? 'linear-gradient(135deg, #1C1610 0%, #141008 100%)'
            : 'var(--bg2)',
          borderTop: theme === 'gold'
            ? '1px solid rgba(201,149,42,0.3)'
            : '1px solid var(--border)',
          padding:'12px 16px',
          display:'flex', alignItems:'center', gap:12,
          boxShadow: theme === 'gold'
            ? '0 -4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,149,42,0.1)'
            : '0 -4px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0,
            border: theme === 'gold' ? '1px solid rgba(201,149,42,0.3)' : '1px solid var(--border)',
          }}>
            <Image src="/icon-192.png" alt="WiFi Pay" width={192} height={192}
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontSize:13, fontWeight:700,
              color: theme === 'gold' ? 'var(--gold-bright, #E8B84B)' : 'var(--txt)',
              fontFamily:"var(--font-sans), sans-serif",
            }}>
              {t('pwa.installTitle')}
            </div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:1 }}>
              {t('pwa.installDesc')}
            </div>
          </div>
          <button
            onClick={() => { (deferredPrompt as any).prompt(); }} // eslint-disable-line @typescript-eslint/no-explicit-any
            style={{
              background: theme === 'gold'
                ? 'linear-gradient(135deg, #C9952A 0%, #E8B84B 100%)'
                : 'var(--zc)',
              color: theme === 'gold' ? '#0C0A06' : '#fff',
              border:'none', padding:'8px 16px',
              borderRadius:'var(--r-sm)', fontSize:12, fontWeight:700,
              cursor:'pointer', flexShrink:0,
              boxShadow: theme === 'gold' ? '0 2px 8px rgba(201,149,42,0.4)' : 'none',
            }}
          >
            {t('pwa.installBtn')}
          </button>
          <button
            onClick={() => setDeferredPrompt(null)}
            aria-label="Tutup"
            style={{
              background:'transparent', border:'none',
              color:'var(--txt4)', cursor:'pointer',
              padding:4, display:'flex', alignItems:'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </AppErrorBoundary>
  );
}
