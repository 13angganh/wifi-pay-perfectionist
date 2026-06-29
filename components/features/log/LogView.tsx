// components/features/log/LogView.tsx — Fase 4: Skeleton + EmptyState
'use client';

import { useState } from 'react';
import type React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { fuzzyMatch } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { ScrollText, Search, X, RotateCcw, Banknote, Trash2, Pencil, UserPlus, Undo2, Globe, Gift, FileText, Lock, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function LogView() {
  const { appData, syncStatus, logSearch, setLogSearch, logType, setLogType } = useAppStore();
  const [logYear,  setLogYear]  = useState('');
  const [logMonth, setLogMonth] = useState('');
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const logs = appData.activityLog || [];

  // v11.5 FIX: gabungkan dua search box yang sebelumnya redundan (search aksi + filter nama)
  // — keduanya mencari di field yang sama persis (action + detail), hanya beda algoritma
  // (includes vs fuzzyMatch). Sekarang satu search box saja, pakai fuzzyMatch yang lebih
  // fleksibel (superset dari includes untuk kasus ini), tanpa kehilangan kapabilitas apapun.
  let filtered = [...logs];
  if (logType === 'pay') {
    filtered = filtered.filter(l => l.action && (
      l.action.includes('Quick Pay') ||
      l.action.startsWith('[PAY]') || l.action.startsWith('[DEL]') || l.action.startsWith('[FREE]') ||
      // Legacy: data lama pakai emoji prefix
      /^[\u{1F4B0}\u{1F5D1}\u{1F193}]/u.test(l.action) ||
      l.action.includes('Hapus bayar')
    ));
  }
  if (logSearch.trim()) {
    filtered = filtered.filter(l => fuzzyMatch(l.action || '', logSearch) || fuzzyMatch(l.detail || '', logSearch));
  }
  if (logYear)  filtered = filtered.filter(l => new Date(l.ts).getFullYear() === +logYear);
  if (logMonth) filtered = filtered.filter(l => new Date(l.ts).getMonth() === +logMonth);

  function reset() { setLogSearch(''); setLogYear(''); setLogMonth(''); setLogType('all'); }


  const isFiltered = logType !== 'all' || logSearch.trim() || logYear || logMonth;

  function getLogMeta(action: string): { icon: React.ReactNode; color: string } {
    const a = action || '';
    if (a.startsWith('[PAY]') || a.includes('Quick Pay') || a.includes('bayar') || a.includes('Bayar'))
      return { icon: <Banknote size={14} strokeWidth={1.5} />, color: 'rgba(34,197,94,0.6)' };
    if (a.startsWith('[DEL]') || a.includes('Hapus'))
      return { icon: <Trash2 size={14} strokeWidth={1.5} />, color: 'rgba(239,68,68,0.6)' };
    if (a.startsWith('[EDIT]') || a.includes('Edit') || a.includes('Ubah'))
      return { icon: <Pencil size={14} strokeWidth={1.5} />, color: 'rgba(59,130,246,0.6)' };
    if (a.startsWith('[ADD]') || a.includes('Tambah'))
      return { icon: <UserPlus size={14} strokeWidth={1.5} />, color: 'rgba(59,130,246,0.6)' };
    if (a.startsWith('[RESTORE]') || a.startsWith('[UNDO]') || a.includes('Pulihkan') || a.includes('Batalkan'))
      return { icon: <Undo2 size={14} strokeWidth={1.5} />, color: 'rgba(249,115,22,0.6)' };
    if (a.startsWith('[IP]') || a.includes('Konversi IP'))
      return { icon: <Globe size={14} strokeWidth={1.5} />, color: 'rgba(99,102,241,0.6)' };
    if (a.startsWith('[FREE]') || a.includes('Gratis'))
      return { icon: <Gift size={14} strokeWidth={1.5} />, color: 'rgba(168,85,247,0.6)' };
    if (a.includes('Login') || a.includes('Masuk'))
      return { icon: <LogIn size={14} strokeWidth={1.5} />, color: 'rgba(20,184,166,0.6)' };
    if (a.includes('Logout') || a.includes('Keluar'))
      return { icon: <LogOut size={14} strokeWidth={1.5} />, color: 'rgba(100,116,139,0.6)' };
    if (a.includes('Kunci') || a.includes('Lock'))
      return { icon: <Lock size={14} strokeWidth={1.5} />, color: 'rgba(245,158,11,0.6)' };
    if (a.startsWith('[SYNC]') || a.includes('Sync'))
      return { icon: <RefreshCw size={14} strokeWidth={1.5} />, color: 'rgba(14,165,233,0.6)' };
    return { icon: <FileText size={14} strokeWidth={1.5} />, color: 'var(--border)' };
  }

  return (
    <div>
      {/* Type filter tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:8, background:'var(--bg3)', padding:3, borderRadius:20, border:'1px solid var(--border)' }}>
        <button onClick={() => setLogType('all')} style={{ flex:1, padding:6, borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all var(--t-fast)', background: logType==='all' ? 'var(--zc)' : 'transparent', color: logType==='all' ? '#fff' : 'var(--txt3)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <ScrollText size={11} /> {t('common.all')}
        </button>
        <button onClick={() => setLogType('pay')} style={{ flex:1, padding:6, borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all var(--t-fast)', background: logType==='pay' ? 'var(--c-lunas)' : 'transparent', color: logType==='pay' ? '#0a0c12' : 'var(--txt3)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Banknote size={11} /> {t('log.payOnly')}
        </button>
      </div>

      {/* Search — satu search box untuk cari aksi/nama/detail (v11.5: digabung dari 2 box) */}
      <div className="search-wrap" style={{ marginBottom:8, position:'relative', display:'flex', alignItems:'center' }}>
        <Search size={13} style={{ position:'absolute', left:10, color:'var(--txt4)', pointerEvents:'none' }} />
        <input className="search-box" style={{ margin:0, paddingLeft:30 }} placeholder={t('log.searchPlaceholder')} value={logSearch} onChange={e => setLogSearch(e.target.value)} />
        {logSearch && <button className="search-clear" onClick={() => setLogSearch('')} aria-label="Hapus pencarian"><X size={12} /></button>}
      </div>

      {/* Date filter */}
      <div style={{ display:'flex', gap:6 }}>
        <select className="cs" style={{ flex:1 }} value={logYear} onChange={e => setLogYear(e.target.value)}>
          <option value="">{t('log.allYears')}</option>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="cs" style={{ flex:1 }} value={logMonth} onChange={e => setLogMonth(e.target.value)}>
          <option value="">{t('log.allMonths')}</option>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <button onClick={reset} aria-label={`${t('action.reset')} filter`} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt3)', padding:'6px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:4, transition:'all var(--t-fast)' }}>
          <RotateCcw size={12} /> {t('action.reset')}
        </button>
      </div>

      {/* Loading skeleton */}
      {syncStatus === 'loading' && logs.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <SkeletonList count={6} />
        </div>
      ) : (
        <>
          <div style={{ fontSize:10, color:'var(--txt3)', margin:'10px 0', letterSpacing:'.06em', fontFamily:"var(--font-sans),sans-serif" }}>
            {filtered.length} dari {logs.length} {t('log.autoDelete')}
          </div>

          {/* Log items */}
          <div id="log-items">
            {filtered.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title={t('log.empty')}
                description={isFiltered ? 'Coba ubah filter pencarian' : t('log.emptyDesc')}
                size="md"
              />
            ) : (
              filtered.slice(0, 150).map((l, i) => {
                const d  = new Date(l.ts);
                const dt = `${d.toLocaleDateString()} ${d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' })}`;
                const meta = getLogMeta(l.action);
                return (
                  <div key={i} className="log-item" style={{ borderLeft:`3px solid ${meta.color}`, paddingLeft:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ color:meta.color, display:'flex', alignItems:'center', flexShrink:0 }}>{meta.icon}</span>
                      <div className="log-action" style={{ flex:1 }}>{l.action}</div>
                    </div>
                    {l.detail && <div className="log-detail" style={{ paddingLeft:20 }}>{l.detail}</div>}
                    <div className="log-time" style={{ paddingLeft:20 }}>{dt} · {l.user || '—'}</div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
