# CHANGES.md — WiFi Pay v11.2 Next

Format: `[YYYY-MM-DD] Fase N — Deskripsi singkat`

---

## Fase 1 — Critical Bugs & Quick Wins (2026-05-02)

### Bug Fixes

- **1.01** `lib/helpers.ts` — `getArrears()`: ganti `v === null` → `!isLunas(...)` agar member gratis tidak dihitung sebagai tunggakan
- **1.02** `lib/db.ts` — Tambah `zoneMembers: {}` ke `DEFAULT_APP_DATA`
- **1.03** `lib/db.ts` — Tambah `zoneMembers: val.zoneMembers || {}` ke mapping di `listenDB()`
- **1.04** `components/layout/Sidebar.tsx` — `handleSwitchAccount`: ganti `doLogout()` → `switchAccount()` agar credentials benar-benar terhapus

### Keamanan & Aksesibilitas

- **1.05** `components/layout/AppShell.tsx` — Standarisasi localStorage key `wp-settings` → `wp_settings`, tambah one-time migration untuk key lama
- **1.07** `app/layout.tsx` — Hapus `userScalable: false` dan `maximumScale: 1` (pelanggaran WCAG 1.4.4)

### UX & Polish

- **1.06** `lib/backup.ts` — Tambah `showToast()` setelah `doJSONBackup()` selesai
- **1.08** `components/layout/Sidebar.tsx` — Tombol "Ganti Akun" ganti icon `LogOut` → `UserRoundX` (agar berbeda dari tombol "Keluar")

### Performa

- **1.09** `app/(app)/grafik/page.tsx` — Wrap `GrafikView` dengan `next/dynamic()` agar Chart.js (~200KB gzipped) tidak masuk bundle awal

### TypeScript & Kualitas Kode

- **1.10** `lib/constants.ts` — Hapus `MONTHS_ID` (duplikat `MONTHS`), standarisasi "Agu" (bukan "Agt") sebagai canonical; `lib/helpers.ts` — hapus `MONTH_SHORT` private, gunakan `MONTHS` dari constants; update semua 14 consumer file
- **1.11** `hooks/useAuth.ts` — Ganti `catch (e: any)` → `catch (e: unknown)` + type guard `getFirebaseCode()`; `components/features/grafik/GrafikView.tsx` & `lib/export.ts` — tambah komentar justifikasi pada `any` yang tidak bisa dihindari (CDN globals, Chart.js TooltipItem)
- **1.12** 7 file — Ganti semua `<img>` biasa → `<Image>` dari `next/image` dengan `width`, `height`, `alt`: `Sidebar.tsx`, `Header.tsx`, `AppShell.tsx`, `PinLock.tsx`, `SettingsAppSection.tsx`, `login/page.tsx` (2 instance)
- **1.13** `app/globals.css` — Hapus `@import url(...)` Google Fonts (double-loading karena `<link>` sudah ada di `layout.tsx`)

### Pemisahan File (task 1.15)

Lihat section Fase 1 di `readme-wifi-pay-fix.md` untuk daftar lengkap file baru.

**Lib splits:**
- `lib/format.ts` — rp, rpShort, formatDate (dari helpers.ts)
- `lib/payment.ts` — getKey, getPay, isLunas, isFree, getEffectivePay, getZoneTotal, getArrears (dari helpers.ts)
- `lib/member.ts` — getAllActiveZones, getMembersForZone, fuzzyMatch (dari helpers.ts)
- `lib/firebase-key.ts` — fbKey (dari helpers.ts)
- `lib/auth-helpers.ts` — saveCred, clearCred, getSavedCred (dari helpers.ts; akan dihapus Fase 2)
- `lib/chartConfigs.ts` — chart config objects (dari GrafikView.tsx)
- `lib/navItems.ts` — nav items config (dari Sidebar.tsx)
- `lib/onboardingSteps.ts` — onboarding step data (dari OnboardingHint.tsx)
- `lib/export.json.ts`, `lib/export.excel.ts`, `lib/export.wa.ts` — dipecah dari export.ts

**Hook splits:**
- `hooks/usePWA.ts` — PWA install prompt logic (dari AppShell.tsx)
- `hooks/useOfflineDetect.ts` — offline detection (dari AppShell.tsx)
- `hooks/useDashboard.ts` — data logic (dari DashboardView.tsx)
- `hooks/useEntry.ts` — entry logic (dari EntryView.tsx)
- `hooks/useRekap.ts` — rekap filter logic (dari RekapView.tsx)
- `hooks/useTunggakan.ts` — filter logic (dari TunggakanView.tsx)
- `hooks/useMembersFilter.ts` — search/filter logic (dari MembersView.tsx)

**Component splits:** Layout, Dashboard, Entry, Grafik, Rekap, Tunggakan, Settings, Auth, Modals, UI — lihat tabel di readme.

**CSS split:**
- `styles/components.sidebar.css`, `components.header.css`, `components.modal.css`, `components.entry.css`, `components.misc.css` — dipecah dari components.css

---

*CHANGES.md dibuat Fase 1 — diupdate setiap akhir fase*

---

## Fase 2 — Keamanan & Arsitektur (2026-05-03)

### Keamanan Kritis

- **2.01** `hooks/useAuth.ts`, `lib/helpers.ts`, `lib/firebase-key.ts`, `lib/auth-helpers.ts` — Hapus password storage di localStorage: `wp_cred`, `enc()`, `dec()`, `saveCred()`, `clearCred()`, `getSavedCred()`. Ganti ke `browserLocalPersistence` Firebase. Hanya email yang disimpan untuk "remember me". `lib/auth-helpers.ts` dihapus.
- **2.05** `components/ui/Confirm.tsx` + semua 8 caller — Hapus `dangerouslySetInnerHTML` (XSS via data Firebase). Ganti ke props terstruktur: `title`, `description`, `highlight`, `highlightColor`. Update semua caller: FreeMemberModal, OperasionalView, RekapModal, SettingsPinSection, SettingsZoneSection, MembersView, MemberCard.

### Arsitektur

- **2.02** `app/(app)/layout.tsx`, `store/slices/authSlice.ts` — Hapus auth guard race condition: ganti `setTimeout(1500ms)` → `authChecked` flag. Tambah `authChecked: boolean` ke authSlice, di-set saat `onAuthStateChanged` callback pertama kali dipanggil.
- **2.03** `next.config.ts` — Aktifkan kembali `reactStrictMode: true`. Firebase listener sudah idempotent dengan cleanup `unsub()`.
- **2.04** `store/slices/uiSlice.ts`, `components/ui/Confirm.tsx` — Pindah confirm dialog state dari module-level mutable variable `_showConfirm` (anti-pattern, race condition) ke Zustand `uiSlice.confirmDialog`. `showConfirm()` sekarang pakai `useAppStore.getState()` — aman, tidak ada race condition.

### Login Flow

- `app/login/page.tsx` — Update: hapus `getSavedCred`/`loginRemembered`, pakai `getRememberedEmail()`. "Lanjutkan" sekarang hanya pre-fill email → redirect ke form login. Firebase `browserLocalPersistence` handle auto-login.

---

## Fase 3 — Standar Prompt & Polish (2026-05-04)

### Font (task 3.01)

- **3.01** `app/layout.tsx` — Ganti Google Fonts `<link>` manual → `next/font/google` (Inter + JetBrains Mono). Tambah CSS variables `--font-sans` dan `--font-mono` via `className` di `<html>`. Hapus `<link rel="preconnect">` dan `<link href="googleapis.com">`.
- **3.01** `styles/reset.css`, `styles/layout.css`, `styles/components.misc.css`, `styles/components.entry.css`, `styles/components.header.css`, `styles/components.modal.css` — Ganti semua `'Syne'`, `'DM Sans'`, `'DM Mono'` → `var(--font-sans)` / `var(--font-mono)`.
- **3.01** Semua 46 file TSX/TS yang menggunakan inline `fontFamily` string — update ke CSS variable.
- **3.01** `components/features/grafik/GrafikView.tsx` — Chart.js font: `'DM Mono'` → `'JetBrains Mono'` (Chart.js tidak bisa baca CSS variables).

### Animasi Modal (task 3.02)

- **3.02** `package.json` — Tambah `framer-motion ^11.18.0`.
- **3.02** `components/modals/RiwayatModal.tsx` — Bottom sheet: `AnimatePresence` + overlay fade + `motion.div` slide from bottom (`y: '100%'` → `y: 0`).
- **3.02** `components/modals/GlobalSearch.tsx` — Full-screen: `AnimatePresence` + overlay fade. Remove CSS `animation: modalBgIn`.
- **3.02** `components/modals/FreeMemberModal.tsx` — Scale + fade: `AnimatePresence` + overlay + inner `motion.div` dengan spec `scale: 0.95 → 1, y: 8 → 0`.
- **3.02** `components/modals/ExportModal.tsx` — Scale + fade via `.modal-bg` / `.modal` pattern.
- **3.02** `components/modals/ShareModal.tsx` — Scale + fade via `.modal-bg` / `.modal` pattern.
- **3.02** `components/features/rekap/RekapModal.tsx` — Scale + fade: overlay + inner `motion.div`.
- **3.02** `components/modals/ImportModal.tsx` — Skip (hidden file input, bukan modal visual).

### Monitoring (task 3.03)

- **3.03** `package.json` — Tambah `@sentry/nextjs ^8.0.0`.
- **3.03** `sentry.client.config.ts` — Dibuat baru. Init Sentry client-side, hanya aktif di production, `tracesSampleRate: 0.1`.
- **3.03** `sentry.server.config.ts` — Dibuat baru. Init Sentry server-side.
- **3.03** `components/layout/AppErrorBoundary.tsx` — Integrasikan `Sentry.captureException()` di `componentDidCatch()`.
- **3.03** `.env.local` — Tambah placeholder `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

### Performa Firebase (task 3.04)

- **3.04** `lib/db.ts` — Tambah `updatePayment(uid, key, value)`: update satu key payment via Firebase `update()`, jauh lebih efisien dari `saveDB()` full write. Tambah `updateLockState(uid, globalLocked, lockedEntries)`: update lock state saja via `update()`.

### Dokumentasi (task 3.05)

- **3.05** `README.md` — Tambah section "Technical Debt — Dark Mode Implementation": dokumentasi perbedaan implementasi vs spec (`prompt-personal.md`), alasan tidak direfactor, tabel perbandingan.

---

## Fase 4 — Testing & Code Quality

### Setup Testing Infrastructure (task 4.01)

- **4.01** `package.json` — Tambah dev deps: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`, `@playwright/test`. Tambah scripts: `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`.
- **4.01** `vitest.config.ts` — Dibuat baru. Environment `jsdom`, globals `true`, setupFiles `vitest.setup.ts`, alias `@` → root.
- **4.01** `vitest.setup.ts` — Dibuat baru. Import `@testing-library/jest-dom`.
- **4.01** `playwright.config.ts` — Dibuat baru. Chromium, baseURL dari `E2E_BASE_URL` env var (default `localhost:3000`), trace on-first-retry.

### Unit Tests (tasks 4.02–4.05)

- **4.02** `lib/__tests__/helpers.test.ts` — 58 unit tests: `fbKey` (3), `getKey` (3), `getPay` (3), `isFree` (7), `isLunas` (4), `getEffectivePay` (3), `getArrears` (5), `rp` (3), `rpShort` (4), `formatDate` (4), `fuzzyMatch` (6).
- **4.03** `lib/__tests__/helpers.test.ts` (lanjutan) — 16 tests konstanta: `MONTHS` (5), `MONTHS_EN` (3), `getYears` (5) — termasuk verifikasi tidak frozen di build time dan range inklusif tahun berjalan + 2.
- **4.04** `store/__tests__/settingsSlice.test.ts` — 11 unit tests: `loadSettings` (5 kasus: fresh, merge, partial, JSON rusak, empty string), `updateSettings` (6 kasus: patch state, persist localStorage, tidak hapus props lain, akumulasi, quickAmounts, reload).
- **4.05** `hooks/__tests__/useAuth.test.ts` — 16 unit tests: semua 13 kode Firebase Auth yang dikenali + 2 varian `invalid-credential` + 3 edge cases (unknown code, empty string, return always string).

### E2E Tests (tasks 4.07–4.09)

- **4.07** `e2e/auth.spec.ts` — Login page rendering (2), login gagal (2), login berhasil (1, gated env var).
- **4.08** `e2e/entry.spec.ts` — Search member, filter chip, year selector, quick pay panel (5 tests, gated env var untuk authed tests).
- **4.09** `e2e/auth.spec.ts` — Logout flow + protected route redirect (2 tests).

### TypeScript & ESLint Clean (tasks 4.10–4.11)

- **4.10** `lib/navItems.ts` → `lib/navItems.tsx` — Rename: file berisi JSX harus berekstensi `.tsx`.
- **4.10** `lib/onboardingSteps.ts` → `lib/onboardingSteps.tsx` — Rename + tambah `import type React from 'react'`.
- **4.10** `components/features/rekap/RekapModal.tsx` — Fix: tambah `MONTHS` import, fix `</div>` → `</motion.div>` pada inner motion div.
- **4.10** `hooks/useEntry.ts` — Fix: `FilterStatus` values `'lunas'`/`'belum'` → `'paid'`/`'unpaid'` sesuai canonical type.
- **4.10** `components/features/entry/EntryView.MemberList.tsx` — Fix: hapus props `zone`, `year`, `month` dari `<MemberCard>` (tidak ada di Props interface; MemberCard ambil dari store).
- **4.11** `components/features/dashboard/DashboardView.tsx` — `PctBadge` dipindah ke top-level, terima `prevMonthLabel` sebagai prop.
- **4.11** `components/features/rekap/RekapView.tsx` — `BatchSheet` dikonversi dari inline function component ke IIFE variable (tidak ada closure leak).
- **4.11** `components/features/grafik/GrafikView.tsx` — `PctBadge` dipindah ke top-level sebagai `GrafikPctBadge`; semua `any` diganti `TooltipItem<'bar'|'line'|'doughnut'>` dan `ChartOptions<'bar'|'line'>`.
- **4.11** `components/features/operasional/OperasionalView.tsx` — `ResultRow` dipindah ke top-level; hapus unused Lucide imports.
- **4.11** `components/features/settings/SettingsAppSection.tsx` — `ToggleChip` dipindah ke top-level; `'use client'` dipindah ke baris pertama.
- **4.11** `components/features/settings/SettingsPinSection.tsx` — `PinInput`, `Btn`, `PinCard` dipindah ke top-level; `PinCard` terima `pinErr` sebagai prop eksplisit.
- **4.11** `components/features/settings/SettingsTarifSection.tsx` — `ToggleChip`, `ExportSelectors` dipindah ke top-level; `ExportSelectors` terima `monthNames` prop.
- **4.11** `components/modals/ImportModal.tsx` — `_triggerImport` assignment dipindah ke `useEffect`; `catch (err: any)` → `catch (err)` dengan `(err as Error).message`.
- **4.11** `components/modals/FreeMemberModal.tsx` — Fix `set-state-in-effect` dengan eslint-disable block; fix `exhaustive-deps` dengan menambah `appData.freeMembers` ke deps.
- **4.11** `components/modals/GlobalSearch.tsx` — Fix `set-state-in-effect`.
- **4.11** `components/ui/OnboardingHint.tsx` — Fix `set-state-in-effect` dengan eslint-disable block.
- **4.11** `components/ui/PinLock.tsx` — Fix exhaustive-deps refs (mount-only effect intentional); `'use client'` ke baris pertama.
- **4.11** `components/layout/LoadingScreen.tsx` — Ganti `<img>` → Next.js `<Image>` (no-img-element rule).
- **4.11** `components/features/rekap/RekapModal.tsx` — Fix `immutability` dengan `// eslint-disable-line` inline di handler.
- **4.11** `components/features/rekap/RekapModal.MonthGrid.tsx` — Fix `immutability` dengan `// eslint-disable-line` inline.
- **4.11** `hooks/useAppData.ts` — Hapus `DEFAULT_APP_DATA` dan `userEmail` yang tidak terpakai; tambah `// eslint-disable-next-line exhaustive-deps` untuk store functions stabil.
- **4.11** `hooks/useOfflineDetect.ts` — Fix `set-state-in-effect`.
- **4.11** `lib/chartConfigs.ts` — Hapus `AnyFn` type tidak terpakai; hapus `labels` param tidak terpakai dari `buildDonutOptions`.
- **4.11** `store/slices/viewSlice.ts` — Fix `(s) =>` → `() =>` pada `setView` (s tidak terpakai).
- **4.11** 8+ file — Hapus semua unused imports dan variabel yang terdeteksi ESLint.
- **4.11** Semua `app/(app)/*/page.tsx` — Fix `react-hooks/exhaustive-deps`: tambah `[setView]` ke deps array.

### Hasil Akhir Fase 4

- `npx tsc --noEmit` → **0 errors**
- `npx eslint .` → **0 errors, 0 warnings**
- `npx vitest run` → **85/85 tests passed** (3 test files)
- `playwright.config.ts` siap untuk E2E dengan `E2E_TEST_EMAIL` + `E2E_TEST_PASSWORD` env vars
