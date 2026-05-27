// app/offline/page.tsx
import type { Metadata } from 'next';
import ReloadButton from './ReloadButton';

export const metadata: Metadata = {
  title: 'Offline — WiFi Pay',
  robots: { index: false },
};

// Baca tema dari localStorage sebelum render (cegah flash)
const themeScript = `(function(){try{var t=localStorage.getItem('wp_theme');document.body.classList.remove('light','gold');if(t==='light')document.body.classList.add('light');else if(t==='gold')document.body.classList.add('gold');}catch(e){}})();`;

export default function OfflinePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

        /* ── Token default (dark) ── */
        :root {
          --bg:       #0F1117;
          --bg2:      #181C27;
          --bg3:      #1E2336;
          --border:   #252B40;
          --txt:      #E8EAF0;
          --txt2:     #B0B8D0;
          --txt3:     #6B7494;
          --txt5:     #2D3452;
          --zc:       #C9952A;
          --err:      #EF4444;
          --radius:   14px;
          --ff:       'Inter', system-ui, sans-serif;
        }
        /* ── Light ── */
        body.light {
          --bg:     #F8FAFC;
          --bg2:    #FFFFFF;
          --bg3:    #F1F3F8;
          --border: #E2E6F0;
          --txt:    #0F1117;
          --txt2:   #374060;
          --txt3:   #6B7494;
          --txt5:   #C8CDD8;
          --zc:     #C9952A;
        }
        /* ── Gold ── */
        body.gold {
          --bg:     #0C0A06;
          --bg2:    #141008;
          --bg3:    #1A1508;
          --border: #2A2210;
          --txt:    #F0E8D0;
          --txt2:   #C8B880;
          --txt3:   #807040;
          --txt5:   #302810;
          --zc:     #E8B84B;
        }

        html, body {
          min-height: 100%;
          background: var(--bg);
          font-family: var(--ff);
          -webkit-font-smoothing: antialiased;
        }

        .page {
          position: fixed;
          inset: 0;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          gap: 0;
        }

        .icon-wrap {
          width: 88px;
          height: 88px;
          border-radius: 24px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: pulse 2.4s ease-in-out infinite;
        }
        body.gold .icon-wrap {
          background: rgba(232,184,75,0.07);
          border-color: rgba(232,184,75,0.2);
        }

        .badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .14em;
          color: var(--zc);
          margin-bottom: 10px;
          opacity: .75;
        }

        .title {
          font-size: 22px;
          font-weight: 800;
          color: var(--txt);
          letter-spacing: -.03em;
          text-align: center;
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .desc {
          font-size: 13px;
          color: var(--txt3);
          max-width: 270px;
          line-height: 1.7;
          text-align: center;
          margin-bottom: 24px;
        }

        .card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 18px;
          width: 100%;
          max-width: 290px;
          margin-bottom: 24px;
        }

        .card-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
          color: var(--zc);
          margin-bottom: 10px;
        }

        .tip {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--txt2);
          margin-bottom: 7px;
        }
        .tip:last-child { margin-bottom: 0; }
        .tip-icon { font-size: 15px; flex-shrink: 0; }

        .version {
          margin-top: 20px;
          font-size: 10px;
          color: var(--txt5);
          letter-spacing: .06em;
        }

        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.6; transform:scale(.94); }
        }
      `}</style>

      <div className="page">

        {/* Icon wifi offline */}
        <div className="icon-wrap">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none"
            stroke="var(--err,#EF4444)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>

        <div className="badge">WIFI PAY</div>
        <div className="title">Tidak Ada Koneksi</div>
        <div className="desc">
          Pastikan WiFi atau paket data aktif, lalu coba muat ulang.
        </div>

        <div className="card">
          <div className="card-title">YANG BISA DILAKUKAN</div>
          <div className="tip"><span className="tip-icon">📶</span><span>Aktifkan WiFi atau paket data</span></div>
          <div className="tip"><span className="tip-icon">✈️</span><span>Pastikan mode pesawat tidak aktif</span></div>
          <div className="tip"><span className="tip-icon">🔄</span><span>Muat ulang setelah internet aktif</span></div>
        </div>

        <ReloadButton />

        <div className="version">WiFi Pay v11.3 Next</div>
      </div>
    </>
  );
}
