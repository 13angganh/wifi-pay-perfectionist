// ══════════════════════════════════════════
// components/features/members/MembersView.tsx — layar Member (REDESAIN T9, prototype T4)
//
// Orkestrator: state + persist + handler. Tampilan dipecah ke MembersView.{Card,Form,Deleted,Toolbar}.tsx,
// logika murni di members.logic.ts (teruji). Gaya satu-layar = members.module.css (hanya token).
//
// Logika zip yang DIPERTAHANKAN: persist() dengan penjaga klik ganda (isSavingRef) + rollback SELEKTIF via
// selectiveRollback (v11.5.4/5/7), zona Member berdiri sendiri (newMemberZone, tidak mengikuti tab zona header),
// KUNCI/BUKA MEMBER terpisah dari kunci global (merah = terkunci, hijau = terbuka; label aksi), Recycle Bin,
// teks log yang tersimpan di database tidak diubah.
// Perubahan yang DISETUJUI: A20–A23 (status + filter status, cari ID/IP, salin IP, catatan saat Tambah), Tambah
// dan Edit = bottom sheet, dan PERBAIKAN ZONA KUSTOM (getMembersForZone/setMembersForZone di members.logic.ts).
// ══════════════════════════════════════════
'use client';

import { FabSpace } from '@/components/ui/Fab';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Lock, LockOpen, MagnifyingGlass, Trash, UserPlus, UsersThree, WarningCircle } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { tLog } from '@/lib/i18n';
import { MONTHS, MONTHS_EN } from '@/lib/constants';
import { persistPayment } from '@/lib/db';
import { selectiveRollback } from '@/lib/rollback';
import { logger } from '@/lib/logger';
import { getMembersForZone } from '@/lib/member';
import { zoneCssColor, zoneCssVars } from '@/lib/design-tokens';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { SkeletonList } from '@/components/ui/Skeleton';
import FreeMemberModal from '@/components/modals/FreeMemberModal';
import { getMemberPeriods } from '@/lib/memberPeriods';
import RiwayatModal from '@/components/modals/RiwayatModal';
import { visibleZoneKeys } from '@/components/layout/Header.ZoneTabs';
import { filterByStatus, statusCounts, refStatus, type RekapFilter } from '../rekap/rekap.logic';
import {
  EMPTY_FORM, buildAddMember, buildDeleteMember, buildEditMember, buildPurgeMember, buildRestoreMember,
  deletedForZone, matchesQuery, memberInfoOf, sortMembers,
  type MemberError, type MemberForm, type SortMode,
} from './members.logic';
import { MemberRow } from './MembersView.Card';
import MemberFormSheet from './MembersView.Form';
import DeletedMembers from './MembersView.Deleted';
import MembersToolbar from './MembersView.Toolbar';
import m from './members.module.css';

type FormState = { mode: 'add' } | { mode: 'edit'; origName: string; initial: MemberForm };

export default function MembersView() {
  const {
    appData, setAppData, uid, userEmail,
    activeZone,
    memberTab, setMemberTab,
    search, setSearch,
    membersLocked, setMembersLocked,
    selYear, selMonth,
    syncStatus, setSyncStatus,
    setRiwayatZone, setRiwayatName, setRiwayatYear,
    settings,
  } = useAppStore();
  const t = useT();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const [sortMode, setSortMode] = useState<SortMode>('name-asc');
  const [statusFilter, setStatusFilter] = useState<RekapFilter>('all');
  const [form, setForm] = useState<FormState | null>(null);
  const [formNonce, setFormNonce] = useState(0);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [freeOpen, setFreeOpen] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [freeZone, setFreeZone] = useState('');
  const [riwOpen, setRiwOpen] = useState(false);
  // FIX v11.5.4 (dipertahankan): double-submit guard. Tanpa ini, tombol Simpan yang ditekan dua kali sebelum
  // request pertama selesai membuat saveEdit() kedua mencari nama lama yang sudah berubah → "Member tidak
  // ditemukan". isSavingRef mem-block semua persist() lain selagi satu proses simpan masih berjalan.
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  // Zona Member berdiri sendiri (newMemberZone). Bila zona itu tak lagi tampil (dihapus/disembunyikan di
  // Pengaturan), jatuh ke zona pertama yang tampil — diturunkan saat render, tanpa efek samping.
  const customZones = settings.customZones ?? [];
  const zones = visibleZoneKeys(customZones, settings.hiddenZones ?? []);
  // Zona Member mengikuti tab zona Header (tab zona ganda di halaman ini dihapus atas permintaan user).
  const zone = zones.includes(activeZone) ? activeZone : (zones[0] ?? activeZone);
  const zoneColor = zoneCssColor(zone, customZones);
  const zoneVars = (() => { const v = zoneCssVars(zone, customZones); return { ['--zc' as string]: v.zc, ['--zcdim' as string]: v.zcdim } as CSSProperties; })();

  // FIX v11.5.5 (dipertahankan): snapshot appData SEBELUM optimistic update; bila Firebase gagal, kembalikan
  // SELEKTIF (selectiveRollback, v11.5.7) supaya retry mencari data yang konsisten dengan server. Error asli
  // dicatat lewat logger.error agar penyebab pasti (PERMISSION_DENIED/offline/…) bisa didiagnosis.
  async function persist(newData: typeof appData, action: string, detail?: string): Promise<boolean> {
    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setIsSaving(true);
    const prevData = appData;
    setAppData(newData);
    if (!uid) { setIsSaving(false); isSavingRef.current = false; return true; }
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
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }

  const errorText: Record<MemberError, string> = {
    nameRequired:    t('members.nameRequired'),
    nameInvalidChar: t('members.nameInvalidChar'),
    nameDuplicate:   t('members.nameDuplicate'),
    notFound:        t('members.notFound'),
  };

  const prevZone = useRef(zone);
  useEffect(() => { if (prevZone.current === zone) return; prevZone.current = zone; setSearch(''); setMemberTab('active'); setStatusFilter('all'); }, [zone, setSearch, setMemberTab, setStatusFilter]);   // pindah zona di Header → daftar mulai bersih
  function openForm(next: FormState) { setNameError(undefined); setFormNonce(n => n + 1); setForm(next); }
  function closeForm() { setForm(null); setNameError(undefined); }
  function openFree(z: string, n: string) { setFreeZone(z); setFreeName(n); setFreeOpen(true); }
  function openRiwayat(z: string, n: string) {
    setRiwayatZone(z); setRiwayatName(n); setRiwayatYear(new Date().getFullYear());
    setRiwOpen(true);
  }
  async function copyIp(ip: string) {
    try { await navigator.clipboard.writeText(ip); showToast(t('members.ipCopied')); }
    catch { showToast(t('members.copyFailed'), 'err'); }
  }

  async function submitForm(values: MemberForm) {
    if (!form || isSavingRef.current) return; // double-tap guard
    if (form.mode === 'add') {
      const r = buildAddMember(appData, zone, values);
      if (!r.ok) { setNameError(errorText[r.error]); showToast(errorText[r.error], 'err'); return; }
      const ok = await persist(r.data, `[ADD] ${tLog('log.action.addMember')} ${zone} - ${r.name}`, `ID:${values.id.trim()} IP:${values.ip.trim()}`);
      if (ok) { showToast(`${r.name} ${t('members.added')}`); closeForm(); }
      else showToast(t('common.saveFailed'), 'err');
      return;
    }
    const { origName } = form;
    const r = buildEditMember(appData, zone, origName, values);
    if (!r.ok) {
      showToast(errorText[r.error], 'err');
      if (r.error === 'notFound') closeForm(); else setNameError(errorText[r.error]);
      return;
    }
    const ok = await persist(r.data, `[EDIT] ${tLog('log.action.editMember')} ${zone}`, `${origName} → ${r.name}`);
    if (ok) { showToast(`${r.name} ${t('members.updated')}`); closeForm(); }
    // Gagal tersimpan ke server — JANGAN tutup sheet, biarkan pengguna coba lagi (zip v11.5.5).
    else showToast(t('common.saveFailed'), 'err');
  }

  function openEdit(name: string) {
    const info = memberInfoOf(appData, zone, name);
    openForm({
      mode: 'edit', origName: name,
      initial: {
        name, id: String(info.id || ''), ip: String(info.ip || ''), tarif: String(info.tarif || ''), notes: String(info.notes || ''),
        // T12: "Terdaftar sejak" tersimpan (null = sejak awal) — selalu eksplisit supaya Simpan tidak diam-diam mengosongkannya.
        joined: getMemberPeriods(appData, zone, name)?.joined ?? null,
      },
    });
  }

  function deleteMember(name: string) {
    showConfirm('trash', `${t('members.delete')} ${name}?`, t('membercard.deleteYes'), async () => {
      if (isSavingRef.current) return; // double-tap guard
      const ok = await persist(buildDeleteMember(appData, zone, name), `[DEL] ${tLog('log.action.deleteMember')} ${zone} - ${name}`);
      // Toast hapus bertipe merah (perilaku zip, T4 §3 butir c).
      showToast(ok ? `${name} ${t('common.deleted')}` : t('common.saveFailed'), 'err');
    }, { description: t('members.deleteNote') });
  }

  async function restoreMember(key: string) {
    if (isSavingRef.current) return; // double-tap guard
    const r = buildRestoreMember(appData, key);
    if (!r) return;
    const ok = await persist(r.data, `[RESTORE] ${tLog('log.action.restoreMember')} ${r.entry.zone} - ${r.entry.name}`);
    showToast(ok ? `${r.entry.name} ${t('members.restored')}` : t('common.saveFailed'), ok ? 'ok' : 'err');
  }

  function permanentDelete(key: string) {
    const d = appData.deletedMembers?.[key];
    if (!d) return;
    showConfirm('trash', `${t('members.permDelete')} ${d.name}?`, t('members.permDeleteYes'), async () => {
      if (isSavingRef.current) return; // double-tap guard
      const ok = await persist(buildPurgeMember(appData, key), `[PURGE] ${tLog('log.action.permDelete')} ${d.zone} - ${d.name}`);
      showToast(ok ? `${d.name} ${t('members.deleted')}` : t('common.saveFailed'), 'err');
    }, { description: t('members.permDeleteNote'), highlightColor: 'var(--c-belum)' });
  }

  // ── Data tampilan ──
  const getInfo = (n: string) => memberInfoOf(appData, zone, n);
  const mems = sortMembers(getMembersForZone(zone, appData), getInfo, sortMode);
  const counts = statusCounts(appData, zone, mems, selYear, selMonth);
  const filteredMems = filterByStatus(appData, zone, mems, selYear, selMonth, statusFilter)
    .filter(n => matchesQuery(n, getInfo(n), search));
  const deletedList = deletedForZone(appData, zone);
  const monthLabel = `${MONTH_NAMES[selMonth]} ${selYear}`;
  const totalAllZones = zones.reduce((s, z) => s + getMembersForZone(z, appData).length, 0);
  const loading = syncStatus === 'loading' && mems.length === 0;
  const failed  = syncStatus === 'err' && totalAllZones === 0;

  // T12 (D8): hitungan header memisahkan Aktif/Nonaktif (+ Belum terdaftar) — hanya muncul bila ada member N/A bulan ini.
  const naInactive = counts.nonaktif ?? 0;
  const naNotReg   = counts.belumTerdaftar ?? 0;
  const activityText = naInactive + naNotReg > 0
    ? ` · ${counts.lunas + counts.belum + counts.free} ${t('members.activeShort')} · ${naInactive} ${t('members.inactiveShort')}${naNotReg ? ` · ${naNotReg} ${t('members.notRegisteredShort')}` : ''}`
    : '';
  const countText = `${filteredMems.length} ${t('common.members')}${search ? ` ${t('common.noResult').toLowerCase()}` : ''} · ${zone} · ${monthLabel}${activityText}`;

  function renderList() {
    if (loading) return <SkeletonList count={5} />;
    if (failed) {
      return (
        <EmptyState icon={WarningCircle} title={t('members.loadErrorTitle')} description={t('members.loadErrorDesc')} size="md"
          action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>} />
      );
    }
    if (mems.length === 0) {
      return (
        <EmptyState icon={UsersThree} title={t('members.empty')} description={t('members.emptyDesc')} size="md"
          action={!membersLocked ? <Button variant="primary" size="sm" onClick={() => openForm({ mode: 'add' })}><UserPlus aria-hidden="true" /> {t('members.add')}</Button> : undefined} />
      );
    }
    if (filteredMems.length === 0) {
      return (
        <EmptyState icon={MagnifyingGlass} title={t('entry.noMatch')} description={t('entry.noMatchDesc')} size="md"
          action={<Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>{t('common.resetFilter')}</Button>} />
      );
    }
    return (
      <div className={m.mlist} id="member-rows">
        {filteredMems.map((name, i) => (
          <MemberRow
            key={name}
            index={i}
            name={name}
            info={getInfo(name)}
            status={refStatus(appData, zone, name, selYear, selMonth)}
            locked={membersLocked}
            onOpenRiwayat={() => openRiwayat(zone, name)}
            onCopyIp={copyIp}
            onPeriods={() => openFree(zone, name)}
            onEdit={() => openEdit(name)}
            onDelete={() => deleteMember(name)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={m.root} style={zoneVars}>
      <div className={m.top}>
        <div className={m.mtb}>
          <Segmented
            mode="tabs"
            ariaLabel={t('members.tabsAria')}
            value={memberTab}
            onChange={setMemberTab}
            options={[
              { value: 'active',  label: <><UsersThree weight={memberTab === 'active' ? 'fill' : 'regular'} aria-hidden="true" /> {t('common.all')}</>, count: mems.length, color: zoneColor },
              { value: 'deleted', label: <><Trash weight={memberTab === 'deleted' ? 'fill' : 'regular'} aria-hidden="true" /> {t('action.delete')}</>, count: deletedList.length, color: 'var(--zc-slk)' },
            ]}
          />
          {/* v11.7.0 (dipertahankan): STATUS (tidak bisa diklik; kata sifat Terkunci/Terbuka) + tombol AKSI ikon-saja
              terpisah, sama persis dengan pola Header. Merah = terkunci, hijau = terbuka. */}
          <div className={m.lkg}>
            <div
              aria-hidden="true"
              className="hdr-lock-status"
              style={{ ['--lc' as string]: membersLocked ? 'var(--c-belum)' : 'var(--c-lunas)' } as CSSProperties}
            >
              {membersLocked ? <Lock size={14} weight="fill" /> : <LockOpen size={14} weight="fill" />}
              {membersLocked ? t('members.statusLocked') : t('members.statusUnlocked')}
            </div>
            <button
              className="header-lock-action-btn"
              onClick={() => { setMembersLocked(!membersLocked); showToast(membersLocked ? t('members.unlocked') : t('members.locked')); }}
              aria-label={membersLocked ? t('members.actionAriaLocked') : t('members.actionAriaUnlocked')}
              title={membersLocked ? t('members.unlock') : t('members.lock')}
            >
              {membersLocked
                ? <LockOpen size={16} weight="fill" />
                : <Lock size={16} weight="fill" />
              }
            </button>
          </div>
        </div>
      </div>

      {memberTab === 'deleted' ? (
        deletedList.length === 0
          ? <EmptyState icon={Trash} title={t('members.recycleBinEmpty')} description={t('members.recycleBinDesc')} size="md" />
          : <DeletedMembers entries={deletedList} locale={lang === 'en' ? 'en-GB' : 'id-ID'} onRestore={restoreMember} onPurge={permanentDelete} />
      ) : (
        <>
          <MembersToolbar
            search={search}
            onSearch={setSearch}
            locked={membersLocked}
            onAdd={() => openForm({ mode: 'add' })}
            filter={statusFilter}
            counts={counts}
            onFilter={setStatusFilter}
            countText={countText}
            statusTitle={`${t('members.statusFor')} ${monthLabel}`}
            sort={sortMode}
            onSort={setSortMode}
          />
          {renderList()}
        </>
      )}

      {form && (
        <MemberFormSheet
          key={formNonce}
          mode={form.mode}
          zone={zone}
          zoneColor={zoneColor}
          initial={form.mode === 'edit' ? form.initial : { ...EMPTY_FORM, joined: { y: new Date().getFullYear(), m: new Date().getMonth() } }}
          saving={isSaving}
          nameError={nameError}
          onNameInput={() => setNameError(undefined)}
          onSubmit={submitForm}
          onClose={closeForm}
        />
      )}
      <FreeMemberModal
        open={freeOpen} zone={freeZone} name={freeName} onClose={() => setFreeOpen(false)}
        onEditMember={() => { setFreeOpen(false); openEdit(freeName); }}
      />
      {riwOpen && <RiwayatModal open onClose={() => setRiwOpen(false)} />}
      {!membersLocked && <FabSpace />}
    </div>
  );
}
