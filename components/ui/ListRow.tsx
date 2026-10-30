// components/ui/ListRow.tsx — baris daftar berkelompok (CORE usulan T1 `.rows/.row`)
// RowGroup + ListRow  : daftar menu (Pengaturan) dengan chevron.
// ChoiceRows          : pilihan tunggal (radio) — halaman Pengaturan > Tampilan (Tema, Mode
//                       Navigasi, Posisi Toast, Bahasa).
'use client';

import { CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { IconTile, type TileTone } from './IconTile';
import type { AnyIcon } from './icons';

export function RowGroup({ children, label }: { children: ReactNode; label?: string }) {
  return <div className="wp-rows" role={label ? 'group' : undefined} aria-label={label}>{children}</div>;
}

export interface ListRowProps {
  icon?: AnyIcon;
  tone?: TileTone;
  title: string;
  description?: string;
  /** elemen di kanan (mis. <Badge/>); chevron tetap tampil bila onClick ada */
  trailing?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ icon, tone = 'accent', title, description, trailing, onClick }: ListRowProps) {
  const body = (
    <>
      {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      <span className="wp-row__tx"><b>{title}</b>{description && <span>{description}</span>}</span>
      {trailing}
      {onClick && <span className="wp-row__chev" aria-hidden="true"><CaretRight size="1em" /></span>}
    </>
  );
  return onClick
    ? <button type="button" className="wp-row" onClick={onClick}>{body}</button>
    : <div className="wp-row" style={{ cursor: 'default' }}>{body}</div>;
}

export interface ChoiceOption<T extends string> {
  value: T;
  title: string;
  description?: string;
  icon?: AnyIcon;
  tone?: TileTone;
}

export function ChoiceRows<T extends string>({ options, value, onChange, label }: {
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="wp-rows" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="wp-row"
          onClick={() => onChange(o.value)}
        >
          {o.icon && <IconTile icon={o.icon} tone={o.tone ?? 'accent'} size="sm" />}
          <span className="wp-row__tx"><b>{o.title}</b>{o.description && <span>{o.description}</span>}</span>
          <i className="wp-row__rd" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default ListRow;
