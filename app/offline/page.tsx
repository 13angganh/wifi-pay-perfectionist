// app/offline/page.tsx — Halaman offline PWA
// Konsisten dengan 3 tema: dark (default), light, gold
// Tema dibaca via inline script sebelum render (sama seperti anti-FOUC di layout.tsx)
import type { Metadata } from 'next';
import ReloadButton from './ReloadButton';

export const metadata: Metadata = {
  title: 'Offline — WiFi Pay',
  robots: { index: false },
};

// Script baca tema dari localStorage sebelum render — cegah flash
const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('wp_theme');
    document.body.classList.remove('light','gold');
    if(t==='light') document.body.classList.add('light');
    else if(t==='gold') document.body.classList.add('gold');
  }catch(e){}
})();
`;

export default function OfflinePage() {
  return (
    <>
      {/* Inject tema sebelum paint */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />

      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg, #0F1117)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}>

        {/* Icon animasi */}
        <div style={{
          width: 88,
          height: 88,
          borderRadius: 24,
          background: 'rgba(var(--offline-icon-bg, 201,149,42), 0.08)',
          border: '1px solid rgba(var(--offline-icon-border, 201,149,42), 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          animation: 'wppulse 2.5s ease-in-out infinite',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
            stroke="var(--c-belum, #EF4444)" strokeWidth="1.5"
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

        {/* App label */}
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: 'var(--zc, #C9952A)',
          letterSpacing: '.14em',
          marginBottom: 10,
          opacity: 0.8,
        }}>
          WIFI PAY
        </div>

        {/* Judul */}
        <div style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--txt, #F0F0F0)',
          letterSpacing: '-0.03em',
          marginBottom: 10,
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          Tidak Ada Koneksi
        </div>

        {/* Deskripsi */}
        <div style={{
          fontSize: 13,
          color: 'var(--txt3, #6B7494)',
          maxWidth: 280,
          lineHeight: 1.7,
          textAlign: 'center',
          marginBottom: 28,
        }}>
          Pastikan perangkat terhubung ke internet (WiFi atau paket data), lalu coba muat ulang.
        </div>

        {/* Tips */}
        <div style={{
          background: 'var(--bg2, #181C27)',
          border: '1px solid var(--border, #252B40)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 28,
          maxWidth: 300,
          width: '100%',
        }}>
          <div style={{
            fontSize: 9,
            color: 'var(--zc, #C9952A)',
            fontWeight: 800,
            letterSpacing: '.1em',
            marginBottom: 10,
          }}>
            YANG BISA DILAKUKAN
          </div>
          {[
            ['📶', 'Aktifkan WiFi atau paket data'],
            ['✈️', 'Pastikan mode pesawat tidak aktif'],
            ['🔄', 'Muat ulang setelah internet aktif'],
          ].map(([icon, text]) => (
            <div key={text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
              fontSize: 12,
              color: 'var(--txt2, #A1A8C1)',
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <ReloadButton />

        <div style={{
          marginTop: 20,
          fontSize: 10,
          color: 'var(--txt5, #2D3452)',
          letterSpacing: '.06em',
        }}>
          WiFi Pay v11.3 Next
        </div>

        <style>{`
          @keyframes wppulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.65; transform: scale(0.95); }
          }
          /* Pastikan body inherit background dari CSS var */
          html, body { margin: 0; padding: 0; min-height: 100%; }
        `}</style>
      </div>
    </>
  );
}
