// hooks/__tests__/useAuth.test.ts
// Task 4.05 — unit tests untuk friendlyAuthError()
// Semua kode error Firebase Auth yang dikenali + fallback

import { describe, it, expect } from 'vitest';
import { friendlyAuthError } from '@/lib/helpers';

describe('friendlyAuthError', () => {
  // Kode-kode yang harus dikenali dengan pesan bahasa Indonesia
  const knownCodes: [string, string][] = [
    ['auth/invalid-email',             'Email tidak valid'],
    ['auth/user-not-found',            'Akun tidak ditemukan'],
    ['auth/wrong-password',            'Password salah'],
    ['auth/email-already-in-use',      'Email sudah terdaftar'],
    ['auth/weak-password',             'Password terlalu lemah'],
    ['auth/network-request-failed',    'Gagal terhubung ke jaringan'],
    ['auth/too-many-requests',         'Terlalu banyak percobaan, coba lagi nanti'],
    ['auth/user-disabled',             'Akun telah dinonaktifkan'],
    ['auth/internal-error',            'Terjadi kesalahan server, coba lagi'],
    ['auth/operation-not-allowed',     'Login email/password belum diaktifkan di Firebase'],
    ['auth/unauthorized-domain',       'Domain belum diizinkan di Firebase Console'],
  ];

  it.each(knownCodes)(
    'kode "%s" → pesan Indonesia yang tepat',
    (code, expected) => {
      expect(friendlyAuthError(code)).toBe(expected);
    }
  );

  it('auth/invalid-credential → "Email atau password salah"', () => {
    expect(friendlyAuthError('auth/invalid-credential')).toBe('Email atau password salah');
  });

  it('auth/invalid-login-credentials → "Email atau password salah" (varian kedua)', () => {
    expect(friendlyAuthError('auth/invalid-login-credentials')).toBe('Email atau password salah');
  });

  it('kode tidak dikenali → fallback berisi kode error', () => {
    const result = friendlyAuthError('auth/unknown-new-error-code');
    expect(result).toContain('auth/unknown-new-error-code');
  });

  it('string kosong → fallback string (tidak throw)', () => {
    const result = friendlyAuthError('');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('return value selalu string (tidak pernah undefined/null)', () => {
    ['auth/cancelled', 'invalid', 'random-code'].forEach(code => {
      expect(typeof friendlyAuthError(code)).toBe('string');
    });
  });
});
