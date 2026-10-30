// ══════════════════════════════════════════
// components/features/rekap/RekapModal.MonthGrid.tsx — isi RekapModal (REDESAIN T8, T3 keputusan 7)
// Dipakai ulang (sebelumnya yatim): catatan gratis/terkunci, atau input nominal (Rp … .000) + tombol hapus,
// chip nominal cepat (tarif member lebih dulu dan disorot) dan tombol Simpan. Simpan ≡ Enter (perilaku zip):
// menandai input kotor lalu menyimpan; blur tetap menyimpan seperti zip. Logika tulis ada di RekapModal.
// REDESAIN T12: catatan + tombol "Tetap catat" untuk bulan Belum-terdaftar/Nonaktif (entryNA) dan pemilih tanggal
// bayar (mode manual; default hari ini) sebagai padanan kolom "Tgl Bayar" kartu Entry.
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Gift, Lock, Prohibit, Trash } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { QuickPayGrid } from '@/components/ui/QuickPayGrid';
import { localDateISO } from '@/lib/payDate';
import type { NaStatus } from './rekap.logic';
import r from './rekap.module.css';

interface Props {
  entryVal:    number | null;
  entryFree:   boolean;
  /** T12: bulan Belum terdaftar / Nonaktif tanpa pembayaran yang BELUM dikonfirmasi — catatan + tombol menggantikan form */
  entryNA:     NaStatus | null;
  onRecordNA:  () => void;
  /** T12 (F4): tampilkan pemilih tanggal bayar (mode manual) */
  showDate:    boolean;
  onPayDate:   (v: string) => void;
  locked:      boolean;
  tarif:       number | undefined;
  quickAmts:   number[];
  inputDirty:  React.MutableRefObject<boolean>;
  onQuickPay:  (amt: number) => void;
  /** force = Enter/Simpan: menyimpan walau input belum diubah (perilaku Enter zip); blur memakai false */
  onManualPay: (val: string, force?: boolean) => void;
  onClearPay:  (e: React.MouseEvent) => void;
}

export default function RekapMonthGrid({
  entryVal, entryFree, entryNA, onRecordNA, showDate, onPayDate, locked, tarif, quickAmts, inputDirty, onQuickPay, onManualPay, onClearPay,
}: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [today] = useState(() => localDateISO());
  const editable = !entryFree && !locked && !entryNA;

  // Fokus ke input seperti autoFocus zip; ditunda satu tick karena Sheet memfokus kontrol pertamanya saat dibuka.
  useEffect(() => {
    if (!editable) return;
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [editable]);

  if (entryFree) {
    return <div className={clsx(r.note, r.noteFree)}><Gift size={16} weight="duotone" aria-hidden="true" /> {t('rekap.freeMember')}</div>;
  }
  if (locked) {
    return <div className={clsx(r.note, r.noteLock)}><Lock size={14} weight="fill" aria-hidden="true" /> {t('rekap.dataLocked')}</div>;
  }
  if (entryNA) {
    return (
      <div className={r.noteNA}>
        <div className={r.note}>
          <Prohibit size={16} aria-hidden="true" /> {t(entryNA === 'nonaktif' ? 'membercard.naNonaktif' : 'membercard.naBelumTerdaftar')}
        </div>
        <Button variant="secondary" block onClick={onRecordNA}>{t('membercard.naRecord')}</Button>
      </div>
    );
  }

  // T2 keputusan 4 (dipakai juga di sini): tarif member lebih dulu, disorot oleh QuickPayGrid
  const ordered = tarif ? [tarif, ...quickAmts.filter(a => a !== tarif)] : quickAmts;
  const save = () => onManualPay(inputRef.current?.value ?? '', true);

  return (
    <>
      <div className={r.mAmt}>
        <Input
          ref={inputRef}
          numeric
          label={t('common.amount')}
          type="number"
          inputMode="numeric"
          placeholder="0"
          defaultValue={entryVal !== null ? String(entryVal) : ''}
          leftIcon={<span style={{ fontWeight: 600 }}>Rp</span>}
          rightIcon={<span>.000</span>}
          style={{ paddingLeft: 40, paddingRight: 52 }}
          onChange={() => { inputDirty.current = true; }} // eslint-disable-line react-hooks/immutability
          onBlur={e => onManualPay(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
          }}
        />
        {entryVal !== null && (
          <IconButton icon={Trash} label={t('action.delete')} tone="danger" onClick={onClearPay} />
        )}
      </div>
      <QuickPayGrid
        amounts={ordered}
        tarif={tarif}
        onPick={onQuickPay}
        formatLabel={a => (a === tarif ? `${a}K ★` : `${a}K`)}
        ariaLabel={t('entry.quickAria')}
      />
      {showDate && (
        <Input type="date" label={t('membercard.payDate')} defaultValue={today} onChange={e => onPayDate(e.target.value)} />
      )}
      <Button variant="primary" block onClick={save}>{t('action.save')}</Button>
    </>
  );
}
