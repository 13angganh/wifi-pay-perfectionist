// components/modals/GlobalSearch.tsx — Fase 4: EmptyState + cleanup
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { getPay, isFree, rp, fuzzyMatch } from '@/lib/helpers';
import { Search, X, Gift, CheckCircle2, XCircle } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatePresence, motion } from 'framer-motion';

interface Props { open: boolean; onClose: () => void; }

export default function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter();
  const { appData, selYear, selMonth, setView, setZone, setExpandedCard } = useAppStore();
  const [q, setQ] = useState('');
  const inputRef   = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); } // eslint-disable-line react-hooks/set-state-in-effect
  }, [open]);


  const results: {
    z: 'KRS'|'SLK'; name: string;
    paid: boolean; free: boolean; val: number|null;
    id?: string; ip?: string; tarif?: number;
  }[] = [];

  for (const z of ['KRS','SLK'] as const) {
    const mems = z === 'KRS' ? appData.krsMembers : appData.slkMembers;
    for (const name of mems) {
      if (!q.trim() || fuzzyMatch(name, q)) {
        const info = appData.memberInfo?.[z+'__'+name] || {};
        const val  = getPay(appData, z, name, selYear, selMonth);
        results.push({ z, name, paid: val !== null, free: isFree(appData, z, name, selYear, selMonth), val, id: info.id as string, ip: info.ip as string, tarif: info.tarif as number });
      }
    }
  }

  function gotoMember(z: 'KRS'|'SLK', name: string) {
    setZone(z);
    setView('entry');
    setExpandedCard(name);
    router.push('/entry');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
    <motion.div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', padding:'16px 14px' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {/* Search input */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:'env(safe-area-inset-top)' }}>
        <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center' }}>
          <Search size={15} style={{ position:'absolute', left:12, color:'var(--txt4)', pointerEvents:'none' }} />
          <input
            ref={inputRef}
            style={{
              width:'100%', background:'rgba(24,28,39,0.95)', backdropFilter:'blur(16px)',
              border:'1px solid rgba(255,255,255,0.1)', color:'var(--txt)',
              padding:'12px 16px 12px 38px', borderRadius:'var(--r-md)',
              fontSize:14, fontFamily:"var(--font-mono),monospace", outline:'none',
              transition:'border-color var(--t-fast)', boxShadow:'var(--shadow-md)',
            }}
            placeholder={t("globalsearch.placeholder")}
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--zc)'}
            onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label={t("action.search")}
              style={{ position:'absolute', right:10, background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', padding:4, display:'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label={t("action.close")}
          style={{ background:'rgba(24,28,39,0.9)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--txt2)', padding:'10px 14px', borderRadius:'var(--r-md)', cursor:'pointer', fontSize:13, flexShrink:0, transition:'all var(--t-fast)', display:'flex', alignItems:'center' }}
        >
          {t('action.close')}
        </button>
      </div>

      {/* Results */}
      <div style={{ flex:1, overflowY:'auto', marginTop:10 }}>
        {!q.trim() ? (
          <EmptyState icon={Search} title={t('globalsearch.title')} description={t('globalsearch.hint')} size="sm" />
        ) : results.length === 0 ? (
          <EmptyState icon={XCircle} title={t('common.noResult')} description={`${t('globalsearch.notFound')} "${q}"`} size="sm" />
        ) : results.map(r => {
          // Left border status
          const borderColor = r.free ? 'var(--c-free)' : r.paid ? 'var(--c-lunas)' : 'var(--c-belum)';

          return (
            <div
              key={r.z+r.name}
              className="gsr-item"
              onClick={() => gotoMember(r.z, r.name)}
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              {/* Zona badge */}
              <span style={{
                fontSize:9, padding:'2px 7px', borderRadius:'var(--r-xs)', fontWeight:600, flexShrink:0,
                background: r.z === 'KRS' ? 'var(--zcdim)' : 'rgba(249,115,22,0.10)',
                color: r.z === 'KRS' ? 'var(--zc-krs)' : 'var(--zc-slk)',
                border: `1px solid ${r.z === 'KRS' ? 'rgba(var(--zc-rgb,59,130,246),0.25)' : 'rgba(249,115,22,0.25)'}`,
                fontFamily:"var(--font-mono),monospace",
              }}>
                {r.z}
              </span>

              {/* Nama + info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div className="gsr-name">{r.name}</div>
                {r.id && <div style={{ fontSize:9, color:'var(--txt4)', fontFamily:"var(--font-mono),monospace" }}>{r.id}{r.ip ? ' · ' + r.ip : ''}</div>}
              </div>

              {/* Status */}
              <div className="gsr-detail">
                {r.free ? (
                  <span style={{ color:'var(--c-free)', display:'flex', alignItems:'center', gap:4 }}>
                    <Gift size={11} /> Free
                  </span>
                ) : r.paid && r.val === 0 ? (
                  <span style={{ color:'var(--c-lunas)', display:'flex', alignItems:'center', gap:4 }}>
                    <CheckCircle2 size={11} /> {t("rekap.accumulation")}
                  </span>
                ) : r.paid ? (
                  <span style={{ color:'var(--c-lunas)', display:'flex', alignItems:'center', gap:4 }}>
                    <CheckCircle2 size={11} /> {r.val?.toLocaleString('id-ID')}
                  </span>
                ) : (
                  <span style={{ color:'var(--c-belum)', display:'flex', alignItems:'center', gap:4 }}>
                    <XCircle size={11} /> {t("status.belum")}
                  </span>
                )}
                {r.tarif && <div style={{ fontSize:9, color:'var(--txt4)', marginTop:2 }}>{t("members.tarifShort")}: {rp(r.tarif)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
