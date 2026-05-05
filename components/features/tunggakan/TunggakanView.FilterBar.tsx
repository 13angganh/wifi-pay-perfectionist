// ══════════════════════════════════════════
// components/features/tunggakan/TunggakanView.FilterBar.tsx
// Dipecah dari TunggakanView.tsx (task 1.15)
// Mode tabs + aging filter bar
// ══════════════════════════════════════════
'use client';

import { AlertTriangle, Star, Gift, AlertCircle, Flame, Clock } from 'lucide-react';
import { useT } from '@/hooks/useT';

export type TMode = 'nakal' | 'rajin' | 'free';
export type AgingFilter = 'total' | 'baru' | 'segera' | 'kritis';

interface Props {
  mode:         TMode;
  agingFilter:  AgingFilter;
  counts:       { nakal: number; rajin: number; free: number };
  agingCounts:  { total: number; baru: number; segera: number; kritis: number };
  onMode:       (m: TMode) => void;
  onAging:      (f: AgingFilter) => void;
}

export default function TunggakanFilterBar({ mode, agingFilter, counts, agingCounts, onMode, onAging }: Props) {
  const t = useT();
  return (
    <>
      {/* Mode tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:10, background:'var(--bg3)', padding:3, borderRadius:20, border:'1px solid var(--border)' }}>
        {([
          ['nakal', <AlertCircle size={12} key="a" />, t('tunggakan.nakal'), counts.nakal, 'var(--c-belum)'],
          ['rajin', <Star        size={12} key="b" />, t('tunggakan.rajin'), counts.rajin, 'var(--c-lunas)'],
          ['free',  <Gift        size={12} key="c" />, t('status.free'),    counts.free,  'var(--c-free)'],
        ] as [TMode, React.ReactNode, string, number, string][]).map(([m, icon, label, cnt, color]) => (
          <button key={m} onClick={() => onMode(m)} style={{ flex:1, padding:'7px 4px', borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, minHeight:36, background: mode === m ? color : 'transparent', color: mode === m ? (m === 'rajin' ? '#0a0c12' : '#fff') : 'var(--txt3)', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all var(--t-fast)' }}>
            {icon} {label} ({cnt})
          </button>
        ))}
      </div>

      {/* Aging filter — hanya di mode nakal */}
      {mode === 'nakal' && (
        <div style={{ display:'flex', gap:6, marginBottom:10, overflowX:'auto', paddingBottom:2 }}>
          {([
            ['total',  <AlertTriangle size={11} key="at" />, t('tunggakan.filter.total'),    agingCounts.total,  'var(--txt2)',   'var(--bg3)',                 'var(--border)'],
            ['baru',   <Clock         size={11} key="cl" />, t('tunggakan.filter.new'),      agingCounts.baru,   '#FFC107',      '#1a1500',                   '#FFC10733'],
            ['segera', <AlertCircle   size={11} key="ac" />, t('tunggakan.filter.soon'),     agingCounts.segera, '#F97316',      '#1a0d00',                   '#F9731633'],
            ['kritis', <Flame         size={11} key="fl" />, t('tunggakan.filter.critical'), agingCounts.kritis, 'var(--c-belum)','rgba(239,68,68,0.08)',     'rgba(239,68,68,0.25)'],
          ] as [AgingFilter, React.ReactNode, string, number, string, string, string][]).map(([key, icon, label, cnt, textColor, bgColor, borderColor]) => (
            <button key={key} onClick={() => onAging(key)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--r-full)', border:`1px solid ${agingFilter === key ? borderColor : 'var(--border)'}`, background: agingFilter === key ? bgColor : 'transparent', color: agingFilter === key ? textColor : 'var(--txt4)', fontSize:11, fontWeight: agingFilter === key ? 700 : 500, cursor:'pointer', whiteSpace:'nowrap', minHeight:36, transition:'all var(--t-fast)', flexShrink:0 }}>
              {icon} {label}
              <span style={{ background: agingFilter === key ? 'rgba(0,0,0,0.2)' : 'var(--bg3)', borderRadius:'var(--r-full)', padding:'1px 7px', fontSize:10, fontWeight:700 }}>{cnt}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
