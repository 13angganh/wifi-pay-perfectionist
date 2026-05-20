// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.Stats.tsx
// Dipecah dari DashboardView.tsx (task 1.15)
// Hero metric + KRS/SLK zone cards + belum bayar card
// UI FIX: Framer Motion entrance + gradient progress bar + enhanced belum card
// ══════════════════════════════════════════
'use client';

import { TrendingUp, TrendingDown, Clock, Gift, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';

interface ZoneStats {
  zone:   string;
  color:  string;
  total:  number;
  pct2:   number | null;
  lunas:  number;
  allLen: number;
  pct:    number;
}

interface Props {
  bulanLbl:    string;
  totalIncome: number;
  totalOps:    number;
  netIncome:   number;
  totalPct:    number | null;
  krsStats:    ZoneStats;
  slkStats:    ZoneStats;
  krsBelum:    number;
  slkBelum:    number;
  krsLunas:    number;
  slkLunas:    number;
  totalFree:   number;
  krsFree:     number;
  slkFree:     number;
}

function PctBadge({ pct, prevLabel }: { pct: number | null; prevLabel?: string }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span style={{ fontSize:9, fontWeight:600, color: up ? 'var(--c-lunas)' : 'var(--c-belum)', marginLeft:4, display:'inline-flex', alignItems:'center', gap:2 }}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {Math.abs(pct)}%{prevLabel ? ` vs ${prevLabel}` : ''}
    </span>
  );
}

// Animated progress bar dengan gradient fill
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 3,
          boxShadow: pct < 100 ? `0 0 6px ${color}66` : 'none',
        }}
      />
    </div>
  );
}

const cardBase = {
  background: 'var(--bg2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--r-md)',
  padding: 16,
  marginBottom: 10,
  boxShadow: 'var(--shadow-sm)',
} as const;

// Stagger container untuk entrance animation
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
};

export default function DashboardStats(p: Props) {
  const t = useT();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* Hero Metric */}
      <motion.div variants={itemVariants} style={{
        ...cardBase,
        background:'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(24,28,39,0) 60%)',
        borderColor:'rgba(34,197,94,0.15)',
        padding:'20px 16px',
      }}>
        <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>
          {t('dashboard.thisMonth')}
        </div>
        <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:'clamp(22px,6vw,32px)', fontWeight:800, color:'var(--c-lunas)', lineHeight:1.1, marginBottom:6 }}>
          {rp(p.totalIncome)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <PctBadge pct={p.totalPct} />
          {p.totalOps > 0 && (
            <span style={{ fontSize:10, color:'var(--txt4)', display:'flex', alignItems:'center', gap:4 }}>
              <Minus size={10} /> Ops: {rp(p.totalOps)} →
              <span style={{ color: p.netIncome >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', fontWeight:600, marginLeft:2 }}>
                {t('dashboard.net')}: {rp(p.netIncome)}
              </span>
            </span>
          )}
        </div>
      </motion.div>

      {/* KRS + SLK zone cards */}
      <motion.div variants={itemVariants} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {[p.krsStats, p.slkStats].map(z => (
          <div key={z.zone} style={{ ...cardBase, boxShadow:'var(--shadow-md)', padding:'14px 14px', marginBottom:0 }}>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              {z.zone} <PctBadge pct={z.pct2} />
            </div>
            <div style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:'clamp(12px,3.8vw,15px)', fontWeight:800, color:z.color, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:8 }}>
              {rp(z.total)}
            </div>
            {/* Animated gradient progress bar */}
            <ProgressBar pct={z.pct} color={z.color} />
            <div style={{ fontSize:9, color:'var(--txt4)', marginTop:4 }}>
              {z.lunas}/{z.allLen} {t('status.lunas')} ({z.pct}%)
            </div>
          </div>
        ))}
      </motion.div>

      {/* Belum bayar — enhanced */}
      <motion.div variants={itemVariants} style={{
        ...cardBase,
        borderColor: p.krsBelum + p.slkBelum > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--txt)' }}>
            <Clock size={14} style={{ color:'var(--c-belum)' }} /> {t('dashboard.unpaidTitle')} {p.bulanLbl}
          </div>
          <div style={{
            fontSize:12, color:'var(--c-belum)', fontWeight:700,
            background: p.krsBelum + p.slkBelum > 0 ? 'var(--c-belum-tint)' : 'transparent',
            padding: '2px 8px', borderRadius: 'var(--r-full)',
          }}>
            {p.krsBelum + p.slkBelum} {t('common.members')}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom: p.totalFree > 0 ? 8 : 0 }}>
          {[
            ['KRS', p.krsBelum, 'var(--c-belum)'],
            ['SLK', p.slkBelum, 'var(--c-belum)'],
            [t('status.lunas'), p.krsLunas + p.slkLunas, 'var(--c-lunas)'],
          ].map(([label, val, color]) => (
            <div key={String(label)} style={{ flex:1, background:'var(--bg3)', borderRadius:'var(--r-sm)', padding:'8px 6px', textAlign:'center', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--font-sans),sans-serif", color: String(color), lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>
        {p.totalFree > 0 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--zcdim)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'7px 10px' }}>
            <span style={{ fontSize:10, color:'var(--c-free)', display:'flex', alignItems:'center', gap:5 }}>
              <Gift size={12} /> {t('status.free')} {p.bulanLbl}
            </span>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--c-free)' }}>
              {p.totalFree} {t('common.members')} <span style={{ fontSize:9, opacity:.7 }}>(KRS:{p.krsFree} SLK:{p.slkFree})</span>
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
