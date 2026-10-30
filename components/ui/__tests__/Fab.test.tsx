// T13-02 — Fab / FabSpace: label (aria + title) wajib, onClick dipanggil, ruang kosong aria-hidden.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fab, FabSpace } from '../Fab';

describe('T13-02 Fab / FabSpace', () => {
  it('Fab: tombol ber-aria-label + title, memanggil onClick', async () => {
    const onClick = vi.fn();
    render(<Fab label="Tambah apa saja" onClick={onClick} />);
    const b = screen.getByRole('button', { name: 'Tambah apa saja' });
    expect(b).toHaveAttribute('title', 'Tambah apa saja');
    expect(b).toHaveClass('wp-fab');
    expect(b).toHaveAttribute('type', 'button');
    await userEvent.setup().click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('FabSpace: ruang kosong tersembunyi dari pembaca layar', () => {
    const { container } = render(<FabSpace />);
    const sp = container.querySelector('.wp-fab-space');
    expect(sp).not.toBeNull();
    expect(sp).toHaveAttribute('aria-hidden', 'true');
  });
});
