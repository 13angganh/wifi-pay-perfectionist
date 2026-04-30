// components/features/tunggakan/TunggakanView.tsx — Fase 4: Skeleton + EmptyState
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { getArrears, isFree } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import {
  AlertTriangle, Star, Gift, CheckCircle2,
  AlertCircle, Flame, Clock, Medal,
} from 'lucide-react';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Tab mode: nakal/rajin/free (mode existing)
type TMode = 'nakal' | 'rajin' | 'free';
// Aging filter (sub-filter dari nakal)
type AgingFilter = 'total' | 'baru' | 'segera' | 'kritis';

export default function TunggakanView() {
  const { appData, syncStatus, activeZone, selYear, selMonth, setSelYear, setSelMonth } = useAppStore();
  const [mode, setMode] = useState<TMode>('nakal');
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('total');
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;

  const mems = activeZone === 'KRS' ? appData.krsMembers : appData.slkMembers;

  // Nunggak
  const allArrears = mems.map(name => {
    const unpaid = getArrears(appData, activeZone, name, selYear, selMonth)
      .filter(u => !isFree(appData, activeZone, name, u.y, u.mi));
    return { name, unpaid, count: unpaid.length };
  }).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  // Rajin
  const rajin = mems.filter(name => {
    if (isFree(appData, activeZone, name, selYear, selMonth)) return false;
    return getArrears(appData, activeZone, name, selYear, selMonth)
      .filter(u => !isFree(appData, activeZone, name, u.y, u.mi)).length === 0;
  });

  // Free
  const freeList = mems.filter(name => isFree(appData, activeZone, name, selYear, selMonth));

  // ── Aging classification ──
  const agingBaru   = allArrears.filter(x => x.count === 1);
  const agingSegera = allArrears.filter(x => x.count >= 2 && x.count <= 3);
  const agingKritis = allArrears.filter(x => x.count >= 4);

  // Filtered list berdasarkan aging tab
  const filteredArrears = agingFilter === 'total'  ? allArrears
    : agingFilter === 'baru'    ? agingBaru
    : agingFilter === 'segera'  ? agingSegera
    : agingKritis;

  const count = mode === 'nakal' ? filteredArrears.length : mode === 'rajin' ? rajin.length : freeList.length;
  const sumColor = mode === 'nakal' ? 'var(--c-belum)' : mode === 'rajin' ? 'var(--c-lunas)' : 'var(--c-free)';
  const sumLabel = mode === 'nakal' ? t('tunggakan.sumLabel') : mode === 'rajin' ? t('tunggakan.sumLunas') : t('tunggakan.sumFree');

  return (
    <div>
      {/* Period selector */}
      <div className="ctrl-row">
        <select className="cs" value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="cs" value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:10, background:'var(--bg3)', padding:3, borderRadius:20, border:'1px solid var(--border)' }}>
        {([
          ['nakal', <AlertCircle size={12} />, t('tunggakan.nakal'), allArrears.length, 'var(--c-belum)'],
          ['rajin', <Star size={12} />,        t('tunggakan.rajin'),   rajin.length,       'var(--c-lunas)'],
          ['free',  <Gift size={12} />,         t('status.free'),    freeList.length,    'var(--c-free)'],
        ] as const).map(([m, icon, label, cnt, color]) => (
          <button
            key={m}
            onClick={() => { setMode(m as TMode); setAgingFilter('total'); }}
            style={{
              flex:1, padding:'7px 4px', borderRadius:16, border:'none', cursor:'pointer',
              fontSize:11, fontWeight:600, minHeight:36,
              background: mode === m ? color as string : 'transparent',
              color:      mode === m ? (m === 'rajin' ? '#0a0c12' : '#fff') : 'var(--txt3)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              transition:'all var(--t-fast)',
            }}
          >
            {icon} {label} ({cnt})
          </button>
        ))}
      </div>

      {/* ── Aging filter bar — hanya tampil di mode nakal ── */}
      {mode === 'nakal' && (
        <div style={{
          display:'flex', gap:6, marginBottom:10,
          overflowX:'auto', paddingBottom:2,
        }}>
          {([
            ['total',  <AlertTriangle size={11} />, t('tunggakan.filter.total'),   allArrears.length,  'var(--txt2)',   'var(--bg3)', 'var(--border)'],
            ['baru',   <Clock size={11} />,          t('tunggakan.filter.new'),    agingBaru.length,   '#FFC107',       '#1a1500',   '#FFC10733'],
            ['segera', <AlertCircle size={11} />,    t('tunggakan.filter.soon'),  agingSegera.length, '#F97316',       '#1a0d00',   '#F9731633'],
            ['kritis', <Flame size={11} />,           t('tunggakan.filter.critical'),  agingKritis.length, 'var(--c-belum)','rgba(239,68,68,0.08)', 'rgba(239,68,68,0.25)'],
          ] as const).map(([key, icon, label, cnt, textColor, bgColor, borderColor]) => (
            <button
              key={key}
              onClick={() => setAgingFilter(key as AgingFilter)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:'var(--r-full)',
                border:`1px solid ${agingFilter === key ? borderColor as string : 'var(--border)'}`,
                background: agingFilter === key ? bgColor as string : 'transparent',
                color: agingFilter === key ? textColor as string : 'var(--txt4)',
                fontSize:11, fontWeight: agingFilter === key ? 700 : 500,
                cursor:'pointer', whiteSpace:'nowrap', minHeight:36,
                transition:'all var(--t-fast)',
                flexShrink:0,
              }}
            >
              {icon}
              {label}
              <span style={{
                background: agingFilter === key ? 'rgba(0,0,0,0.2)' : 'var(--bg3)',
                borderRadius:'var(--r-full)', padding:'1px 7px',
                fontSize:10, fontWeight:700,
                color: agingFilter === key ? textColor as string : 'var(--txt3)',
              }}>
                {cnt}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Summary bar */}
      <div className="sum-bar" style={{ marginBottom:10 }}>
        <div className="sum-lbl">{sumLabel} {MONTH_NAMES[selMonth].toUpperCase()} {selYear} · {activeZone}</div>
        <div className="sum-val" style={{ color: sumColor }}>{count} {t('common.members')}</div>
      </div>

      {/* Cards — mode nakal */}
      {mode === 'nakal' && (
        syncStatus === 'loading' && mems.length === 0 ? (
          <SkeletonList count={4} />
        ) : filteredArrears.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t('dashboard.allPaid')}
            description={
              agingFilter === 'total' ? t('tunggakan.emptyTotal')
              : agingFilter === 'baru'   ? t('tunggakan.emptyNew')
              : agingFilter === 'segera' ? t('tunggakan.emptySoon')
              : t('tunggakan.emptyCritical')
            }
            size="md"
          />
        ) : (
          filteredArrears.map((x, i) => {
            // Tentukan warna aging per card
            const agingColor = x.count >= 4 ? 'var(--c-belum)'
              : x.count >= 2 ? '#F97316'
              : '#FFC107';

            return (
              <div key={x.name} className="tcard" style={{
                borderLeft: `3px solid ${agingColor}`,
                borderRadius:'var(--r-md)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span className="tcard-name">{i + 1}. {x.name}</span>
                  <span style={{
                    fontSize:10, fontWeight:600, color: agingColor,
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    {x.count >= 4 ? <Flame size={11} /> : x.count >= 2 ? <AlertCircle size={11} /> : <Clock size={11} />}
                    {x.count} {t('tunggakan.months')}
                  </span>
                </div>
                <div className="tcard-months">
                  {x.unpaid.slice(0, 12).map(u => <span key={u.label} className="tmonth">{u.label}</span>)}
                  {x.unpaid.length > 12 && <span className="tmonth" style={{ color:'var(--txt2)' }}>+{x.unpaid.length - 12} lagi</span>}
                </div>
              </div>
            );
          })
        )
      )}

      {/* Cards — mode rajin */}
      {mode === 'rajin' && (
        rajin.length === 0 ? (
          <EmptyState
            icon={Medal}
            title={t('common.noData')}
            description={t('tunggakan.emptyRajin')}
            size="md"
          />
        ) : (
          rajin.map((name, i) => (
            <div key={name} className="tcard" style={{
              borderLeft:'3px solid var(--c-lunas)',
              borderColor:'rgba(34,197,94,0.2)',
              borderRadius:'var(--r-md)',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="tcard-name" style={{ color:'var(--c-lunas)', display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle2 size={13} /> {i + 1}. {name}
                </span>
                <span style={{ fontSize:10, color:'var(--c-lunas)' }}>{t('tunggakan.paidAll')}</span>
              </div>
            </div>
          ))
        )
      )}

      {/* Cards — mode free */}
      {mode === 'free' && (
        freeList.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={t('common.noData')}
            description={t('tunggakan.emptyFree')}
            size="md"
          />
        ) : (
          freeList.map((name, i) => {
            const fm = appData.freeMembers?.[activeZone + '__' + name];
            const toStr = fm?.toYear !== undefined
              ? ` s/d ${MONTH_NAMES[fm.toMonth!]} ${fm.toYear}` : `(${t('tunggakan.forever')})`;
            return (
              <div key={name} className="tcard" style={{
                borderLeft:'3px solid var(--c-free)',
                borderColor:'rgba(59,130,246,0.15)',
                background:'rgba(59,130,246,0.04)',
                borderRadius:'var(--r-md)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span className="tcard-name" style={{ color:'var(--c-free)', display:'flex', alignItems:'center', gap:6 }}>
                    <Gift size={13} /> {i + 1}. {name}
                  </span>
                  <span style={{ fontSize:10, color:'var(--c-free)' }}>{t('status.free')}</span>
                </div>
                {fm && (
                  <div style={{ fontSize:10, color:'var(--txt4)', marginTop:3 }}>
                    Dari {MONTH_NAMES[fm.fromMonth]} {fm.fromYear}{toStr}
                  </div>
                )}
              </div>
            );
          })
        )
      )}
    </div>
  );
}
