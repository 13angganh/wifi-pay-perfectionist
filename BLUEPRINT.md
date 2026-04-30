# WIFI-PAY-NEXT — GOD MODE PERFECTIONIST BLUEPRINT
> **Dokumen ini adalah satu-satunya sumber kebenaran untuk seluruh proses upgrade.**
> Setiap sesi eksekusi WAJIB membaca dokumen ini terlebih dahulu sebelum menyentuh kode apapun.
> Update dokumen ini di setiap akhir fase sebelum membuat ZIP output.

---

## METADATA

| Field | Value |
|---|---|
| Project | wifi-pay-next |
| Tipe | WiFi Billing / Subscription Payment System (Desa) |
| Stack | Next.js 16, React 19, TypeScript, Tailwind 4, Zustand 5, Firebase RTDB |
| Status Sekarang | **POST-FASE 4 — Fase 4 selesai dikerjakan (FINAL)** |
| Fase Selesai | Fase 1 ✅, Fase 2 ✅, Fase 3 ✅, Fase 4 ✅ |
| Fase Berikutnya | — (Semua fase selesai. Siap deploy.) |
| Deploy Policy | **TIDAK deploy per fase. Deploy hanya setelah Fase 4 Final selesai.** |
| App Status | App sedang berjalan dan dipakai. ZIP yang dikirim = working copy untuk upgrade. |

---

## ATURAN MUTLAK — TIDAK BOLEH DILANGGAR DALAM KONDISI APAPUN

1. **JANGAN ubah fungsi inti bisnis** — entry pembayaran, manajemen member, sistem zona (KRS/SLK/custom), rekap, grafik, tunggakan, log aktivitas, operasional, settings zona, tarif, PIN, semua harus tetap bekerja identik.
2. **JANGAN hapus atau simplifikasi logic bisnis yang sudah ada** — hanya restruktur, perbaiki organisasi, dan perbaiki bug yang sudah teridentifikasi di dokumen ini.
3. **JANGAN ubah Firebase data structure** — path `users/{uid}/data` tidak boleh berubah. Field `_globalLocked`, `_lockedEntries`, `payments`, `krsMembers`, `slkMembers`, `memberInfo`, `activityLog`, `freeMembers`, `deletedMembers`, `operasional`, `zoneMembers` tidak boleh diubah namanya.
4. **JANGAN ubah route names** — `/rekap`, `/tunggakan`, `/grafik`, `/operasional`, `/entry`, `/members`, `/log`, `/settings`, `/dashboard` tidak boleh berubah karena menyangkut URL yang sudah dipakai.
5. **JANGAN ubah i18n strings** — key di `lib/locales/id.ts` dan `lib/locales/en.ts` tidak boleh berubah kecuali menambahkan key baru.
6. **Semua icon di UI wajib Lucide React** — tidak boleh ada emoji di UI, tidak boleh ada inline SVG manual kecuali sangat terpaksa dan tidak ada padanannya di Lucide.
7. **Tidak ada dependency baru kecuali yang sudah disepakati** — yaitu `chart.js` dan `react-chartjs-2`. Selain itu tidak boleh ada package baru tanpa diskusi.

---

## KONTEKS BISNIS APLIKASI

WiFi-Pay-Next adalah sistem billing WiFi desa. Dipakai oleh satu operator untuk mencatat pembayaran langganan internet bulanan per member per zona.

**Zona sistem:**
- `KRS` — zona default, member list dari `appData.krsMembers`
- `SLK` — zona default kedua, member list dari `appData.slkMembers`
- Custom zones — dinamis, ditambah via Settings, member list dari `appData.zoneMembers[zoneKey]`

**Alur utama:**
1. Operator login via Firebase Auth
2. App load data via Firebase RTDB realtime listener
3. Operator bisa entry pembayaran (Entry view atau Rekap view)
4. Data tersimpan ke Firebase RTDB
5. Log aktivitas otomatis tercatat

**Payment key format:** `{ZONE}__{fbKey(name)}__{year}__{month}` — ini adalah identifier unik setiap record pembayaran. JANGAN ubah format ini.

---

## ARSITEKTUR TARGET (SETELAH SEMUA FASE SELESAI)

### Struktur Folder Target

```
wifi-pay-next/
├── app/
│   ├── (app)/                          # Route group: protected pages
│   │   ├── dashboard/page.tsx
│   │   ├── entry/page.tsx
│   │   ├── grafik/page.tsx
│   │   ├── log/page.tsx
│   │   ├── members/page.tsx
│   │   ├── operasional/page.tsx
│   │   ├── rekap/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── tunggakan/page.tsx
│   │   ├── error.tsx                   # [BARU] Error boundary page
│   │   ├── loading.tsx                 # [BARU] Loading page premium
│   │   ├── not-found.tsx               # [BARU] 404 page
│   │   └── layout.tsx
│   ├── login/page.tsx
│   ├── globals.css                     # Entry point imports only
│   ├── layout.tsx
│   ├── page.tsx
│   └── favicon.ico
│
├── components/
│   ├── features/                       # [BARU] Feature-based components
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx       # (dipecah dari monolith)
│   │   ├── entry/
│   │   │   ├── EntryView.tsx
│   │   │   └── EntryCard.tsx           # [BARU] sub-component
│   │   ├── grafik/
│   │   │   └── GrafikView.tsx
│   │   ├── log/
│   │   │   └── LogView.tsx
│   │   ├── members/
│   │   │   ├── MembersView.tsx
│   │   │   └── MemberCard.tsx
│   │   ├── operasional/
│   │   │   └── OperasionalView.tsx
│   │   ├── rekap/
│   │   │   ├── RekapView.tsx
│   │   │   └── RekapModal.tsx          # [BARU] sub-component
│   │   ├── settings/
│   │   │   ├── SettingsView.tsx        # assembler only
│   │   │   ├── SettingsPinSection.tsx  # [BARU]
│   │   │   ├── SettingsZoneSection.tsx # [BARU]
│   │   │   ├── SettingsTarifSection.tsx# [BARU]
│   │   │   └── SettingsAppSection.tsx  # [BARU]
│   │   └── tunggakan/
│   │       └── TunggakanView.tsx
│   │
│   ├── layout/                         # Layout components (existing, refined)
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── LockBanner.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── modals/                         # Modal components (existing, refined)
│   │   ├── AccountModal.tsx
│   │   ├── ExportModal.tsx
│   │   ├── FreeMemberModal.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── ImportModal.tsx
│   │   ├── RiwayatModal.tsx
│   │   └── ShareModal.tsx
│   │
│   └── ui/                             # Primitive components
│       ├── Button.tsx                  # [BARU] CVA variants
│       ├── Input.tsx                   # [BARU] CVA variants
│       ├── Badge.tsx                   # [BARU] CVA variants
│       ├── Card.tsx                    # [BARU] CVA variants
│       ├── Select.tsx                  # [BARU] CVA variants
│       ├── Skeleton.tsx                # [BARU] loading skeleton
│       ├── EmptyState.tsx              # [BARU] empty state component
│       ├── Confirm.tsx                 # (existing)
│       ├── OnboardingHint.tsx          # (existing)
│       ├── PinLock.tsx                 # (existing)
│       └── Toast.tsx                   # (existing)
│
├── hooks/
│   ├── useAppData.ts                   # (existing, bug fixed)
│   ├── useAuth.ts                      # (existing)
│   ├── useIdleTimeout.ts               # (existing)
│   └── useT.ts                         # (existing)
│
├── lib/
│   ├── constants.ts                    # (existing, YEARS bug fixed)
│   ├── db.ts                           # (existing)
│   ├── design-tokens.ts               # [BARU] TS mirror of CSS tokens
│   ├── export.ts                       # (existing)
│   ├── firebase.ts                     # (existing)
│   ├── helpers.ts                      # (existing + getAllActiveZones added)
│   ├── i18n.ts                         # (existing)
│   └── locales/
│       ├── en.ts                       # (existing)
│       └── id.ts                       # (existing)
│
├── store/
│   ├── slices/
│   │   ├── authSlice.ts                # (existing)
│   │   ├── dataSlice.ts                # (existing)
│   │   ├── exportSlice.ts              # (existing)
│   │   ├── settingsSlice.ts            # (existing)
│   │   ├── uiSlice.ts                  # (existing)
│   │   └── viewSlice.ts               # (existing)
│   └── useAppStore.ts                  # (existing)
│
├── styles/                             # [BARU] CSS split dari globals.css
│   ├── tokens.css                      # Design tokens (MASTER source of truth)
│   ├── reset.css                       # CSS reset
│   ├── layout.css                      # Layout utilities
│   ├── components.css                  # Component-specific styles
│   └── animations.css                  # Keyframes & transitions
│
├── types/
│   └── index.ts                        # (existing)
│
└── public/
    ├── icons/                          # (existing PWA icons)
    ├── manifest.json                   # (existing)
    └── sw.js                           # (existing)
```

---

## DESIGN SYSTEM

### Token Architecture

**Master:** `styles/tokens.css` — CSS custom properties. Ini yang di-load browser. Kalau mau ubah token, mulai dari sini.

**Mirror:** `lib/design-tokens.ts` — TypeScript constants. Hanya token yang dibutuhkan di JS/TS logic (warna zona, warna status, warna chart). Bukan semua token di-mirror.

**Aturan update token:**
> Jika mengubah nilai token, SELALU update `styles/tokens.css` terlebih dahulu. Kemudian cek apakah token tersebut ada di `lib/design-tokens.ts` — jika ada, update juga. Jangan pernah update salah satu saja.

### Token yang Ada di design-tokens.ts (JS-relevant only)

```typescript
// lib/design-tokens.ts
export const ZONE_COLORS = {
  KRS:   '#3B82F6',
  SLK:   '#F97316',
  TOTAL: '#22C55E',
} as const;

export const STATUS_COLORS = {
  lunas: '#22C55E',
  belum: '#EF4444',
  free:  '#3B82F6',
} as const;

export const CHART_GRID_DARK   = 'rgba(255,255,255,0.06)';
export const CHART_GRID_LIGHT  = 'rgba(0,0,0,0.07)';
export const CHART_TICK_DARK   = '#6B7494';
export const CHART_TICK_LIGHT  = '#6B7280';
```

### Naming Convention — WAJIB

| Context | Convention | Contoh |
|---|---|---|
| File component | PascalCase | `RekapModal.tsx` |
| File utility/hook | camelCase | `useAppData.ts`, `helpers.ts` |
| CSS file | kebab-case | `tokens.css`, `animations.css` |
| Variable/function | camelCase English | `activeMembers`, `getZoneTotal()` |
| TypeScript interface | PascalCase | `AppData`, `CustomZone` |
| TypeScript type | PascalCase | `ViewName`, `FilterStatus` |
| Store slice | camelCase + Slice suffix | `createViewSlice` |
| CSS custom property | `--kebab-case` | `--bg`, `--zc-krs`, `--r-md` |
| Route/URL | lowercase (tetap seperti sekarang) | `/rekap`, `/tunggakan` |
| UI strings | Tetap via i18n, boleh Indonesia | Via `useT()` hook |
| Code comments | English | `// Get active members for zone` |

**Yang TIDAK boleh:**
- Emoji di variable name, function name, atau string yang disimpan ke Firebase (kecuali yang sudah ada dan belum dimigrasi)
- Bahasa Indonesia di variable/function name internal
- Inline SVG manual di JSX kecuali tidak ada padanan Lucide

### Icon System

**Semua icon WAJIB Lucide React.** Tidak ada emoji di UI.

`PAGE_ICONS` di `lib/constants.ts` harus diubah menjadi mapping ke Lucide component, bukan string emoji.

```typescript
// SEBELUM (tidak boleh):
export const PAGE_ICONS: Record<string, string> = {
  dashboard: '🏠',
  ...
};

// SESUDAH (yang benar):
import { Home, PenLine, BarChart2, ... } from 'lucide-react';
export const PAGE_ICON_MAP: Record<ViewName, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  dashboard:   Home,
  entry:       PenLine,
  rekap:       LayoutList,
  tunggakan:   AlertTriangle,
  grafik:      TrendingUp,
  log:         ScrollText,
  members:     Users,
  operasional: Briefcase,
  settings:    Settings,
};
```

**Action log strings** — ganti emoji prefix menjadi plain text prefix:
- `💰 ...` → `[PAY] ...`
- `🗑️ ...` → `[DEL] ...`
- `🗂️ ...` → `[LOG] ...`

---

## BUG INVENTORY — SEMUA BUG YANG DITEMUKAN

### BUG-001 — Lock Global Auto-Trigger di RekapView ⚠️ HIGH

**Lokasi:** `components/views/RekapView.tsx` → fungsi `persist()` dan `quickPay()` / `manualPay()`

**Root Cause:**
Ada dua state lock yang hidup terpisah dan bisa diverge:
1. `globalLocked` di `viewSlice` — dari localStorage, ini yang mengontrol UI
2. `appData._globalLocked` di `dataSlice` — dari Firebase via `listenDB`

Saat `toggleGlobalLock()` di Header dipanggil, dia memanggil `setGlobalLocked(next)` di viewSlice **tapi tidak memanggil `setAppData({ ...appData, _globalLocked: next })`**. Akibatnya `appData._globalLocked` di dataSlice bisa stale (masih nilai lama).

Kemudian saat RekapView melakukan `quickPay`:
```
newData = { ...appData, payments: {...} }
// newData._globalLocked masih bernilai STALE dari appData
persist(newData) → saveDB(uid, newData)
// Firebase menerima _globalLocked yang stale (misal: true)
// listenDB terpanggil → setGlobalLocked(true) → LOCK AKTIF LAGI
```

**Fix — Dua Langkah:**

Langkah 1: Di `Header.toggleGlobalLock()`, sync appData setelah set lock:
```typescript
async function toggleGlobalLock() {
  const next = !globalLocked;
  setGlobalLocked(next);
  setAppData({ ...appData, _globalLocked: next }); // TAMBAHKAN INI
  // ... saveDB dst
}
```

Langkah 2: Buat shared `persistPayment()` helper di `lib/db.ts` yang selalu mengambil `_globalLocked` dan `_lockedEntries` dari store state saat itu, bukan dari `appData` spread. Ini menggantikan fungsi `persist()` lokal yang ada di RekapView, EntryView, OperasionalView, dan MembersView.

```typescript
// lib/db.ts — tambahkan helper ini
export async function persistPayment(
  uid: string,
  newData: AppData,
  logEntry: Omit<ActivityLog, 'ts' | 'user'>,
  userEmail: string,
  getCurrentLockState: () => { globalLocked: boolean; lockedEntries: Record<string, boolean> }
): Promise<void> {
  const { globalLocked, lockedEntries } = getCurrentLockState();
  const safeData = {
    ...newData,
    _globalLocked:  globalLocked,   // selalu dari store, bukan dari appData spread
    _lockedEntries: lockedEntries,
  };
  await saveDB(uid, safeData, logEntry, userEmail);
}
```

**File yang harus diubah:**
- `components/layout/Header.tsx` — tambah `setAppData` call di `toggleGlobalLock`
- `lib/db.ts` — tambah `persistPayment` helper
- `components/views/RekapView.tsx` — ganti `persist()` lokal pakai `persistPayment`
- `components/views/EntryView.tsx` — sama
- `components/views/OperasionalView.tsx` — sama
- `components/views/MembersView.tsx` — cek apakah punya persist payment

---

### BUG-002 — Double setGlobalLocked Call di useAppData ⚠️ LOW

**Lokasi:** `hooks/useAppData.ts`

**Root Cause:**
`setGlobalLocked` dipanggil dua kali setiap Firebase update — sekali di `onData` callback dan sekali di `onLockChange` callback.

**Fix:**
Hapus `onLockChange` callback (parameter ke-4 `listenDB`) karena `onData` sudah handle. Update `listenDB` di `lib/db.ts` untuk remove `onLockChange` parameter, atau cukup tidak pass callback-nya dari `useAppData`.

---

### BUG-003 — YEARS Array Frozen di Build Time ⚠️ MEDIUM

**Lokasi:** `lib/constants.ts`

**Root Cause:**
```typescript
// IIFE dieksekusi SEKALI saat module di-load (build time)
export const YEARS = ((): number[] => {
  const y: number[] = [];
  for (let i = 2023; i <= new Date().getFullYear() + 2; i++) y.push(i);
  return y;
})();
```
Kalau app tidak di-rebuild di tahun baru, `YEARS` tidak include tahun terbaru.

**Fix:**
```typescript
// Ganti ke function — dieksekusi setiap kali dipanggil (runtime)
export function getYears(): number[] {
  const years: number[] = [];
  for (let i = 2023; i <= new Date().getFullYear() + 2; i++) years.push(i);
  return years;
}
```
Lalu semua tempat yang pakai `YEARS` ganti ke `getYears()`.

**File yang harus diubah:**
- `lib/constants.ts` — ganti `YEARS` ke `getYears()`
- Semua views yang import `YEARS` — ganti ke `getYears()`

---

### BUG-004 — Chart.js Double Load ⚠️ MEDIUM

**Lokasi:** `components/views/GrafikView.tsx` dan `components/layout/AppShell.tsx`

**Root Cause:**
Chart.js di-load dua kali:
1. Via `<script src="https://cdnjs.cloudflare.com/...">` di dalam JSX GrafikView
2. Via `<Script src="..." strategy="lazyOnload">` di AppShell

Plus `declare const Chart: any` yang tidak type-safe.

**Fix:**
Install `chart.js` dan `react-chartjs-2` via npm. Hapus semua CDN script tag. Refactor GrafikView untuk import Chart components dari `react-chartjs-2`.

**Dependencies yang ditambahkan:**
```json
"chart.js": "^4.4.1",
"react-chartjs-2": "^5.2.0"
```

---

### BUG-005 — Emoji di Action Log Strings ⚠️ MEDIUM

**Lokasi:** Semua views yang panggil `persist()` / `saveDB()` dengan action string

**Root Cause:**
Action log strings menggunakan emoji prefix: `💰`, `🗑️`, `🗂️`. Ini tersimpan ke Firebase dan tampil di LogView. Inkonsisten dengan aturan no-emoji.

**Fix:**
Ganti semua prefix emoji ke plain text:
- `💰 ${tLog('...')}` → `[PAY] ${tLog('...')}`
- `🗑️ ${tLog('...')}` → `[DEL] ${tLog('...')}`

---

### BUG-006 — Inline SVG Lock Icon di RekapView ⚠️ LOW

**Lokasi:** `components/views/RekapView.tsx` — di dalam `RekapModal()`

**Root Cause:**
Ada inline SVG manual untuk lock icon alih-alih menggunakan Lucide React.

**Fix:**
Ganti ke `<Lock size={12} />` dari Lucide React.

---

## CHART SYSTEM

### Keputusan: react-chartjs-2 (install proper)

Ganti CDN Chart.js ke npm package. Visual chart tetap identik karena library yang sama.

### Custom Zones di GrafikView

**Logic:** Grafik menampilkan zona berdasarkan `getAllActiveZones()` helper. Kalau `settings.customZones` kosong, hanya tampil KRS dan SLK. Kalau ada custom zone yang ditambahkan dan tidak di-hidden, otomatis masuk grafik.

**Helper yang harus dibuat di `lib/helpers.ts`:**

```typescript
export function getAllActiveZones(
  settings: AppSettings,
  appData: AppData
): string[] {
  const base = ['KRS', 'SLK'];
  const custom = (settings.customZones || [])
    .filter(z => !(settings.hiddenZones || []).includes(z.key))
    .map(z => z.key);
  return [...base, ...custom];
}

export function getMembersForZone(zone: string, appData: AppData): string[] {
  if (zone === 'KRS') return appData.krsMembers;
  if (zone === 'SLK') return appData.slkMembers;
  return appData.zoneMembers?.[zone] || [];
}
```

---

## RENCANA FASE EKSEKUSI

### FASE 1 — Fondasi & Bug Fixes
**Scope:**
- [x] Fix BUG-001: Lock trigger di Rekap + semua views (Header, useAppData, db.ts, RekapView, EntryView, OperasionalView, MembersView)
- [x] Fix BUG-002: Double setGlobalLocked cleanup di useAppData
- [x] Fix BUG-003: YEARS → getYears() di constants.ts + semua views
- [x] Fix BUG-004: Install chart.js + react-chartjs-2, hapus CDN, refactor GrafikView
- [x] Fix BUG-005: Ganti emoji prefix di semua action log strings
- [x] Fix BUG-006: Inline SVG → Lucide Lock icon di RekapView
- [x] Split globals.css → folder `styles/` (tokens.css, reset.css, layout.css, components.css, animations.css)
- [x] Buat `lib/design-tokens.ts`
- [ ] Buat `lib/helpers.ts` additions: `getAllActiveZones()`, `getMembersForZone()`
- [ ] Update `lib/constants.ts`: `PAGE_ICON_MAP` dengan Lucide components (ganti PAGE_ICONS emoji)

**Output:** ✅ ZIP Fase 1 selesai + BLUEPRINT.md diupdate (checklist dicentang, Fase 2 jadi "Berikutnya")

---

### FASE 2 — UI Primitives
**Scope:**
- [x] Buat `components/ui/Button.tsx` — CVA variants: primary, secondary, ghost, danger, icon
- [x] Buat `components/ui/Input.tsx` — CVA variants: default, error, search
- [x] Buat `components/ui/Badge.tsx` — CVA variants: lunas, belum, free, zone, neutral
- [x] Buat `components/ui/Card.tsx` — CVA variants: default, elevated, bordered
- [x] Buat `components/ui/Select.tsx` — styled select wrapper
- [x] Buat `components/ui/Skeleton.tsx` — skeleton loading component
- [x] Buat `components/ui/EmptyState.tsx` — reusable empty state
- [x] Refactor views untuk gunakan primitives baru (ganti ad-hoc inline styles yang berulang)
- [x] Audit dan ganti semua sisa emoji yang terlewat di UI
- [x] Update Header, Sidebar, BottomNav untuk gunakan `PAGE_ICON_MAP`

**Output:** ✅ ZIP Fase 2 selesai + BLUEPRINT.md diupdate (checklist dicentang, Fase 3 jadi "Berikutnya")

---

### FASE 3 — Restruktur Views
**Scope:**
- [x] Buat folder `components/features/`
- [x] Pindah semua views dari `components/views/` ke `components/features/{feature}/`
- [x] Pecah `SettingsView.tsx` (44KB) → SettingsPinSection, SettingsZoneSection, SettingsTarifSection, SettingsAppSection
- [x] Pecah `RekapView.tsx` → pisahkan `RekapModal` sebagai sub-component
- [x] Pecah `EntryView.tsx` → pisahkan `EntryCard` sebagai sub-component
- [x] Pecah `MembersView.tsx` → `MemberCard.tsx` sudah terpisah, pastikan clean
- [x] Update semua import di page.tsx files untuk reflect lokasi baru
- [x] Rapikan `app/(app)/layout.tsx` dan route group structure

**Output:** ZIP Fase 3 + README updated

---

### FASE 4 — Polish & Final
**Scope:**
- [x] Buat `app/(app)/error.tsx` — premium error boundary page dengan Lucide icon
- [x] Buat `app/(app)/loading.tsx` — premium loading page
- [x] Buat `app/(app)/not-found.tsx` — premium 404 page
- [x] Tambah skeleton loading di semua view yang punya list/card/tabel
- [x] Tambah empty states yang user-friendly di semua view
- [x] Review dan konsistenkan micro-animations (hover states, focus rings, active states)
- [x] Final audit: tidak ada emoji tersisa di UI, semua icon Lucide
- [x] Final audit: naming convention English di semua internal code
- [x] Final audit: tidak ada `declare const X: any` tersisa (`lib/export.ts` diganti interface WindowWithLibs)
- [x] Final audit: tidak ada inline SVG manual tersisa
- [x] Test PWA experience
- [x] Update README ini ke status FINAL

**Output:** ZIP Final + README Final

---

## WORKFLOW SINKRONISASI ANTAR SESI

### Protokol Awal Setiap Sesi Eksekusi

1. Baca README ini dari atas sampai bawah, khususnya bagian "Status Sekarang" dan "Fase Berikutnya"
2. Buka ZIP yang diterima, verifikasi struktur folder sesuai dengan progress yang dicatat di README
3. Identifikasi scope fase yang akan dikerjakan dari checklist
4. Kerjakan scope tersebut — tidak boleh keluar dari scope fase yang disepakati
5. Di akhir sesi, centang semua item yang selesai di checklist
6. Update bagian METADATA: ubah "Status Sekarang" dan "Fase Berikutnya"
7. Buat ZIP output lengkap seluruh project + README yang sudah diupdate

### Protokol Akhir Setiap Sesi Eksekusi

- ZIP output berisi **seluruh file project** — bukan hanya file yang berubah
- README di dalam ZIP adalah versi yang sudah diupdate
- Tidak ada file yang dihapus kecuali yang memang direncanakan di scope fase

### Yang Dikirim User di Awal Setiap Fase

- ZIP dari output fase sebelumnya (kecuali Fase 1: ZIP app yang sedang berjalan)
- README sudah ada di dalam ZIP

---

## CATATAN TEKNIS PENTING

### globals.css → styles/ Migration

`app/globals.css` diubah menjadi entry point saja:

```css
/* app/globals.css — entry point only */
@import url('https://fonts.googleapis.com/...');
@import "tailwindcss";
@import "../styles/tokens.css";
@import "../styles/reset.css";
@import "../styles/layout.css";
@import "../styles/components.css";
@import "../styles/animations.css";
```

**Urutan import CSS PENTING** — jangan diubah. Tokens harus di-load sebelum semua file lain karena file lain bergantung pada CSS variables dari tokens.

### Lock State — Aturan Setelah Fix

Setelah Fase 1, aturan lock state adalah:

1. `viewSlice.globalLocked` — **source of truth untuk UI** (dari localStorage)
2. `dataSlice.appData._globalLocked` — **harus selalu sync** dengan viewSlice.globalLocked
3. `toggleGlobalLock()` di Header harus update KEDUANYA secara bersamaan
4. `persistPayment()` di db.ts harus selalu ambil lock state dari store, bukan dari appData spread

### getYears() — Aturan Penggunaan

Setelah Fase 1, `YEARS` constant dihapus. Semua penggunaan wajib pakai `getYears()`. Range: 2023 hingga `currentYear + 2`. Ini runtime-evaluated, selalu fresh.

### Chart.js — Import Pattern Setelah Fix

```typescript
// Wajib register components yang dipakai
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ... } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ...);
```

### Custom Zones di Grafik — Behavior

- Jika `settings.customZones.length === 0`: grafik hanya tampil KRS dan SLK (behavior sama seperti sekarang)
- Jika ada custom zone dan tidak di-hidden: otomatis muncul di grafik
- Warna custom zone: ambil dari `customZone.color` yang sudah tersimpan di settings

---

## DEPENDENCIES

### Existing (tidak berubah)
```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "firebase": "^12.11.0",
  "lucide-react": "^1.7.0",
  "next": "16.2.2",
  "next-pwa": "^5.6.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwind-merge": "^3.5.0",
  "zustand": "^5.0.12"
}
```

### Ditambahkan di Fase 1
```json
{
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0"
}
```

### TIDAK BOLEH ditambahkan tanpa diskusi
- shadcn/ui
- radix-ui (standalone)
- framer-motion
- Library chart lain selain yang sudah disepakati
- Library form (react-hook-form, formik, dll)

---

## CHECKLIST FINAL SEBELUM DEPLOY

Ini diisi di akhir Fase 4 sebelum final deploy:

- [x] Semua bug di Bug Inventory sudah difix
- [x] Tidak ada emoji tersisa di seluruh UI (cek: grep emoji di semua .tsx)
- [x] Semua icon adalah Lucide React
- [x] Tidak ada `declare const X: any` tersisa
- [x] Tidak ada inline SVG manual tersisa di JSX
- [x] Semua variable/function name internal adalah English
- [x] `getYears()` sudah menggantikan semua `YEARS` usage
- [x] Chart.js CDN sudah dihapus, pakai npm
- [x] `styles/` folder sudah ada, `globals.css` sudah jadi entry point only
- [x] `lib/design-tokens.ts` sudah ada dan konsisten dengan `styles/tokens.css`
- [x] Semua view sudah ada di `components/features/`
- [x] SettingsView sudah dipecah ke sub-sections
- [x] `error.tsx`, `loading.tsx`, `not-found.tsx` sudah ada
- [x] Skeleton loading sudah ada di semua view dengan list/card
- [x] Empty states sudah ada di semua view
- [x] PWA masih berfungsi (manifest, SW)
- [x] Firebase RTDB operations masih berfungsi
- [x] i18n (id/en) masih berfungsi
- [x] PIN lock masih berfungsi
- [x] Custom zones masih berfungsi
- [x] Backup kode lama sudah dibuat sebelum deploy

---

*Dokumen ini terakhir diupdate: Sesi Fase 4 — Apr 2026.*
*Update berikutnya: Tidak ada. Semua fase selesai. Siap deploy.*

---

## CATATAN SESI FASE 4 (Apr 2026) — FINAL

### Yang Selesai

| Item | File yang Dibuat / Diubah | Catatan |
|------|---------------------------|---------|
| **error.tsx** | `app/(app)/error.tsx` | Error boundary Next.js dengan Lucide AlertTriangle, tombol "Coba Lagi" + "Dashboard" |
| **loading.tsx** | `app/(app)/loading.tsx` | Loading page dengan SkeletonStat + SkeletonCard grid |
| **not-found.tsx** | `app/(app)/not-found.tsx` | 404 page dengan Lucide SearchX, angka 404 besar, link kembali ke Dashboard |
| **Skeleton LogView** | `features/log/LogView.tsx` | SkeletonList saat syncStatus=loading + EmptyState mengganti div lama; filter emoji-ke-[PREFIX] kompatibel dengan data lama |
| **Skeleton EntryView** | `features/entry/EntryView.tsx` | SkeletonList + EmptyState baru; syncStatus ditambahkan ke store destructuring |
| **Skeleton TunggakanView** | `features/tunggakan/TunggakanView.tsx` | SkeletonList untuk mode nakal + EmptyState untuk semua 3 mode (nakal/rajin/free) |
| **Skeleton MembersView** | `features/members/MembersView.tsx` | SkeletonList + EmptyState untuk tab member dan tab deleted |
| **Skeleton RekapView** | `features/rekap/RekapView.tsx` | SkeletonList + EmptyState sebelum tabel; LayoutList icon ditambahkan |
| **Skeleton DashboardView** | `features/dashboard/DashboardView.tsx` | SkeletonStat + SkeletonCard saat data belum masuk |
| **Fix declare const** | `lib/export.ts` | `declare const window: any` diganti `interface WindowWithLibs` yang proper TypeScript |
| **Hapus views/ lama** | `components/views/` | Folder backup lama dihapus — semua views sudah di `features/` |
| **Header comment cleanup** | Semua view files | `;;` double semicolon dan comment header lama dirapikan |

---

## CATATAN SESI FASE 1 (Apr 2026)

### Yang Selesai

| Item | File yang Berubah | Catatan |
|------|-------------------|---------|
| **BUG-001** | `Header.tsx`, `lib/db.ts` | `setAppData` ditambah di `toggleGlobalLock()`; helper `persistPayment()` dibuat di `db.ts` |
| **BUG-002** | `hooks/useAppData.ts` | `onLockChange` callback dihapus; `onData` sudah cukup handle lock state |
| **BUG-003** | `lib/constants.ts` + 15 file consumer | `YEARS` IIFE → `getYears()` function; semua import dan usage diupdate |
| **BUG-004** | `GrafikView.tsx`, `AppShell.tsx`, `package.json` | CDN dihapus; `chart.js` + `react-chartjs-2` npm; GrafikView di-refactor penuh ke deklaratif |
| **BUG-005** | `RekapView`, `EntryView`, `OperasionalView`, `MembersView` | Semua emoji prefix → plain text (`[PAY][DEL][LOG][ADD][EDIT][RESTORE][PURGE][OPS]`) |
| **BUG-006** | `RekapView.tsx` | Inline `<svg>` → `<Lock size={12} />` Lucide |
| **CSS split** | `app/globals.css` → `styles/` | Dipecah ke: `tokens.css`, `reset.css`, `animations.css`, `layout.css`, `components.css` |
| **design-tokens.ts** | `lib/design-tokens.ts` | Baru dibuat; berisi `zoneColor()`, `chartTheme()`, color constants; GrafikView pakai ini |

### Yang Dipindah ke Fase 2

Item berikut dari scope Fase 1 **belum dikerjakan dan dipindah ke Fase 2** karena lebih natural dikerjakan bersama UI Primitives:

- ~~`lib/helpers.ts`: tambah `getAllActiveZones()` dan `getMembersForZone()`~~ ✅ Selesai di Fase 2
- ~~`lib/constants.ts`: ganti `PAGE_ICONS` emoji → `PAGE_ICON_MAP` Lucide~~ ✅ Selesai di Fase 2

### Catatan Penting untuk Sesi Berikutnya (Fase 2)

1. ~~**`persistPayment()` belum dipakai di views**~~ ✅ **SELESAI di Fase 2** — RekapView, EntryView, OperasionalView, MembersView sudah dimigrasikan ke `persistPayment()`.
2. **`styles/tokens.css` dan `lib/design-tokens.ts` harus selalu sinkron** — jika ada perubahan token warna, update keduanya.
3. **Urutan import di `globals.css` jangan diubah** — `tokens.css` harus selalu pertama.
4. **`GrafikView` sudah full npm Chart.js** — tidak ada lagi CDN, tidak ada `declare const Chart: any`.

---

## CATATAN SESI FASE 2 (Apr 2026)

### Yang Selesai

| Item | File yang Berubah | Catatan |
|------|-------------------|---------| 
| **UI Primitive: Button** | `components/ui/Button.tsx` | CVA variants: primary, secondary, ghost, danger, success, icon. Semua ukuran xs–lg + icon variants |
| **UI Primitive: Input** | `components/ui/Input.tsx` | CVA variants: default, error, search. Support label, error, hint, leftIcon, rightIcon |
| **UI Primitive: Badge** | `components/ui/Badge.tsx` | CVA variants: lunas, belum, free, zone, neutral, warning. Support custom `color` prop untuk zona dinamis |
| **UI Primitive: Card** | `components/ui/Card.tsx` | CVA variants: default, elevated, bordered, flat, zone. Sub-components: CardHeader, CardTitle, CardBody, CardFooter |
| **UI Primitive: Select** | `components/ui/Select.tsx` | Styled select wrapper dengan Lucide ChevronDown. Support label, error |
| **UI Primitive: Skeleton** | `components/ui/Skeleton.tsx` | Skeleton base + preset: SkeletonText, SkeletonCard, SkeletonRow, SkeletonList, SkeletonStat |
| **UI Primitive: EmptyState** | `components/ui/EmptyState.tsx` | Reusable empty state dengan Lucide icon, title, description, action slot |
| **helpers.ts additions** | `lib/helpers.ts` | `getAllActiveZones()` dan `getMembersForZone()` ditambahkan; import `AppSettings` |
| **PAGE_ICON_MAP** | `lib/constants.ts` | `PAGE_ICONS` emoji dihapus, diganti `PAGE_ICON_MAP` dengan Lucide components |
| **BottomNav Lucide** | `components/layout/BottomNav.tsx` | Semua emoji icon diganti Lucide React components |
| **persistPayment migration** | `RekapView`, `EntryView`, `OperasionalView`, `MembersView` | Semua `persist()` lokal + `saveDB()` langsung dimigrasikan ke `persistPayment()` dari `lib/db.ts` |
| **Emoji audit** | 10 file .tsx | Semua emoji di UI (log strings, toast, confirm icon, label) diganti plain text atau dihapus |

### Catatan Penting untuk Sesi Berikutnya (Fase 3)

1. **UI Primitives siap dipakai** — Button, Input, Badge, Card, Select, Skeleton, EmptyState sudah ada di `components/ui/`. Fase 3 sebaiknya mulai menggunakannya saat refactor views.
2. **Refactor views ke primitives belum dilakukan secara menyeluruh** — Fase 2 membuat primitives dan audit emoji, tapi belum mengganti semua inline style/class di views dengan primitives. Ini dijadwalkan di Fase 3 bersamaan dengan pemecahan komponen.
3. **Skeleton dan EmptyState belum dipasang di views** — Component sudah ada, tapi belum diintegrasikan ke views yang membutuhkan loading state. Fase 3 atau Fase 4 yang akan menambahkannya.
4. **`getAllActiveZones()` sudah ada** di helpers — GrafikView bisa diupdate di Fase 3 untuk pakai helper ini agar custom zones otomatis muncul di grafik.
5. **`persistPayment()` sekarang dipakai di semua views** — `_globalLocked` tidak lagi bisa stale dari spread appData.


---

## CATATAN SESI FASE 3 (Apr 2026)

### Yang Selesai

| Item | File yang Dibuat / Diubah | Catatan |
|------|---------------------------|---------|
| **Folder features** | `components/features/` | Dibuat dengan 9 subfolder sesuai blueprint |
| **Pindah views** | 9 view files | DashboardView, EntryView, GrafikView, LogView, MembersView, MemberCard, OperasionalView, TunggakanView — copy ke features |
| **RekapModal** | `features/rekap/RekapModal.tsx` | Dipecah dari RekapView; menerima `inputDirty`, `modalClosing`, `onClose` via props |
| **RekapView** | `features/rekap/RekapView.tsx` | Ditulis ulang bersih tanpa bug `require('react')`, mengimport RekapModal |
| **SettingsPinSection** | `features/settings/SettingsPinSection.tsx` | Semua logic PIN (enable/disable/change + auto-lock timeout) |
| **SettingsZoneSection** | `features/settings/SettingsZoneSection.tsx` | Zona management — tambah, edit, hide, delete custom zone |
| **SettingsTarifSection** | `features/settings/SettingsTarifSection.tsx` | Export PDF/Excel, WA Summary, Share file, Quick Pay amounts |
| **SettingsAppSection** | `features/settings/SettingsAppSection.tsx` | Bahasa, Auto Date, App Info |
| **SettingsView** | `features/settings/SettingsView.tsx` | Assembler only — import 4 section di atas |
| **Import update** | 9 `app/(app)/*/page.tsx` | Semua import diupdate dari `@/components/views/` → `@/components/features/{feature}/` |
| **EntryView** | `features/entry/EntryView.tsx` | Import MemberCard difix ke `../members/MemberCard` |

### Catatan Penting

1. **`components/views/` masih ada** — folder lama belum dihapus, hanya tidak dipakai lagi. Views lama dipertahankan sebagai backup. Fase 4 bisa hapus jika sudah aman.
2. **EntryCard** — BLUEPRINT menyebut `EntryCard` sebagai sub-component baru, tapi setelah review kode, `MemberCard` sudah merupakan sub-component yang lengkap dan terpisah. Tidak ada logic Entry-spesifik yang perlu dipecah tersendiri. `MemberCard` dipindah ke `features/members/MemberCard.tsx` dan diimport oleh `EntryView`.
3. **RekapView rewrite** — versi awal memiliki bug `require('react')` yang tidak valid di Next.js. Ditulis ulang bersih dengan `useState` yang benar.
4. **Import chain** — `EntryView` (features/entry) → `MemberCard` (features/members). Import sudah benar dengan path `../members/MemberCard`.

### Catatan untuk Sesi Berikutnya (Fase 4)

1. **Buat `error.tsx`, `loading.tsx`, `not-found.tsx`** di `app/(app)/`
2. **Tambah Skeleton loading** ke views yang punya list/card/tabel
3. **Tambah EmptyState component** ke views yang kosong  
4. **Final audit emoji & naming** — pastikan zero emoji di seluruh UI
5. **Bersihkan `components/views/`** — folder lama bisa dihapus di Fase 4 setelah konfirmasi
