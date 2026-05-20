// app/offline/ReloadButton.tsx — Client Component
// Dipecah dari page.tsx karena page.tsx perlu export metadata (Server Component)
// sedangkan tombol reload butuh onClick (hanya bisa di Client Component).
'use client';

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: 8,
        background: 'var(--zc, #3B82F6)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--r-md, 12px)',
        padding: '10px 28px',
        fontFamily: 'var(--font-sans, system-ui), sans-serif',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        minHeight: 44,
      }}
    >
      Muat Ulang
    </button>
  );
}
