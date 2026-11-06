// v11.11.1 — jeda PIN setelah 5 kali salah (disimpan di perangkat, per akun)
import { describe, it, expect, beforeEach } from 'vitest';
import { PIN_LOCK_SECONDS, PIN_MAX_FAILS, clearPinThrottle, pinLockRemaining, readPinThrottle, recordPinFail } from '@/lib/pinThrottle';

beforeEach(() => localStorage.clear());

describe('pinThrottle', () => {
  it('4 kali salah belum dijeda; kali ke-5 memulai jeda 30 detik', () => {
    const t0 = 1_000_000;
    for (let i = 1; i < PIN_MAX_FAILS; i++) {
      const s = recordPinFail('u1', t0 + i);
      expect(pinLockRemaining(s, t0 + i)).toBe(0);
      expect(s.fails).toBe(i);
    }
    const s5 = recordPinFail('u1', t0 + 10);
    expect(pinLockRemaining(s5, t0 + 10)).toBe(PIN_LOCK_SECONDS);
  });

  it('jeda bertahan walau app ditutup/dibuka lagi (dibaca dari penyimpanan perangkat)', () => {
    const t0 = 5_000_000;
    for (let i = 0; i < PIN_MAX_FAILS; i++) recordPinFail('u1', t0);
    expect(pinLockRemaining(readPinThrottle('u1', t0 + 12_000), t0 + 12_000)).toBe(18);
  });

  it('setelah jeda lewat, percobaan mulai dari nol', () => {
    const t0 = 9_000_000;
    for (let i = 0; i < PIN_MAX_FAILS; i++) recordPinFail('u1', t0);
    const after = readPinThrottle('u1', t0 + PIN_LOCK_SECONDS * 1000 + 1);
    expect(after).toEqual({ fails: 0, until: 0 });
  });

  it('PIN benar menghapus hitungan; hitungan terpisah per akun', () => {
    recordPinFail('u1', 1); recordPinFail('u1', 2);
    recordPinFail('u2', 3);
    expect(readPinThrottle('u1', 4).fails).toBe(2);
    expect(readPinThrottle('u2', 4).fails).toBe(1);
    clearPinThrottle('u1');
    expect(readPinThrottle('u1', 5).fails).toBe(0);
    expect(readPinThrottle('u2', 5).fails).toBe(1);
  });

  it('penyimpanan rusak tidak membuat error', () => {
    localStorage.setItem('wp_pin_throttle_u1', '{rusak');
    expect(readPinThrottle('u1')).toEqual({ fails: 0, until: 0 });
  });
});
