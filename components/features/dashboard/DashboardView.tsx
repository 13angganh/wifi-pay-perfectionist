// components/features/dashboard/DashboardView.tsx — Fase 4: Skeleton + cleanup
'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { showToast } from '@/components/ui/Toast';
import { getZoneTotal, isLunas, isFree, getPay, getArrears, getPrevMonth, calcPctDelta, rp } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { doJSONBackup, doJSONShare, isShareSupported, doWASummary } from '@/lib/export';
import type { ViewName } from '@/types';
import { SkeletonStat, SkeletonCard } from '@/components/ui/Skeleton';
import {
  LayoutDashboard, ChevronRight,
  TrendingUp, TrendingDown,
  CheckCircle2, Clock, Gift,
  AlertTriangle, Database,
  Share2, Wallet, Minus, ArrowRight,
} from 'lucide-react';

// ── PctBadge — top-level component (task 4.11: react-hooks/static-components) ──
// v11.5.2: tambah invertColor — untuk metrik di mana NAIK berarti buruk (misal tunggakan),
// kebalikan dari income di mana naik berarti baik. Tanpa ini, badge akan salah kasih warna
// (hijau untuk tunggakan naik, padahal itu buruk).
function PctBadge({ pct, prevMonthLabel, invertColor }: { pct: number | null; prevMonthLabel: string; invertColor?: boolean }) {
  if (pct === null) return null;
  const up = pct >= 0;
  const isGood = invertColor ? !up : up;
  return (
    <span style={{ fontSize:9, fontWeight:600, color: isGood ? 'var(--c-lunas)' : 'var(--c-belum)', marginLeft:4, display:'inline-flex', alignItems:'center', gap:2 }}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {Math.abs(pct)}% vs {prevMonthLabel}
    </span>
  );
}

export default function DashboardView() {
  const router = useRouter();
  const { appData, syncStatus, selYear, selMonth, setSelYear, setSelMonth, setView, setViewWithPeriod } = useAppStore();
  const dy = selYear; const dm = selMonth;
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';

  function nav(v: ViewName) { setView(v); router.push('/' + v); }
  // v11.5: navigasi atomic ke Entry pada zona + bulan + tahun tertentu — dipakai saat
  // klik member tunggakan agar langsung lompat ke bulan yang nunggak (kartu auto-expand),
  // bukan bulan sekarang.
  function goToEntryAt(zone: string, year: number, month: number, memberName?: string) {
    setViewWithPeriod('entry', year, month, zone, memberName);
    router.push('/entry');
  }
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  // ── Income ──
  const krsTotal    = getZoneTotal(appData, 'KRS', dy, dm);
  const slkTotal    = getZoneTotal(appData, 'SLK', dy, dm);
  const totalIncome = krsTotal + slkTotal;
  const { year: prevDy, month: prevDm } = getPrevMonth(dy, dm);
  const krsPrev     = getZoneTotal(appData, 'KRS', prevDy, prevDm);
  const slkPrev     = getZoneTotal(appData, 'SLK', prevDy, prevDm);
  const totalPrev   = krsPrev + slkPrev;
  const krsPct2: number | null  = krsPrev > 0 ? Math.round(((krsTotal - krsPrev) / krsPrev) * 100) : null;
  const slkPct2: number | null  = slkPrev > 0 ? Math.round(((slkTotal - slkPrev) / slkPrev) * 100) : null;
  const totalPct: number | null = totalPrev > 0 ? Math.round(((totalIncome - totalPrev) / totalPrev) * 100) : null;
  const opsData   = appData.operasional?.[`${dy}_${dm}`] || { items: [] };
  const totalOps  = (opsData.items || []).reduce((s, it) => s + (+it.nominal || 0), 0);
  const netIncome = totalIncome - totalOps;

  // ── Member counts ──
  const krsAll   = appData.krsMembers || [];
  const slkAll   = appData.slkMembers || [];
  const krsLunas = krsAll.filter(m => isLunas(appData, 'KRS', m, dy, dm) && !isFree(appData, 'KRS', m, dy, dm)).length;
  const krsBelum = krsAll.filter(m => getPay(appData, 'KRS', m, dy, dm) === null && !isFree(appData, 'KRS', m, dy, dm)).length;
  const slkLunas = slkAll.filter(m => isLunas(appData, 'SLK', m, dy, dm) && !isFree(appData, 'SLK', m, dy, dm)).length;
  const slkBelum = slkAll.filter(m => getPay(appData, 'SLK', m, dy, dm) === null && !isFree(appData, 'SLK', m, dy, dm)).length;
  const krsPct   = krsAll.length ? Math.round(krsLunas / krsAll.length * 100) : 0;
  const slkPct   = slkAll.length ? Math.round(slkLunas / slkAll.length * 100) : 0;
  const krsFree  = krsAll.filter(m => isFree(appData, 'KRS', m, dy, dm)).length;
  const slkFree  = slkAll.filter(m => isFree(appData, 'SLK', m, dy, dm)).length;
  const totalFree = krsFree + slkFree;

  // ── v11.5.2: Insight kontekstual — tunggakan & rasio lunas, bulan ini vs bulan lalu ──
  // Reuse prevDy/prevDm yang sudah dihitung di atas (sudah handle wrap tahun Jan→Des).
  const totalBelumNow  = krsBelum + slkBelum;
  const krsBelumPrev   = krsAll.filter(m => getPay(appData, 'KRS', m, prevDy, prevDm) === null && !isFree(appData, 'KRS', m, prevDy, prevDm)).length;
  const slkBelumPrev   = slkAll.filter(m => getPay(appData, 'SLK', m, prevDy, prevDm) === null && !isFree(appData, 'SLK', m, prevDy, prevDm)).length;
  const totalBelumPrev = krsBelumPrev + slkBelumPrev;
  // Selisih tunggakan: negatif = turun (bagus), positif = naik (kurang bagus)
  const tunggakanDelta = calcPctDelta(totalBelumNow, totalBelumPrev);

  const totalAllMembers = krsAll.length + slkAll.length;
  const totalLunasNow   = krsLunas + slkLunas;
  const lunasPctNow     = totalAllMembers ? Math.round((totalLunasNow / totalAllMembers) * 100) : 0;
  const krsLunasPrev    = krsAll.filter(m => isLunas(appData, 'KRS', m, prevDy, prevDm) && !isFree(appData, 'KRS', m, prevDy, prevDm)).length;
  const slkLunasPrev    = slkAll.filter(m => isLunas(appData, 'SLK', m, prevDy, prevDm) && !isFree(appData, 'SLK', m, prevDy, prevDm)).length;
  const totalLunasPrev  = krsLunasPrev + slkLunasPrev;
  const lunasPctPrev    = totalAllMembers ? Math.round((totalLunasPrev / totalAllMembers) * 100) : 0;
  const lunasPctDelta   = lunasPctNow - lunasPctPrev; // poin persentase, bukan rasio

  // ── Tunggakan ──
  const topTunggak: { z: string; name: string; count: number; oldest: string; oldestY: number; oldestMi: number }[] = [];
  for (const z of ['KRS', 'SLK'] as const) {
    const mems = z === 'KRS' ? appData.krsMembers : appData.slkMembers;
    for (const name of mems) {
      const unpaid = getArrears(appData, z, name, dy, dm).filter(u => !isFree(appData, z, name, u.y, u.mi));
      if (unpaid.length > 0) topTunggak.push({ z, name, count: unpaid.length, oldest: unpaid[0].label, oldestY: unpaid[0].y, oldestMi: unpaid[0].mi });
    }
  }
  topTunggak.sort((a, b) => b.count - a.count);
  const top5 = topTunggak.slice(0, 5);

  // ── Misc ──
  const lastBackup = typeof window !== 'undefined' ? localStorage.getItem('wp_last_backup') : null;
  const backupLbl  = lastBackup ? new Date(+lastBackup).toLocaleDateString('id-ID') : t('common.noData');
  const bulanLbl   = `${MONTH_NAMES[dm]} ${dy}`;

  const card = {
    background:'var(--bg2)',
    border:'1px solid rgba(255,255,255,0.05)',
    borderRadius:'var(--r-md)',
    padding:16,
    marginBottom:10,
    boxShadow:'var(--shadow-sm)',
  } as const;

  return (
    <div>
      {/* Header + Period selector */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <LayoutDashboard size={16} style={{ color:'var(--txt3)' }} />
          <span style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:16, color:'var(--txt)' }}>Dashboard</span>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <select className="cs" style={{ fontSize:11, padding:'5px 8px' }} value={dm} onChange={e => setSelMonth(+e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="cs" style={{ fontSize:11, padding:'5px 8px' }} value={dy} onChange={e => setSelYear(+e.target.value)}>
            {getYears().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize:9, color:'var(--txt4)', letterSpacing:'.07em', marginBottom:12, textTransform:'uppercase' }}>{bulanLbl}</div>

      {/* Skeleton saat pertama kali load */}
      {syncStatus === 'loading' && appData.krsMembers.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <SkeletonCard />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <SkeletonStat /><SkeletonStat />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
      <>

      {/* ── Hero Metric: Total Income ── */}
      <div style={{
        ...card,
        background:'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(24,28,39,0) 60%)',
        borderColor:'rgba(34,197,94,0.15)',
        padding:'20px 16px',
        marginBottom:10,
      }}>
        <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>
          {t('dashboard.thisMonth')}
        </div>
        <div style={{
          fontFamily:"var(--font-sans),sans-serif",
          fontSize:'clamp(22px,6vw,32px)',
          fontWeight:800,
          color:'var(--c-lunas)',
          lineHeight:1.1,
          marginBottom:6,
        }}>
          {rp(totalIncome)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <PctBadge pct={totalPct} prevMonthLabel={MONTH_NAMES[prevDm]} />
          {totalOps > 0 && (
            <span style={{ fontSize:10, color:'var(--txt4)', display:'flex', alignItems:'center', gap:4 }}>
              <Minus size={10} /> Ops: {rp(totalOps)} →
              <span style={{ color: netIncome >= 0 ? 'var(--c-lunas)' : 'var(--c-belum)', fontWeight:600, marginLeft:2 }}>
                {t('dashboard.net')}: {rp(netIncome)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── v11.5.2: Insight Kontekstual — tunggakan & rasio lunas vs bulan lalu ── */}
      <div style={card}>
        <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
          {t('dashboard.insightTitle')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {/* Tunggakan bulan ini vs bulan lalu */}
          <div>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:3 }}>{t('dashboard.insightTunggakan')}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:20, fontWeight:800, color: totalBelumNow > 0 ? 'var(--c-belum)' : 'var(--c-lunas)' }}>
                {totalBelumNow}
              </span>
              <span style={{ fontSize:10, color:'var(--txt4)' }}>{t('common.members')}</span>
            </div>
            {tunggakanDelta !== null ? (
              <PctBadge pct={tunggakanDelta} prevMonthLabel={MONTH_NAMES[prevDm]} invertColor />
            ) : (
              <span style={{ fontSize:9, color:'var(--txt4)', marginLeft:2 }}>{t('dashboard.insightNoBaseline')}</span>
            )}
          </div>
          {/* Rasio lunas bulan ini vs bulan lalu */}
          <div>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:3 }}>{t('dashboard.insightLunasRatio')}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontFamily:"var(--font-sans),sans-serif", fontSize:20, fontWeight:800, color:'var(--c-lunas)' }}>
                {lunasPctNow}%
              </span>
            </div>
            <span style={{
              fontSize:9, fontWeight:600, marginLeft:2, display:'inline-flex', alignItems:'center', gap:2,
              color: lunasPctDelta === 0 ? 'var(--txt4)' : lunasPctDelta > 0 ? 'var(--c-lunas)' : 'var(--c-belum)',
            }}>
              {lunasPctDelta === 0
                ? <Minus size={9} />
                : lunasPctDelta > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {lunasPctDelta === 0 ? t('dashboard.insightSame') : `${Math.abs(lunasPctDelta)} pp vs ${MONTH_NAMES[prevDm]}`}
            </span>
          </div>
        </div>
      </div>

      {/* KRS + SLK cards — shadow-md, progress bar 6px */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {([
          ['KRS', 'var(--zc-krs)', krsTotal, krsPct2, krsLunas, krsAll.length, krsPct],
          ['SLK', 'var(--zc-slk)', slkTotal, slkPct2, slkLunas, slkAll.length, slkPct],
        ] as const).map(([zone, color, tot, pct2, lunas, allLen, pct]) => (
          <div key={zone} style={{
            ...card,
            boxShadow:'var(--shadow-md)',
            padding:'14px 14px',
          }}>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              {zone} <PctBadge pct={pct2 as number | null} prevMonthLabel={MONTH_NAMES[prevDm]} />
            </div>
            <div style={{
              fontFamily:"var(--font-sans),sans-serif",
              fontSize:'clamp(12px,3.8vw,15px)',
              fontWeight:800,
              color: color as string,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              marginBottom:8,
            }}>
              {rp(tot as number)}
            </div>
            <div>
              {/* Progress bar 6px */}
              <div style={{ height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  height:'100%', width:`${pct}%`,
                  background: color as string,
                  borderRadius:3, transition:'width .4s var(--ease-smooth)',
                }} />
              </div>
              <div style={{ fontSize:9, color:'var(--txt4)', marginTop:4 }}>{lunas}/{allLen} {t('status.lunas')} ({pct}%)</div>
            </div>
          </div>
        ))}
      </div>

      {/* Belum bayar */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--txt)' }}>
            <Clock size={14} style={{ color:'var(--c-belum)' }} /> {t('dashboard.unpaidTitle')} {bulanLbl}
          </div>
          <div style={{ fontSize:12, color:'var(--c-belum)', fontWeight:700 }}>{krsBelum + slkBelum} {t('common.members')}</div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom: totalFree > 0 ? 8 : 0 }}>
          {([
            ['KRS', krsBelum, 'var(--c-belum)'],
            ['SLK', slkBelum, 'var(--c-belum)'],
            [t('status.lunas'), krsLunas + slkLunas, 'var(--c-lunas)'],
          ] as const).map(([label, val, color]) => (
            <div key={label} style={{ flex:1, background:'var(--bg3)', borderRadius:'var(--r-sm)', padding:'8px 6px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--txt4)' }}>{label}</div>
              <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--font-sans),sans-serif", color: color as string }}>{val}</div>
            </div>
          ))}
        </div>
        {totalFree > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background:'var(--zcdim)', border:'1px solid var(--border)',
            borderRadius:'var(--r-sm)', padding:'7px 10px',
          }}>
            <span style={{ fontSize:10, color:'var(--c-free)', display:'flex', alignItems:'center', gap:5 }}>
              <Gift size={12} /> {t('status.free')} {bulanLbl}
            </span>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--c-free)' }}>
              {totalFree} {t('common.members')} <span style={{ fontSize:9, opacity:.7 }}>(KRS:{krsFree} SLK:{slkFree})</span>
            </span>
          </div>
        )}
        {(krsBelum + slkBelum) > 0 && (
          <button
            onClick={() => { setViewWithPeriod('entry', dy, dm); router.push('/entry'); }}
            style={{
              marginTop:10, width:'100%', display:'flex', alignItems:'center',
              justifyContent:'center', gap:6,
              background:'rgba(239,68,68,0.07)',
              border:'1px solid rgba(239,68,68,0.2)',
              color:'var(--c-belum)', borderRadius:'var(--r-sm)',
              padding:'9px 12px', cursor:'pointer', fontSize:12,
              fontWeight:700, fontFamily:"var(--font-sans),sans-serif",
              transition:'all var(--t-fast)',
            }}
          >
            <ArrowRight size={13} />
            Input Bayar {bulanLbl}
          </button>
        )}
      </div>

      {/* Top tunggakan — tanpa aging widget */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--txt)', marginBottom:10 }}>
          <AlertTriangle size={14} style={{ color:'var(--c-belum)' }} /> {t('dashboard.topArrears')}
        </div>
        {top5.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <CheckCircle2 size={24} style={{ color:'var(--c-lunas)' }} />
            <span style={{ color:'var(--c-lunas)', fontSize:12 }}>{t('dashboard.allPaid')}</span>
          </div>
        ) : (
          top5.map((t2, i) => (
            <div
              key={i}
              onClick={() => goToEntryAt(t2.z, t2.oldestY, t2.oldestMi, t2.name)}
              role="button"
              tabIndex={0}
              aria-label={`${t2.name} — ${t2.count} bulan tunggakan, ke Entry ${t2.oldest}`}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 4px',
                margin:'0 -4px',
                borderRadius:'var(--r-sm)',
                cursor:'pointer',
                transition:'background var(--t-fast)',
                borderBottom: i < top5.length - 1 ? '1px solid var(--border2)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='var(--bg3)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='transparent'}
            >
              <div>
                <span style={{ fontSize:13, color:'var(--txt)', fontFamily:"var(--font-mono),monospace" }}>{t2.name}</span>
                <span style={{ fontSize:9, color:'var(--txt4)', marginLeft:6 }}>{t2.z}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, color:'var(--c-belum)', fontWeight:700 }}>{t2.count} {t('common.months')}</div>
                  <div style={{ fontSize:9, color:'var(--txt4)' }}>{t('common.since')} {t2.oldest}</div>
                </div>
                <ChevronRight size={14} style={{ color:'var(--txt4)', flexShrink:0 }} />
              </div>
            </div>
          ))
        )}
        {topTunggak.length > 5 && (
          <div
            style={{ fontSize:10, color:'var(--txt3)', textAlign:'center', marginTop:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
            onClick={() => nav('tunggakan')}
          >
            +{topTunggak.length - 5} {t('common.more')}
            <ChevronRight size={12} />
          </div>
        )}
      </div>

      {/* Operasional row — tappable, navigate ke Operasional */}
      <div
        style={{
          ...card,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          cursor:'pointer', transition:'background var(--t-fast)',
        }}
        onClick={() => nav('operasional')}
        role="button"
        aria-label={t('nav.operasional')}
      >
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Wallet size={14} style={{ color:'var(--txt3)' }} /> {t('nav.operasional')} {bulanLbl}
          </div>
          <div style={{ fontSize:11, color: totalOps > 0 ? 'var(--c-belum)' : 'var(--txt4)', marginTop:3 }}>
            {totalOps > 0 ? rp(totalOps) : t('common.noData')}
          </div>
        </div>
        <ChevronRight size={16} style={{ color:'var(--txt4)', flexShrink:0 }} />
      </div>

      {/* Backup — 2 pilihan: Download + Share */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Database size={14} style={{ color:'var(--txt3)' }} /> {t('dashboard.lastBackup')}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)' }}>{backupLbl}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {/* Download ke storage */}
          <button
            style={{ flex:1, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt2)', padding:'9px 8px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
            onClick={() => { doJSONBackup(appData); showToast('Backup berhasil diunduh'); }}
          >
            <Database size={12} /> Download
          </button>
          {/* Share — hanya tampil jika Web Share tersedia */}
          {isShareSupported() && (
            <button
              style={{ flex:1, background:'rgba(201,149,42,0.08)', border:'1px solid rgba(201,149,42,0.25)', color:'var(--zc)', padding:'9px 8px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
              onClick={async () => {
                const ok = await doJSONShare(appData);
                if (ok) showToast('Backup berhasil dibagikan');
                else showToast('Share dibatalkan', 'err');
              }}
            >
              <Share2 size={12} /> Bagikan
            </button>
          )}
        </div>
      </div>

      {/* WA Summary — label dinamis sesuai selector bulan */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Share2 size={14} style={{ color:'var(--txt3)' }} /> {t('dashboard.waSummary')}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)' }}>{bulanLbl}</div>
        </div>
        <button
          style={{
            width:'100%',
            background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
            color:'var(--c-lunas)', padding:12, borderRadius:'var(--r-sm)',
            cursor:'pointer', fontSize:13, fontWeight:600,
            transition:'all var(--t-fast)', minHeight:44,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
          onClick={() => { doWASummary(appData, dy, dm); }}
        >
          <Share2 size={15} />
          {t('dashboard.sendWA')} {bulanLbl}
        </button>
        <div style={{ fontSize:9, color:'var(--txt4)', marginTop:6, textAlign:'center' }}>
          {t('dashboard.periodNote')}
        </div>
      </div>
      </> /* end skeleton conditional */
      )}
    </div>
  );
}
