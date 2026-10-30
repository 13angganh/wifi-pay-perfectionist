// ══════════════════════════════════════════
// components/features/operasional/OperasionalView.Sheet.tsx — sheet Tambah / Edit Item (REDESAIN T10, T5 keputusan D5)
// Menggantikan "baris kosong yang langsung tersimpan" di zip. Komponen presentasi: validasi (operasional.logic)
// dan penyimpanan (rollback, penjaga klik ganda) dimiliki OperasionalView. Dipasang kondisional dengan `key`.
// ══════════════════════════════════════════
'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, MagicWand, PencilSimple, Plus } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { OPS_ICON_KEYS, opsIconKey, type OpsFormValue } from './operasional.logic';
import { ICONS } from './OperasionalView.Icons';
import o from './operasional.module.css';

export interface OpsSheetProps {
  mode: 'add' | 'edit';
  initial: OpsFormValue;
  saving: boolean;
  labelError?: string;
  onLabelInput: () => void;
  onSubmit: (value: OpsFormValue) => void;
  onClose: () => void;
}

export default function OperasionalSheet({ mode, initial, saving, labelError, onLabelInput, onSubmit, onClose }: OpsSheetProps) {
  const t = useT();
  const add = mode === 'add';
  const [form, setForm] = useState<OpsFormValue>(initial);
  const labelRef = useRef<HTMLInputElement>(null);

  // Sheet memfokus tombol tutup lebih dulu; pindahkan fokus ke kolom pertama satu tick kemudian.
  useEffect(() => {
    const id = setTimeout(() => labelRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => { if (labelError) labelRef.current?.focus(); }, [labelError]);

  return (
    <Sheet
      open
      onClose={onClose}
      dismissible={!saving}
      leading={<IconTile icon={add ? Plus : PencilSimple} size="sm" />}
      title={add ? t('ops.addItemBtn') : t('ops.editItem')}
    >
      <div className={o.form}>
        <Input
          ref={labelRef}
          label={t('ops.labelField')}
          placeholder={t('ops.itemPlaceholder')}
          autoComplete="off"
          value={form.label}
          error={labelError}
          onChange={e => { setForm(p => ({ ...p, label: e.target.value })); onLabelInput(); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(form); } }}
        />
        <Input
          label={t('ops.nominalField')}
          type="number" inputMode="numeric" numeric
          placeholder="0" autoComplete="off"
          value={form.nominal}
          onChange={e => setForm(p => ({ ...p, nominal: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(form); } }}
        />
        <div className={o.ipickWrap}>
          <span className="wp-t-label" id="ops-icon-label">{t('ops.iconField')}</span>
          <div className={o.ipick} role="radiogroup" aria-labelledby="ops-icon-label">
            <button type="button" role="radio" aria-checked={!form.icon} className={o.ipickBtn}
              onClick={() => setForm(p => ({ ...p, icon: '' }))}>
              <MagicWand aria-hidden="true" size={22} />
              <span>{t('ops.icon.auto')}</span>
            </button>
            {OPS_ICON_KEYS.map(k => {
              const Ic = ICONS[k].icon;
              return (
                <button key={k} type="button" role="radio" aria-checked={form.icon === k} className={o.ipickBtn}
                  onClick={() => setForm(p => ({ ...p, icon: k }))}>
                  <Ic aria-hidden="true" size={22} />
                  <span>{t(`ops.icon.${k}`)}</span>
                </button>
              );
            })}
          </div>
          {!form.icon && form.label.trim() && <span className="wp-t-cap">{t('ops.icon.autoHint')} {t(`ops.icon.${opsIconKey(form.label)}`)}</span>}
        </div>
        <div className={o.actions}>
          <Button variant="secondary" disabled={saving} onClick={onClose}>{t('action.cancel')}</Button>
          <Button variant="primary" loading={saving} onClick={() => onSubmit(form)}>
            <Check aria-hidden="true" /> {t('action.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
