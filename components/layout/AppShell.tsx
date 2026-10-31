// ══════════════════════════════════════════
// components/layout/AppShell.tsx (task 1.15: dipecah)
// REDESAIN T6: Mode Navigasi (A1: 'bottom' | 'sidebar'), Posisi Toast (A2, di Toast.tsx),
// Header baru, banner Update/Offline/PWA bergaya baru. Logika non-visual TIDAK berubah
// (migrasi wp-settings, idle timeout, usePWA, sync route→view, tema, auto backup, navigate).
// AccountModal kini dimiliki shell ini (dibuka dari avatar Header ATAU kartu akun Sidebar).
// ══════════════════════════════════════════
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import { useAppStore } from '@/store/useAppStore';
import { checkAutoBackup } from '@/lib/backup';
import { hasAnyMembers, useEscapeClose } from './shellLogic';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { usePWA } from '@/hooks/usePWA';
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';
import { useOfflineDetect } from '@/hooks/useOfflineDetect';
import AppErrorBoundary from './AppErrorBoundary';
import Header        from './Header';
import Sidebar       from './Sidebar';
import BottomNav     from './BottomNav';
import Toast         from '@/components/ui/Toast';
import Confirm       from '@/components/ui/Confirm';
import PinLock       from '@/components/ui/PinLock';
import OnboardingHint from '@/components/ui/OnboardingHint';
import AccountModal from '@/components/modals/AccountModal';
import AppLogo from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { WifiSlash, WifiHigh, ArrowUp, X } from '@phosphor-icons/react';
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
  const Icon = offline ? WifiSlash : WifiHigh;
  return (
    <div
      className={`net-banner ${offline ? 'net-banner--off' : 'net-banner--on'}`}
      role="status"
      aria-live="polite"
    >
      <Icon size={16} weight="fill" aria-hidden="true" />
      <span>{offline ? t('app.offline') : t('app.backOnline')}</span>
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
    deferredPrompt, settings, navMode,
  } = useAppStore();
  const [accountOpen, setAccountOpen] = useState(false);

  const t = useT();

  // Scroll shadow — tampilkan gradient bottom jika masih ada konten di bawah
  // v11.5 FIX: throttle dengan requestAnimationFrame — handler scroll sebelumnya dipanggil
  // puluhan kali per detik tanpa throttle, menyebabkan overhead re-render berlebih saat
  // scroll cepat di halaman berat seperti Rekap (tabel 100+ baris) → terlihat seperti jank/delay.
  const [showScrollFade, setShowScrollFade] = useState(true);
  const scrollFadeRaf = useRef<number | null>(null);
  const textSize = useAppStore(st => st.textSize);
  useEffect(() => { document.documentElement.dataset.textSize = textSize; }, [textSize]);
  useEffect(() => () => { if (scrollFadeRaf.current !== null) cancelAnimationFrame(scrollFadeRaf.current); }, []);
  function handleContentScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (scrollFadeRaf.current !== null) return; // sudah ada rAF pending, skip
    scrollFadeRaf.current = requestAnimationFrame(() => {
      scrollFadeRaf.current = null;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
      setShowScrollFade(prev => (prev === !atBottom ? prev : !atBottom));
    });
  }



  useIdleTimeout(settings.pinTimeoutMinutes);
  usePWA(); // task 1.15: hook hasil pecah dari AppShell
  useRoutePrefetch(); // v11.10.2: muat rute menu lebih dulu → pindah menu tidak lag

  // Sync route → view
  // v11.5 FIX: gunakan keepPeriod:true — effect ini hanya untuk sinkronisasi currentView
  // saat route berubah (termasuk back/forward browser). Reset period (selYear/selMonth)
  // sudah ditangani secara eksplisit oleh navigate() di bawah untuk navigasi sidebar biasa,
  // dan oleh setViewWithPeriod() untuk navigasi terprogram (misal klik tunggakan di dashboard).
  // Tanpa keepPeriod:true di sini, setView akan selalu menimpa balik selYear/selMonth
  // setelah router.push — menyebabkan navigasi ke bulan tertentu selalu gagal.
  useEffect(() => {
    const seg = pathname.split('/')[1] as ViewName;
    if (seg) setView(seg, { keepPeriod: true });
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
    // T11: member di zona MANA PUN memicu cek auto-backup (dulu hanya krsMembers → zona kustom diabaikan)
    if (!backupChecked.current && hasAnyMembers(appData, settings)) {
      backupChecked.current = true;
      checkAutoBackup(appData);
    }
  }, [appData, settings]);

  // T11 (a11y): Esc menutup drawer Sidebar
  const closeSidebar = useCallback(() => setSidebar(false), [setSidebar]);
  useEscapeClose(sidebarOpen, closeSidebar);

  // Tinggi banner Update → CSS var global (dipakai posisi toast Atas & offset kontainer)
  useEffect(() => {
    document.documentElement.style.setProperty('--banner-h', showUpdateBanner ? '44px' : '0px');
    return () => { document.documentElement.style.setProperty('--banner-h', '0px'); };
  }, [showUpdateBanner]);

  const navigate = useCallback((v: ViewName) => {
    setView(v);
    router.push('/'+v);
    setSidebar(false);
  }, [router, setView, setSidebar]);

  return (
    <AppErrorBoundary>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="afterInteractive" />

      <PinLock />
      <OnboardingHint />

      {showUpdateBanner && (
        <div className="update-banner" role="status">
          <span className="update-banner__ico" aria-hidden="true"><ArrowUp size={16} weight="bold" /></span>
          <span className="update-banner__txt">{t('app.updateAvailable')}</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigator.serviceWorker.getRegistration().then(r => {
              r?.waiting?.postMessage({ type:'SKIP_WAITING' }); window.location.reload();
            })}
          >
            {t('app.updateNow')}
          </Button>
        </div>
      )}

      {/* v11.7.0: LockBanner DIHAPUS — status "Terkunci"/"Terbuka" sudah ada di Header. */}
      <div id="app-root" className="wp-app" data-nav={navMode}>
        {navMode === 'sidebar' && (
          <>
            <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebar(false)} />
            <div id="sidebar" className={sidebarOpen ? 'open' : ''}>
              <Sidebar onNavigate={navigate} onOpenAccount={() => setAccountOpen(true)} />
            </div>
          </>
        )}
        <div className="wp-col">
          <Header onToggleSidebar={() => setSidebar(!sidebarOpen)} onOpenAccount={() => setAccountOpen(true)} />
          <OfflineBanner />
          <div className="wp-content-wrap">
            <div
              id="content"
              onScroll={handleContentScroll}
            >
              {children}
            </div>
            {/* Scroll shadow — gradient bawah menandakan ada konten lebih */}
            {showScrollFade && <div aria-hidden="true" className="wp-scroll-fade" />}
          </div>
        </div>
        {navMode === 'bottom' && <BottomNav onNavigate={navigate} />}
      </div>

      <AccountModal open={accountOpen} onClose={() => { setAccountOpen(false); setSidebar(false); }} />

      <Toast />
      <Confirm />

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className={`pwa-banner${navMode === 'bottom' ? ' pwa-banner--above-nav' : ''}`} role="region" aria-label={t('pwa.installTitle')}>
          <AppLogo size="s" />
          <div className="pwa-banner__tx">
            <b className={theme === 'gold' ? 'gtxt-gold' : undefined}>{t('pwa.installTitle')}</b>
            <span>{t('pwa.installDesc')}</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { (deferredPrompt as any).prompt(); }} // eslint-disable-line @typescript-eslint/no-explicit-any
          >
            {t('pwa.installBtn')}
          </Button>
          <button
            type="button"
            className="pwa-banner__x"
            onClick={() => setDeferredPrompt(null)}
            aria-label={t('common.close')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </AppErrorBoundary>
  );
}
