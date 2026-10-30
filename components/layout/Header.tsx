'use client';

// components/layout/Header.tsx — REDESAIN T6
// 2 baris: (1) hamburger [mode sidebar] + logo + versi + cari + notifikasi [kerangka A3] + tema + avatar;
//          (2) tab zona dinamis + SyncPill + status/aksi kunci global.
// Logika TIDAK berubah dari v11.7.1: toggleGlobalLock (+ rollback selektif), cycleTheme,
// ResizeObserver --header-h. Perubahan non-visual yang disengaja (lihat MANIFEST):
//   - warna zona aktif ditulis ke <body> lewat zoneCssVars() dalam effect → ikut tema Terang/Emas
//     dan ikut perubahan zona terprogram (sebelumnya hanya saat tombol tab diklik).
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { saveDB } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { showToast } from '@/components/ui/Toast';
import GlobalSearch from '@/components/modals/GlobalSearch';
import { useT } from '@/hooks/useT';
import {
  List, Lock, LockOpen, MagnifyingGlass, Sun, Moon, Crown,
} from '@phosphor-icons/react';
import type { ThemeMode } from '@/store/slices/uiSlice';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';
import { zoneCssVars } from '@/lib/design-tokens';
import AppLogo from '@/components/ui/AppLogo';
import IconButton from '@/components/ui/IconButton';
import HeaderZoneTabs from './Header.ZoneTabs';
import HeaderSyncPill from './Header.SyncPill';
import NotificationCenter from '@/components/features/notifications/NotificationCenter';
import { getInitials } from './userInitials';

interface Props {
  onToggleSidebar: () => void;
  onOpenAccount: () => void;
}

const THEME_ICON = { light: Sun, dark: Moon, gold: Crown } as const;

export default function Header({ onToggleSidebar, onOpenAccount }: Props) {
  const {
    activeZone, setZone,
    globalLocked, setGlobalLocked,
    theme, setTheme,
    appData, uid, setSyncStatus,
    settings, setAppData,
    navMode, userName, userEmail,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const t = useT();

  // v11.7.1 FIX (dipertahankan): --header-h diukur ASLI via ResizeObserver & ditulis ke <html>;
  // Toast.tsx (node terpisah) membacanya lewat CSS custom property global.
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height;
      if (h !== undefined) document.documentElement.style.setProperty('--header-h', `${Math.ceil(h)}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Warna zona aktif → CSS variable di <body> (menang atas aturan body.light/body.gold).
  const customZones = settings.customZones;
  useEffect(() => {
    const v = zoneCssVars(activeZone, customZones ?? []);
    const st = document.body.style;
    st.setProperty('--zc', v.zc);
    st.setProperty('--zcdim', v.zcdim);
    st.setProperty('--zc-rgb', v.rgb);
  }, [activeZone, customZones]);
  useEffect(() => () => {
    const st = document.body.style;
    st.removeProperty('--zc'); st.removeProperty('--zcdim'); st.removeProperty('--zc-rgb');
  }, []);

  // Cycle: dark → light → gold → dark
  function cycleTheme() {
    const next: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'gold', gold: 'dark' };
    const toasts: Record<ThemeMode, string> = {
      light: t('header.themeToast.light'),
      dark:  t('header.themeToast.dark'),
      gold:  t('header.themeToast.gold'),
    };
    const n = next[theme];
    setTheme(n);
    showToast(toasts[n]);
  }

  async function toggleGlobalLock() {
    const next = !globalLocked;
    const prevLocked = globalLocked;
    const prevData = appData;
    const newData  = { ...appData, _globalLocked: next };
    setGlobalLocked(next);
    setAppData(newData); // BUG-001: sync appData agar tidak stale
    let ok = true;
    if (uid) {
      try {
        setSyncStatus('loading');
        await saveDB(uid, newData);
        setSyncStatus('ok');
      } catch (err) {
        logger.error('Gagal simpan toggleGlobalLock ke Firebase', err);
        setSyncStatus('err'); ok = false;
        setGlobalLocked(prevLocked); // rollback
        // FIX v11.5.7: rollback SELEKTIF via selectiveRollback (lib/rollback.ts) — baca state
        // terbaru, kembalikan hanya field yang disentuh operasi ini (_globalLocked).
        const latest = useAppStore.getState().appData;
        setAppData(selectiveRollback(latest, prevData, newData));
      }
    }
    if (ok) {
      showToast(next ? t('header.entryLocked') : t('header.entryUnlocked'), next ? 'info' : 'ok');
    } else {
      showToast(t('common.saveFailed'), 'err');
    }
  }

  const ThemeIcon = THEME_ICON[theme];
  const themeLabel = theme === 'light' ? t('settings.theme.light') : theme === 'gold' ? t('settings.theme.gold') : t('settings.theme.dark');

  return (
    <>
      <header id="header" ref={headerRef}>
        {/* Baris 1: hamburger (mode sidebar) + logo + versi + aksi */}
        <div className="hdr-row">
          {navMode === 'sidebar' && (
            <IconButton
              id="hamburger"
              icon={List}
              label={t('header.menuOpen')}
              round
              onClick={onToggleSidebar}
            />
          )}

          <div className="hdr-brand">
            <AppLogo size="m" priority />
            <div>
              <b>{APP_NAME}</b>
              <span>{APP_VERSION_FULL}</span>
            </div>
          </div>

          <span className="hdr-sp" />

          <IconButton icon={MagnifyingGlass} label={t('header.searchMember')} round onClick={() => setSearchOpen(true)} />
          <NotificationCenter />
          <IconButton
            icon={ThemeIcon}
            label={`${t('settings.theme')}: ${themeLabel}`}
            title={themeLabel}
            round
            weight={theme === 'gold' ? 'fill' : 'regular'}
            onClick={cycleTheme}
            style={theme === 'gold' ? { color: 'var(--gold)' } : undefined}
          />
          <button type="button" className="hdr-av" aria-label={t('sidebar.accountAria')} title={t('sidebar.manageAccount')} onClick={onOpenAccount}>
            {getInitials(userName, userEmail)}
          </button>
        </div>

        {/* Baris 2: zona + sync + kunci */}
        <div className="hdr-row">
          <HeaderZoneTabs onZoneChange={setZone} />
          <HeaderSyncPill />
          <span className="hdr-sp" />

          {/* v11.7.0 (dipertahankan): STATUS (tidak bisa diklik) + tombol AKSI ikon-saja terpisah. */}
          <div
            aria-hidden="true"
            className="hdr-lock-status"
            style={{ ['--lc' as string]: globalLocked ? 'var(--c-belum)' : 'var(--c-lunas)' }}
          >
            {globalLocked
              ? <Lock size={14} weight="fill" />
              : <LockOpen size={14} weight="fill" />
            }
            {globalLocked ? t('header.statusLocked') : t('header.statusUnlocked')}
          </div>
          <button
            className="header-lock-action-btn"
            onClick={toggleGlobalLock}
            aria-label={globalLocked ? t('header.actionAriaLocked') : t('header.actionAriaUnlocked')}
            title={globalLocked ? t('header.unlock') : t('header.lock')}
          >
            {globalLocked
              ? <LockOpen size={16} weight="fill" />
              : <Lock size={16} weight="fill" />
            }
          </button>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
