// ══════════════════════════════════════════
// components/modals/FreeMemberModal.tsx — REDESAIN T9 (T4 keputusan 7): bottom sheet pada primitive Sheet.
// DIPERLUAS di REDESAIN T12 (F1, F3, D7) menjadi SATU pintu "Status & Periode" per member (ikon hadiah di kartu Member):
//   • Free MULTI-PERIODE (sebelumnya hanya satu): Tambah / Ubah / Hapus periode Free; "Gratis selamanya" (tanpa akhir)
//     dan validasi tanggal selesai >= mulai dipertahankan; "Kembalikan Berbayar" = hapus periode Free lewat Confirm.
//   • NONAKTIF / REAKTIVASI berulang: "Nonaktifkan mulai {bulan}" dan "Aktifkan kembali mulai {bulan}" (menutup periode
//     nonaktif terbuka di bulan sebelumnya; hanya muncul bila relevan) + Tambah / Ubah / Hapus periode Nonaktif.
//   • Sumber data baru: memberPeriods[`${zona}__${nama}`] (lib/memberPeriods.ts); rekaman freeMembers lama dimigrasikan
//     otomatis dan tidak ditulis lagi. Tanpa percabangan zona (zona kustom = KRS/SLK).
// Penyimpanan dipertahankan dari zip: saveDB + rollback SELEKTIF (selectiveRollback, v11.5.7) + log aktivitas + toast.
// Tampilan: FreeMemberModal.Status.tsx (daftar) dan FreeMemberModal.Form.tsx (editor satu periode).
// Isi sheet dipasang hanya saat terbuka (Sheet), jadi state awal selalu segar dari data member.
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { Gift } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN } from '@/lib/constants';
import { saveDB } from '@/lib/db';
import { tLog } from '@/lib/i18n';
import { getMonthStatus } from '@/lib/payment';
import {
  addPeriod, crossOverlap, deactivateFrom, getMemberPeriods, getPeriodActions, isOpenPeriod, isValidPeriod,
  makePeriod, reactivateFrom, removePeriod, setMemberPeriods, updatePeriod,
  type PeriodError, type PeriodKind, type PeriodResult,
} from '@/lib/memberPeriods';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { IconTile } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import type { MemberPeriod, MemberPeriods, Zone } from '@/types';
import FreeMemberForm from './FreeMemberModal.Form';
import FreeMemberStatus, { type PeriodRowView } from './FreeMemberModal.Status';
import f from './freeMember.module.css';

interface Props {
  open:    boolean;
  zone:    Zone;
  name:    string;
  onClose: () => void;
  /** Pintasan ke form Edit Member (satu-satunya tempat mengubah "Terdaftar sejak"). */
  onEditMember?: () => void;
}

interface EditorState { kind: PeriodKind; index: number | null }

function FreeMemberBody({ zone, name, onEditMember }: Omit<Props, 'open' | 'onClose'>) {
  const { appData, setAppData, uid, userEmail, setSyncStatus, selYear, selMonth } = useAppStore();
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const mp: MemberPeriods | undefined = getMemberPeriods(appData, zone, name);
  const freeList     = mp?.free ?? [];
  const inactiveList = mp?.inactive ?? [];

  // ── state editor satu periode (dipasang saat editor dibuka, bukan lewat efek) ──
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [fromYear,  setFromYear]  = useState(selYear);
  const [fromMonth, setFromMonth] = useState(selMonth);
  const [toYear,    setToYear]    = useState(selYear);
  const [toMonth,   setToMonth]   = useState(11);
  const [noEnd,     setNoEnd]     = useState(false);

  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;
  const status = getMonthStatus(appData, zone, name, selYear, selMonth);
  const { canDeactivate, canReactivate } = getPeriodActions(mp, selYear, selMonth);
  const joinedLabel = mp?.joined ? `${MONTH_NAMES[mp.joined.m]} ${mp.joined.y}` : null;

  const fmtPeriod = (p: MemberPeriod, kind: PeriodKind): string => {
    const from = `${MONTH_NAMES[p.fromM]} ${p.fromY}`;
    if (p.toY != null && p.toM != null) return `${from} ${t('tunggakan.until')} ${MONTH_NAMES[p.toM]} ${p.toY}`;
    return `${from} (${t(kind === 'free' ? 'tunggakan.forever' : 'periods.stillInactive')})`;
  };
  const rowsOf = (list: MemberPeriod[], kind: PeriodKind): PeriodRowView[] =>
    list.map(p => ({ label: fmtPeriod(p, kind), open: isOpenPeriod(p) }));

  // FIX v11.5.7 (dipertahankan): rollback via selectiveRollback (lib/rollback.ts) — lihat penjelasan di MemberCard.tsx.
  async function persist(newData: typeof appData, action: string, detail: string): Promise<boolean> {
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

  const errorText = (e: PeriodError): string =>
    e === 'overlap' ? t('periods.overlapError')
    : e === 'invalidRange' ? t('freemodal.dateError')
    : e === 'beforeJoined' ? t('periods.beforeJoinedError')
    : e === 'alreadyInactive' ? t('periods.alreadyInactiveError')
    : e === 'notAfterStart' ? t('periods.notAfterStartError')
    : t('common.saveFailed');

  /** Terapkan hasil operasi periode: tulis ke data, simpan, beri toast. Mengembalikan true bila tersimpan. */
  async function commit(res: PeriodResult, action: string, detail: string, okText: string): Promise<boolean> {
    if (!res.ok) { showToast(errorText(res.error), 'err'); return false; }
    const ok = await persist(setMemberPeriods(appData, zone, name, res.value), action, detail);
    if (ok) showToast(okText); else showToast(t('common.saveFailed'), 'err');
    return ok;
  }

  // ── editor satu periode ──
  function openEditor(kind: PeriodKind, index: number | null) {
    const list = kind === 'free' ? freeList : inactiveList;
    const p = index === null ? undefined : list[index];
    setFromYear(p?.fromY ?? selYear);
    setFromMonth(p?.fromM ?? selMonth);
    setToYear(p?.toY ?? p?.fromY ?? selYear);
    setToMonth(p?.toM ?? 11);
    setNoEnd(p ? isOpenPeriod(p) : false);
    setEditor({ kind, index });
  }

  const candidate = (): MemberPeriod => makePeriod(fromYear, fromMonth, noEnd ? null : { y: toYear, m: toMonth });

  async function handleSave() {
    if (!editor) return;
    if (!noEnd && (toYear * 12 + toMonth) < (fromYear * 12 + fromMonth)) {
      showToast(t('freemodal.dateError'), 'err');
      return;
    }
    const { kind, index } = editor;
    const period = candidate();
    const res = index === null ? addPeriod(mp, kind, period) : updatePeriod(mp, kind, index, period);
    const detail = `${lang === 'en' ? 'From' : 'Dari'} ${MONTH_NAMES[fromMonth]} ${fromYear}${noEnd ? (lang === 'en' ? ' (forever)' : ' (selamanya)') : (lang === 'en' ? ' to ' : ' s/d ') + MONTH_NAMES[toMonth] + ' ' + toYear}`;
    const ok = kind === 'free'
      ? await commit(res, `[FREE] ${tLog('log.action.setFree')} ${zone} - ${name}`, detail, `${name} ${t('freemodal.setFree')}`)
      : await commit(res, `[EDIT] ${tLog('log.action.editPeriod')} ${zone} - ${name}`, detail, `${name} ${t('periods.savedInactive')}`);
    if (ok) setEditor(null);
  }

  function handleRemove(kind: PeriodKind, index: number) {
    const label = fmtPeriod((kind === 'free' ? freeList : inactiveList)[index], kind);
    if (kind === 'free') {
      showConfirm(
        'question',
        `${t('freemodal.removeConfirm')} ${name}?`,
        t('freemodal.removeYes'),
        async () => {
          const ok = await commit(removePeriod(mp, 'free', index), `[PAY] ${tLog('log.action.unsetFree')} ${zone} - ${name}`, label, `${name} ${t('freemodal.removed')}`);
          if (ok) setEditor(null);
        },
        { description: t('freemodal.removeNote') },
      );
    } else {
      showConfirm(
        'question',
        `${t('periods.removeInactiveConfirm')} ${name}?`,
        t('periods.removeInactiveYes'),
        async () => {
          const ok = await commit(removePeriod(mp, 'inactive', index), `[EDIT] ${tLog('log.action.editPeriod')} ${zone} - ${name}`, label, `${name} ${t('periods.removedInactive')}`);
          if (ok) setEditor(null);
        },
        { description: t('periods.removeInactiveNote') },
      );
    }
  }

  // ── Nonaktifkan / Aktifkan kembali mulai bulan terpilih ──
  function handleDeactivate() {
    showConfirm(
      'question',
      `${t('periods.deactivateConfirm')} ${name}?`,
      t('periods.deactivateYes'),
      () => { void commit(deactivateFrom(mp, selYear, selMonth), `[EDIT] ${tLog('log.action.deactivateMember')} ${zone} - ${name}`, monthLabel, `${name} ${t('periods.deactivated')}`); },
      { description: `${monthLabel}: ${t('periods.deactivateNote')}` },
    );
  }
  function handleReactivate() {
    showConfirm(
      'question',
      `${t('periods.reactivateConfirm')} ${name}?`,
      t('periods.reactivateYes'),
      () => { void commit(reactivateFrom(mp, selYear, selMonth), `[EDIT] ${tLog('log.action.reactivateMember')} ${zone} - ${name}`, monthLabel, `${name} ${t('periods.reactivated')}`); },
      { description: `${monthLabel}: ${t('periods.reactivateNote')}` },
    );
  }

  if (editor) {
    const cand = candidate();
    const existing = editor.index !== null;
    return (
      <div className={f.body}>
        <h3 className={f.secTitle}>
          {t(existing
            ? (editor.kind === 'free' ? 'periods.editFreeTitle' : 'periods.editInactiveTitle')
            : (editor.kind === 'free' ? 'periods.addFree' : 'periods.addInactive'))}
        </h3>
        <FreeMemberForm
          kind={editor.kind}
          fromYear={fromYear} fromMonth={fromMonth} toYear={toYear} toMonth={toMonth} noEnd={noEnd}
          hasExisting={existing}
          crossWarn={isValidPeriod(cand) && crossOverlap(mp, editor.kind, cand)}
          MONTH_NAMES={MONTH_NAMES}
          onFromYear={setFromYear} onFromMonth={setFromMonth} onToYear={setToYear} onToMonth={setToMonth} onNoEnd={setNoEnd}
          onSave={handleSave}
          onRemove={() => { if (editor.index !== null) handleRemove(editor.kind, editor.index); }}
          onCancel={() => setEditor(null)}
        />
      </div>
    );
  }

  return (
    <FreeMemberStatus
      monthLabel={monthLabel}
      status={status}
      joinedLabel={joinedLabel}
      canDeactivate={canDeactivate}
      canReactivate={canReactivate}
      free={rowsOf(freeList, 'free')}
      inactive={rowsOf(inactiveList, 'inactive')}
      onEditJoined={onEditMember}
      onDeactivate={handleDeactivate}
      onReactivate={handleReactivate}
      onAdd={kind => openEditor(kind, null)}
      onEdit={(kind, index) => openEditor(kind, index)}
      onDelete={handleRemove}
    />
  );
}

export default function FreeMemberModal({ open, zone, name, onClose, onEditMember }: Props) {
  const t = useT();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      leading={<IconTile icon={Gift} tone="free" size="sm" />}
      title={`${t('periods.title')} ${name}`}
    >
      <FreeMemberBody zone={zone} name={name} onEditMember={onEditMember} />
    </Sheet>
  );
}
