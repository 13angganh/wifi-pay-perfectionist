// ══════════════════════════════════════════
// components/features/members/MembersView.Form.tsx — sheet Tambah / Edit Member (REDESAIN T9, T4 keputusan 5)
// SATU komponen untuk Tambah dan Edit (zip: form inline untuk tambah, dialog untuk edit). Komponen presentasi:
// validasi dan penyimpanan dimiliki MembersView (members.logic.ts). Nama otomatis huruf besar (CSS + trim/upper
// di logika), Enter di kolom nama menyimpan (hanya Tambah), tombol nonaktif + spinner saat menyimpan (penjaga
// klik ganda tetap di MembersView.persist). Gagal simpan: sheet tetap terbuka (diatur pemanggil).
// Dipasang kondisional dengan `key` oleh pemanggil, jadi state awal selalu segar dari `initial`.
// REDESAIN T12 (F2, D6): kolom "Terdaftar sejak" (bulan + tahun; kosong = "Sejak awal") — SATU-SATUNYA tempat mengubahnya.
// Member baru diisi bulan berjalan oleh pemanggil; bulan sebelum terdaftar tidak ditagih dan tidak dihitung.
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, PencilSimple, Plus, UserPlus } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { ZoneChip } from '@/components/ui/Chip';
import { IconTile } from '@/components/ui/IconTile';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import type { MemberForm } from './members.logic';
import m from './members.module.css';

export interface MemberFormSheetProps {
  mode: 'add' | 'edit';
  zone: string;
  /** warna zona (var CSS untuk zona bawaan, hex untuk zona kustom) */
  zoneColor: string;
  initial: MemberForm;
  saving: boolean;
  /** pesan galat untuk kolom Nama (sudah diterjemahkan) */
  nameError?: string;
  onNameInput: () => void;
  onSubmit: (form: MemberForm) => void;
  onClose: () => void;
}

export default function MemberFormSheet({ mode, zone, zoneColor, initial, saving, nameError, onNameInput, onSubmit, onClose }: MemberFormSheetProps) {
  const t = useT();
  const add = mode === 'add';
  const [form, setForm] = useState<MemberForm>(initial);
  const nameRef = useRef<HTMLInputElement>(null);
  const set = (k: 'name' | 'id' | 'ip' | 'tarif' | 'notes') => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  // T12: "Terdaftar sejak" — month '' = Sejak awal (null). Tahun tersimpan di luar rentang standar tetap muncul di pilihan.
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const joined = form.joined ?? null;
  const joinYears = Array.from(new Set([...getYears(), ...(joined ? [joined.y] : [])])).sort((a, b) => a - b);
  const setJoinedMonth = (raw: string) => setForm(prev => (
    raw === '' ? { ...prev, joined: null } : { ...prev, joined: { y: prev.joined?.y ?? new Date().getFullYear(), m: +raw } }
  ));
  const setJoinedYear = (y: number) => setForm(prev => (prev.joined ? { ...prev, joined: { ...prev.joined, y } } : prev));

  // Sheet memfokus kontrol pertamanya (tombol tutup); pindahkan fokus ke kolom Nama satu tick kemudian.
  useEffect(() => {
    const id = setTimeout(() => nameRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);
  // Galat nama baru muncul → kembalikan fokus ke kolom Nama.
  useEffect(() => { if (nameError) nameRef.current?.focus(); }, [nameError]);

  return (
    <Sheet
      open
      onClose={onClose}
      dismissible={!saving}
      leading={<IconTile icon={add ? UserPlus : PencilSimple} size="sm" />}
      title={<span className={m.zoneHead}>{add ? t('members.add') : t('members.editTitle')} <ZoneChip color={zoneColor}>{zone}</ZoneChip></span>}
    >
      <div className={m.form}>
        <Input
          ref={nameRef}
          label={t('common.name')}
          className={m.upper}
          placeholder={t('members.namePlaceholder')}
          autoComplete="off"
          value={form.name}
          error={nameError}
          onChange={e => { set('name')(e.target.value); onNameInput(); }}
          onKeyDown={e => { if (add && e.key === 'Enter') { e.preventDefault(); onSubmit(form); } }}
        />
        <div className={m.two}>
          <Input label={t('members.customerId')} placeholder={t('common.optional')} autoComplete="off"
            value={form.id} onChange={e => set('id')(e.target.value)} />
          <Input label={add ? t('members.tarifShort') : t('members.tarifLabel')} type="number" inputMode="decimal" numeric
            placeholder="100" autoComplete="off" value={form.tarif} onChange={e => set('tarif')(e.target.value)} />
        </div>
        <Input label={t('members.ipLabel')} placeholder="192.168.x.x atau http://..." autoComplete="off"
          value={form.ip} onChange={e => set('ip')(e.target.value)} />
        <div className="wp-field">
          <span className="wp-t-label">{t('members.joinedLabel')}</span>
          <div className={m.two}>
            <Select size="sm" aria-label={`${t('members.joinedLabel')} — ${t('common.month')}`} value={joined ? joined.m : ''} onChange={e => setJoinedMonth(e.target.value)}>
              <option value="">{t('members.joinedFromStart')}</option>
              {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </Select>
            <Select size="sm" aria-label={`${t('members.joinedLabel')} — ${t('common.year')}`} value={joined ? joined.y : new Date().getFullYear()} disabled={!joined} onChange={e => setJoinedYear(+e.target.value)}>
              {joinYears.map(y => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <span className={m.joinHint}>{t(joined ? 'members.joinedHint' : 'members.joinedHintStart')}</span>
        </div>
        <Textarea label={t('members.notesLabel')} className={m.area} rows={3} placeholder={t('members.notesPlaceholder')}
          value={form.notes} onChange={e => set('notes')(e.target.value)} />
        <div className={m.actions}>
          <Button variant="secondary" disabled={saving} onClick={onClose}>{t('action.cancel')}</Button>
          <Button variant="primary" loading={saving} onClick={() => onSubmit(form)}>
            {add ? <Plus aria-hidden="true" /> : <Check aria-hidden="true" />}
            {add ? `${t('members.addTo')} ${zone}` : t('members.saveChanges')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
