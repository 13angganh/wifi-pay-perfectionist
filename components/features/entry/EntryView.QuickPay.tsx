// ══════════════════════════════════════════
// components/features/entry/EntryView.QuickPay.tsx
// Dipecah dari EntryView.tsx (task 1.15)
// Quick-pay batch selection panel
// ══════════════════════════════════════════
'use client';
import { useAppStore } from '@/store/useAppStore';
import { rp } from '@/lib/helpers';

export default function EntryQuickPay() {
  const { batchSelected, settings } = useAppStore();

  if (batchSelected.length === 0) return null;

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--zc)', borderRadius:'var(--r-md)', padding:12, marginBottom:10, boxShadow:'var(--shadow-z)' }}>
      <div style={{ fontSize:10, color:'var(--zc)', letterSpacing:'.06em', marginBottom:8 }}>
        QUICK PAY — {batchSelected.length} member
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {(settings?.quickAmounts || [50,80,90,100,150,200]).map(amt => (
          <button key={amt} className="sbtn primary" style={{ padding:'8px 14px', fontSize:12 }}>
            {rp(amt)}
          </button>
        ))}
      </div>
    </div>
  );
}
