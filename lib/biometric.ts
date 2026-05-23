// lib/biometric.ts — Biometric auth via WebAuthn platform authenticator
// Mendukung: sidik jari (Android), Face ID (iOS Safari), Windows Hello
// Tidak memerlukan server — verifikasi lokal hanya (tidak simpan credential)

const CRED_ID_KEY = 'wp_biometric_cred';
const USER_ID     = new Uint8Array(16).fill(1); // static, app-level user

/** Cek apakah perangkat mendukung platform authenticator (sidik jari / face) */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Daftarkan credential biometrik baru (panggil saat user aktifkan) */
export async function registerBiometric(): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp:   { name: 'WiFi Pay', id: window.location.hostname },
        user: { id: USER_ID, name: 'wifi-pay-user', displayName: 'WiFi Pay User' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7  },  // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',       // hanya built-in (sidik jari / face)
          userVerification: 'required',              // wajib verifikasi biometrik
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }) as PublicKeyCredential | null;

    if (!cred) return false;
    // Simpan credential ID untuk verifikasi berikutnya
    const credIdB64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
    localStorage.setItem(CRED_ID_KEY, credIdB64);
    return true;
  } catch (err) {
    console.warn('[Biometric] register error:', err);
    return false;
  }
}

/** Verifikasi biometrik (panggil saat unlock) */
export async function verifyBiometric(): Promise<boolean> {
  try {
    const credIdB64 = localStorage.getItem(CRED_ID_KEY);
    if (!credIdB64) return false;

    // Decode credential ID
    const credIdBytes = Uint8Array.from(atob(credIdB64), c => c.charCodeAt(0));
    const challenge   = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: credIdBytes }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    return !!assertion;
  } catch (err) {
    console.warn('[Biometric] verify error:', err);
    return false;
  }
}

/** Hapus credential yang terdaftar */
export function clearBiometricCred() {
  localStorage.removeItem(CRED_ID_KEY);
}

/** Cek apakah sudah ada credential terdaftar */
export function hasBiometricCred(): boolean {
  return !!localStorage.getItem(CRED_ID_KEY);
}
