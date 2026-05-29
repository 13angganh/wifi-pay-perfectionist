'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <>
      {/* Self-contained CSS — tidak bergantung pada globals.css atau SW cache */}
      <style>{`
        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Dark (default) ── */
        :root {
          --bg:      #0F1117;
          --bg2:     #181C27;
          --bg3:     #1E2235;
          --border:  #252B40;
          --txt:     #FFFFFF;
          --txt2:    #A1A8C1;
          --txt3:    #6B7494;
          --txt5:    #2D3452;
          --zc:      #3B82F6;
          --c-belum: #EF4444;
          --r-xl:    20px;
          --r-md:    12px;
          --r-full:  9999px;
          --ff:      ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        /* ── Light ── */
        body.light {
          --bg:      #F8FAFC;
          --bg2:     #FFFFFF;
          --bg3:     #F0F4F8;
          --border:  #E4EAF0;
          --txt:     #0F1117;
          --txt2:    #374151;
          --txt3:    #6B7280;
          --txt5:    #D1D5DB;
          --zc:      #2563EB;
          --c-belum: #DC2626;
        }
        /* ── Gold ── */
        body.gold {
          --bg:      #0C0A06;
          --bg2:     #141008;
          --bg3:     #1C1610;
          --border:  rgba(201,149,42,0.15);
          --txt:     #F5EAD6;
          --txt2:    #C4AA80;
          --txt3:    #8A7055;
          --txt5:    #2E2218;
          --zc:      #C9952A;
          --c-belum: #EF4444;
        }

        html, body {
          min-height: 100%;
          background: var(--bg);
          font-family: var(--ff);
          -webkit-font-smoothing: antialiased;
        }

        .wp-offline-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: var(--bg);
          gap: 20px;
          text-align: center;
        }

        .wp-offline-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--r-xl);
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: wpOfflinePulse 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        .wp-offline-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .14em;
          color: var(--zc);
          opacity: .75;
        }

        .wp-offline-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--txt);
          letter-spacing: -.02em;
          line-height: 1.2;
          margin-bottom: 8px;
        }

        .wp-offline-desc {
          font-size: 13px;
          color: var(--txt3);
          max-width: 280px;
          line-height: 1.7;
          margin: 0 auto;
        }

        .wp-offline-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 14px 18px;
          width: 100%;
          max-width: 290px;
          text-align: left;
        }

        .wp-offline-card-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
          color: var(--zc);
          margin-bottom: 10px;
        }

        .wp-offline-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--txt2);
          margin-bottom: 7px;
        }
        .wp-offline-tip:last-child { margin-bottom: 0; }

        .wp-offline-tip-icon {
          font-size: 16px;
          flex-shrink: 0;
          line-height: 1;
        }

        .wp-offline-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 12px 32px;
          background: var(--zc);
          border: none;
          border-radius: var(--r-full);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: var(--ff);
          cursor: pointer;
          letter-spacing: .01em;
          transition: opacity .15s ease, transform .15s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,.25);
        }
        .wp-offline-btn:hover  { opacity: .85; transform: scale(1.03); }
        .wp-offline-btn:active { opacity: .7;  transform: scale(.98);  }

        .wp-offline-version {
          font-size: 10px;
          color: var(--txt5);
          letter-spacing: .06em;
        }

        @keyframes wpOfflinePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .6; transform: scale(.94); }
        }
      `}</style>

      <div className="wp-offline-page">

        <div className="wp-offline-icon">
          <WifiOff size={34} color="var(--c-belum)" />
        </div>

        <div className="wp-offline-badge">WIFI PAY</div>

        <div>
          <div className="wp-offline-title">Tidak Ada Akses Internet</div>
          <p className="wp-offline-desc">
            WiFi Pay memerlukan koneksi internet untuk mengakses data.
            Aktifkan WiFi atau paket data, lalu coba lagi.
          </p>
        </div>

        <div className="wp-offline-card">
          <div className="wp-offline-card-title">YANG BISA DILAKUKAN</div>
          <div className="wp-offline-tip">
            <span className="wp-offline-tip-icon">📶</span>
            <span>Aktifkan WiFi atau paket data</span>
          </div>
          <div className="wp-offline-tip">
            <span className="wp-offline-tip-icon">✈️</span>
            <span>Pastikan mode pesawat tidak aktif</span>
          </div>
          <div className="wp-offline-tip">
            <span className="wp-offline-tip-icon">🔄</span>
            <span>Muat ulang setelah internet aktif</span>
          </div>
        </div>

        <button
          className="wp-offline-btn"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={15} />
          Coba Lagi
        </button>

        <div className="wp-offline-version">WiFi Pay v11.3 Next</div>

      </div>
    </>
  );
}
