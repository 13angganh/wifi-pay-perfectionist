// components/ui/__tests__/PinLock.test.tsx
// v11.5.18/19 — Test regresi untuk dua bug di alur PIN salah saat login:
//
// 1) (v11.5.18) "kadang muncul 6 digit kadang 4 digit yang harusnya 6
//    digit". Root cause: reset digits setelah PIN SALAH menggunakan array
//    4 elemen (setDigits(['','','',''])) — sisa dari sebelum PIN
//    di-upgrade 4→6 digit — padahal initial state, dot indicator, dan
//    hidden input semuanya sudah 6-elemen. Efeknya, setelah 1x PIN salah,
//    UI PIN menyusut dari 6 digit jadi 4 digit di tengah sesi yang sama.
//
// 2) (v11.5.19) Pesan error "PIN salah, coba lagi" tidak pernah hilang
//    otomatis — setTimeout(600ms) yang mereset digits tidak memanggil
//    setError(''), jadi pesan itu nyangkut di layar meski dot indikator
//    sudah kosong lagi dan siap menerima input baru (kondisi yg
//    membingungkan/terlihat macet). Ditemukan saat menulis test bug #1 di
//    atas, awalnya sengaja dibiarkan sebagai catatan terpisah di luar
//    cakupan laporan asli, lalu diperbaiki di v11.5.19 atas permintaan
//    eksplisit setelahnya.
//
// Test ini merender PinLock sungguhan (bukan mock digits/error secara
// langsung) dan mengetik PIN via numpad — persis alur asli user — supaya
// kedua bug ini tidak bisa lolos lagi lewat perubahan implementasi
// internal apa pun.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PinLock from '@/components/ui/PinLock';
import { useAppStore } from '@/store/useAppStore';

// PinLock → useAppStore → dataSlice → lib/db.ts → lib/firebase.ts, yang
// menginisialisasi Firebase Auth/Database sungguhan lewat env var
// NEXT_PUBLIC_FIREBASE_*. Tidak tersedia (dan memang seharusnya tidak perlu
// tersedia) di lingkungan unit test, jadi di-mock di titik paling awal
// (lib/firebase) — bukan di lib/db, supaya tetap menguji kode asli lib/db.ts
// sejauh itu tidak menyentuh koneksi Firebase sungguhan (yang PinLock.tsx
// memang tidak butuh sama sekali untuk fungsinya sendiri).
vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  default: {},
}));

// Hash sederhana yang identik dengan simpleHash() internal PinLock.tsx —
// perlu didekopling di sini karena fungsinya tidak diekspor dari komponen
// (sengaja privat), jadi test menghitung hash yang sama secara independen
// supaya bisa menyiapkan settings.pin yang valid untuk skenario "PIN benar".
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return String(Math.abs(h));
}

const CORRECT_PIN = '135790';
const WRONG_PIN    = '246801'; // tetap 6 digit, isinya saja salah

function countDigitSlots(container: HTMLElement): number {
  // Dot indicator dan hidden input (readOnly, maxLength=1) sama-sama
  // di-map dari state `digits` yang sama, jadi jumlahnya selalu identik.
  // Hidden input dipakai sebagai proxy hitung karena punya selector CSS
  // yang stabil (maxlength="1"), tidak bergantung pada struktur style
  // dot indicator yang bisa berubah sewaktu-waktu.
  return container.querySelectorAll('input[maxlength="1"]').length;
}

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }));
  }
}

describe('PinLock — regresi bug jumlah digit tidak konsisten', () => {
  beforeEach(() => {
    // Reset store ke kondisi PIN aktif, terkunci, belum ada PIN salah
    useAppStore.setState({
      pinUnlocked: false,
      settings: {
        ...useAppStore.getState().settings,
        pinEnabled: true,
        pin: simpleHash(CORRECT_PIN),
        biometricEnabled: false, // hindari jalur biometric sama sekali di test ini
      },
    });
    localStorage.clear();
  });

  it('selalu merender 6 slot digit saat pertama kali muncul', () => {
    const { container } = render(<PinLock />);
    expect(countDigitSlots(container)).toBe(6);
  });

  it('tetap 6 slot digit DAN pesan error hilang otomatis setelah PIN SALAH (bug #1 dan #2)', async () => {
    const user = userEvent.setup();
    const { container } = render(<PinLock />);

    expect(countDigitSlots(container)).toBe(6); // sebelum apa pun terjadi

    await typePin(user, WRONG_PIN);

    // Pesan error muncul sesaat setelah PIN ke-6 dimasukkan dan salah —
    // dot/input pada titik ini masih terisi penuh (belum direset).
    await waitFor(() => {
      expect(screen.getByText('PIN salah, coba lagi')).toBeInTheDocument();
    });

    // Tunggu digits direset otomatis oleh setTimeout(600ms) di implementasi
    // — ditandai SEMUA slot kembali kosong (value="").
    await waitFor(() => {
      const filled = container.querySelectorAll('input[maxlength="1"][value=""]');
      expect(filled.length).toBe(6);
    }, { timeout: 3000 });

    // Assersi bug #1: SEBELUM fix v11.5.18, baris ini gagal karena
    // countDigitSlots() bernilai 4, bukan 6 — akibat setDigits(['','','',''])
    // yang cuma 4 elemen di kode lama.
    expect(countDigitSlots(container)).toBe(6);

    // Assersi bug #2: SEBELUM fix v11.5.19, pesan error masih ada di titik
    // ini (dot sudah kosong tapi teks error nyangkut) karena setTimeout
    // reset tidak pernah memanggil setError('').
    expect(screen.queryByText('PIN salah, coba lagi')).not.toBeInTheDocument();
  });

  it('bisa login sukses dengan PIN benar SETELAH sebelumnya salah 1x (memverifikasi state tidak korup)', async () => {
    const user = userEvent.setup();
    const { container } = render(<PinLock />);

    // Percobaan 1: salah
    await typePin(user, WRONG_PIN);
    await waitFor(() => {
      expect(screen.getByText('PIN salah, coba lagi')).toBeInTheDocument();
    });

    // Tunggu digits direset (semua slot kosong lagi) sebelum mengetik ulang.
    // pressPad() mencari slot kosong via digits.findIndex(d=>d===''); kalau
    // tidak ada slot kosong (belum direset), findIndex return -1 dan
    // pressPad langsung berhenti tanpa mendaftarkan klik apa pun — jadi
    // percobaan ke-2 HARUS menunggu reset dulu, sama seperti alur asli user.
    await waitFor(() => {
      const filled = container.querySelectorAll('input[maxlength="1"][value=""]');
      expect(filled.length).toBe(6);
    }, { timeout: 3000 });

    // Percobaan 2: PIN benar. Sebelum fix v11.5.18, reset memakai array 4
    // elemen (bukan 6) membuat next.every(d => d !== '') / next.join('') di
    // handleDigit() tidak pernah lengkap dgn benar utk PIN 6-digit setelah
    // 1x salah, sehingga login sukses bisa gagal terpicu meski PIN yg
    // diketik pada percobaan ke-2 ini benar.
    await typePin(user, CORRECT_PIN);

    await waitFor(() => {
      expect(useAppStore.getState().pinUnlocked).toBe(true);
    });
  });

  it('menghapus komponen dari DOM setelah pinUnlocked true (tidak nyangkut render 4-digit di belakang layar)', async () => {
    const user = userEvent.setup();
    const { container } = render(<PinLock />);

    await typePin(user, CORRECT_PIN);

    await waitFor(() => {
      expect(container.querySelector('input[maxlength="1"]')).toBeNull();
    });
  });
});
