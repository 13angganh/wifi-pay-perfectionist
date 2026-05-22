// ══════════════════════════════════════════
// app/(app)/template.tsx — Page transition wrapper
// Next.js App Router: template.tsx di-mount ulang di setiap navigasi
// (berbeda dari layout.tsx yang persist) — ideal untuk page transitions.
// Framer Motion fade+slide subtle agar tidak mengganggu UX.
// ══════════════════════════════════════════
'use client';

// FIX: Hapus animasi page transition — menyebabkan lag saat navigasi antar menu
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}
