// components/ui/PinScreen.tsx — kerangka layar kunci PIN penuh layar (T5 `.pinl`)
'use client';

import type { ReactNode } from 'react';

export function PinScreen({ children, label }: { children: ReactNode; label: string }) {
  return <div className="wp-pinl" role="dialog" aria-modal="true" aria-label={label}>{children}</div>;
}

export default PinScreen;
