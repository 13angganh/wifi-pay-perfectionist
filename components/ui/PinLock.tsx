'use client';

// ══════════════════════════════════════════
// components/ui/PinLock.tsx — layar kunci PIN (REDESAIN T10, D13, prototype T5 `.pinl`)
// Logika zip UTUH: 6 digit, hash sederhana (sama dengan SettingsPinSection.simpleHash), PIN salah → goyang + pesan +
// reset 600ms (digits kembali 6 slot, pesan dibersihkan), biometrik opsional (muncul bila diaktifkan + kredensial ada +
// perangkat mendukung). Enam <input maxLength=1 readOnly> tersembunyi dipertahankan (dipakai test dan fokus keyboard fisik);
// masukan utama lewat Numpad primitive. Tampilan: PinScreen + AppLogo + PinDots + Numpad.
// ══════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { clearPinThrottle, pinLockRemaining, readPinThrottle, recordPinFail } from '@/lib/pinThrottle';
import { fillText } from '@/lib/i18n';
import { Fingerprint } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { verifyBiometric, hasBiometricCred, isBiometricAvailable } from '@/lib/biometric';
import { APP_NAME } from '@/lib/constants';
import { AppLogo } from '@/components/ui/AppLogo';
import { Numpad } from '@/components/ui/Numpad';
import { PinDots } from '@/components/ui/PinDots';
import { PinScreen } from '@/components/ui/PinScreen';

const EMPTY = () => ['', '', '', '', '', ''];

/** Harus identik dengan simpleHash di SettingsPinSection (PIN tersimpan harus tetap valid). */
export function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return String(Math.abs(h));
}

export default function PinLock() {
  const { settings, setPinUnlocked, pinUnlocked, uid } = useAppStore();
  const t = useT();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [bioAvail, setBioAvail] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // v11.11.1: sisa detik jeda setelah 5 kali PIN salah (disimpan di perangkat, per akun)
  const [lockLeft, setLockLeft] = useState(() => pinLockRemaining(readPinThrottle(uid)));

  useEffect(() => {
    refs.current[0]?.focus();
    // Biometrik tersedia dan kredensial sudah terdaftar — hanya perlu dicek sekali saat dipasang
    if (settings.biometricEnabled && hasBiometricCred()) isBiometricAvailable().then(ok => setBioAvail(ok));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hitung mundur jeda; setelah habis, pesan hilang dan percobaan mulai dari nol.
  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => {
      const left = pinLockRemaining(readPinThrottle(uid));
      setLockLeft(left);
      if (left <= 0) { setError(''); setDigits(EMPTY()); }
    }, 1000);
    return () => clearTimeout(id);
  }, [lockLeft, uid]);

  if (!settings.pinEnabled || pinUnlocked) return null;

  function handleDigit(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    if (lockLeft > 0) return; // sedang dijeda
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError('');
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d !== '') && val) {
      if (simpleHash(next.join('')) === settings.pin) {
        clearPinThrottle(uid);
        setPinUnlocked(true);
      } else {
        const st = recordPinFail(uid);
        const left = pinLockRemaining(st);
        if (left > 0) setLockLeft(left);
        setShake(true);
        setError(left > 0 ? fillText(t('pin.tooMany'), { n: left }) : t('pin.wrongRetry'));
        // v11.5.18/19 (dipertahankan): reset ke 6 slot + bersihkan pesan di titik yang sama (jangan 4 slot, jangan pesan menyangkut).
        setTimeout(() => {
          setShake(false);
          setDigits(EMPTY());
          if (left <= 0) setError('');
          refs.current[0]?.focus();
        }, 600);
      }
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function pressDigit(k: string) {
    const idx = digits.findIndex(d => d === '');
    if (idx === -1) return;
    handleDigit(idx, k);
  }

  function pressBackspace() {
    const last = digits.map((d, i) => ({ d, i })).filter(x => x.d).pop();
    if (!last) return;
    const next = [...digits]; next[last.i] = ''; setDigits(next);
    refs.current[last.i]?.focus();
  }

  async function handleBiometric() {
    setBioLoading(true);
    try {
      const ok = await verifyBiometric();
      if (ok) { clearPinThrottle(uid); setPinUnlocked(true); }
      else { setError(t('pin.bioFailed')); setTimeout(() => setError(''), 2000); }
    } catch {
      setError(t('biometric.cancelled'));
      setTimeout(() => setError(''), 2000);
    } finally {
      setBioLoading(false);
    }
  }

  const filled = digits.filter(Boolean).length;

  return (
    <PinScreen label={t('pin.enter')}>
      <AppLogo size="l" priority />
      <b className="wp-t-head">{APP_NAME}</b>
      <span className="wp-t-label">{t('pin.enter')}</span>

      <PinDots filled={filled} shake={shake} label={`${filled}/6`} />
      <div className="wp-t-cap" role="alert" style={{ minHeight: '1.5em', color: 'var(--c-belum)', textAlign: 'center' }}>
        {lockLeft > 0 ? fillText(t('pin.tooMany'), { n: lockLeft }) : error}
      </div>

      {/* Input tersembunyi: readOnly + inputMode=none mencegah keyboard mobile; semua masukan via Numpad */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        {digits.map((d, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }} type="tel" inputMode="none" readOnly maxLength={1} value={d}
            aria-hidden="true" tabIndex={-1}
            onChange={() => {/* hanya Numpad: ditangani pressDigit */}}
            onKeyDown={e => handleKeyDown(i, e)} />
        ))}
      </div>

      <Numpad
        onDigit={pressDigit}
        onBackspace={pressBackspace}
        backspaceLabel={t('pin.backspace')}
        extra={bioAvail && settings.biometricEnabled ? (
          <button type="button" disabled={bioLoading} aria-label={t('pin.bioAria')} onClick={handleBiometric}>
            <Fingerprint size="1em" aria-hidden="true" />
          </button>
        ) : undefined}
      />
    </PinScreen>
  );
}
