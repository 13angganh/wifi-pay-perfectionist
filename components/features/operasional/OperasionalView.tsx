// ══════════════════════════════════════════
// components/features/operasional/OperasionalView.tsx — layar Operasional (REDESAIN T10, prototype T5, keputusan D5/D6)
//
// Logika zip yang DIPERTAHANKAN: edit langsung di baris (label + nominal), simpan saat blur, persist lewat
// persistPayment + rollback SELEKTIF (selectiveRollback, v11.5.7) bila gagal + toast, hapus lewat Confirm,
// tahun >= 2026, nominal dalam ribuan rupiah, log "[OPS] Update operasional".
// Yang BERUBAH (disetujui): Tambah Item = bottom sheet (bukan baris kosong yang langsung tersimpan), menu titik
// tiga (Edit lewat sheet, Hapus lewat Confirm), simpan hanya bila nilai benar-benar berubah, toast hapus sukses
// berwarna hijau, dan PERBAIKAN ZONA KUSTOM: ringkasan satu baris per zona aktif (operasional.logic.ts).
// ══════════════════════════════════════════
'use client';

import { CardFilter, Vis } from '@/components/ui/CardFilter';
import { useEffect, useRef, useState } from 'react';
import {
  DotsThreeVertical, PencilSimple, Receipt, Trash, Warning,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { rp } from '@/lib/helpers';
import { getAllActiveZones, getMembersForZone } from '@/lib/member';
import { persistPayment } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { zoneCssColor } from '@/lib/design-tokens';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GhostInput, NominalWrap } from '@/components/ui/GhostInput';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Select } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { AppData, OpsItem } from '@/types';
import { ICONS } from './OperasionalView.Icons';
import { Fab, FabSpace } from '@/components/ui/Fab';
import OperasionalSheet from './OperasionalView.Sheet';
import {
  buildOpsSummary, isItemChanged, itemFromForm, resolveOpsIcon, validateOpsForm, withUpdatedItem,
  type OpsFormValue,
} from './operasional.logic';
import o from './operasional.module.css';

const MIN_YEAR = 2026;

type SheetState = { mode: 'add' } | { mode: 'edit'; index: number; initial: OpsFormValue };

export default function OperasionalView() {
  const { appData, setAppData, uid, userEmail, opsYear, opsMonth, setOpsYear, setOpsMonth, setSyncStatus, syncStatus, settings } = useAppStore();
  const t = useT();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const opsKey = `${opsYear}_${opsMonth}`;
  const items: OpsItem[] = appData.operasional?.[opsKey]?.items || [];
  const summary = buildOpsSummary(appData, settings, opsYear, opsMonth, items);

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [labelError, setLabelError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [menuIdx, setMenuIdx] = useState<number | null>(null);
  const isSavingRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menu titik tiga: tutup dengan Esc atau klik di luar.
  useEffect(() => {
    if (menuIdx === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuIdx(null); };
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuIdx(null); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [menuIdx]);

  // FIX v11.5.7 (dipertahankan): rollback via selectiveRollback, bukan replace total ke prevData.
  async function persist(newData: AppData, prevData: AppData): Promise<boolean> {
    setAppData(newData);
    if (!uid) return true;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action: `[OPS] ${tLog('log.action.updateOps')}`, detail: `${MONTH_NAMES[opsMonth]} ${opsYear}` }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
      return true;
    } catch (err) {
      logger.error('Gagal simpan data operasional ke Firebase', err);
      setSyncStatus('err');
      const latest = useAppStore.getState().appData;
      setAppData(selectiveRollback(latest, prevData, newData));
      return false;
    }
  }

  /** Terapkan perubahan daftar item pada data TERKINI (bukan salinan render) lalu simpan. */
  async function commit(build: (current: OpsItem[]) => OpsItem[]): Promise<boolean> {
    const prev = useAppStore.getState().appData;
    const current = prev.operasional?.[opsKey]?.items || [];
    const next: AppData = { ...prev, operasional: { ...prev.operasional, [opsKey]: { items: build(current) } } };
    return persist(next, prev);
  }

  async function onInlineBlur(index: number, field: 'label' | 'nominal', raw: string) {
    if (!isItemChanged(items[index], field, raw)) return;
    const ok = await commit(cur => withUpdatedItem(cur, index, field, raw));
    if (!ok) showToast(t('common.saveFailed'), 'err');
  }

  async function submitSheet(value: OpsFormValue) {
    if (!sheet || isSavingRef.current) return;
    if (validateOpsForm(value)) { setLabelError(t('ops.labelRequired')); return; }
    isSavingRef.current = true; setSaving(true);
    const item = itemFromForm(value);
    const editing = sheet.mode === 'edit' ? sheet.index : -1;
    const ok = await commit(cur => (editing >= 0 ? cur.map((it, i) => (i === editing ? item : it)) : [...cur, item]));
    isSavingRef.current = false; setSaving(false);
    if (ok) { setSheet(null); showToast(editing >= 0 ? t('ops.itemSaved') : t('ops.itemAdded'), 'ok'); }
    else showToast(t('common.saveFailed'), 'err'); // sheet tetap terbuka, data sudah di-rollback
  }

  function askDelete(index: number) {
    const item = items[index];
    setMenuIdx(null);
    showConfirm('trash', `${t('action.delete')} ${item?.label || 'item'}?`, t('action.delete'), async () => {
      const ok = await commit(cur => cur.filter((_, i) => i !== index));
      showToast(ok ? t('ops.itemDeleted') : t('common.saveFailed'), ok ? 'ok' : 'err');
    }, { description: t('ops.deleteHint') });
  }

  // "Belum ada data sama sekali" = tidak ada member di zona aktif mana pun (daftar lewat getMembersForZone)
  const hasMembers = getAllActiveZones(settings).some(z => getMembersForZone(z, appData).length > 0);
  const loading = syncStatus === 'loading' && !hasMembers && items.length === 0;
  const failed = syncStatus === 'err' && !hasMembers && items.length === 0 && !appData.operasional;
  const years = getYears().filter(y => y >= MIN_YEAR);
  const netNeg = summary.net < 0;

  return (
    <div className={o.root}>
      <div className="wp-pbar">
        <Select size="sm" aria-label={t('ops.yearAria')} value={opsYear} onChange={e => setOpsYear(+e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select size="sm" aria-label={t('ops.monthAria')} value={opsMonth} onChange={e => setOpsMonth(+e.target.value)}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <CardFilter compact screen="operasional" items={[{ id: 'zones', label: t('view.operasional.zones') }]} />
      </div>

      <div className={o.secHead}>
        <span className={o.secTitle}>{t('ops.expenseTitle')}</span>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : failed ? (
        <EmptyState icon={Warning} title={t('ops.loadErrorTitle')} description={t('ops.loadErrorDesc')} size="md"
          action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>} />
      ) : items.length === 0 ? (
        <EmptyState icon={Receipt} title={t('ops.emptyTitle')} description={t('ops.emptyDesc')} size="md"
          action={<Button variant="primary" size="sm" onClick={() => { setLabelError(undefined); setSheet({ mode: 'add' }); }}>{t('ops.addItemBtn')}</Button>} />
      ) : (
        <div className={o.list} ref={menuRef}>
          {items.map((it, i) => {
            const meta = ICONS[resolveOpsIcon(it)];
            return (
              <Card key={`${opsKey}-${i}-${it.label}-${it.nominal}`} padding="none" className={o.row}>
                <IconTile icon={meta.icon} tone={meta.tone} size="sm" />
                <div className={o.lbl}>
                  <GhostInput aria-label={`${t('ops.labelField')} ${i + 1}`} placeholder={t('ops.itemPlaceholder')} autoComplete="off"
                    defaultValue={it.label} onBlur={e => onInlineBlur(i, 'label', e.target.value)} />
                </div>
                <div className={o.nom}>
                  <NominalWrap prefix={<span className={o.unit}>Rp</span>} suffix={<span className={o.unit}>.000</span>}>
                    <GhostInput numeric aria-label={`${t('ops.nominalField')} ${i + 1}`} type="number" inputMode="numeric" placeholder="0" autoComplete="off"
                      defaultValue={it.nominal || ''} onBlur={e => onInlineBlur(i, 'nominal', e.target.value)} />
                  </NominalWrap>
                </div>
                <IconButton icon={DotsThreeVertical} size="sm" label={`${t('ops.itemMenu')} ${it.label || i + 1}`}
                  aria-haspopup="menu" aria-expanded={menuIdx === i}
                  onClick={() => setMenuIdx(menuIdx === i ? null : i)} />
                {menuIdx === i && (
                  <div className={o.menu} role="menu">
                    <button type="button" role="menuitem" className={o.menuItem}
                      onClick={() => { setMenuIdx(null); setLabelError(undefined); setSheet({ mode: 'edit', index: i, initial: { label: it.label, nominal: it.nominal ? String(it.nominal) : '', icon: (it.icon as OpsFormValue['icon']) || '' } }); }}>
                      <PencilSimple aria-hidden="true" /> {t('action.edit')}
                    </button>
                    <button type="button" role="menuitem" className={`${o.menuItem} ${o.menuItemDanger}`} onClick={() => askDelete(i)}>
                      <Trash aria-hidden="true" /> {t('action.delete')}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card padding="none" className={o.sum} aria-label={t('ops.netIncome')}>
        <Vis screen="operasional" id="zones">{summary.zones.map(z => (
          <div key={z.zone} className={o.sumRow}>
            <span className={o.sumLbl}>
              <i className={o.dot} style={{ background: zoneCssColor(z.zone, settings.customZones ?? []) }} aria-hidden="true" />
              {t('ops.income')} {z.zone}
            </span>
            <span className={o.sumVal} style={{ color: zoneCssColor(z.zone, settings.customZones ?? []) }}>{rp(z.total)}</span>
          </div>
        ))}</Vis>
        <div className={o.sumRow}>
          <span className={o.sumLbl}>{t('ops.grossIncome')}</span>
          <span className={`${o.sumVal} ${o.gross}`}>{rp(summary.gross)}</span>
        </div>
        <div className={o.sumRow}>
          <span className={o.sumLbl}>{t('ops.totalExpense')}</span>
          <span className={`${o.sumVal} ${o.expense}`}>{rp(summary.expense)}</span>
        </div>
        <div className={`${o.net} ${netNeg ? o.netNeg : ''}`} data-negative={netNeg ? 'true' : 'false'}>
          <span className={o.netLbl}>{t('ops.netIncome')}</span>
          <span className={o.netVal}>{rp(summary.net)}</span>
        </div>
      </Card>

      {sheet && (
        <OperasionalSheet
          key={sheet.mode === 'edit' ? `edit-${sheet.index}` : 'add'}
          mode={sheet.mode}
          initial={sheet.mode === 'edit' ? sheet.initial : { label: '', nominal: '', icon: '' }}
          saving={saving}
          labelError={labelError}
          onLabelInput={() => setLabelError(undefined)}
          onSubmit={submitSheet}
          onClose={() => { if (!saving) setSheet(null); }}
        />
      )}
      <Fab label={t('ops.addItemBtn')} onClick={() => { setLabelError(undefined); setSheet({ mode: 'add' }); }} />
      <FabSpace />
    </div>
  );
}
