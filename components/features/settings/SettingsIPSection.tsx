// ══════════════════════════════════════════
// components/features/settings/SettingsIPSection.tsx — Konversi IP (REDESAIN T10)
// Logika zip utuh (v11.5): cari-ganti substring APAPUN di IP member sebuah zona (convertMemberIPs, fungsi murni),
// pratinjau jumlah yang terdampak, Confirm sebelum menulis, persistPayment + rollback selektif, log "[IP] Konversi".
// Daftar zona = allZoneKeys (dasar + kustom); zona awal = zona pertama (tanpa literal).
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { persistPayment } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { getMembersForZone, convertMemberIPs } from '@/lib/member';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import type { AppData } from '@/types';
import { allZoneKeys } from './settings.logic';
import s from './settings.module.css';

export default function SettingsIPSection() {
  const { appData, setAppData, uid, userEmail, setSyncStatus, settings } = useAppStore();
  const t = useT();
  const zones = allZoneKeys(settings);
  const [zone, setZone] = useState<string>(zones[0]);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');

  // FIX v11.5.7 (dipertahankan): rollback via selectiveRollback.
  async function persist(newData: AppData, action: string, detail?: string): Promise<boolean> {
    const prevData = appData;
    setAppData(newData);
    if (!uid) return true;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail: detail || '' }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
      return true;
    } catch (err) {
      logger.error(`Gagal simpan ke Firebase — action: ${action}`, err);
      setSyncStatus('err');
      const latest = useAppStore.getState().appData;
      setAppData(selectiveRollback(latest, prevData, newData));
      return false;
    }
  }

  async function doConvert() {
    const f = find.trim();
    if (!f) { showToast(t('settings.ip.findRequired'), 'err'); return; }
    const { newInfo, count } = convertMemberIPs(appData.memberInfo || {}, getMembersForZone(zone, appData), zone, f, replace);
    if (count === 0) { showToast(`${t('settings.ip.noneFound')} ${zone}`, 'err'); return; }
    const ok = await persist({ ...appData, memberInfo: newInfo }, `[IP] Konversi "${f}"→"${replace}" zona ${zone}`, `${count} member diperbarui`);
    if (ok) { showToast(`${count} IP zona ${zone} ${t('settings.ip.converted')}`); setFind(''); setReplace(''); }
    else showToast(t('common.saveFailed'), 'err');
  }

  function handleConvertClick() {
    const f = find.trim();
    if (!f) { showToast(t('settings.ip.findRequired'), 'err'); return; }
    showConfirm('switch',
      `${t('settings.ip.confirmPrefix')} ${zone} ${t('settings.ip.confirmFrom')} "${f}" ${t('settings.ip.confirmTo')} "${replace}"?`,
      t('settings.ip.convertYes'), doConvert, { description: t('settings.ip.confirmNote') });
  }

  const f = find.trim();
  const previewCount = !f ? 0 : getMembersForZone(zone, appData).filter(name => String(appData.memberInfo?.[`${zone}__${name}`]?.ip || '').includes(f)).length;

  return (
    <Card className={s.card}>
      <div>
        <span className={s.sectionLabel}>{t('settings.ip.zoneLabel')}</span>
        <FilterChips ariaLabel={t('settings.ip.zoneLabel')}>
          {zones.map(z => <FilterChip key={z} active={zone === z} aria-pressed={zone === z} onClick={() => setZone(z)}>{z}</FilterChip>)}
        </FilterChips>
      </div>
      <Input label={t('settings.ip.findLabel')} className={s.mono} autoComplete="off" placeholder={t('settings.ip.findPlaceholder')} value={find} onChange={e => setFind(e.target.value)} />
      <Input label={t('settings.ip.replaceLabel')} className={s.mono} autoComplete="off" placeholder={t('settings.ip.replacePlaceholder')} value={replace} onChange={e => setReplace(e.target.value)} />
      {f && (
        <Notice tone={previewCount > 0 ? 'info' : 'warn'}>
          {previewCount > 0 ? `${previewCount} ${t('settings.ip.willBeChanged')} ${zone}` : `${t('settings.ip.noMatch')} ${zone}`}
        </Notice>
      )}
      <Button variant="primary" block disabled={!f} onClick={handleConvertClick}>
        <ArrowsLeftRight aria-hidden="true" /> {t('settings.ip.convertButton')}
      </Button>
      <span className={s.capSm}>{t('settings.ip.note')}</span>
    </Card>
  );
}
