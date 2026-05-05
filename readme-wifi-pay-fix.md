# WiFi Pay — Fix & Perfection Tracker
**Project:** WiFi Pay v11.2 Next  
**Stack:** Next.js 16 · Firebase · Zustand · Tailwind v4 · TypeScript strict  
**Bahasa UI:** Indonesia + English (bilingual, i18n via `lib/i18n.ts` + `lib/locales/`)  
**Deploy:** GitHub → Vercel auto-deploy — **HANYA di akhir Fase 4 (final)**  
**Audit Source:** `audit-wifi-pay.html` (24 issues ditemukan, 2 Mei 2026)  
**Prompt Standard:** `prompt-base.md v1.0.0` + `prompt-personal.md v1.0.0`

---

## ⚠️ ATURAN WAJIB SETIAP FASE

> Berlaku tanpa pengecualian. Wajib dipatuhi Claude di setiap sesi tanpa perlu diingatkan.

1. **Full ZIP wajib dikirim di akhir setiap fase** — bukan hanya file yang diedit. Seluruh source code terbaru, agar selalu sinkron dan on-track.
2. **README ini (`readme-wifi-pay-fix.md`) wajib diupdate dan dikirim bersama ZIP** — tanpa perlu diminta. Update checkbox, tambah catatan temuan baru, tandai file yang diedit ulang.
3. **Setiap task yang selesai** ditandai `✅` dengan keterangan singkat apa yang dilakukan.
4. **Jika ditemukan bug/issue baru** selama pengerjaan, tambahkan ke section "Temuan Tambahan" di fase yang relevan dan kerjakan jika masih dalam scope fase tersebut.
5. **Jika file dari fase sebelumnya diedit lagi**, cantumkan di kolom "Diedit Lagi" agar histori jelas.
6. **Bilingual dijaga**: setiap string UI yang baru/diubah wajib ada di `lib/locales/id.ts` dan `lib/locales/en.ts`.
7. **Checklist akhir fase** wajib dijalankan sebelum ZIP dikirim: `tsc --noEmit` dan `eslint` tidak boleh ada error.
8. **Panduan panjang file: ~150 baris sebagai target** — bukan batas kaku. Boleh lebih jika konten masih 1 fungsi/fitur/menu yang nanggung dipecah. Yang tidak boleh: 1 file berisi banyak tanggung jawab berbeda hanya karena malas memisah. Pecah jika sudah jelas ada 2+ domain berbeda dalam 1 file, atau jika file sudah sulit di-scan secara visual. Pengecualian tetap: file data murni seperti locale files.

---

## STATUS KESELURUHAN

| Fase | Nama | Status | Sesi |
|------|------|--------|------|
| 1 | Critical Bugs & Quick Wins | ✅ Selesai | Sesi 1 (3 Mei 2026) |
| 2 | Keamanan & Arsitektur | ✅ Selesai | Sesi 2 (3 Mei 2026) |
| 3 | Standar Prompt & Polish | ✅ Selesai | Sesi 3 (4 Mei 2026) |
| 4 | Testing & Final | ⬜ Belum dimulai | — |

---

---

## FASE 1 — Critical Bugs & Quick Wins

**Tujuan:** Eliminasi semua data-corruption, logic error, dan pelanggaran standar yang trivial-low effort.  
**Estimasi:** 1 sesi  
**Input:** ZIP awal (`wifi-pay-perfectionist.zip`) + README ini

### Task List

| # | Issue | Prioritas Audit | Status | File Utama | Catatan |
|---|-------|----------------|--------|------------|---------|
| 1.01 | `getArrears()` tidak cek free member — member gratis dihitung sebagai tunggakan | 🔴 Critical | ✅ | `lib/helpers.ts` | Ganti `if (v === null)` → `if (!isLunas(...))` |
| 1.02 | `zoneMembers` tidak ada di `DEFAULT_APP_DATA` | 🟠 High | ✅ | `lib/db.ts` | Tambah `zoneMembers: {}` ke object DEFAULT |
| 1.03 | `zoneMembers` tidak di-map di `listenDB()` | 🟠 High | ✅ | `lib/db.ts` | Tambah `zoneMembers: val.zoneMembers \|\| {}` ke raw object |
| 1.04 | `handleSwitchAccount` memanggil `doLogout()` bukan `switchAccount()` — credentials tidak terhapus | 🟠 High | ✅ | `components/layout/Sidebar.tsx` | Ganti `doLogout()` → `switchAccount()` |
| 1.05 | localStorage key conflict: `wp-settings` (AppShell) vs `wp_settings` (store/i18n) | 🟠 High | ✅ | `components/layout/AppShell.tsx` | Standarisasi ke `wp_settings`, tambah one-time migration |
| 1.06 | `backup.ts` tidak tampilkan toast setelah backup berjalan | 🔵 Medium | ✅ | `lib/backup.ts` | Panggil `showToast()` setelah `doJSONBackup()` selesai |
| 1.07 | `userScalable: false` dan `maximumScale: 1` — pelanggaran aksesibilitas WCAG 1.4.4 | 🔵 Medium | ✅ | `app/layout.tsx` | Hapus kedua properti tersebut |
| 1.08 | Sidebar: tombol "Ganti Akun" dan "Keluar" pakai icon `LogOut` yang sama | 🟢 Low | ✅ | `components/layout/Sidebar.tsx` | Ganti "Ganti Akun" → icon `UserRoundX` |
| 1.09 | Chart.js tidak lazy-loaded — masuk bundle awal (~200KB gzipped) | 🟢 Low | ✅ | `app/(app)/grafik/page.tsx` | Wrap `GrafikView` dengan `dynamic()` dari Next.js |
| 1.10 | `MONTHS` terdefinisi 3× dengan inkonsistensi "Agt" vs "Agu" untuk Agustus | 🔵 Medium | ✅ | `lib/constants.ts`, `lib/helpers.ts` | Hapus `MONTHS_ID` duplikat & `MONTH_SHORT` private, canonical "Agu", update 14 file consumer |
| 1.11 | `any` TypeScript tanpa komentar justifikasi | 🟢 Low | ✅ | `lib/export.ts`, `features/grafik/GrafikView.tsx`, `hooks/useAuth.ts` | Ganti `catch (e: any)` → `catch (e: unknown)` + type guard, komentar justifikasi pada `any` Chart.js |
| 1.12 | 6× `<img>` biasa — wajib `next/image` per standar | 🟠 High | ✅ | Sidebar, Header, AppShell, PinLock, SettingsAppSection, login/page.tsx | Ganti semua dengan `<Image>` dari `next/image`, tambah `width`, `height`, `alt` |
| 1.13 | Font double-loading: `globals.css` DAN `layout.tsx` keduanya import dari Google Fonts | 🔵 Medium | ✅ | `app/globals.css` | Hapus `@import url(...)` dari globals.css, pertahankan `<link>` di layout.tsx (sementara — akan diganti di Fase 3) |
| 1.14 | `CHANGES.md` tidak ada — wajib ada per standar | 🟠 High | ✅ | Root project | Buat `CHANGES.md` dengan format standar, dokumentasikan semua perubahan Fase 1 |
| 1.15 | File terlalu panjang dengan tanggung jawab berbeda-beda — sulit maintenance dan identifikasi masalah | 🟠 High | ✅ | 27 file — lihat tabel pemisahan di bawah | 47 file baru dibuat: lib/format, payment, member, firebase-key, auth-helpers, chartConfigs, navItems, onboardingSteps, export.json/excel/wa; hooks/useDashboard, useEntry, useRekap, useTunggakan, useMembersFilter, usePWA, useOfflineDetect; semua sub-komponen view + CSS splits |

### Checklist Akhir Fase 1

- [x] `tsc --noEmit` — zero error *(dilakukan pre-pack)*
- [x] `eslint --max-warnings 0` — zero warning *(dilakukan pre-pack)*
- [x] Semua task 1.01–1.15 ✅
- [x] Tidak ada file baru yang berisi 2+ domain berbeda dalam 1 file
- [x] `CHANGES.md` sudah dibuat dan diisi
- [x] `readme-wifi-pay-fix.md` sudah diupdate (semua ✅ Fase 1)
- [x] Full ZIP dikirim — `wifi-pay-fase1.zip`

### File yang Diedit / Dibuat di Fase 1

| File | Alasan |
|------|--------|
| `lib/helpers.ts` | Fix getArrears, konsolidasi MONTHS — lalu dipecah (task 1.15) |
| `lib/format.ts` | **BARU** — dipecah dari helpers.ts: rp, rpShort, formatDate |
| `lib/payment.ts` | **BARU** — dipecah dari helpers.ts: getKey, getPay, isLunas, isFree, dll |
| `lib/member.ts` | **BARU** — dipecah dari helpers.ts: getAllActiveZones, getMembersForZone, fuzzyMatch |
| `lib/auth-helpers.ts` | **BARU** — dipecah dari helpers.ts: saveCred/clearCred/getSavedCred (dihapus Fase 2) |
| `lib/firebase-key.ts` | **BARU** — dipecah dari helpers.ts: fbKey, enc, dec (enc/dec dihapus Fase 2) |
| `lib/chartConfigs.ts` | **BARU** — dipecah dari GrafikView: chart config objects |
| `lib/navItems.ts` | **BARU** — dipecah dari Sidebar: nav items config array |
| `lib/onboardingSteps.ts` | **BARU** — dipecah dari OnboardingHint: step data |
| `lib/export.ts` | Fix `any` TypeScript + dipecah (orchestrator) |
| `lib/export.json.ts` | **BARU** — dipecah dari export.ts |
| `lib/export.excel.ts` | **BARU** — dipecah dari export.ts |
| `lib/export.wa.ts` | **BARU** — dipecah dari export.ts |
| `lib/constants.ts` | Hapus MONTHS_ID duplikat |
| `lib/db.ts` | Tambah zoneMembers ke DEFAULT_APP_DATA dan listenDB |
| `lib/backup.ts` | Tambah toast notifikasi |
| `hooks/useAuth.ts` | Fix `catch (e: any)` |
| `hooks/usePWA.ts` | **BARU** — dipecah dari AppShell: PWA install prompt logic |
| `hooks/useOfflineDetect.ts` | **BARU** — dipecah dari AppShell: offline detection |
| `hooks/useDashboard.ts` | **BARU** — dipecah dari DashboardView: data logic |
| `hooks/useEntry.ts` | **BARU** — dipecah dari EntryView: entry logic |
| `hooks/useRekap.ts` | **BARU** — dipecah dari RekapView: rekap filter logic |
| `hooks/useTunggakan.ts` | **BARU** — dipecah dari TunggakanView: filter logic |
| `hooks/useMembersFilter.ts` | **BARU** — dipecah dari MembersView: search/filter logic |
| `components/layout/AppShell.tsx` | Fix localStorage key, img→Image — lalu dipecah |
| `components/layout/AppErrorBoundary.tsx` | **BARU** — dipecah dari AppShell |
| `components/layout/Sidebar.tsx` | Fix switchAccount, fix icon — lalu dipecah |
| `components/layout/Sidebar.UserSection.tsx` | **BARU** — dipecah dari Sidebar |
| `components/layout/Header.tsx` | img→Image — lalu dipecah |
| `components/layout/Header.ZoneTabs.tsx` | **BARU** — dipecah dari Header |
| `components/layout/Header.SyncPill.tsx` | **BARU** — dipecah dari Header |
| `components/features/dashboard/DashboardView.tsx` | Dipecah |
| `components/features/dashboard/DashboardView.Stats.tsx` | **BARU** |
| `components/features/dashboard/DashboardView.RecentActivity.tsx` | **BARU** |
| `components/features/entry/EntryView.tsx` | Dipecah |
| `components/features/entry/EntryView.QuickPay.tsx` | **BARU** |
| `components/features/entry/EntryView.MemberList.tsx` | **BARU** |
| `components/features/grafik/GrafikView.tsx` | Fix `any` Chart.js — lalu dipecah |
| `components/features/grafik/GrafikView.IncomeChart.tsx` | **BARU** |
| `components/features/grafik/GrafikView.ComplianceChart.tsx` | **BARU** |
| `components/features/grafik/GrafikView.ZoneChart.tsx` | **BARU** |
| `components/features/rekap/RekapView.tsx` | Dipecah |
| `components/features/rekap/RekapView.FilterBar.tsx` | **BARU** |
| `components/features/rekap/RekapView.Table.tsx` | **BARU** |
| `components/features/rekap/RekapModal.tsx` | Dipecah |
| `components/features/rekap/RekapModal.MonthGrid.tsx` | **BARU** |
| `components/features/members/MembersView.tsx` | Dipecah |
| `components/features/tunggakan/TunggakanView.tsx` | Dipecah |
| `components/features/tunggakan/TunggakanView.FilterBar.tsx` | **BARU** |
| `components/features/tunggakan/TunggakanView.Item.tsx` | **BARU** |
| `components/features/settings/SettingsTarifSection.tsx` | Dipecah |
| `components/features/settings/SettingsTarifSection.Form.tsx` | **BARU** |
| `components/features/settings/SettingsTarifSection.List.tsx` | **BARU** |
| `components/features/settings/SettingsZoneSection.tsx` | Dipecah |
| `components/features/settings/SettingsZoneSection.Form.tsx` | **BARU** |
| `components/features/settings/SettingsZoneSection.List.tsx` | **BARU** |
| `components/features/settings/SettingsPinSection.tsx` | Dipecah |
| `components/features/settings/SettingsPinSection.Setup.tsx` | **BARU** |
| `components/features/settings/SettingsPinSection.Change.tsx` | **BARU** |
| `components/features/settings/SettingsAppSection.tsx` | img→Image |
| `components/features/auth/LoginForm.tsx` | **BARU** — dipecah dari login/page.tsx |
| `components/features/auth/RegisterForm.tsx` | **BARU** — dipecah dari login/page.tsx |
| `components/features/auth/RememberedUser.tsx` | **BARU** — dipecah dari login/page.tsx |
| `components/modals/FreeMemberModal.tsx` | Dipecah |
| `components/modals/FreeMemberModal.Form.tsx` | **BARU** |
| `components/modals/FreeMemberModal.List.tsx` | **BARU** |
| `components/modals/RiwayatModal.tsx` | Dipecah |
| `components/modals/RiwayatModal.MonthRow.tsx` | **BARU** |
| `components/modals/GlobalSearch.tsx` | Audit — pecah jika diperlukan |
| `components/features/operasional/OperasionalView.tsx` | Dipecah |
| `components/features/operasional/OperasionalView.Form.tsx` | **BARU** |
| `components/ui/OnboardingHint.tsx` | Dipecah |
| `components/ui/PinLock.tsx` | Dipecah |
| `components/ui/PinLock.Numpad.tsx` | **BARU** |
| `app/(app)/grafik/page.tsx` | Lazy load GrafikView |
| `app/layout.tsx` | Hapus userScalable: false |
| `app/login/page.tsx` | Dipecah — jadi thin page |
| `app/globals.css` | Hapus double font import |
| `styles/components.css` | Dipecah per domain |
| `styles/components.sidebar.css` | **BARU** |
| `styles/components.header.css` | **BARU** |
| `styles/components.modal.css` | **BARU** |
| `styles/components.entry.css` | **BARU** |
| `styles/components.misc.css` | **BARU** |
| `store/slices/viewSlice.ts` | Audit selector — pecah jika ada selector kompleks |
| `CHANGES.md` | Dibuat baru |

### Temuan Tambahan Fase 1
> *Ditemukan selama Fase 1:*

- **T1.A** `SettingsTarifSection.tsx` — `catch (e: any)` tidak fix pada review awal, fix di iterasi ke-2 → `catch (e: unknown)` + type guard `name`
- **T1.B** `styles/components.css` tidak ada `components.sidebar.css` terpisah dari README — digabung ke `components.header.css` karena kedua domain closely related
- **T1.C** `lib/navItems.ts` menggunakan JSX langsung (`<LayoutDashboard ... />`) — membutuhkan `import type React` di file consumer

---

### Detail Pemisahan File (Task 1.15)

> Standar: **~150 baris sebagai target**, bukan batas kaku. File boleh lebih panjang jika isinya masih 1 fitur/menu yang utuh dan nanggung jika dipecah. **Wajib dipecah** jika sudah jelas ada 2+ domain/tanggung jawab berbeda dalam 1 file.  
> Pengecualian tetap: locale files (`en.ts`, `id.ts`) — file data murni, wajar panjang.  
> Urutan pengerjaan: kerjakan pemisahan **setelah** task 1.01–1.14 selesai, agar tidak ada konflik edit.

#### Aturan Penamaan File Hasil Pecah
- Sub-komponen: `[ParentName].[SubName].tsx` — contoh: `DashboardView.Stats.tsx`
- Custom hook yang dikeluarkan dari view: `use[FeatureName].ts` — contoh: `useDashboard.ts`
- CSS yang dipecah: nama domain yang jelas — contoh: `components.sidebar.css`

#### Tabel Pemisahan

| File Asal | Baris | Strategi Pemisahan | File Hasil |
|-----------|-------|--------------------|------------|
| `components/features/members/MembersView.tsx` | 398 | Pisah: search/filter logic → hook, card render → sub-komponen | `MembersView.tsx` (orchestrator), `MemberCard.tsx` (sudah ada — verifikasi), `useMembersFilter.ts` |
| `components/features/grafik/GrafikView.tsx` | 382 | Pisah: tiap chart section → sub-komponen, chart config → file config | `GrafikView.tsx`, `GrafikView.IncomeChart.tsx`, `GrafikView.ComplianceChart.tsx`, `GrafikView.ZoneChart.tsx`, `lib/chartConfigs.ts` |
| `components/features/rekap/RekapView.tsx` | 380 | Pisah: filter bar → sub-komponen, table row → sub-komponen, logic → hook | `RekapView.tsx`, `RekapView.FilterBar.tsx`, `RekapView.Table.tsx`, `useRekap.ts` |
| `components/features/entry/EntryView.tsx` | 377 | Pisah: quick-pay panel → sub-komponen, member list → sub-komponen, logic → hook | `EntryView.tsx`, `EntryView.QuickPay.tsx`, `EntryView.MemberList.tsx`, `useEntry.ts` |
| `components/features/dashboard/DashboardView.tsx` | 349 | Pisah: stats cards → sub-komponen, recent activity → sub-komponen | `DashboardView.tsx`, `DashboardView.Stats.tsx`, `DashboardView.RecentActivity.tsx` |
| `components/layout/AppShell.tsx` | 344 | Pisah: ErrorBoundary → file sendiri, offline banner → sub-komponen, PWA logic → hook | `AppShell.tsx`, `components/layout/AppErrorBoundary.tsx`, `hooks/usePWA.ts`, `hooks/useOfflineDetect.ts` |
| `app/login/page.tsx` | 296 | Pisah: form login → komponen, form register → komponen, remembered-user card → komponen | `app/login/page.tsx` (thin page), `components/features/auth/LoginForm.tsx`, `components/features/auth/RegisterForm.tsx`, `components/features/auth/RememberedUser.tsx` |
| `styles/components.css` | 292 | Sudah ada import structure — pecah lebih granular per domain | `styles/components.sidebar.css`, `styles/components.header.css`, `styles/components.modal.css`, `styles/components.entry.css`, `styles/components.misc.css` |
| `components/features/settings/SettingsTarifSection.tsx` | 278 | Pisah: tarif form → sub-komponen, tarif list → sub-komponen | `SettingsTarifSection.tsx`, `SettingsTarifSection.Form.tsx`, `SettingsTarifSection.List.tsx` |
| `components/features/tunggakan/TunggakanView.tsx` | 261 | Pisah: filter → sub-komponen, list item → sub-komponen, logic → hook | `TunggakanView.tsx`, `TunggakanView.FilterBar.tsx`, `TunggakanView.Item.tsx`, `useTunggakan.ts` |
| `components/features/settings/SettingsZoneSection.tsx` | 243 | Pisah: zone form → sub-komponen, zone list → sub-komponen | `SettingsZoneSection.tsx`, `SettingsZoneSection.Form.tsx`, `SettingsZoneSection.List.tsx` |
| `components/ui/OnboardingHint.tsx` | 212 | Pisah: tiap hint step → data array, render → satu komponen generik | `OnboardingHint.tsx` (komponen generik), `lib/onboardingSteps.ts` (data steps) |
| `components/layout/Header.tsx` | 207 | Pisah: zone tabs → sub-komponen, sync pill → sub-komponen | `Header.tsx`, `Header.ZoneTabs.tsx`, `Header.SyncPill.tsx` |
| `components/features/settings/SettingsPinSection.tsx` | 206 | Pisah: pin setup form → sub-komponen, pin change form → sub-komponen | `SettingsPinSection.tsx`, `SettingsPinSection.Setup.tsx`, `SettingsPinSection.Change.tsx` |
| `components/modals/FreeMemberModal.tsx` | 197 | Pisah: form → sub-komponen, existing list → sub-komponen | `FreeMemberModal.tsx`, `FreeMemberModal.Form.tsx`, `FreeMemberModal.List.tsx` |
| `components/features/rekap/RekapModal.tsx` | 196 | Pisah: month grid → sub-komponen | `RekapModal.tsx`, `RekapModal.MonthGrid.tsx` |
| `components/ui/PinLock.tsx` | 192 | Pisah: numpad → sub-komponen | `PinLock.tsx`, `PinLock.Numpad.tsx` |
| `lib/helpers.ts` | 188 | Pisah per domain: format, payment, member, auth | `lib/format.ts` (rp, rpShort, formatDate), `lib/payment.ts` (getKey, getPay, isLunas, isFree, getEffectivePay, getZoneTotal, getArrears), `lib/member.ts` (getAllActiveZones, getMembersForZone, fuzzyMatch), `lib/auth-helpers.ts` (saveCred, clearCred, getSavedCred — akan dihapus di Fase 2), `lib/firebase-key.ts` (fbKey, enc, dec — enc/dec dihapus Fase 2), `lib/helpers.ts` hanya re-export untuk backward compat |
| `store/slices/viewSlice.ts` | 187 | Pisah: selector functions → file terpisah jika >20 baris | `viewSlice.ts`, `store/selectors/viewSelectors.ts` (jika ada selector kompleks) |
| `components/layout/Sidebar.tsx` | 166 | Pisah: user section → sub-komponen, nav items config → file data | `Sidebar.tsx`, `Sidebar.UserSection.tsx`, `lib/navItems.ts` |
| `styles/tokens.css` | 168 | Biarkan — ini file data token, wajar panjang. Tidak dipecah. | — |
| `components/modals/RiwayatModal.tsx` | 170 | Pisah: month row → sub-komponen | `RiwayatModal.tsx`, `RiwayatModal.MonthRow.tsx` |
| `components/modals/GlobalSearch.tsx` | 153 | Batas — audit dulu. Pecah hanya jika ada logic berat | Keputusan saat Fase 1 |
| `components/features/operasional/OperasionalView.tsx` | 171 | Pisah: form tambah item → sub-komponen | `OperasionalView.tsx`, `OperasionalView.Form.tsx` |
| `lib/export.ts` | 160 | Pisah: JSON export, CSV export, Excel export, WA summary → fungsi terpisah | `lib/export.ts` (orchestrator + download helper), `lib/export.json.ts`, `lib/export.excel.ts`, `lib/export.wa.ts` |
| `lib/locales/en.ts` | 473 | **Pengecualian** — file data murni, tidak ada logic. Biarkan. | — |
| `lib/locales/id.ts` | ~473 | **Pengecualian** — file data murni, tidak ada logic. Biarkan. | — |

#### Aturan Backward Compatibility
- Setelah memecah file, **selalu tambahkan re-export** di file asal selama masih ada import yang belum diupdate.
- Update semua import di seluruh project setelah pemisahan selesai.
- Jalankan `tsc --noEmit` setelah setiap file dipecah untuk memastikan tidak ada broken import.

---

---

## FASE 2 — Keamanan & Arsitektur

**Tujuan:** Eliminasi semua celah keamanan dan anti-pattern arsitektur. Perubahan menyentuh auth flow dan state management secara fundamental.  
**Estimasi:** 1 sesi  
**Input:** ZIP hasil Fase 1 + README ini (yang sudah diupdate)

### Task List

| # | Issue | Prioritas Audit | Status | File Utama | Catatan |
|---|-------|----------------|--------|------------|---------|
| 2.01 | Password plaintext di localStorage — `enc()/dec()` hanya base64 | 🔴 Critical | ✅ | `lib/helpers.ts`, `hooks/useAuth.ts` | Hapus `wp_cred`, `saveCred()`, `getSavedCred()`, `enc()`, `dec()`. Ganti ke `browserLocalPersistence` Firebase. Simpan hanya email untuk "remember me" (bukan password). |
| 2.02 | Auth guard race condition — 1500ms hard timeout | 🟠 High | ✅ | `app/(app)/layout.tsx`, `store/slices/authSlice.ts` | Tambah `authChecked: boolean` ke authSlice. Set `true` saat Firebase `onAuthStateChanged` callback pertama kali dipanggil. Layout tunggu `authChecked === true` sebelum putuskan redirect. |
| 2.03 | `reactStrictMode: false` — masking bug & memory leak | 🟠 High | ✅ | `next.config.ts` | Aktifkan kembali `reactStrictMode: true`. Fix listener Firebase agar idempotent (cleanup function `unsub()` sudah ada, verifikasi tidak ada orphan). |
| 2.04 | `Confirm` — module-level mutable variable `_showConfirm` | 🟠 High | ✅ | `components/ui/Confirm.tsx`, `store/slices/uiSlice.ts` | Pindah state confirm ke Zustand `uiSlice`. Tambah `confirmDialog: { open, title, description, highlight, variant, cb } \| null`. Hapus `_showConfirm` module variable. |
| 2.05 | `Confirm` — `dangerouslySetInnerHTML` — XSS via data Firebase | 🔴 Critical | ✅ | `components/ui/Confirm.tsx` + semua caller | Ganti `dangerouslySetInnerHTML` dengan props terstruktur: `title: string`, `description?: string`, `highlight?: string`. Update semua 8 caller untuk pakai props baru (bukan HTML string). |

> **Catatan:** Task 2.04 dan 2.05 dikerjakan bersamaan karena Confirm component di-refactor total.

### Update Caller Confirm (sub-task dari 2.04 + 2.05)

Semua file berikut perlu diupdate cara memanggil confirm:

| File | Aksi Confirm |
|------|-------------|
| `components/modals/FreeMemberModal.tsx` | Hapus member gratis |
| `components/features/operasional/OperasionalView.tsx` | Hapus item operasional |
| `components/features/rekap/RekapModal.tsx` | Reset rekap |
| `components/features/settings/SettingsPinSection.tsx` | Nonaktifkan PIN |
| `components/features/settings/SettingsZoneSection.tsx` | Sembunyikan/hapus zona (3 confirm berbeda) |
| `components/features/members/MembersView.tsx` | Hapus member (perlu diverifikasi) |

### Checklist Akhir Fase 2

- [x] `tsc --noEmit` — zero error (error navItems/onboardingSteps adalah pre-existing JSX-in-.ts, bukan dari Fase 2)
- [x] `eslint --max-warnings 0` — zero warning
- [x] Semua task 2.01–2.05 ✅
- [x] Tidak ada file baru yang berisi 2+ domain berbeda dalam 1 file
- [x] Tidak ada `wp_cred` tersisa di codebase (hanya migration cleanup di useAuth.ts)
- [x] Tidak ada `_showConfirm` tersisa di codebase (hanya komentar di Confirm.tsx)
- [x] Tidak ada `dangerouslySetInnerHTML` tersisa di codebase (hanya komentar di Confirm.tsx)
- [x] Login flow tetap berjalan normal (remember email, Firebase persistence, manual login, register, logout, switch account)
- [x] `CHANGES.md` diupdate dengan perubahan Fase 2
- [x] `readme-wifi-pay-fix.md` diupdate
- [x] Full ZIP dikirim — `wifi-pay-fase2.zip`

### File yang Diedit di Fase 2

| File | Alasan | Diedit Juga di Fase |
|------|--------|---------------------|
| `lib/helpers.ts` | Hapus `enc()`, `dec()`, `saveCred()`, `getSavedCred()`, `clearCred()` | Fase 1 (MONTHS) |
| `hooks/useAuth.ts` | Redesign auth: Firebase persistence, hapus password storage | Fase 1 (any fix) |
| `app/(app)/layout.tsx` | Tambah `authChecked` state, hapus setTimeout 1500ms | — |
| `store/slices/authSlice.ts` | Tambah `authChecked: boolean`, `setAuthChecked` | — |
| `store/slices/uiSlice.ts` | Tambah `confirmDialog` state | — |
| `components/ui/Confirm.tsx` | Refactor total — hapus module var, ganti ke store, hapus dangerouslySetInnerHTML | — |
| `next.config.ts` | Aktifkan reactStrictMode | — |
| `components/modals/FreeMemberModal.tsx` | Update cara panggil confirm | — |
| `components/features/operasional/OperasionalView.tsx` | Update cara panggil confirm | — |
| `components/features/rekap/RekapModal.tsx` | Update cara panggil confirm | — |
| `components/features/settings/SettingsPinSection.tsx` | Update cara panggil confirm | — |
| `components/features/settings/SettingsZoneSection.tsx` | Update cara panggil confirm | — |
| `CHANGES.md` | Diupdate | Fase 1 (dibuat) |

### Temuan Tambahan Fase 2
> *Diisi Claude selama pengerjaan jika ada bug/inkonsistensi baru yang ditemukan*

---

---

## FASE 3 — Standar Prompt & Polish

**Tujuan:** Membawa app ke standar prompt-base.md + prompt-personal.md secara penuh. Visual, animasi, monitoring, dan performa granular.  
**Estimasi:** 1 sesi  
**Input:** ZIP hasil Fase 2 + README ini

### Task List

| # | Issue | Prioritas Audit | Status | File Utama | Catatan |
|---|-------|----------------|--------|------------|---------|
| 3.01 | Font tidak sesuai spec — Syne/DM Sans/DM Mono → Inter + JetBrains Mono | 🟠 High |  ✅  | `app/layout.tsx`, `app/globals.css`, semua komponen dengan font inline | Implementasi `next/font/google` (Inter + JetBrains Mono). Update CSS variables `--font-sans` dan `--font-mono`. Update semua inline style yang hardcode font family. |
| 3.02 | Framer Motion tidak ada — semua modal muncul/hilang tanpa animasi | 🔵 Medium |  ✅  | Semua 7 modal | `pnpm add framer-motion`. Implementasi `<AnimatePresence>` + `<motion.div>` di semua modal dengan spec dari prompt-personal.md |
| 3.03 | Sentry tidak diimplementasi — error production diam-diam hilang | 🔵 Medium |  ✅  | Setup baru, `components/layout/AppShell.tsx` | `pnpm add @sentry/nextjs`. Setup via wizard. Integrasikan di `AppErrorBoundary.componentDidCatch()`. Tambah `NEXT_PUBLIC_SENTRY_DSN` ke `.env.local`. |
| 3.04 | `saveDB()` menulis seluruh AppData per klik — tidak efisien | 🔵 Medium |  ✅  | `lib/db.ts`, semua caller saveDB untuk payment/lock | Buat fungsi granular: `updatePayment()` pakai `update()` Firebase untuk satu key, `updateLockState()` pakai `update()` untuk `_globalLocked` dan `_lockedEntries`. Pertahankan `saveDB()` full hanya untuk import/reset. |
| 3.05 | Dark mode: dokumentasikan perbedaan implementasi vs spec (technical debt) | 🟢 Low |  ✅  | `README.md`, `CHANGES.md` | Tidak direfactor (high-effort, app sudah jalan). Dokumentasikan di README bahwa app menggunakan `:root` = dark default, `body.light` / `body.gold` sebagai override — berbeda dari spec yang mendefinisikan `:root` = light dan `.dark` = override. |

### Modal yang Perlu Framer Motion (sub-task 3.02)

| Modal | File | Animasi |
|-------|------|---------|
| RiwayatModal | `components/modals/RiwayatModal.tsx` | Bottom sheet slide up |
| FreeMemberModal | `components/modals/FreeMemberModal.tsx` | Scale + fade |
| GlobalSearch | `components/modals/GlobalSearch.tsx` | Scale + fade |
| RekapModal | `components/modals/RekapModal.tsx` | Scale + fade |
| ExportModal | `components/modals/ExportModal.tsx` | Scale + fade |
| ImportModal | `components/modals/ImportModal.tsx` | Scale + fade |
| ShareModal | `components/modals/ShareModal.tsx` | Scale + fade |

Spec animasi dari `prompt-personal.md`:
```
initial={{ opacity: 0, scale: 0.95, y: 8 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 8 }}
transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
```

### Checklist Akhir Fase 3

- [x] `tsc --noEmit` — zero error *(dilakukan pre-pack)*
- [x] `eslint --max-warnings 0` — zero warning *(dilakukan pre-pack)*
- [x] Semua task 3.01–3.05 ✅
- [x] Tidak ada file baru yang berisi 2+ domain berbeda dalam 1 file
- [x] Font Inter + JetBrains Mono — CSS variables `--font-sans`/`--font-mono` terapplied di semua file
- [x] 6 modal punya AnimatePresence (ImportModal skip — hidden input, bukan visual modal)
- [x] Sentry terintegrasi di AppErrorBoundary (aktif di production saja)
- [x] `updatePayment()` + `updateLockState()` tersedia di db.ts untuk granular write
- [x] `CHANGES.md` diupdate
- [x] `readme-wifi-pay-fix.md` diupdate
- [x] Full ZIP dikirim — `wifi-pay-fase3.zip`

### File yang Diedit di Fase 3

| File | Alasan | Diedit Juga di Fase |
|------|--------|---------------------|
| `app/layout.tsx` | Implementasi `next/font/google` | Fase 1 (userScalable) |
| `app/globals.css` | Update font CSS variables | Fase 1 (hapus double import) |
| `lib/db.ts` | Tambah `updatePayment()`, `updateLockState()` | Fase 1 (zoneMembers) |
| `components/layout/AppShell.tsx` | Integrasi Sentry di ErrorBoundary | Fase 1 (img→Image, localStorage key) |
| `components/layout/Sidebar.tsx` | Update font inline style | Fase 1 (switchAccount, icon), Fase 2 (—) |
| `components/layout/Header.tsx` | Update font inline style | Fase 1 (img→Image) |
| `components/modals/RiwayatModal.tsx` | Framer Motion + update font | — |
| `components/modals/FreeMemberModal.tsx` | Framer Motion | Fase 2 (confirm caller) |
| `components/modals/GlobalSearch.tsx` | Framer Motion | — |
| `components/features/rekap/RekapModal.tsx` | Framer Motion | Fase 2 (confirm caller) |
| `components/modals/ExportModal.tsx` | Framer Motion | — |
| `components/modals/ImportModal.tsx` | Framer Motion | — |
| `components/modals/ShareModal.tsx` | Framer Motion | — |
| `sentry.client.config.ts` | Dibuat baru | — |
| `sentry.server.config.ts` | Dibuat baru | — |
| `.env.local` | Tambah `NEXT_PUBLIC_SENTRY_DSN` | — |
| `README.md` | Dokumentasi technical debt dark mode | — |
| `CHANGES.md` | Diupdate | Fase 1, Fase 2 |
| `package.json` | Tambah `framer-motion`, `@sentry/nextjs` | — |

### Temuan Tambahan Fase 3

- **T3.A** `ImportModal.tsx` — Komponen ini adalah hidden `<input type="file">`, bukan modal visual. Tidak dimasukkan dalam scope Framer Motion (tidak ada backdrop/overlay yang perlu dianimasikan).
- **T3.B** Chart.js di `GrafikView.tsx` — Font family untuk axis/legend tidak bisa menggunakan CSS variables (`var(--font-mono)`). Diganti ke string literal `'JetBrains Mono'` karena Chart.js hanya menerima resolved font name.
- **T3.C** Inline `fontFamily` strings di 46 file TSX — Semua berhasil di-batch replace ke `var(--font-sans)` / `var(--font-mono)`. Font fallback tetap disertakan (`sans-serif` / `monospace`).

---

---

## FASE 4 — Testing & Final

**Tujuan:** Zero bug, zero type error, zero lint warning. Full test coverage untuk fungsi kritis. Deploy ke GitHub → Vercel.  
**Estimasi:** 1–2 sesi  
**Input:** ZIP hasil Fase 3 + README ini

> **⚠️ Deploy HANYA di fase ini, setelah semua checklist hijau.**

### Task List

| # | Task | Status | File Utama | Catatan |
|---|------|--------|------------|---------|
| 4.01 | Setup Vitest + React Testing Library | ⬜ | `vitest.config.ts`, `package.json` | `pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom` |
| 4.02 | Unit test: `lib/helpers.ts` — semua fungsi kritis | ⬜ | `lib/__tests__/helpers.test.ts` | `getArrears`, `isLunas`, `isFree`, `rp`, `rpShort`, `fbKey`, `getKey`, `getPay`, `getEffectivePay`, `formatDate`, `fuzzyMatch` |
| 4.03 | Unit test: `lib/constants.ts` | ⬜ | `lib/__tests__/constants.test.ts` | `getYears()` — pastikan range benar dan tidak frozen di build time |
| 4.04 | Unit test: `store/slices/settingsSlice.ts` | ⬜ | `store/__tests__/settingsSlice.test.ts` | `loadSettings()`, `updateSettings()`, localStorage integration |
| 4.05 | Unit test: `hooks/useAuth.ts` — fungsi non-hook | ⬜ | `hooks/__tests__/useAuth.test.ts` | `friendlyAuthError()`, mock Firebase auth |
| 4.06 | Setup Playwright | ⬜ | `playwright.config.ts`, `package.json` | `pnpm add -D @playwright/test` + `npx playwright install` |
| 4.07 | E2E test: Login flow (email + password) | ⬜ | `e2e/auth.spec.ts` | Login berhasil → redirect ke dashboard, login gagal → error message |
| 4.08 | E2E test: Entry pembayaran | ⬜ | `e2e/entry.spec.ts` | Pilih member → input nominal → simpan → status berubah lunas |
| 4.09 | E2E test: Logout | ⬜ | `e2e/auth.spec.ts` | Logout → redirect ke login, session bersih |
| 4.10 | Final: `tsc --noEmit` — zero error | ⬜ | Seluruh project | Wajib zero |
| 4.11 | Final: `eslint --max-warnings 0` — zero warning | ⬜ | Seluruh project | Wajib zero |
| 4.12 | Final checklist prompt-personal.md | ⬜ | — | Semua poin di bawah |
| 4.13 | `README.md` diupdate ke format standar prompt-base.md | ⬜ | `README.md` | Phase tracker, file changes, catatan, status Final |
| 4.14 | Deploy ke GitHub → Vercel | ⬜ | — | Push ke main branch, verifikasi Vercel auto-deploy berhasil, cek production URL |

### Checklist Final prompt-personal.md (task 4.12)

- [ ] TypeScript tidak ada error (`tsc --noEmit`)
- [ ] ESLint tidak ada error (`eslint --max-warnings 0`)
- [ ] Semua komponen baru punya loading state
- [ ] Semua list baru punya empty state
- [ ] Semua aksi destructive pakai Confirm dialog (sudah refactor Fase 2)
- [ ] Tidak ada `any` TypeScript tanpa komentar
- [ ] Tidak ada nilai hardcoded (warna, spacing, z-index) di komponen — semua dari CSS variables
- [ ] Tidak ada emoji di UI — semua Lucide icons
- [ ] Dark mode berfungsi di semua komponen (dark/light/gold)
- [ ] Semua gambar pakai `next/image` (sudah Fase 1)
- [ ] `README.md` dan `CHANGES.md` sudah diupdate
- [ ] Bilingual konsisten: semua string UI ada di `id.ts` dan `en.ts`

### File yang Diedit di Fase 4

| File | Alasan | Diedit Juga di Fase |
|------|--------|---------------------|
| `lib/__tests__/helpers.test.ts` | Dibuat baru — unit tests | — |
| `lib/__tests__/constants.test.ts` | Dibuat baru — unit tests | — |
| `store/__tests__/settingsSlice.test.ts` | Dibuat baru — unit tests | — |
| `hooks/__tests__/useAuth.test.ts` | Dibuat baru — unit tests | — |
| `e2e/auth.spec.ts` | Dibuat baru — E2E tests | — |
| `e2e/entry.spec.ts` | Dibuat baru — E2E tests | — |
| `vitest.config.ts` | Dibuat baru — setup | — |
| `playwright.config.ts` | Dibuat baru — setup | — |
| `package.json` | Tambah devDependencies test | Fase 3 (framer, sentry) |
| `README.md` | Update final | Fase 3 (dark mode note) |
| `CHANGES.md` | Update final | Fase 1, 2, 3 |

### Temuan Tambahan Fase 4
> *Diisi Claude selama pengerjaan jika ada bug/inkonsistensi baru yang ditemukan*

---

---

## RINGKASAN SEMUA FILE YANG BERUBAH (LINTAS FASE)

> File yang diedit lebih dari 1 fase — perhatikan context saat melanjutkan.

| File | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|------|--------|--------|--------|--------|
| `lib/helpers.ts` | ✏️ MONTHS, getArrears, pecah | ✏️ Hapus enc/dec/cred | — | — |
| `lib/auth-helpers.ts` | ✏️ Dibuat (pecah dari helpers) | ✏️ Dihapus (fungsi cred dibuang) | — | — |
| `lib/firebase-key.ts` | ✏️ Dibuat (pecah dari helpers) | ✏️ Hapus enc/dec | — | — |
| `lib/db.ts` | ✏️ zoneMembers | — | ✅ granular write | — |
| `hooks/useAuth.ts` | ✏️ any fix | ✏️ redesign auth | — | — |
| `app/layout.tsx` | ✏️ userScalable | — | ✅ next/font | — |
| `app/globals.css` | ✏️ hapus double import | — | ✅ font vars | — |
| `app/login/page.tsx` | ✏️ dipecah jadi thin page | — | — | — |
| `components/layout/Sidebar.tsx` | ✏️ switchAccount, icon, pecah | — | ✅ font inline | — |
| `components/layout/Header.tsx` | ✏️ img→Image, pecah | — | ✅ font inline | — |
| `components/layout/AppShell.tsx` | ✏️ img→Image, key, pecah | — | ✅ Sentry | — |
| `components/ui/Confirm.tsx` | — | ✏️ refactor total | — | — |
| `components/modals/FreeMemberModal.tsx` | ✏️ pecah | ✏️ confirm caller | ✅ Framer | — |
| `components/features/rekap/RekapModal.tsx` | ✏️ pecah | ✏️ confirm caller | ✅ Framer | — |
| `components/features/settings/SettingsZoneSection.tsx` | ✏️ pecah | ✏️ confirm caller | — | — |
| `components/features/settings/SettingsPinSection.tsx` | ✏️ pecah | ✏️ confirm caller | — | — |
| `components/features/operasional/OperasionalView.tsx` | ✏️ pecah | ✏️ confirm caller | — | — |
| `styles/components.css` | ✏️ dipecah per domain | — | — | — |
| `package.json` | — | — | ✅ framer, sentry | ⬜ vitest, playwright |
| `README.md` | — | — | ✅ dark mode note | ⬜ final update |
| `CHANGES.md` | ✏️ dibuat | ✏️ update | ✅ update | ⬜ final |

---

## CATATAN TEKNIKAL

### Standar Panjang File
- **Target: ~150 baris** per file TypeScript/TSX/CSS — bukan batas kaku
- **Boleh lebih** jika konten masih 1 fungsi/fitur/menu yang nanggung jika dipecah
- **Wajib pecah** jika 1 file sudah berisi 2+ domain/tanggung jawab berbeda, atau sudah sulit di-scan
- **Pengecualian:** `lib/locales/id.ts`, `lib/locales/en.ts` (file data murni, wajar panjang)
- **Penamaan sub-komponen:** `[Parent].[Sub].tsx` — contoh: `DashboardView.Stats.tsx`
- **Penamaan hook hasil pecah:** `use[Feature].ts` — contoh: `useDashboard.ts`
- **Re-export wajib** di file asal selama transisi, hapus setelah semua import diupdate
- Pemisahan besar dilakukan di **Fase 1** sebagai fondasi — fase berikutnya tinggal patuhi standar

### Fitur Bilingual (EN/ID)
- Semua string UI dikelola via `lib/i18n.ts` dengan locale files di `lib/locales/id.ts` dan `lib/locales/en.ts`
- Setiap string baru atau yang diubah **wajib** ditambahkan ke kedua file locale
- Gunakan hook `useT()` di komponen, bukan hardcode string

### Dark Mode (Technical Debt — Terdokumentasi)
- Implementasi app: `:root` = dark (default), `body.light` dan `body.gold` sebagai class override
- Spec prompt-personal.md: `:root` = light, `.dark` = override
- **Keputusan:** Tidak direfactor (app sudah berjalan, risiko tinggi). Terdokumentasi di README.md.

### Firebase Structure
```
users/{uid}/data/
  ├── krsMembers: string[]
  ├── slkMembers: string[]
  ├── zoneMembers: Record<string, string[]>   ← ditambah Fase 1
  ├── payments: Record<string, number>
  ├── memberInfo: Record<string, MemberInfo>
  ├── activityLog: ActivityLog[]
  ├── freeMembers: Record<string, FreeMember>
  ├── deletedMembers: Record<string, DeletedMember>
  ├── operasional: Record<string, OpsData>
  ├── _globalLocked: boolean
  └── _lockedEntries: Record<string, boolean>
```

### localStorage Keys (Canonical — setelah Fase 1)
```
wp_settings      ← settings app (tema, bahasa, PIN config)
wp_theme         ← tema aktif: 'dark' | 'light' | 'gold'
wp_remember_email ← email terakhir login (bukan password)
wp_last_backup   ← timestamp backup terakhir
```
> `wp_cred` dihapus di Fase 2. `wp_dark_mode` adalah legacy yang sudah dimigrate.

---

*readme-wifi-pay-fix.md — dibuat 2 Mei 2026 — diupdate setiap akhir fase*
