# CHANGES — WiFi Pay

## v7.1 — Blank Hitam Rekap (Root Cause Fix) + Logout Stuck

### 🔴 Blank Hitam saat Scroll Rekap — Semua Mode (Dark / Light / Gold)

Root cause yang sebenarnya: **empat penyebab bersamaan**:

1. **`-webkit-overflow-scrolling: touch`** di `#content` (`layout.css`)  
   → API deprecated iOS yang force-promote setiap element ke GPU layer sendiri  
   → dikombinasikan dengan `position:sticky` → blank hitam saat scroll  
   → **Dihapus**

2. **`position: 'relative'` inline di setiap td bulan** (`RekapView.tsx`)  
   → menciptakan *stacking context* baru per sel (12 kolom × N member)  
   → ratusan GPU layer terpisah = browser kehabihan VRAM → blank hitam  
   → **Dihapus**, CheckCheck icon diubah ke inline (tidak perlu parent relative)

3. **`will-change: transform`** di `td.stk` / `th.stk`  
   → GPU layer dengan background transparan sampai repaint = hitam sementara  
   → **Dihapus** (fix sebelumnya v7, dikonfirmasi bersih)

4. **Background tidak solid** di beberapa sel (td row total, tfoot td bulan)  
   → sel transparan = warna canvas browser = hitam  
   → Semua sel kini punya `background` eksplisit

**Pengganti yang benar:**
- `td.stk` kini pakai `isolation: isolate` + `contain: style layout`  
- `td` biasa pakai `contain: style`  
- `th.stk` pakai `isolation: isolate`  
- Ini mengontrol stacking context tanpa menciptakan GPU layer baru

### 🔴 Logout / Ganti Akun — Loading Stuck (Race Condition Fix Tuntas)

Root cause: `setLoggingOut(true)` → `router.replace('/login')` dipanggil **sebelum** Firebase `onAuthStateChanged` fire, sehingga AppLayout sudah unmount sebelum `setLoggingOut(false)` bisa dipanggil → stuck selamanya.

**Solusi**: Hapus `isLoggingOut` sepenuhnya dari logika render:
- `AppLayout` kini hanya cek `authChecked && !uid` (murni dari Firebase)  
- `Sidebar` cukup panggil `signOut()` dan tutup sidebar — **tanpa `router.replace`**  
- Setelah `signOut()`, Firebase trigger `onAuthStateChanged` → `clearUser()` → `uid = null` → `AppLayout` useEffect otomatis `router.replace('/login')`  
- Alur ini deterministik dan tidak ada race condition

### 🟠 Loading Screen — Tagline Diganti ke Versi
- "Manajemen Iuran WiFi" → "v11.2 Next"

---

## v7 — UX & Performa Fix (10 Temuan)

### 🔴 FIX 1: Hapus Fitur Swipe Antar Zona
- Fitur swipe horizontal antar zona (KRS ↔ SLK) **dihapus permanen** dari `AppShell.tsx`
- Alasan: tidak disukai, sering konflik dengan scroll horizontal pada tabel Rekap
- Import `getAllActiveZones`, `haptic` dari AppShell juga dibersihkan (tidak dipakai lagi)

### 🔴 FIX 2: Animasi Lag pada Riwayat & Member Card
- **EntryView:** Hapus stagger delay (`delay: i * 0.028`) pada render daftar member card — penyebab utama lag saat list panjang atau setelah buka/tutup modal
- **Import** `motion`/`AnimatePresence` dari `framer-motion` di EntryView dihapus (tidak terpakai)
- **RiwayatModal:** Percepat durasi animasi dari `0.28s` → `0.2s` dan backdrop dari `0.2s` → `0.15s`

### 🔴 FIX 3: Konten Rekap Tembus Judul Kolom
- Background `.rekap-header-wrap` diubah dari `var(--bg2)` ke `var(--bg)` (warna solid penuh)
- Header `th` dan `.rtable-header th` juga disamakan ke `var(--bg)`
- Shadow diperkuat: `box-shadow: 0 3px 10px rgba(0,0,0,0.4)`
- Margin kiri-kanan -1px ditambah agar header menutupi penuh tanpa celah

### 🔴 FIX 4: Loading Stuck Setelah Logout / Ganti Akun
- **Root cause:** `setLoggingOut(true)` dipanggil saat logout, tapi tidak pernah di-reset ke `false`
- **Fix:** `useAuth.ts` → di dalam `onAuthStateChanged` callback, setelah `setAuthChecked(true)`, tambah `useAppStore.getState().setLoggingOut(false)`
- Efek: loading screen otomatis hilang begitu Firebase auth state berubah

### 🟠 FIX 5: Loading Screen — Logo + Nama + Animasi
- `LoadingScreen.tsx` dirombak total: sekarang menampilkan **logo WiFi Pay** (icon-192.png) + **nama "WiFi Pay"** + **tagline** + progress bar + dots
- Logo muncul dengan animasi scale-in, teks fade-in bertahap, loading bar di bawah
- Menghapus splash logo terpisah yang tidak perlu

### 🟠 FIX 6: Default Bulan = Bulan Saat Ini (Realtime)
- **MemberCard:** `cardYear/cardMonth` kini default ke `new Date().getFullYear()/getMonth()` (bukan `selYear/selMonth` global yang bisa sudah berubah)
- **MemberCard:** Saat kartu pertama dibuka (`isExp` jadi true), langsung `setEntryCard(name, nowY, nowM)` agar bulan ter-inisialisasi ke bulan sekarang
- **viewSlice `setView`:** Setiap navigasi antar menu, `selYear` dan `selMonth` di-reset ke `new Date()` — mencegah bulan "nyangkut" dari sesi pembayaran sebelumnya

### 🟠 FIX 7: Konfirmasi Hapus — Ganti `(DEL)` / `'X'` ke Ikon Wajar
- Semua `showConfirm` dengan icon `'X'`, `'[DEL]'` diganti ke `'🗑️'`
- File yang difix: `MemberCard.tsx`, `RekapModal.tsx`, `MembersView.tsx`, `OperasionalView.tsx`
- Catatan: `'DEL'` di `PinLock.Numpad.tsx` (label tombol backspace) dan `[DEL]` di prefix log `LogView.tsx` **tidak diubah** (memang label fungsional)

### 🔴 FIX 8: Input Bayar Entry — Tidak Lagi Lambat
- **Root cause:** `quickPay` menunggu (`await`) Firebase selesai sebelum menutup kartu dan menampilkan toast
- **Fix: Optimistic UI** — `setAppData(newData)` dipanggil instan → kartu langsung tertutup → toast/undo langsung muncul → Firebase write jalan di **background** (fire-and-forget)
- Efek: klik QuickPay terasa instan, tidak ada spinner atau delay

### 🔴 FIX 9: QuickPay Rekap Konsisten dengan Entry
- `RekapModal.quickPay` diubah dari `async/await persist()` → Optimistic UI (sama persis dengan Entry)
- Kini juga menampilkan **undo toast** (`showToastUndo`) selama 4 detik, konsisten dengan Entry
- Modal langsung tertutup setelah klik, Firebase write di background

### 🟠 FIX 10: Blank Hitam Saat Scroll Rekap + Performa Umum
- **Blank hitam:** Tambah `background: var(--bg)` eksplisit ke `.rtable td` — GPU compositor tidak lagi merender cell transparan (penyebab artefak hitam saat scroll cepat)
- **Even row:** Ganti `rgba(255,255,255,.02)` → `color-mix(in srgb, var(--bg) 98%, #fff)` (solid, bukan transparan)
- **Page transition:** Hapus animasi `motion.div` di `app/(app)/template.tsx` — penyebab delay/lag saat navigasi antar halaman
- **`will-change`** dihapus dari `.rtable-header th.stk` (GPU layer creation tidak perlu)

---

### 🧹 File Dihapus (Tidak Berguna, Zero Breaking Change)

| File | Alasan |
|---|---|
| `public/file.svg` | Default Next.js placeholder, tidak pernah direferensikan |
| `public/globe.svg` | Default Next.js placeholder, tidak pernah direferensikan |
| `public/next.svg` | Default Next.js placeholder, tidak pernah direferensikan |
| `public/vercel.svg` | Default Next.js placeholder, tidak pernah direferensikan |
| `public/window.svg` | Default Next.js placeholder, tidak pernah direferensikan |
| `components/features/rekap/RekapView.Table.tsx` | Didefinisikan tapi tidak pernah diimport/digunakan — digantikan oleh tabel inline di `RekapView.tsx` |

---

## Sesi Fix — Perbaikan Bertahap Menuju Deploy

### 🔴 DEPLOY FIX: Konflik Dependency (Penyebab Build Gagal)
- **Hapus `@sentry/nextjs`** — tidak kompatibel dengan Next.js 16.x (hanya support 13/14/15)
- **Hapus `next-pwa`** — dead dependency (tidak dipakai di next.config.ts), tidak kompatibel Next.js 16
- **Tambah `zod`** — untuk lib/env.ts validation
- **Tambah `@vercel/analytics` + `@vercel/speed-insights`** — Vercel monitoring
- Hasil: `npm install` tidak lagi ERESOLVE, build Vercel berhasil

### 🟠 BUG FIX: Rekap Table — Flash & Sticky Header
**Problem:** Nama member flash/hilang secara random saat scroll vertikal maupun horizontal
**Root cause:** `position: sticky` cells tanpa GPU compositor layer → transparent repaint saat scroll
**Fix:** Tambah `transform: translateZ(0)` + `backface-visibility: hidden` pada `.rtable td.stk`

**Problem:** Header kolom bulan (Jan–Des) tidak frozen saat scroll vertikal
**Root cause:** `overflow-x: auto` pada `.rekap-wrap` secara implisit membuat container scroll
  untuk kedua arah → `position: sticky; top: 0` pada `thead th` tidak bekerja (terikat ke
  container, bukan page scroll)
**Fix:** Pisah header ke `div.rekap-head` di luar `.rekap-wrap`, sync horizontal scroll via JS
  (`onRekapBodyScroll` → `rekapHeadRef.scrollLeft = rekapBodyRef.scrollLeft`)
  Scroll vertikal dan horizontal tetap terpisah sesuai preferensi user.

### 🟠 BUG FIX: Custom Zone Support (7 file)
Semua view dan hook yang pakai `activeZone === 'KRS' ? appData.krsMembers : appData.slkMembers`
diganti dengan `getMembersForZone(activeZone, appData)` yang mendukung custom zones:
- `hooks/useEntry.ts`
- `hooks/useRekap.ts`
- `hooks/useTunggakan.ts`
- `components/features/entry/EntryView.tsx`
- `components/features/tunggakan/TunggakanView.tsx`
- `components/features/rekap/RekapView.tsx`
- `components/modals/GlobalSearch.tsx` + `getAllActiveZones(settings)`

### ✅ TAMBAHAN: File Baru (zero breaking change)
- `lib/logger.ts` — Custom logger (dev: console berwarna, prod: silent kecuali error)
- `lib/env.ts` — Zod env validation, crash dengan pesan jelas jika env var kurang
- `constants/routes.ts` — ROUTES constants, tidak ada lagi string literal path
- `middleware.ts` — Soft session guard: redirect `/login` → `/dashboard` jika sudah login
- `app/offline/page.tsx` + `app/offline/ReloadButton.tsx` — PWA offline fallback page
- `app/global-error.tsx` — Global error boundary (root level)
- `database.rules.json` — RTDB rules: UID hardcoded, `$other: false`, eliminasi Firebase warning

### ✅ TAMBAHAN: Update File Existing (minimal, surgical)
- `app/layout.tsx` — Tambah Vercel Analytics, SpeedInsights, anti-FOUC script
- `hooks/useAuth.ts` — Tambah `wp_session` cookie untuk middleware soft guard
- `next.config.ts` — Tambah security headers (X-Frame-Options, X-Content-Type, dll)
- `.env.local.example` — Hapus Sentry vars, tambah NEXT_PUBLIC_APP_URL
- `styles/components.entry.css` — GPU compositing fix + rekap-outer/rekap-head styles

### 🗑️ DIHAPUS
- `sentry.client.config.ts` — Sentry tidak dipakai (DSN kosong, package dihapus)
- `sentry.server.config.ts` — idem
