// components/features/rekap/RekapView.tsx — Fase 4: Skeleton + EmptyState
'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { getPay, isFree, rp, getKey, fuzzyMatch } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { persistPayment } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { Search, X, Gift, CheckCheck, LayoutList } from 'lucide-react';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import RekapModal from './RekapModal';

export default function RekapView() {
  const {
    appData, setAppData, uid, userEmail,
    activeZone, selYear, setSelYear,
    search, setSearch,
    rekapExpanded, setRekapExpanded,
    globalLocked, lockedEntries,
    syncStatus,
    setSyncStatus,
    settings,
  } = useAppStore();

  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const inputDirty   = useRef(false);
  const modalClosing = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [batchColIdx,   setBatchColIdx]   = useState<number | null>(null);
  const [batchSelected, setBatchSelected] = useState<string[]>([]);

  const mems     = activeZone === 'KRS' ? appData.krsMembers : appData.slkMembers;
  const filtered  = mems.filter(m => fuzzyMatch(m, search));
  const grand     = MONTHS.reduce((s, _, mi) =>
    s + mems.reduce((ss, m) => ss + (getPay(appData, activeZone, m, selYear, mi) || 0), 0), 0);

  async function persist(newData: typeof appData, action: string, detail: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }

  function isLocked(name: string) {
    return globalLocked || (lockedEntries[activeZone + '__' + name] === true);
  }

  function closeModal() {
    modalClosing.current = true;
    inputDirty.current   = false;
    setRekapExpanded(null);
    setTimeout(() => { modalClosing.current = false; }, 200);
  }

  function exitBatch() {
    setBatchColIdx(null);
    setBatchSelected([]);
  }

  function onCellPointerDown(name: string, mi: number) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      if (batchColIdx === null || batchColIdx !== mi) {
        setBatchColIdx(mi);
        setBatchSelected([name]);
        closeModal();
      }
    }, 500);
  }

  function onCellPointerUp() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }

  function onCellClick(name: string, mi: number) {
    if (batchColIdx !== null && batchColIdx === mi) {
      setBatchSelected(prev =>
        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      );
      return;
    }
    if (batchColIdx === null) {
      inputDirty.current   = false;
      modalClosing.current = false;
      const isExp = rekapExpanded?.name === name && rekapExpanded?.month === mi;
      setRekapExpanded(isExp ? null : { name, month: mi });
    }
  }

  async function handleBatchPay() {
    if (batchColIdx === null || batchSelected.length === 0) return;
    const mi = batchColIdx;
    const entries: { name: string; amt: number }[] = [];
    for (const name of batchSelected) {
      if (isLocked(name)) continue;
      const info  = appData.memberInfo?.[`${activeZone}__${name}`] || {};
      const tarif = info.tarif as number | undefined;
      const amt   = tarif ?? (settings?.quickAmounts?.[0] ?? 100);
      entries.push({ name, amt });
    }
    if (entries.length === 0) { showToast(t('rekap.allLocked'), 'err'); return; }
    const newData = { ...appData, payments: { ...appData.payments } };
    const today   = new Date().toISOString().slice(0, 10);
    for (const { name, amt } of entries) {
      const k = getKey(activeZone, name, selYear, mi);
      newData.payments[k] = amt;
      if (settings?.autoDate) {
        const infoKey = `${activeZone}__${name}`;
        const dateKey = `date_${selYear}_${mi}`;
        newData.memberInfo = {
          ...(newData.memberInfo || {}),
          [infoKey]: { ...(newData.memberInfo?.[infoKey] || {}), [dateKey]: today },
        };
      }
    }
    await persist(newData,
      `[PAY] ${tLog('log.action.batchPay')} Rekap ${activeZone} - ${entries.length} ${tLog('common.members')}`,
      `${MONTH_NAMES[mi]} ${selYear}`
    );
    showToast(`${entries.length} ${t('rekap.batchSuccess')}`);
    exitBatch();
  }

  const batchSheet = (() => {
    if (batchColIdx === null || batchSelected.length === 0) return null;
    const mi = batchColIdx;
    const previewItems = batchSelected.map(name => {
      const info  = appData.memberInfo?.[`${activeZone}__${name}`] || {};
      const tarif = info.tarif as number | undefined;
      const amt   = tarif ?? (settings?.quickAmounts?.[0] ?? 100);
      return { name, amt, hasTarif: !!tarif };
    });
    const total = previewItems.reduce((s, p) => s + p.amt, 0);

    return (
      <div
        style={{ position:'fixed', inset:0, zIndex:8500, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}
        onClick={exitBatch}
      >
        <div
          style={{
            background:'rgba(24,28,39,0.95)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'var(--r-lg) var(--r-lg) 0 0',
            width:'min(480px,100vw)', maxHeight:'60vh',
            boxShadow:'var(--shadow-lg)',
            animation:'slideUp var(--t-slow) var(--ease-spring)',
            display:'flex', flexDirection:'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display:'flex', justifyContent:'center', paddingTop:10, paddingBottom:6, flexShrink:0 }}>
            <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div>
              <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:14, color:'var(--txt)' }}>
                {batchSelected.length} {t('rekap.batchSelected')}
              </div>
              <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>{MONTH_NAMES[mi]} {selYear} · {activeZone}</div>
            </div>
            <button onClick={exitBatch} aria-label="Tutup" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--txt3)', width:32, height:32, borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'10px 16px' }}>
            {previewItems.map(({ name, amt, hasTarif }) => (
              <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontFamily:"var(--font-mono),monospace", fontSize:13, color:'var(--txt)' }}>{name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {!hasTarif && <span style={{ fontSize:9, color:'var(--txt4)', background:'rgba(255,255,255,0.04)', padding:'2px 6px', borderRadius:'var(--r-xs)' }}>default</span>}
                  <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:12, fontWeight:600, color:'var(--zc)' }}>{rp(amt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:11, color:'var(--txt3)' }}>{t('common.total')}</span>
              <span style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:800, fontSize:16, color:'var(--zc)' }}>{rp(total)}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={exitBatch} style={{ flex:1, padding:'10px', borderRadius:'var(--r-sm)', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'var(--txt2)', cursor:'pointer', fontSize:13, transition:'all var(--t-fast)' }}>
                {t('action.cancel')}
              </button>
              <button
                onClick={handleBatchPay}
                style={{ flex:2, padding:'10px', borderRadius:'var(--r-sm)', border:'none', background:'var(--zc)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, boxShadow:'var(--shadow-z)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <CheckCheck size={14} />
                {t('rekap.batchConfirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        <select className="cs" style={{ flex:'none', width:'auto' }} value={selYear}
          onChange={e => { setSelYear(+e.target.value); closeModal(); exitBatch(); }}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="search-wrap" style={{ flex:1, margin:0, position:'relative', display:'flex', alignItems:'center' }}>
          <Search size={13} style={{ position:'absolute', left:10, color:'var(--txt4)', pointerEvents:'none' }} />
          <input
            className="search-box"
            style={{ margin:0, paddingLeft:30 }}
            placeholder={t("rekap.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="Hapus pencarian">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="sum-bar" style={{ marginBottom:10 }}>
        <div className="sum-lbl">{activeZone} {selYear}</div>
        <div className="sum-val">{rp(grand)}</div>
      </div>

      {/* Batch hint bar */}
      {batchColIdx !== null && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--zcdim)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px 12px', marginBottom:10 }}>
          <div style={{ fontSize:12, color:'var(--zc)' }}>
            <strong>{MONTH_NAMES[batchColIdx]}</strong> — {t('rekap.batchHint')}
          </div>
          <button onClick={exitBatch} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', padding:4, display:'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabel rekap utama */}
      {syncStatus === 'loading' && mems.length === 0 ? (
        <SkeletonList count={5} className="mt-2" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title={search ? 'Member tidak ditemukan' : 'Belum ada member'}
          description={search ? `Tidak ada hasil untuk "${search}"` : 'Tambah member di menu Members'}
          size="md"
        />
      ) : (
      <>
      <div className="rekap-wrap">
        <table className="rtable">
          <thead>
            <tr>
              <th className="stk" style={{ left:0, minWidth:22 }}>#</th>
              <th className="stk" style={{ left:22, textAlign:'left', minWidth:95, maxWidth:95, overflow:'hidden' }}>NAMA</th>
              {MONTH_NAMES.map((m, mi) => (
                <th key={m} style={{
                  minWidth:38,
                  color: batchColIdx === mi ? 'var(--zc)' : undefined,
                  background: batchColIdx === mi ? 'var(--zcdim)' : undefined,
                  borderBottom: batchColIdx === mi ? '2px solid var(--zc)' : undefined,
                  transition:'all var(--t-base)',
                }}>
                  {m.slice(0, 3)}
                </th>
              ))}
              <th style={{ color:'var(--zc)', minWidth:52 }}>{t('common.total')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((name, i) => {
              let rowTotal = 0;
              const cells = MONTHS.map((_, mi) => {
                const raw  = getPay(appData, activeZone, name, selYear, mi);
                const free = isFree(appData, activeZone, name, selYear, mi);
                const v    = free ? 0 : raw;
                rowTotal  += v || 0;

                const isDimmed   = batchColIdx !== null && batchColIdx !== mi;
                const isSelected = batchColIdx === mi && batchSelected.includes(name);

                const cls  = v! > 0 ? 'cv' : v === 0 && !free ? 'cz' : 'cn';
                const disp = free
                  ? <Gift size={9} style={{ opacity:0.6 }} />
                  : v === 0 ? <span style={{ fontSize:8, opacity:0.8 }}>Akm</span>
                  : v !== null ? (v * 1000).toLocaleString('id-ID') : '—';

                const isExp = rekapExpanded?.name === name && rekapExpanded?.month === mi;

                return (
                  <td
                    key={mi}
                    className={`${cls}${isExp ? ' rekap-exp-cell' : ''}`}
                    style={{
                      opacity: isDimmed ? 0.2 : 1,
                      pointerEvents: isDimmed ? 'none' : undefined,
                      outline: isSelected ? '2px solid var(--zc)' : undefined,
                      outlineOffset: '-2px',
                      background: isSelected ? 'var(--zcdim)' : undefined,
                      position: 'relative',
                      transition: 'opacity var(--t-base), background var(--t-fast)',
                      userSelect: 'none',
                      cursor: 'pointer',
                    }}
                    onPointerDown={() => onCellPointerDown(name, mi)}
                    onPointerUp={onCellPointerUp}
                    onPointerCancel={onCellPointerUp}
                    onClick={() => onCellClick(name, mi)}
                    title={free ? 'Free Member' : `${MONTH_NAMES[mi]} ${selYear}`}
                  >
                    {isSelected && (
                      <span style={{ position:'absolute', top:2, right:2, color:'var(--zc)', lineHeight:1 }}>
                        <CheckCheck size={8} />
                      </span>
                    )}
                    {disp}
                  </td>
                );
              });
              return (
                <tr key={name} data-name={name}>
                  <td className="stk" style={{ left:0, fontSize:10, color:'var(--txt5)', paddingLeft:8, minWidth:22 }}>{i + 1}</td>
                  <td className="stk" style={{ left:22, minWidth:95, maxWidth:95, fontSize:12, textAlign:'left', paddingLeft:6, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{name}</td>
                  {cells}
                  <td style={{ color:'var(--zc)', fontFamily:"var(--font-sans),sans-serif", fontWeight:700 }}>{rowTotal.toLocaleString('id-ID')}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background:'var(--bg3)', borderTop:'2px solid var(--border)' }}>
              <td colSpan={2} className="stk" style={{ left:0, fontSize:10, color:'var(--txt4)', paddingLeft:8, background:'var(--bg3)', maxWidth:117 }}>{t('common.total')}</td>
              {MONTHS.map((_, mi) => {
                const colTotal = mems.reduce((s, m) => s + (getPay(appData, activeZone, m, selYear, mi) || 0), 0);
                return (
                  <td key={mi} style={{
                    color:'var(--c-lunas)', fontWeight:700,
                    opacity: batchColIdx !== null && batchColIdx !== mi ? 0.2 : 1,
                    transition:'opacity var(--t-base)',
                  }}>
                    {(colTotal * 1000).toLocaleString('id-ID')}
                  </td>
                );
              })}
              <td style={{ color:'var(--zc)', fontFamily:"var(--font-sans),sans-serif", fontWeight:800 }}>{rp(grand)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ fontSize:10, color:'var(--txt4)', textAlign:'center', marginTop:6 }}>
        {t('rekap.scrollHint')}
      </div>
      </> /* end data branch fragment */
      )} {/* end loading/empty/data conditional */}

      <RekapModal inputDirty={inputDirty} modalClosing={modalClosing} onClose={closeModal} />
      {batchSheet}
    </div>
  );
}
