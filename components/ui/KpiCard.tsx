// components/ui/KpiCard.tsx — kartu KPI (.kpi/.kpi2), dipakai Grafik (T9)
'use client';

import type { ReactNode } from 'react';
import { Card } from './Card';

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="wp-kpi2">{children}</div>;
}

export function KpiCard({ label, value, caption, color }: { label: string; value: ReactNode; caption?: ReactNode; color?: string }) {
  return (
    <Card padding="sm" className="wp-kpi">
      <span className="wp-t-cap">{label}</span>
      <span className="wp-kpi__v" style={color ? { color } : undefined}>{value}</span>
      {caption && <span className="wp-t-cap">{caption}</span>}
    </Card>
  );
}

export default KpiCard;
