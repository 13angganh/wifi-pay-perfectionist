// app/offline/ReloadButton.tsx — Client Component
'use client';

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        background: 'var(--zc, #C9952A)',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 700,
        padding: '13px 36px',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        letterSpacing: '.02em',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        minWidth: 180,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      Coba Lagi
    </button>
  );
}
