// components/features/members/MembersView.tsx — Fase 4: Skeleton + EmptyState
'use client';

import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

import { isFree, rp } from '@/lib/helpers';
import { persistPayment } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import FreeMemberModal from '@/components/modals/FreeMemberModal';
import RiwayatModal    from '@/components/modals/RiwayatModal';
import { Users, Trash2, X, Gift, Lock, LockOpen } from 'lucide-react';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Zone } from '@/types';

type SortMode = 'name-asc'|'name-desc'|'id-asc'|'id-desc'|'ip-asc'|'ip-desc';

export default function MembersView() {
  const {
    appData, setAppData, uid, userEmail,
    newMemberZone, setNewMemberZone,
    memberTab, setMemberTab,
    search, setSearch,
    membersLocked, setMembersLocked,
    selYear, selMonth,
    syncStatus,
    setSyncStatus,
    setRiwayatZone, setRiwayatName, setRiwayatYear,
    settings,
  } = useAppStore();

  const [sortMode, setSortMode] = useState<SortMode>('name-asc');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ zone:'KRS' as Zone, origName:'', name:'', id:'', ip:'', tarif:'' });
  const [freeOpen, setFreeOpen] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [freeZone, setFreeZone] = useState<Zone>('KRS');
  const [riwOpen,  setRiwOpen]  = useState(false);

  const t = useT();
  const zone = newMemberZone;
  const zc   = zone === 'KRS' ? 'var(--zc-krs)' : 'var(--zc-slk)';

  const addRef = {
    name:  useRef<HTMLInputElement>(null),
    id:    useRef<HTMLInputElement>(null),
    ip:    useRef<HTMLInputElement>(null),
    tarif: useRef<HTMLInputElement>(null),
  };

  async function persist(newData: typeof appData, action: string, detail?: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail: detail || '' }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }
  function openFree(z: Zone, n: string) { setFreeZone(z); setFreeName(n); setFreeOpen(true); }
  function openRiwayat(z: Zone, n: string) {
    setRiwayatZone(z); setRiwayatName(n); setRiwayatYear(new Date().getFullYear());
    setRiwOpen(true);
  }

  async function addMember() {
    const name  = addRef.name.current?.value.trim().toUpperCase() || '';
    const id    = addRef.id.current?.value.trim()   || '';
    const ip    = addRef.ip.current?.value.trim()   || '';
    const tarif = addRef.tarif.current?.value.trim() || '';
    if (!name) { showToast(t('members.nameRequired'),'err'); return; }
    const list = zone==='KRS' ? [...appData.krsMembers] : [...appData.slkMembers];
    if (list.includes(name)) { showToast(t('members.nameDuplicate'),'err'); return; }
    list.push(name); list.sort();
    const infoKey = `${zone}__${name}`;
    const newInfo = { ...(appData.memberInfo||{}), [infoKey]: { id, ip, ...(tarif ? { tarif:+tarif } : {}) } };
    const newData = { ...appData, [zone==='KRS'?'krsMembers':'slkMembers']: list, memberInfo: newInfo };
    await persist(newData, `[ADD] ${tLog('log.action.addMember')} ${zone} - ${name}`, `ID:${id} IP:${ip}`);
    showToast(`${name} ${t('members.added')}`);
    ['name','id','ip','tarif'].forEach(f => { const el = addRef[f as keyof typeof addRef].current; if(el) el.value=''; });
  }

  function openEdit(name: string) {
    const info = appData.memberInfo?.[zone+'__'+name] || {};
    setEditData({ zone, origName:name, name, id:String(info.id||''), ip:String(info.ip||''), tarif:String(info.tarif||'') });
    setEditOpen(true);
  }

  async function saveEdit() {
    const { zone, origName, name, id, ip, tarif } = editData;
    const newName = name.trim().toUpperCase();
    if (!newName) { showToast(t('members.nameRequired'),'err'); return; }
    const list = zone==='KRS' ? [...appData.krsMembers] : [...appData.slkMembers];
    const idx  = list.indexOf(origName);
    if (idx === -1) { showToast(t('members.notFound'),'err'); return; }
    if (newName !== origName && list.includes(newName)) { showToast(t('members.nameDuplicate'),'err'); return; }
    const newPayments   = { ...appData.payments };
    const newMemberInfo = { ...(appData.memberInfo||{}) };
    if (newName !== origName) {
      list[idx] = newName; list.sort();
      Object.keys(newPayments).filter(k => k.startsWith(`${zone}__${origName}__`)).forEach(k => {
        newPayments[k.replace(`${zone}__${origName}__`,`${zone}__${newName}__`)] = newPayments[k];
        delete newPayments[k];
      });
      const oldInfo = newMemberInfo[`${zone}__${origName}`] || {};
      delete newMemberInfo[`${zone}__${origName}`];
      newMemberInfo[`${zone}__${newName}`] = { ...oldInfo, id, ip, ...(tarif ? { tarif:+tarif } : {}) };
    } else {
      const existing = newMemberInfo[`${zone}__${origName}`] || {};
      newMemberInfo[`${zone}__${origName}`] = { ...existing, id, ip, ...(tarif ? { tarif:+tarif } : {}) };
      if (!tarif) delete newMemberInfo[`${zone}__${origName}`].tarif;
    }
    const newData = { ...appData, [zone==='KRS'?'krsMembers':'slkMembers']:list, payments:newPayments, memberInfo:newMemberInfo };
    await persist(newData, `[EDIT] ${tLog('log.action.editMember')} ${zone}`, `${origName} → ${newName}`);
    showToast(`${newName} ${t('members.updated')}`); setEditOpen(false);
  }

  async function deleteMember(name: string) {
    showConfirm('[DEL]', `${t('members.delete')} ${name}?`, t('membercard.deleteYes'), async () => {
      const list     = zone==='KRS' ? [...appData.krsMembers] : [...appData.slkMembers];
      const filtered = list.filter(m => m !== name);
      const mk       = `${zone}__${name}`;
      const mp: Record<string,number> = {};
      Object.keys(appData.payments||{}).filter(k=>k.startsWith(mk+'__')).forEach(k=>{mp[k]=appData.payments[k];});
      const nd = { ...appData, [zone==='KRS'?'krsMembers':'slkMembers']:filtered,
        payments:Object.fromEntries(Object.entries(appData.payments||{}).filter(([k])=>!k.startsWith(mk+'__'))),
        deletedMembers:{ ...(appData.deletedMembers||{}), [mk]:{ zone,name,deletedAt:Date.now(),payments:mp } } };
      await persist(nd, `[DEL] ${tLog('log.action.deleteMember')} ${zone} - ${name}`);
      showToast(`${name} ${t('common.deleted')}`,'err');
    }, { description: t('members.deleteNote') });
  }

  async function restoreMember(key: string) {
    const d = appData.deletedMembers?.[key]; if(!d) return;
    const list = d.zone==='KRS' ? [...appData.krsMembers] : [...appData.slkMembers];
    if (!list.includes(d.name)) { list.push(d.name); list.sort(); }
    const nd = { ...appData, [d.zone==='KRS'?'krsMembers':'slkMembers']:list,
      payments:{ ...(appData.payments||{}), ...(d.payments||{}) },
      deletedMembers:Object.fromEntries(Object.entries(appData.deletedMembers||{}).filter(([k])=>k!==key)) };
    await persist(nd, `[RESTORE] ${tLog('log.action.restoreMember')} ${d.zone} - ${d.name}`);
    showToast(`${d.name} ${t('members.restored')}`, 'ok');
  }

  async function permanentDelete(key: string) {
    const d = appData.deletedMembers?.[key]; if(!d) return;
    showConfirm('[PURGE]', `${t('members.permDelete')} ${d.name}?`, t('members.permDeleteYes'), async () => {
      const nd = { ...appData, deletedMembers:Object.fromEntries(Object.entries(appData.deletedMembers||{}).filter(([k])=>k!==key)) };
      await persist(nd, `[PURGE] ${tLog('log.action.permDelete')} ${d.zone} - ${d.name}`);
      showToast(`${d.name} ${t('members.deleted')}`,'err');
    }, { description: t('members.permDeleteNote'), highlightColor: '#e05c5c' });
  }

  // Sort
  const getInfo = (n: string) => appData.memberInfo?.[zone+'__'+n] || {};
  const mems = zone==='KRS' ? [...appData.krsMembers] : zone==='SLK' ? [...appData.slkMembers] : [...(appData.zoneMembers?.[zone] ?? [])];
  const sortFns: Record<SortMode,(a:string,b:string)=>number> = {
    'name-asc':  (a,b) => a.localeCompare(b),
    'name-desc': (a,b) => b.localeCompare(a),
    'id-asc':    (a,b) => String(getInfo(a).id||'zzz').localeCompare(String(getInfo(b).id||'zzz'),undefined,{numeric:true}),
    'id-desc':   (a,b) => String(getInfo(b).id||'').localeCompare(String(getInfo(a).id||''),undefined,{numeric:true}),
    'ip-asc':    (a,b) => String(getInfo(a).ip||'zzz').localeCompare(String(getInfo(b).ip||'zzz'),undefined,{numeric:true}),
    'ip-desc':   (a,b) => String(getInfo(b).ip||'').localeCompare(String(getInfo(a).ip||''),undefined,{numeric:true}),
  };
  mems.sort(sortFns[sortMode]);
  const filteredMems = mems.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const deletedList  = Object.entries(appData.deletedMembers||{}).filter(([k])=>k.startsWith(zone+'__')).sort((a,b)=>b[1].deletedAt-a[1].deletedAt);
  const sortLabels: Record<SortMode,string> = { 'name-asc':'A-Z','name-desc':'Z-A','id-asc':'ID ↑','id-desc':'ID ↓','ip-asc':'IP ↑','ip-desc':'IP ↓' };

  const badgeStyle: React.CSSProperties = {
    fontSize:9, padding:'2px 6px', borderRadius:4, flexShrink:0, fontFamily:"var(--font-mono),monospace",
  };

  return (
    <div>
      {/* Zone tabs + lock */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ display:'flex', gap:3, background:'var(--bg3)', padding:3, borderRadius:24, border:'1px solid var(--border)' }}>
          {(() => {
            const hiddenZones: string[] = settings.hiddenZones ?? [];
            const customZones: { key: string; color: string }[] = settings.customZones ?? [];
            const allZ = [
              { key:'KRS', color:'var(--zc-krs)' },
              { key:'SLK', color:'var(--zc-slk)' },
              ...customZones.map(c => ({ key: c.key, color: c.color })),
            ].filter(z => !hiddenZones.includes(z.key));
            return allZ.map(({ key: z, color: zColor }) => {
              const mCount = z === 'KRS' ? appData.krsMembers.length
                           : z === 'SLK' ? appData.slkMembers.length
                           : (appData.zoneMembers?.[z] ?? []).length;
              return (
                <button key={z} onClick={() => { setNewMemberZone(z); setSearch(''); setMemberTab('active'); }}
                  style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                    background: zone===z ? zColor : 'transparent',
                    color: zone===z ? '#fff' : 'var(--txt3)', minHeight:32 }}>
                  {z} <span style={{ opacity:.6, fontSize:10 }}>({mCount})</span>
                </button>
              );
            });
          })()}
        </div>
        <button onClick={() => { setMembersLocked(!membersLocked); showToast(membersLocked ? t('header.entryUnlocked') : t('header.entryLocked')); }}
          aria-label={membersLocked ? 'Buka kunci daftar member' : 'Kunci daftar member'}
          style={{ background:membersLocked?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${membersLocked?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}`, color:membersLocked?'var(--c-lunas)':'var(--c-belum)', padding:'6px 14px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:11, minHeight:34, display:'flex', alignItems:'center', gap:5 }}>
          {membersLocked ? <><Lock size={12} strokeWidth={1.5} /> {t('header.lock')}</> : <><LockOpen size={12} strokeWidth={1.5} /> {t('header.unlock')}</>}
        </button>
      </div>

      {/* Active / Deleted tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:10, background:'var(--bg2)', padding:3, borderRadius:20, border:'1px solid var(--border)' }}>
        <button onClick={() => setMemberTab('active')} style={{ flex:1, padding:6, borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:memberTab==='active'?zc:'transparent', color:memberTab==='active'?'#fff':'var(--txt3)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Users size={12} strokeWidth={1.5} /> {t('common.all')} ({mems.length})
        </button>
        <button onClick={() => setMemberTab('deleted')} style={{ flex:1, padding:6, borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:memberTab==='deleted'?'var(--zc-slk)':'transparent', color:memberTab==='deleted'?'#fff':'var(--txt3)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Trash2 size={12} strokeWidth={1.5} /> {t('action.delete')} ({deletedList.length})
        </button>
      </div>

      {/* DELETED TAB */}
      {memberTab === 'deleted' ? (
        deletedList.length === 0
          ? <EmptyState icon={Trash2} title={t('members.recycleBinEmpty')} description={t('members.recycleBinDesc')} size="md" />
          : deletedList.map(([k,d]) => (
            <div key={k} className="del-card">
              <div>
                <div className="del-card-name" style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <Trash2 size={12} strokeWidth={1.5} color="var(--c-belum)" /> {d.name}
                </div>
                <div style={{ fontSize:10, color:'var(--txt4)' }}>{t('action.delete')}: {new Date(d.deletedAt).toLocaleDateString()} · {Object.keys(d.payments||{}).length} data</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="restore-btn" onClick={() => restoreMember(k)}>{t('members.restore')}</button>
                <button onClick={() => permanentDelete(k)} aria-label={`Hapus permanen ${d.name}`}
                  style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--c-belum)', padding:'5px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))
      ) : (
        <>
          {/* Add form */}
          {!membersLocked && (
            <div className="add-form">
              <div className="af-title">{t('members.addTitle')} {zone}</div>
              <div className="af-grid">
                <div>
                  <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:4 }}>{t('common.name').toUpperCase()}</div>
                  <input ref={addRef.name} className="af-input" placeholder={t('members.namePlaceholder')} autoComplete="off"
                    style={{ textTransform:'uppercase' }} onKeyDown={e=>e.key==='Enter'&&addMember()} />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:4 }}>{t('members.customerId').toUpperCase()}</div>
                  {/* eslint-disable-next-line react-hooks/refs */}
                  <input ref={addRef.id} className="af-input" placeholder={t('common.optional')} autoComplete="off" />
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:4 }}>{t('members.ipLabel').toUpperCase()}</div>
                  {/* eslint-disable-next-line react-hooks/refs */}
                  <input ref={addRef.ip} className="af-input" placeholder="192.168.x.x atau http://..." autoComplete="off" />
                </div>
                <div>
                  <div style={{ fontSize:10, color:'var(--txt3)', marginBottom:4 }}>{t('members.tarifShort').toUpperCase()}</div>
                  {/* eslint-disable-next-line react-hooks/refs */}
                  <input ref={addRef.tarif} type="number" inputMode="numeric" className="af-input" placeholder="100" autoComplete="off" />
                </div>
              </div>
              <button style={{ width:'100%', background:zc, color:'#fff', border:'none', padding:10, borderRadius:'var(--r-sm)', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:40 }} onClick={addMember}>
                + {t('members.addTo')} {zone}
              </button>
            </div>
          )}

          {/* Sort */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
            {(Object.entries(sortLabels) as [SortMode,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setSortMode(k)}
                style={{ padding:'4px 9px', borderRadius:'var(--r-full)', border:'none', cursor:'pointer', fontSize:10,
                  background:sortMode===k?'var(--zc)':'var(--bg3)', color:sortMode===k?'#fff':'var(--txt3)' }}>{l}</button>
            ))}
          </div>

          {/* Search */}
          <div className="search-wrap">
            <input className="search-box" placeholder={`${t('entry.searchPlaceholder')} ${zone}...`} value={search} onChange={e=>setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={()=>setSearch('')} aria-label={t('action.search')}><X size={12} /></button>}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginBottom:8 }}>{filteredMems.length} {t('common.members')}{search ? ` ${t('common.noResult').toLowerCase()}` : ''} · {zone}</div>

          {/* Member rows */}
          <div id="member-rows">
            {syncStatus === 'loading' && mems.length === 0 ? (
              <SkeletonList count={5} />
            ) : filteredMems.length === 0 ? (
              <EmptyState icon={Users} title={t('members.empty')} description={t('members.emptyDesc')} size="md" />
            ) : filteredMems.map((name, i) => {
                const info      = getInfo(name);
                const isFreeNow = isFree(appData, zone, name, selYear, selMonth);
                const ipStr     = String(info.ip || '');
                const idStr     = String(info.id || '—');

                return (
                  <div key={name} style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:8, padding:'8px 12px', marginBottom:4 }}>
                    {/* Baris 1: nomor, ID, nama, badge */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: (!membersLocked || ipStr) ? 5 : 0 }}>
                      <span style={{ fontSize:10, color:'var(--txt4)', width:18, flexShrink:0 }}>{i+1}</span>
                      <span style={{ ...badgeStyle, background:'var(--zcdim)', border:'1px solid var(--border)', color: info.id ? 'var(--zc)' : 'var(--txt4)' }}>{idStr}</span>
                      <span style={{ fontSize:12, flex:1, cursor:'pointer', color:'var(--txt)', fontWeight:500 }} onClick={() => openRiwayat(zone, name)}>{name}</span>
                      {isFreeNow && <span style={{ ...badgeStyle, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', color:'var(--c-free)', display:'flex', alignItems:'center', gap:3 }}><Gift size={9} strokeWidth={1.5} />Free</span>}
                      {info.tarif && <span style={{ ...badgeStyle, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt3)' }}>{rp(info.tarif as number)}</span>}
                    </div>

                    {/* Baris 2: IP + action buttons */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingLeft:24 }}>
                      {/* IP — hanya selebar teksnya, bukan flex:1 agar area klik tidak melebar */}
                      {ipStr ? (
                        <a
                          href={ipStr.startsWith('http') ? ipStr : 'http://'+ipStr}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize:10, color:'var(--zc)', textDecoration:'none', fontFamily:"var(--font-mono),monospace", flexShrink:0, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}
                        >
                          {ipStr}
                        </a>
                      ) : (
                        <span style={{ flexShrink:0, fontSize:10, color:'var(--txt5)', fontStyle:'italic' }}>—</span>
                      )}
                      {/* Spacer — mengisi sisa ruang, bukan area klik */}
                      <span style={{ flex:1 }} />

                      {/* Action buttons — selalu di baris bawah */}
                      {!membersLocked && (
                        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                          <button onClick={() => openFree(zone, name)}
                            aria-label={`${isFreeNow ? 'Cabut status' : 'Set'} member gratis: ${name}`}
                            style={{ background:isFreeNow?'rgba(34,197,94,0.08)':'none', border:`1px solid ${isFreeNow?'rgba(34,197,94,0.3)':'var(--border)'}`, color:isFreeNow?'var(--c-free)':'var(--txt4)', padding:'3px 8px', borderRadius:'var(--r-xs)', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', minHeight:28 }}>
                            <Gift size={11} strokeWidth={1.5} />
                          </button>
                          <button onClick={() => openEdit(name)}
                            aria-label={`Edit member: ${name}`}
                            style={{ background:'none', border:'1px solid var(--border)', color:'var(--zc)', padding:'3px 8px', borderRadius:'var(--r-xs)', cursor:'pointer', fontSize:10, fontFamily:"var(--font-mono),monospace", minHeight:28 }}>
                            Edit
                          </button>
                          <button onClick={() => deleteMember(name)}
                            aria-label={`Hapus member: ${name}`}
                            style={{ background:'none', border:'1px solid rgba(239,68,68,0.15)', color:'rgba(239,68,68,0.4)', padding:'3px 8px', borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', minHeight:28 }}>
                            <X size={11} strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="modal-bg center" onClick={() => setEditOpen(false)}>
          <div className="modal center" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{t('members.editTitle')} <button className="modal-close" aria-label={t('action.close')} onClick={() => setEditOpen(false)}><X size={13} strokeWidth={1.5} /></button></div>
            {([
              { label: t('common.name').toUpperCase(),                   field:'name',  type:'text',   ph:''                             },
              { label: t('members.customerId').toUpperCase(),            field:'id',    type:'text',   ph: t('common.optional')          },
              { label: t('members.ipLabel').toUpperCase(),               field:'ip',    type:'text',   ph:'192.168.x.x'                  },
              { label: t('members.tarifLabel').toUpperCase(),            field:'tarif', type:'number', ph:'100'                          },
            ] as const).map(({ label, field, type, ph }) => (
              <div key={field} className="modal-row">
                <div className="modal-label">{label}</div>
                <input
                  className="modal-select"
                  type={type}
                  inputMode={type==='number' ? 'numeric' : undefined}
                  placeholder={ph}
                  value={editData[field]}
                  onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                  style={{ borderRadius:7, padding:'9px 12px', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)', fontSize:13, fontFamily:"var(--font-mono),monospace" }}
                />
              </div>
            ))}
            <button className="modal-action" onClick={saveEdit}>{t('members.saveChanges')}</button>
          </div>
        </div>
      )}

      <FreeMemberModal open={freeOpen} zone={freeZone} name={freeName} onClose={() => setFreeOpen(false)} />
      <RiwayatModal    open={riwOpen}  onClose={() => setRiwOpen(false)} />
    </div>
  );
}
