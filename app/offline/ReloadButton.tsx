'use client';

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        background: 'var(--zc,#C9952A)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 700,
        padding: '13px 40px',
        fontFamily: "'Inter', system-ui, sans-serif",
        letterSpacing: '.02em',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        transition: 'all 0.2s ease',
        minWidth: '160px',
      }}
      onMouseEnter={e => { const b = e.currentTarget; b.style.opacity='.85'; b.style.transform='scale(1.03)'; }}
      onMouseLeave={e => { const b = e.currentTarget; b.style.opacity='1'; b.style.transform='scale(1)'; }}
    >
      Coba Lagi
    </button>
  );
}
