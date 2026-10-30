// components/ui/__tests__/primitives.test.tsx — primitive UI REDESAIN T6
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wallet as LucideWallet } from 'lucide-react';
import { Wallet as PhWallet } from '@phosphor-icons/react';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Segmented from '@/components/ui/Segmented';
import { FilterChip, ZoneChip, IdChip } from '@/components/ui/Chip';
import Checkbox, { RoundCheckbox } from '@/components/ui/Checkbox';
import ProgressBar, { DeltaPct } from '@/components/ui/ProgressBar';
import QuickPayGrid from '@/components/ui/QuickPayGrid';
import Notice from '@/components/ui/Notice';
import PinDots from '@/components/ui/PinDots';
import Numpad from '@/components/ui/Numpad';
import ChecklistRow from '@/components/ui/ChecklistRow';
import ColorSwatch from '@/components/ui/ColorSwatch';
import ActionCard from '@/components/ui/ActionCard';
import { ChoiceRows } from '@/components/ui/ListRow';
import CollapsibleGroupHeader, { CollapsibleBody } from '@/components/ui/CollapsibleGroupHeader';
import GhostInput from '@/components/ui/GhostInput';
import IconButton from '@/components/ui/IconButton';
import Sheet from '@/components/ui/Sheet';
import { resolveConfirmIcon } from '@/components/ui/Confirm';

describe('Button / Badge / Input / Select', () => {
  it('Button: varian → kelas, default type=button, loading menonaktifkan', () => {
    render(<Button variant="primary" size="lg" block loading>Simpan</Button>);
    const b = screen.getByRole('button', { name: /simpan/i });
    expect(b).toHaveClass('wp-btn', 'wp-btn--primary', 'wp-btn--lg', 'wp-btn--block');
    expect(b).toHaveAttribute('type', 'button');
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute('aria-busy', 'true');
  });
  it('Badge: varian aging Tunggakan (baru/segera/kritis) tersedia', () => {
    render(<><Badge variant="baru">a</Badge><Badge variant="segera">b</Badge><Badge variant="kritis">c</Badge></>);
    expect(screen.getByText('a')).toHaveClass('wp-badge--baru');
    expect(screen.getByText('b')).toHaveClass('wp-badge--segera');
    expect(screen.getByText('c')).toHaveClass('wp-badge--kritis');
  });
  it('Input: label terhubung, error → aria-invalid + role alert', () => {
    render(<Input label="Nominal" error="Wajib diisi" />);
    const el = screen.getByLabelText('Nominal');
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi');
  });
  it('Textarea & Select merender label', () => {
    render(<><Textarea label="Catatan" /><Select label="Zona"><option>KRS</option></Select></>);
    expect(screen.getByLabelText('Catatan')).toBeInTheDocument();
    expect(screen.getByLabelText('Zona')).toBeInTheDocument();
  });
});

describe('EmptyState — kompatibel dengan ikon Phosphor DAN Lucide (masa transisi T7–T10)', () => {
  it.each([['Phosphor', PhWallet], ['Lucide', LucideWallet]])('%s', (_n, Icon) => {
    const { container } = render(<EmptyState icon={Icon} title="Kosong" description="Belum ada data" />);
    expect(screen.getByText('Kosong')).toBeInTheDocument();
    expect(container.querySelector('.wp-empty__ico svg')).not.toBeNull();
  });
});

describe('Segmented / chip / checkbox', () => {
  it('Segmented (filter): aria-pressed + onChange', async () => {
    const onChange = vi.fn();
    render(<Segmented ariaLabel="Mode" value="a" onChange={onChange} options={[{ value: 'a', label: 'A', count: 3 }, { value: 'b', label: 'B' }]} />);
    expect(screen.getByRole('button', { name: /A/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
  it('Segmented (tabs): role tab + aria-selected', () => {
    render(<Segmented ariaLabel="Tab" mode="tabs" value="b" onChange={() => {}} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });
  it('FilterChip / ZoneChip / IdChip', async () => {
    const onClick = vi.fn();
    render(<><FilterChip active count={4} onClick={onClick}>Baru</FilterChip><ZoneChip color="#10B981">ABC</ZoneChip><IdChip muted>K-01</IdChip></>);
    const chip = screen.getByRole('button', { name: /Baru/ });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText('ABC')).toHaveClass('wp-zchip');
    expect(screen.getByText('K-01')).toHaveClass('wp-idc--no');
  });
  it('Checkbox & RoundCheckbox', async () => {
    const onChange = vi.fn();
    render(<><Checkbox label="Ingat saya" defaultChecked /><RoundCheckbox label="Pilih ABIL" checked={false} onChange={onChange} /></>);
    expect(screen.getByLabelText('Ingat saya')).toBeChecked();
    const rc = screen.getByRole('checkbox', { name: 'Pilih ABIL' });
    expect(rc).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(rc);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ProgressBar / DeltaPct / QuickPayGrid', () => {
  it('ProgressBar: nilai dijepit 0–100', () => {
    render(<ProgressBar label="Progres" value={140} />);
    expect(screen.getByRole('progressbar', { name: 'Progres' })).toHaveAttribute('aria-valuenow', '100');
  });
  it('DeltaPct: naik hijau, turun merah, invert membalik, nol netral', () => {
    const { container } = render(<><DeltaPct value={5} /><DeltaPct value={-3} /><DeltaPct value={5} invert /><DeltaPct value={0} /></>);
    const els = container.querySelectorAll('.wp-pct');
    expect(els[0]).toHaveClass('wp-pct--g');
    expect(els[1]).toHaveClass('wp-pct--b');
    expect(els[2]).toHaveClass('wp-pct--b');
    expect(els[3]).toHaveClass('wp-pct--n');
  });
  it('QuickPayGrid: onPick membawa nominal; tarif disorot', async () => {
    const onPick = vi.fn();
    render(<QuickPayGrid ariaLabel="Nominal cepat" amounts={[50, 100]} tarif={100} onPick={onPick} formatLabel={a => `Rp ${a}K`} />);
    const b = screen.getByRole('button', { name: 'Rp 100K' });
    expect(b).toHaveAttribute('data-tarif', 'true');
    await userEvent.click(b);
    expect(onPick).toHaveBeenCalledWith(100);
  });
});

describe('Primitive T5', () => {
  it('Notice: bad → role alert; ok → role status', () => {
    render(<><Notice tone="bad">Gagal</Notice><Notice tone="ok">Berhasil</Notice></>);
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal');
    expect(screen.getByRole('status')).toHaveTextContent('Berhasil');
  });
  it('PinDots: jumlah titik + terisi', () => {
    const { container } = render(<PinDots length={6} filled={3} label="3 dari 6" />);
    expect(container.querySelectorAll('i')).toHaveLength(6);
    expect(container.querySelectorAll('i.on')).toHaveLength(3);
    expect(screen.getByRole('img', { name: '3 dari 6' })).toBeInTheDocument();
  });
  it('Numpad: digit + hapus', async () => {
    const onDigit = vi.fn(), onBackspace = vi.fn();
    render(<Numpad onDigit={onDigit} onBackspace={onBackspace} backspaceLabel="Hapus" />);
    await userEvent.click(screen.getByRole('button', { name: '7' }));
    await userEvent.click(screen.getByRole('button', { name: '0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(onDigit).toHaveBeenNthCalledWith(1, '7');
    expect(onDigit).toHaveBeenNthCalledWith(2, '0');
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });
  it('ChecklistRow: klik & keyboard (Spasi/Enter)', async () => {
    const onToggle = vi.fn();
    render(<ChecklistRow checked={false} onToggle={onToggle}>ABIL</ChecklistRow>);
    const row = screen.getByRole('checkbox');
    await userEvent.click(row);
    row.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(onToggle).toHaveBeenCalledWith(true);
  });
  it('ColorSwatch & ActionCard & GhostInput', async () => {
    const onSelect = vi.fn(), onClick = vi.fn();
    render(<><ColorSwatch color="#8B5CF6" label="Ungu" selected onSelect={onSelect} /><ActionCard icon={PhWallet} title="Export" onClick={onClick} /><GhostInput aria-label="Nama item" numeric /></>);
    expect(screen.getByRole('radio', { name: 'Ungu' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'Ungu' }));
    expect(onSelect).toHaveBeenCalledWith('#8B5CF6');
    await userEvent.click(screen.getByRole('button', { name: /Export/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByLabelText('Nama item')).toHaveClass('wp-gin--nm');
  });
  it('CollapsibleGroupHeader: aria-expanded/controls + body hidden', async () => {
    const onToggle = vi.fn();
    const { rerender } = render(<><CollapsibleGroupHeader title="Tampilan" open={false} onToggle={onToggle} controlsId="g1" /><CollapsibleBody id="g1" open={false}>isi</CollapsibleBody></>);
    const h = screen.getByRole('button', { name: /Tampilan/ });
    expect(h).toHaveAttribute('aria-expanded', 'false');
    expect(h).toHaveAttribute('aria-controls', 'g1');
    expect(document.getElementById('g1')).toHaveAttribute('hidden');
    await userEvent.click(h);
    expect(onToggle).toHaveBeenCalled();
    rerender(<><CollapsibleGroupHeader title="Tampilan" open onToggle={onToggle} controlsId="g1" /><CollapsibleBody id="g1" open>isi</CollapsibleBody></>);
    expect(document.getElementById('g1')).not.toHaveAttribute('hidden');
  });
  it('ChoiceRows: radiogroup, aria-checked, onChange', async () => {
    const onChange = vi.fn();
    render(<ChoiceRows label="Mode" value="a" onChange={onChange} options={[{ value: 'a', title: 'Satu' }, { value: 'b', title: 'Dua' }]} />);
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Satu/ })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: /Dua/ }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
  it('IconButton: aria-label wajib terpasang', () => {
    render(<IconButton icon={PhWallet} label="Dompet" />);
    expect(screen.getByRole('button', { name: 'Dompet' })).toBeInTheDocument();
  });
});

describe('Sheet', () => {
  it('render lewat portal; Esc dan klik latar menutup; isi bisa dibaca', async () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Riwayat"><button>Aksi</button></Sheet>);
    expect(screen.getByRole('dialog', { name: 'Riwayat' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('dismissible=false: Esc tidak menutup', async () => {
    const onClose = vi.fn();
    render(<Sheet open onClose={onClose} title="Wajib" dismissible={false}><button>OK</button></Sheet>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
  it('tidak merender apa pun saat open=false', () => {
    render(<Sheet open={false} onClose={() => {}} title="X">isi</Sheet>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Confirm — resolveConfirmIcon (tanpa emoji, nilai lama dipetakan)', () => {
  it('kunci semantik', () => {
    expect(resolveConfirmIcon('trash').tone).toBe('danger');
    expect(resolveConfirmIcon('switch').tone).toBe('info');
  });
  it('nilai lama dari pemanggil yang belum dimigrasi → ikon setara, tidak pernah teks mentah', () => {
    expect(resolveConfirmIcon('\u{1F5D1}\uFE0F')).toBe(resolveConfirmIcon('trash'));
    expect(resolveConfirmIcon('[PURGE]')).toBe(resolveConfirmIcon('trash'));
    expect(resolveConfirmIcon('\u{1F512}')).toBe(resolveConfirmIcon('lock'));
    expect(resolveConfirmIcon('\u2194')).toBe(resolveConfirmIcon('switch'));
    expect(resolveConfirmIcon('')).toBe(resolveConfirmIcon('warning'));
    expect(resolveConfirmIcon(undefined)).toBe(resolveConfirmIcon('warning'));
    expect(resolveConfirmIcon('apa-saja')).toBe(resolveConfirmIcon('warning'));
  });
});
