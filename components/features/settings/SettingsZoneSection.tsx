// components/features/settings/SettingsZoneSection.tsx — Fase 3: dipecah dari SettingsView
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { saveDB } from '@/lib/db';
import { useT } from '@/hooks/useT';
import type { CustomZone } from '@/types';
import {
  Settings, ChevronDown, ChevronUp, Check, X, Plus, Edit2, Eye, EyeOff,
} from 'lucide-react';

export default function SettingsZoneSection() {
  const { settings, updateSettings, appData, setAppData, uid, userEmail, setSyncStatus } = useAppStore();
  const t = useT();

  const [zonaOpen,     setZonaOpen]     = useState(false);
  const [editingZona,  setEditingZona]  = useState<string | null>(null);
  const [editZonaVal,  setEditZonaVal]  = useState('');
  const [addZonaOpen,  setAddZonaOpen]  = useState(false);
  const [newZonaKey,   setNewZonaKey]   = useState('');
  const [newZonaColor, setNewZonaColor] = useState('#8B5CF6');

  async function persistData(newData: typeof appData, action: string, detail: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try { await saveDB(uid, newData, { action, detail }, userEmail || ''); setSyncStatus('ok'); }
    catch { setSyncStatus('err'); }
  }

  const zonaHidden: string[] = settings.hiddenZones ?? [];
  const customZones: CustomZone[] = settings.customZones ?? [];
  const allZones: { key: string; color: string; isCustom: boolean }[] = [
    { key: 'KRS', color: 'var(--zc-krs)', isCustom: false },
    { key: 'SLK', color: 'var(--zc-slk)', isCustom: false },
    ...customZones.map(z => ({ key: z.key, color: z.color, isCustom: true })),
  ];

  function saveHiddenZones(arr: string[]) {
    updateSettings({ ...settings, hiddenZones: arr });
  }

  function startEditZona(z: string) { setEditingZona(z); setEditZonaVal(z); }

  function saveEditZona(oldZone: string) {
    const newName = editZonaVal.trim().toUpperCase();
    if (!newName || newName === oldZone) { setEditingZona(null); return; }
    if (newName.length > 6) { showToast(t('zona.nameTooLong'), 'err'); return; }
    showConfirm(
      '',
      `Ganti nama zona <b>${oldZone}</b> → <b>${newName}</b>?<br><span style="font-size:11px;color:var(--txt3)">${t('zona.renameNote')}</span>`,
      t('zona.renameYes'),
      () => {
        const zoneNames = settings.zoneNames ?? {};
        updateSettings({ ...settings, zoneNames: { ...zoneNames, [oldZone]: newName } });
        showToast(`Zona ${oldZone} ${t('zona.renamed')} ${newName}`);
        setEditingZona(null);
      }
    );
  }

  function toggleHideZona(z: string) {
    const isHidden = zonaHidden.includes(z);
    const memCount = z === 'KRS' ? appData.krsMembers.length
                   : z === 'SLK' ? appData.slkMembers.length
                   : (appData.zoneMembers?.[z] ?? []).length;
    if (!isHidden && memCount > 0) {
      showConfirm('', `Sembunyikan zona <b>${z}</b>?<br><span style="font-size:11px;color:var(--txt3)">${z} ${memCount} ${t('zona.hideConfirmWithMembers')}</span>`, t('zona.hideYes'), () => {
        saveHiddenZones([...zonaHidden, z]);
        showToast(`Zona ${z} ${t('zona.hidden')}`);
      });
    } else if (!isHidden) {
      showConfirm('', `Sembunyikan zona <b>${z}</b>?`, t('zona.hideYes'), () => {
        saveHiddenZones([...zonaHidden, z]);
        showToast(`Zona ${z} ${t('zona.hidden')}`);
      });
    } else {
      showConfirm('', `Tampilkan kembali zona <b>${z}</b>?`, t('zona.showYes'), () => {
        saveHiddenZones(zonaHidden.filter(h => h !== z));
        showToast(`Zona ${z} ${t('zona.shown')}`);
      });
    }
  }

  function addZona() {
    const key = newZonaKey.trim().toUpperCase();
    if (!key) { showToast(t('zona.nameRequired'), 'err'); return; }
    if (key.length > 6) { showToast(t('zona.nameTooLong'), 'err'); return; }
    if (['KRS','SLK',...customZones.map(z=>z.key)].includes(key)) {
      showToast(t('zona.duplicate'), 'err'); return;
    }
    const newZona: CustomZone = { key, name: key, color: newZonaColor };
    updateSettings({ ...settings, customZones: [...customZones, newZona] });
    showToast(`Zona ${key} ${t('zona.added')}`);
    setNewZonaKey(''); setNewZonaColor('#8B5CF6'); setAddZonaOpen(false);
  }

  function deleteCustomZona(key: string) {
    const memCount = (appData.zoneMembers?.[key] ?? []).length;
    showConfirm(
      '',
      `Hapus zona <b>${key}</b>?${memCount > 0 ? `<br><span style="font-size:11px;color:var(--c-belum)">${memCount} ${t('zona.deleteHasMembers')}</span>` : ''}`,
      t('zona.deleteYes'),
      () => {
        updateSettings({ ...settings, customZones: customZones.filter(z => z.key !== key) });
        if (appData.zoneMembers?.[key]) {
          const { [key]: _, ...rest } = appData.zoneMembers;
          persistData({ ...appData, zoneMembers: rest }, `[DEL] Hapus zona ${key}`, '');
        }
        showToast(`Zona ${key} ${t('zona.deleted')}`);
      }
    );
  }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-md)', padding:16, marginBottom:10, boxShadow:'var(--shadow-md)' }}>
      <button
        onClick={() => setZonaOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0, color:'var(--txt)' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ color:'var(--zc)' }}><Settings size={16} strokeWidth={1.5} /></div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13 }}>{t('settings.zones')}</div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>{t('settings.zonesNote').split('.')[0]}</div>
          </div>
        </div>
        {zonaOpen ? <ChevronUp size={16} color="var(--txt3)" /> : <ChevronDown size={16} color="var(--txt3)" />}
      </button>

      {zonaOpen && (
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border2)' }}>
          {allZones.map(({ key: z, color: zColor, isCustom }) => {
            const isHidden  = zonaHidden.includes(z);
            const memCount  = z === 'KRS' ? appData.krsMembers.length
                            : z === 'SLK' ? appData.slkMembers.length
                            : (appData.zoneMembers?.[z] ?? []).length;
            const isEditing = editingZona === z;

            return (
              <div key={z} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                background: isHidden ? 'rgba(255,255,255,0.02)' : 'var(--bg3)',
                borderRadius:'var(--r-sm)', marginBottom:6,
                border:`1px solid ${isHidden ? 'rgba(255,255,255,0.04)' : 'var(--border)'}`,
                opacity: isHidden ? 0.6 : 1, transition:'all var(--t-base)',
              }}>
                <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: zColor }} />

                {isEditing ? (
                  <input autoFocus value={editZonaVal}
                    onChange={e => setEditZonaVal(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditZona(z); if (e.key === 'Escape') setEditingZona(null); }}
                    style={{ flex:1, background:'var(--bg4)', border:'1px solid var(--zc)', color:'var(--txt)', padding:'4px 8px', borderRadius:'var(--r-xs)', fontSize:13, fontFamily:"'DM Mono',monospace" }}
                    maxLength={6}
                  />
                ) : (
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
                      {z}
                      {isCustom && <span style={{ fontSize:9, background:'var(--zcdim)', color:'var(--zc)', padding:'1px 6px', borderRadius:'var(--r-xs)' }}>Custom</span>}
                      {isHidden && <span style={{ fontSize:9, background:'rgba(255,255,255,0.06)', color:'var(--txt4)', padding:'1px 6px', borderRadius:'var(--r-xs)' }}>{t('settings.zona.hidden')}</span>}
                    </div>
                    <div style={{ fontSize:10, color:'var(--txt4)', marginTop:1 }}>{memCount} {t('common.members')}</div>
                  </div>
                )}

                <div style={{ display:'flex', gap:4 }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEditZona(z)} aria-label={t('action.save')} style={{ background:'var(--zc)', border:'none', color:'#fff', width:28, height:28, borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingZona(null)} aria-label={t('action.cancel')} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt3)', width:28, height:28, borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditZona(z)} aria-label={`Edit zona ${z}`} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt3)', width:28, height:28, borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all var(--t-fast)' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => toggleHideZona(z)} aria-label={isHidden ? `Tampilkan ${z}` : `Sembunyikan ${z}`} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color: isHidden ? 'var(--c-lunas)' : 'var(--txt3)', width:28, height:28, borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all var(--t-fast)' }}>
                        {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      {isCustom && (
                        <button onClick={() => deleteCustomZona(z)} aria-label={`Hapus zona ${z}`} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'var(--c-belum)', width:28, height:28, borderRadius:'var(--r-xs)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all var(--t-fast)' }}>
                          <X size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {addZonaOpen ? (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'12px', marginTop:8 }}>
              <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:10 }}>{t('settings.addZone').toUpperCase()}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
                <input
                  autoFocus value={newZonaKey}
                  onChange={e => setNewZonaKey(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') addZona(); if (e.key === 'Escape') setAddZonaOpen(false); }}
                  placeholder={t('settings.zona.namePlaceholder')}
                  maxLength={6}
                  style={{ flex:1, background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt)', padding:'8px 10px', borderRadius:'var(--r-xs)', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none' }}
                />
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <label style={{ fontSize:10, color:'var(--txt3)' }}>{t('settings.zona.color')}:</label>
                  <input
                    type="color" value={newZonaColor} onChange={e => setNewZonaColor(e.target.value)}
                    style={{ width:32, height:28, border:'1px solid var(--border)', borderRadius:'var(--r-xs)', cursor:'pointer', padding:2, background:'var(--bg4)' }}
                  />
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={addZona} style={{ flex:1, background:'var(--zc)', color:'#fff', border:'none', borderRadius:'var(--r-sm)', padding:'8px', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <Check size={13} /> {t('settings.addZone')}
                </button>
                <button onClick={() => { setAddZonaOpen(false); setNewZonaKey(''); }} style={{ background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt3)', borderRadius:'var(--r-sm)', padding:'8px 14px', fontSize:12, cursor:'pointer' }}>
                  {t('action.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddZonaOpen(true)} style={{ width:'100%', background:'var(--bg3)', border:'1px dashed var(--border)', color:'var(--zc)', borderRadius:'var(--r-sm)', padding:'9px', fontSize:12, cursor:'pointer', marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Plus size={13} strokeWidth={1.5} /> {t('settings.addZone')}
            </button>
          )}

          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:8, lineHeight:1.6, padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:'var(--r-xs)' }}>
            {t('settings.zonesNote')}
          </div>
        </div>
      )}
    </div>
  );
}
