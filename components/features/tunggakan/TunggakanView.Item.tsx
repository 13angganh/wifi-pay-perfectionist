// ══════════════════════════════════════════
// components/features/tunggakan/TunggakanView.Item.tsx
// Dipecah dari TunggakanView.tsx (task 1.15)
// Single tunggakan item card
// ══════════════════════════════════════════
'use client';

interface UnpaidMonth { label: string; y: number; mi: number; }

interface Props {
  index:   number;
  name:    string;
  unpaid:  UnpaidMonth[];
  onClick: () => void;
}

export default function TunggakanItem({ index, name, unpaid, onClick }: Props) {
  return (
    <div
      className="tcard"
      style={{ cursor:'pointer' }}
      onClick={onClick}
      role="button"
      aria-label={`${name} — ${unpaid.length} bulan tunggakan`}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:10, color:'var(--txt4)', width:18 }}>{index + 1}</span>
          <span className="tcard-name">{name}</span>
        </div>
        <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:11, color:'var(--c-belum)', fontWeight:700, flexShrink:0 }}>
          {unpaid.length} bln
        </span>
      </div>
      <div className="tcard-months">
        {unpaid.slice(0, 6).map((u, i) => (
          <span key={i} className="tmonth">{u.label}</span>
        ))}
        {unpaid.length > 6 && (
          <span className="tmonth" style={{ opacity:.6 }}>+{unpaid.length - 6}</span>
        )}
      </div>
    </div>
  );
}
