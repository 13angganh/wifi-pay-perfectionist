// components/layout/AppShell.tsx — Fase 4: offline detection + error boundary + onboarding
'use client';

import { useCallback, useEffect, useRef, useState, Component } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import { useAppStore } from '@/store/useAppStore';
import { checkAutoBackup } from '@/lib/backup';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import Header        from './Header';
import Sidebar       from './Sidebar';
import LockBanner    from './LockBanner';
import Toast         from '@/components/ui/Toast';
import Confirm       from '@/components/ui/Confirm';
import PinLock       from '@/components/ui/PinLock';
import OnboardingHint from '@/components/ui/OnboardingHint';
import { WifiOff, RotateCcw, X } from 'lucide-react';
import type { ViewName } from '@/types';
import { useT } from '@/hooks/useT';

// ─── Static i18n helper for class components ────────────────────────────────────
function tStatic(key: string): string {
  if (typeof window === 'undefined') return key;
  try {
    const s = localStorage.getItem('wp-settings');
    const lang = s ? JSON.parse(s)?.language : 'id';
    const msgs: Record<string, Record<string, string>> = {
      en: { 'app.errorTitle': 'Oops, something went wrong', 'app.errorDesc': 'The app encountered an unexpected error. Try reloading the page.', 'app.reload': 'Reload' },
      id: { 'app.errorTitle': 'Oops, ada yang error', 'app.errorDesc': 'Aplikasi mengalami error tidak terduga. Coba muat ulang halaman.', 'app.reload': 'Muat Ulang' },
    };
    return msgs[lang]?.[key] ?? msgs['id'][key] ?? key;
  } catch { return key; }
}

// ─── Error Boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; error?: Error }

class AppErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[WiFi Pay] Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          height:'100vh', gap:16, padding:24, background:'var(--bg)', textAlign:'center',
        }}>
          <div style={{
            width:56, height:56, borderRadius:'var(--r-lg)',
            background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <RotateCcw size={24} color="var(--c-belum)" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:'var(--txt)' }}>
            {tStatic('app.errorTitle')}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'var(--txt2)', maxWidth:280, lineHeight:1.55 }}>
            {tStatic('app.errorDesc')}
          </div>
          {this.state.error && (
            <div style={{
              fontFamily:"'DM Mono',monospace", fontSize:10, color:'var(--txt4)',
              background:'var(--bg3)', border:'1px solid var(--border)',
              borderRadius:'var(--r-sm)', padding:'8px 12px',
              maxWidth:300, wordBreak:'break-all', textAlign:'left',
            }}>
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background:'var(--zc)', color:'#fff', border:'none',
              borderRadius:'var(--r-md)', padding:'10px 24px',
              fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:13, cursor:'pointer',
            }}
          >
            {tStatic('app.reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Offline Banner ─────────────────────────────────────────────────────────────

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [show, setShow]       = useState(false);
  const t = useT();

  useEffect(() => {
    function onOnline()  { setOffline(false); setTimeout(() => setShow(false), 1200); }
    function onOffline() { setOffline(true); setShow(true); }

    if (!navigator.onLine) { setOffline(true); setShow(true); }

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

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
        fontFamily:"'DM Sans',sans-serif", fontSize:12,
        color: offline ? 'var(--c-belum)' : 'var(--c-lunas)',
        fontWeight:500,
      }}>
        {offline ? t('app.offline') : t('app.backOnline')}
      </span>
    </div>
  );
}

// ─── AppShell ────────────────────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const {
    sidebarOpen, setSidebar, setView, theme, appData,
    setDeferredPrompt, setUpdateBanner, showUpdateBanner,
    deferredPrompt,
    settings,
  } = useAppStore();
  const { setTheme } = useAppStore();
  const t = useT();

  useIdleTimeout(settings.pinTimeoutMinutes);

  useEffect(() => {
    const seg = pathname.split('/')[1] as ViewName;
    if (seg) setView(seg);
  }, [pathname]);

  // Apply theme class ke body
  useEffect(() => {
    document.body.classList.remove('light', 'gold');
    if (theme === 'light') document.body.classList.add('light');
    else if (theme === 'gold') document.body.classList.add('gold');
    // dark = default, tidak butuh class tambahan
  }, [theme]);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
      if (reg.waiting) { reg.waiting.postMessage({ type:'SKIP_WAITING' }); setUpdateBanner(true); }
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed') { sw.postMessage({ type:'SKIP_WAITING' }); setUpdateBanner(true); }
        });
      });
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }, []);

  const backupChecked = useRef(false);
  useEffect(() => {
    // Jalan sekali setelah data pertama kali tersedia dari Firebase
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
      {/* BUG-004: Chart.js CDN dihapus — sekarang pakai npm chart.js + react-chartjs-2 */}

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
              WebkitOverflowScrolling:'touch' as any,
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

      {/* PWA Install Banner — posisi bawah layar, muncul di semua halaman */}
      {deferredPrompt && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9000,
          background: theme === 'gold'
            ? 'linear-gradient(135deg, #1C1610 0%, #141008 100%)'
            : 'var(--bg2)',
          borderTop: theme === 'gold'
            ? '1px solid rgba(201,149,42,0.3)'
            : '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: theme === 'gold'
            ? '0 -4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,149,42,0.1)'
            : '0 -4px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            border: theme === 'gold' ? '1px solid rgba(201,149,42,0.3)' : '1px solid var(--border)',
          }}>
            <img src="/icon-192.png" alt="WiFi Pay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: theme === 'gold' ? 'var(--gold-bright, #E8B84B)' : 'var(--txt)',
              fontFamily: "'Syne', sans-serif",
            }}>
              {t('pwa.installTitle')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>
              {t('pwa.installDesc')}
            </div>
          </div>
          <button
            onClick={() => { (deferredPrompt as any).prompt(); }}
            style={{
              background: theme === 'gold'
                ? 'linear-gradient(135deg, #C9952A 0%, #E8B84B 100%)'
                : 'var(--zc)',
              color: theme === 'gold' ? '#0C0A06' : '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--r-sm)',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: theme === 'gold' ? '0 2px 8px rgba(201,149,42,0.4)' : 'none',
            }}
          >
            {t('pwa.installBtn')}
          </button>
          <button
            onClick={() => setDeferredPrompt(null)}
            aria-label="Tutup"
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--txt4)', cursor: 'pointer',
              padding: 4, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </AppErrorBoundary>
  );
}
