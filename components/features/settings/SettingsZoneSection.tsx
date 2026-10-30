// ══════════════════════════════════════════
// components/features/settings/SettingsZoneSection.tsx — Zona (REDESAIN T10, D9)
// Logika zip utuh: tambah (nama maks 6, tanpa duplikat, warna), ubah nama (hanya nama tampilan), sembunyikan/tampilkan
// dan hapus zona kustom — SEMUA lewat Confirm; hapus zona ikut menghapus zoneMembers-nya (saveDB + rollback selektif).
// PERBAIKAN ZONA KUSTOM: jumlah pelanggan lewat getMembersForZone (tanpa cabang KRS/SLK tertanam).
// Daftar zona dasar = KRS/SLK dari getAllZoneRows (urutan tetap), lalu zona kustom.
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Check, Eye, EyeSlash, PencilSimple, Plus, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { saveDB } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { getMembersForZone } from '@/lib/member';
import { ZONE_FALLBACK_PALETTE, zoneCssColor } from '@/lib/design-tokens';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import type { AppData, CustomZone } from '@/types';
import { allZoneKeys } from './settings.logic';
import s from './settings.module.css';

const MAX_ZONE_NAME = 6;
const DEFAULT_COLOR = ZONE_FALLBACK_PALETTE[0];

export default function SettingsZoneSection() {
  const { settings, updateSettings, appData, setAppData, uid, userEmail, setSyncStatus } = useAppStore();
  const t = useT();
  const [editingZona, setEditingZona] = useState<string | null>(null);
  const [editZonaVal, setEditZonaVal] = useState('');
  const [addZonaOpen, setAddZonaOpen] = useState(false);
  const [newZonaKey, setNewZonaKey] = useState('');
  const [newZonaColor, setNewZonaColor] = useState<string>(DEFAULT_COLOR);

  // FIX v11.5.7 (dipertahankan): rollback via selectiveRollback, bukan replace total.
  async function persistData(newData: AppData, action: string, detail: string): Promise<boolean> {
    const prevData = appData;
    setAppData(newData);
    if (!uid) return true;
    setSyncStatus('loading');
    try { await saveDB(uid, newData, { action, detail }, userEmail || ''); setSyncStatus('ok'); return true; }
    catch (err) {
      logger.error(`Gagal simpan ke Firebase — action: ${action}`, err);
      setSyncStatus('err');
      const latest = useAppStore.getState().appData;
      setAppData(selectiveRollback(latest, prevData, newData));
      return false;
    }
  }

  const zonaHidden: string[] = settings.hiddenZones ?? [];
  const customZones: CustomZone[] = settings.customZones ?? [];
  const customKeys = new Set(customZones.map(z => z.key));
  const zones = allZoneKeys(settings);
  const memCountOf = (z: string) => getMembersForZone(z, appData).length;
  const prefix = t('zona.prefix');

  const saveHiddenZones = (arr: string[]) => updateSettings({ ...settings, hiddenZones: arr });

  function startEditZona(z: string) { setEditingZona(z); setEditZonaVal(z); }

  function saveEditZona(oldZone: string) {
    const newName = editZonaVal.trim().toUpperCase();
    if (!newName || newName === oldZone) { setEditingZona(null); return; }
    if (newName.length > MAX_ZONE_NAME) { showToast(t('zona.nameTooLong'), 'err'); return; }
    showConfirm('question', `${t('zona.renameTitle')} ${oldZone} → ${newName}?`, t('zona.renameYes'), () => {
      const zoneNames = settings.zoneNames ?? {};
      updateSettings({ ...settings, zoneNames: { ...zoneNames, [oldZone]: newName } });
      showToast(`${prefix} ${oldZone} ${t('zona.renamed')} ${newName}`);
      setEditingZona(null);
    }, { description: t('zona.renameNote') });
  }

  function toggleHideZona(z: string) {
    const isHidden = zonaHidden.includes(z);
    const memCount = memCountOf(z);
    if (!isHidden) {
      showConfirm('warning', `${t('zona.hideTitle')} ${z}?`, t('zona.hideYes'), () => {
        saveHiddenZones([...zonaHidden, z]);
        showToast(`${prefix} ${z} ${t('zona.hidden')}`);
      }, memCount > 0 ? { description: `${z} ${memCount} ${t('zona.hideConfirmWithMembers')}` } : undefined);
    } else {
      showConfirm('question', `${t('zona.showTitle')} ${z}?`, t('zona.showYes'), () => {
        saveHiddenZones(zonaHidden.filter(h => h !== z));
        showToast(`${prefix} ${z} ${t('zona.shown')}`);
      });
    }
  }

  function addZona() {
    const key = newZonaKey.trim().toUpperCase();
    if (!key) { showToast(t('zona.nameRequired'), 'err'); return; }
    if (key.length > MAX_ZONE_NAME) { showToast(t('zona.nameTooLong'), 'err'); return; }
    if (zones.includes(key)) { showToast(t('zona.duplicate'), 'err'); return; }
    const newZona: CustomZone = { key, name: key, color: newZonaColor };
    updateSettings({ ...settings, customZones: [...customZones, newZona] });
    showToast(`${prefix} ${key} ${t('zona.added')}`);
    setNewZonaKey(''); setNewZonaColor(DEFAULT_COLOR); setAddZonaOpen(false);
  }

  function deleteCustomZona(key: string) {
    const memCount = memCountOf(key);
    showConfirm('trash', `${t('zona.deleteTitle')} ${key}?`, t('zona.deleteYes'), () => {
      updateSettings({ ...settings, customZones: customZones.filter(z => z.key !== key) });
      if (appData.zoneMembers?.[key]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _del, ...rest } = appData.zoneMembers;
        persistData({ ...appData, zoneMembers: rest }, `[DEL] Hapus zona ${key}`, '').then(ok => {
          showToast(ok ? `${prefix} ${key} ${t('zona.deleted')}` : t('common.saveFailed'), ok ? 'ok' : 'err');
        });
      } else {
        showToast(`${prefix} ${key} ${t('zona.deleted')}`);
      }
    }, memCount > 0 ? { description: `${memCount} ${t('zona.deleteHasMembers')}`, highlightColor: 'var(--c-belum)' } : undefined);
  }

  return (
    <>
      <Card padding="none" className={s.list}>
        {zones.map(z => {
          const isCustom = customKeys.has(z);
          const isHidden = zonaHidden.includes(z);
          const editing = editingZona === z;
          return (
            <div key={z} className={s.li} style={{ opacity: isHidden ? 0.6 : 1 }}>
              <i className={s.dot} style={{ background: zoneCssColor(z, customZones) }} aria-hidden="true" />
              {editing ? (
                <div className={s.liTx}>
                  <Input
                    aria-label={`${t('zona.editAria')} ${z}`}
                    size="sm" autoFocus maxLength={MAX_ZONE_NAME} autoComplete="off"
                    value={editZonaVal}
                    onChange={e => setEditZonaVal(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditZona(z); if (e.key === 'Escape') setEditingZona(null); }}
                  />
                </div>
              ) : (
                <div className={s.liTx}>
                  <b className={s.mono}>
                    {z}{' '}
                    {isCustom && <Badge variant="zone" size="xs">{t('zona.custom')}</Badge>}{' '}
                    {isHidden && <Badge variant="neutral" size="xs">{t('settings.zona.hidden')}</Badge>}
                  </b>
                  <small>{memCountOf(z)} {t('common.members')}</small>
                </div>
              )}
              <div className={s.liAct}>
                {editing ? (
                  <>
                    <IconButton icon={Check} size="sm" tone="on" label={t('action.save')} onClick={() => saveEditZona(z)} />
                    <IconButton icon={X} size="sm" label={t('action.cancel')} onClick={() => setEditingZona(null)} />
                  </>
                ) : (
                  <>
                    <IconButton icon={PencilSimple} size="sm" label={`${t('zona.editAria')} ${z}`} onClick={() => startEditZona(z)} />
                    <IconButton icon={isHidden ? Eye : EyeSlash} size="sm" label={`${isHidden ? t('zona.showAria') : t('zona.hideAria')} ${z}`} onClick={() => toggleHideZona(z)} />
                    {isCustom && <IconButton icon={X} size="sm" tone="danger" label={`${t('zona.deleteAria')} ${z}`} onClick={() => deleteCustomZona(z)} />}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {addZonaOpen ? (
        <Card className={s.card}>
          <span className={s.sectionLabel}>{t('settings.addZone')}</span>
          <Input
            label={t('common.name')} autoFocus autoComplete="off" maxLength={MAX_ZONE_NAME}
            placeholder={t('settings.zona.namePlaceholder')}
            value={newZonaKey}
            onChange={e => setNewZonaKey(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') addZona(); if (e.key === 'Escape') setAddZonaOpen(false); }}
          />
          <div>
            <span className={s.cap}>{t('settings.zona.color')}</span>
            <div className={s.swatches} role="group" aria-label={t('settings.zona.color')}>
              {ZONE_FALLBACK_PALETTE.map(c => (
                <ColorSwatch key={c} color={c} selected={newZonaColor === c} onSelect={setNewZonaColor} label={`${t('settings.zona.color')} ${c}`} />
              ))}
              <input type="color" className={s.colorPick} value={newZonaColor} aria-label={t('zona.colorPick')} onChange={e => setNewZonaColor(e.target.value)} />
            </div>
          </div>
          <div className={s.rowBtns}>
            <Button variant="secondary" onClick={() => { setAddZonaOpen(false); setNewZonaKey(''); }}>{t('action.cancel')}</Button>
            <Button variant="primary" onClick={addZona}><Check aria-hidden="true" /> {t('settings.addZone')}</Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" block onClick={() => setAddZonaOpen(true)}><Plus aria-hidden="true" /> {t('settings.addZone')}</Button>
      )}

      <Notice tone="info">{t('settings.zonesNote')}</Notice>
    </>
  );
}
