// ══════════════════════════════════════════
// app/(app)/template.tsx — Page transition wrapper
// Next.js App Router: template.tsx di-mount ulang di setiap navigasi
// (berbeda dari layout.tsx yang persist) — ideal untuk page transitions.
// Framer Motion fade+slide subtle agar tidak mengganggu UX.
// ══════════════════════════════════════════
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}
