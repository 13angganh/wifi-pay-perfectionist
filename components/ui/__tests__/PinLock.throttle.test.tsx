// v11.11.1 — PinLock: 5 kali PIN salah → masukan PIN dijeda 30 detik (tersimpan di perangkat, per akun)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PinLock from '@/components/ui/PinLock';
import { useAppStore } from '@/store/useAppStore';
import { PIN_LOCK_SECONDS, PIN_MAX_FAILS, readPinThrottle, recordPinFail } from '@/lib/pinThrottle';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return String(Math.abs(h));
}
const CORRECT = '135790';
const WRONG   = '246801';

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const d of pin) await user.click(screen.getByRole('button', { name: d }));
}

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    uid: 'u1', pinUnlocked: false,
    settings: { ...useAppStore.getState().settings, pinEnabled: true, pin: simpleHash(CORRECT), biometricEnabled: false },
  } as never);
});

describe('PinLock — jeda setelah PIN salah berulang', () => {
  it('PIN salah ke-5 menampilkan jeda dan menyimpannya di perangkat', async () => {
    for (let i = 0; i < PIN_MAX_FAILS - 1; i++) recordPinFail('u1');   // 4 kali salah sebelumnya
    const user = userEvent.setup();
    render(<PinLock />);
    await typePin(user, WRONG);
    await waitFor(() => expect(screen.getByText(/Terlalu banyak percobaan\. Coba lagi dalam \d+ detik\./)).toBeInTheDocument());
    expect(readPinThrottle('u1').until).toBeGreaterThan(Date.now());
    expect(readPinThrottle('u1').until - Date.now()).toBeLessThanOrEqual(PIN_LOCK_SECONDS * 1000);
  });

  it('selama dijeda, PIN yang BENAR pun tidak diterima', async () => {
    for (let i = 0; i < PIN_MAX_FAILS; i++) recordPinFail('u1');       // sudah dalam jeda
    const user = userEvent.setup();
    render(<PinLock />);
    expect(screen.getByText(/Terlalu banyak percobaan/)).toBeInTheDocument();   // langsung tampil saat dibuka (jeda bertahan)
    await typePin(user, CORRECT);
    expect(useAppStore.getState().pinUnlocked).toBe(false);
  });

  it('tanpa jeda, PIN benar membuka kunci dan menghapus hitungan salah', async () => {
    recordPinFail('u1'); recordPinFail('u1');
    const user = userEvent.setup();
    render(<PinLock />);
    await typePin(user, CORRECT);
    await waitFor(() => expect(useAppStore.getState().pinUnlocked).toBe(true));
    expect(readPinThrottle('u1').fails).toBe(0);
  });

  it('jeda milik akun lain tidak berlaku untuk akun ini', async () => {
    for (let i = 0; i < PIN_MAX_FAILS; i++) recordPinFail('akun-lain');
    render(<PinLock />);
    expect(screen.queryByText(/Terlalu banyak percobaan/)).not.toBeInTheDocument();
  });
});
