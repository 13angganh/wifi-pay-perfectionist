# CHANGES — WiFi Pay

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
