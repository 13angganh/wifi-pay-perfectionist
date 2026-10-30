'use client';

// app/offline/page.tsx — REDESAIN T6: tampilan baru (token CORE v3, Phosphor, tanpa emoji).
// CSS SELF-CONTAINED (nilai token disalin di bawah): halaman ini bisa disajikan SW saat offline
// sehingga tidak boleh bergantung pada globals.css yang mungkin tidak ter-cache.
import { WifiSlash, WifiHigh, Airplane, ArrowClockwise } from '@phosphor-icons/react';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import ReloadButton from './ReloadButton';

export default function OfflinePage() {
  const t = useT();
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Gelap (default) — nilai = styles/tokens.css ── */
        :root {
          --bg: #0B1020; --bg2: #131A2D; --bg3: #1A2238; --border: #222B45;
          --txt: #FFFFFF; --txt2: #A1A8C1; --txt3: #6B7494; --txt4: #4A5270;
          --accent: #3B82F6; --on-accent: #FFFFFF; --c-belum: #EF4444;
          --halo: radial-gradient(120% 70% at 50% -10%, rgba(59,130,246,.16), transparent 60%);
          --grad-a: linear-gradient(135deg, #5F9CF8, #2D6BD6);
          --r-xl: 20px; --r-lg: 16px; --r-full: 9999px;
          --ff: ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        body.light {
          --bg: #F8FAFC; --bg2: #FFFFFF; --bg3: #F0F4F8; --border: #E4EAF0;
          --txt: #0F1117; --txt2: #374151; --txt3: #6B7280; --txt4: #9CA3AF;
          --accent: #2563EB; --c-belum: #DC2626;
          --halo: radial-gradient(120% 70% at 50% -10%, rgba(37,99,235,.10), transparent 60%);
          --grad-a: linear-gradient(135deg, #4B83F0, #1E4FC2);
        }
        body.gold {
          --bg: #0C0A06; --bg2: #141008; --bg3: #1C1610; --border: rgba(201,149,42,.15);
          --txt: #F5EAD6; --txt2: #C4AA80; --txt3: #8A7055; --txt4: #5A4830;
          --accent: #C9952A; --on-accent: #0C0A06;
          --halo: radial-gradient(120% 70% at 50% -10%, rgba(201,149,42,.22), transparent 60%);
          --grad-a: linear-gradient(135deg, #F2CF74, #C9952A 55%, #9C6F14);
        }

        html, body { min-height: 100%; background: var(--bg); font-family: var(--ff); -webkit-font-smoothing: antialiased; }

        .wp-offline-page {
          min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 32px 24px; background-color: var(--bg); background-image: var(--halo); gap: 20px; text-align: center;
        }
        .wp-offline-icon {
          width: 80px; height: 80px; border-radius: var(--r-xl); display: flex; align-items: center; justify-content: center;
          background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); color: var(--c-belum);
          animation: wpOfflinePulse 2.4s ease-in-out infinite; flex-shrink: 0;
        }
        .wp-offline-badge { font-size: 11px; font-weight: 800; letter-spacing: .14em; color: var(--accent); }
        .wp-offline-title { font-size: 22px; font-weight: 800; color: var(--txt); letter-spacing: -.02em; line-height: 1.2; margin-bottom: 8px; }
        .wp-offline-desc { font-size: 14px; color: var(--txt3); max-width: 300px; line-height: 1.6; margin: 0 auto; }
        .wp-offline-card {
          background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r-lg);
          padding: 14px 18px; width: 100%; max-width: 310px; text-align: left;
        }
        .wp-offline-card-title { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: var(--accent); margin-bottom: 10px; }
        .wp-offline-tip { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--txt2); margin-bottom: 8px; }
        .wp-offline-tip:last-child { margin-bottom: 0; }
        .wp-offline-tip svg { flex-shrink: 0; color: var(--accent); }
        .wp-offline-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 180px; height: 48px; padding: 0 32px;
          background: var(--grad-a); border: 0; border-radius: 12px; color: var(--on-accent);
          font-size: 14px; font-weight: 600; font-family: var(--ff); cursor: pointer;
          box-shadow: 0 6px 24px rgba(0,0,0,.25); transition: opacity .15s ease, transform .15s ease;
        }
        .wp-offline-btn:hover  { opacity: .9; }
        .wp-offline-btn:active { transform: scale(.97); }
        .wp-offline-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .wp-offline-version { font-size: 11px; color: var(--txt4); letter-spacing: .06em; }
        @keyframes wpOfflinePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .65; transform: scale(.95); } }
        @media (prefers-reduced-motion: reduce) { .wp-offline-icon { animation: none; } }
      `}</style>

      <main className="wp-offline-page">
        <div className="wp-offline-icon" aria-hidden="true">
          <WifiSlash size={38} weight="duotone" />
        </div>

        <div className="wp-offline-badge">WIFI PAY</div>

        <div>
          <h1 className="wp-offline-title">{t('offline.title')}</h1>
          <p className="wp-offline-desc">{t('offline.desc')}</p>
        </div>

        <div className="wp-offline-card">
          <div className="wp-offline-card-title">{t('offline.tipsTitle')}</div>
          <div className="wp-offline-tip"><WifiHigh size={18} aria-hidden="true" /><span>{t('offline.tipWifi')}</span></div>
          <div className="wp-offline-tip"><Airplane size={18} aria-hidden="true" /><span>{t('offline.tipAirplane')}</span></div>
          <div className="wp-offline-tip"><ArrowClockwise size={18} aria-hidden="true" /><span>{t('offline.tipReload')}</span></div>
        </div>

        <ReloadButton label={t('offline.retry')} />

        <div className="wp-offline-version">{APP_NAME} {APP_VERSION_FULL}</div>
      </main>
    </>
  );
}
