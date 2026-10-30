# REDESAIN-MANIFEST.md — WiFi Pay redesain UI/UX

Berkas koordinasi antar-tahap (kontrak T0 bagian 9 butir 5). Dipindah ke `docs/` di T11 (selesai).
**Status terakhir: v11.10.1 (pembaruan keamanan Next.js 16.4.3 di atas T13; lihat bagian 17). Sebelumnya TAHAP 13 selesai (menerapkan hasil uji prototipe R1–R17 ke zip produksi, v11.10.0; lihat bagian 16). Sebelumnya TAHAP 12 selesai (FITUR: Periode Member — Free multi-periode, Terdaftar sejak, Nonaktif/Reaktivasi — + perbaikan tanggal bayar; lihat bagian 15). Sebelumnya TAHAP 11: verifikasi + pembersihan + zip final (bagian 14)** · `APP_VERSION` = **v11.10.1** (patch pembaruan Next.js; v11.10.0 di T13; sebelumnya v11.9.0 di T12; README punya entri baru paling atas).
Zip asal: `wifi-pay-perfectionist-main.zip` (v11.7.1, tidak ditimpa) → T6: `wifi-pay-redesain-T6.zip` → T7: `wifi-pay-redesain-T7.zip` (tidak ditimpa) → T8: `wifi-pay-redesain-T8.zip` (tidak ditimpa) → T9: `wifi-pay-redesain-T9.zip` (tidak ditimpa) → T10: `wifi-pay-redesain-T10.zip` → T11: `wifi-pay-perfectionist-v11_8_0.zip` → T12: `wifi-pay-perfectionist-v11_9_0.zip` → T13: `wifi-pay-perfectionist-v11_10_0.zip` → zip ini: `wifi-pay-perfectionist-v11_10_1.zip`.

---

## 1. Baseline & gerbang kualitas

| Gerbang | Baseline v11.7.1 | Akhir T6 | Akhir T7 | Akhir T8 |
|---|---|---|---|---|
| `tsc --noEmit` | bersih | bersih | bersih | bersih |
| `eslint .` (seluruh proyek) | bersih | bersih | bersih | bersih |
| `vitest run` | 274 test / 13 file | 338 / 19 | 411 / 24 | **481 test / 28 file** lulus |
| test i18n (`lib/__tests__/i18n-and-ui-consistency.test.ts`) | 18 lulus | 18 | 18 | 18 lulus |
| `RekapView.pagination.test.tsx` | 14 | 14 | 14 | 14 lulus (file tidak diubah) |
| `pnpm audit` (info; dependensi tidak diubah di T6–T8) | — | — | — | 30 temuan (1 kritis, 11 tinggi, 11 sedang, 7 rendah) pada 15 Okt 2026; `package.json` dan `pnpm-lock.yaml` IDENTIK dengan zip T7, jadi ini advisori baru, bukan regresi T8. Lihat bagian 9, "Dari T8" butir 8 |
| `next build` mentah | GAGAL (lingkungan: `next/font/google` tak bisa unduh dari fonts.googleapis.com di sandbox) | GAGAL, sebab sama | GAGAL, sebab sama | GAGAL, sebab sama: tepat 2 galat, keduanya "Failed to fetch Inter / JetBrains Mono from Google Fonts" (bukan kesalahan kode) |
| `next build` font di-stub pada salinan sementara + env Firebase dummy | lulus | lulus (14 rute) | lulus (14 rute) | lulus (exit 0, 16/16 halaman statis, `/rekap` dan `/tunggakan` ada). `app/layout.tsx` dikembalikan persis (md5 sama dengan zip T7) |

**Baseline test sebelum T9 = 481; baseline untuk T10 = 591 (bagian 1b; jumlah tidak boleh turun).** Rincian penambahan T8: +15 `rekap/rekap.logic` (filter status A15, jenis sel, total, paginasi, pengaman batch), +11 `hooks/useTunggakan.compute` (zona kustom, mode TOTAL, aging, A16, A19), +27 `features/t8-screens` (render Rekap, Tunggakan, RiwayatModal), +17 `redesign-t8-guard` = +70.
Cara menjalankan build uji: salin proyek (tanpa `.next`), ganti baris `import { Inter, JetBrains_Mono } from 'next/font/google'` di `app/layout.tsx` dengan stub `() => ({ variable, className: '' })`, isi 7 env `NEXT_PUBLIC_FIREBASE_*` dummy, jalankan `next build`, lalu kembalikan layout. Di Vercel (jaringan normal) build mentah berjalan biasa. Sandbox T8: `pnpm` tidak ada bawaan → `npm i -g pnpm@10` (terpasang 9.15.9 sesuai `packageManager`), `pnpm install --frozen-lockfile`.
**Tampilan belum diverifikasi secara visual** (browser tidak bisa dipasang di sandbox). Yang terverifikasi: tipe, lint, test DOM (perilaku, aria, kelas), build. Mohon cek visual di perangkat: tema Terang/Gelap/Emas, mobile 380px dan desktop (2 kolom daftar Tunggakan), mode Bottom Nav dan Sidebar. Khusus Rekap: header dan kolom `#`/Nama yang menempel di dalam kartu tabel (scroll dua arah) — cek di Chrome Android dan Safari iOS (mekanisme lama "tabel header terpisah + sinkron scroll" dihapus, lihat bagian 11e butir 6).

### 1b. Gerbang akhir T9 (apa adanya)

| Gerbang | Akhir T8 | Akhir T9 |
|---|---|---|
| `tsc --noEmit` | bersih | bersih |
| `eslint .` (seluruh proyek) | bersih | bersih |
| `vitest run` | 481 test / 28 file | **591 test / 33 file** lulus (+110) |
| test i18n (`i18n-and-ui-consistency.test.ts`) | 18 | 18 lulus (tidak diubah) |
| `next build` mentah | GAGAL (2 galat font) | GAGAL, sebab sama: tepat 2 galat, "Failed to fetch Inter / JetBrains Mono from Google Fonts" (batasan jaringan sandbox, bukan kode) |
| `next build` font di-stub + env Firebase dummy (dijalankan di folder proyek, layout dikembalikan) | lulus (16 halaman) | lulus (exit 0, 16/16 halaman statis; `/members` dan `/grafik` ada). `app/layout.tsx` dikembalikan persis (md5 `26d6279d179ef6debbaf3f821ab57296`, sama dengan zip T8) |
| `pnpm audit` (info) | 30 temuan | 30 temuan (1 kritis, 11 tinggi, 11 sedang, 7 rendah); `package.json` dan `pnpm-lock.yaml` TIDAK diubah di T9 |

Rincian +110: +10 `lib/zone-members` (setMembersForZone, getZoneTotal zona kustom, 2–5 zona), +30 `members/members.logic` (urutan 6 mode, cari A21, tambah/edit/hapus/pulihkan/hapus permanen, zona kustom 1–5), +16 `grafik/grafik.logic` (total zona, proyeksi, persen, komposisi, A25/A26, compactRp), +33 `features/t9-screens` (render Member, FreeMemberModal, Grafik; Confirm/Toast dipantau lewat mock), +21 `redesign-t9-guard`.
**Tampilan belum diverifikasi secara visual** (browser tidak bisa dipasang di sandbox). Yang terverifikasi: tipe, lint, test DOM (perilaku, aria, kelas, data grafik lewat mock `react-chartjs-2`), build. Mohon cek visual di perangkat: tema Terang/Gelap/Emas, mobile 380px dan desktop (daftar Member 2 kolom, Grafik 2 kolom), mode Bottom Nav dan Sidebar; khusus Grafik: kanvas Chart.js (label sumbu ringkas jt/rb, tooltip "Rp …", donat, warna zona kustom).

---

### 1c. Gerbang akhir T10 (apa adanya)

| Gerbang | Akhir T9 | Akhir T10 |
|---|---|---|
| `tsc --noEmit` | bersih | bersih |
| `eslint .` (seluruh proyek) | bersih | bersih |
| `vitest run` | 591 test / 33 file | **701 test / 39 file** lulus (+110; jumlah tidak turun) |
| test i18n (`i18n-and-ui-consistency.test.ts`) | 18 | 18 lulus (tidak diubah; `SettingsView.tsx` tetap memuat literal `badgeColor="var(--c-lunas)"` dua kali) |
| `PinLock.test.tsx` (test lama, DOM 6 slot) | lulus | lulus (tidak diubah) |
| `next build` mentah | GAGAL (2 galat font) | GAGAL, sebab sama: batasan jaringan sandbox untuk `fonts.googleapis.com` (bukan kode) |
| `next build` font di-stub + env Firebase dummy (folder proyek, layout dikembalikan) | lulus (16 halaman) | lulus (exit 0; 16/16 halaman statis; `/log`, `/operasional`, `/settings` ada). `app/layout.tsx` dikembalikan persis (md5 `26d6279d179ef6debbaf3f821ab57296`); `.env.local` dan `.next` dihapus |
| `package.json` / `pnpm-lock.yaml` | — | IDENTIK dengan zip T9 (md5 sama); dependensi tidak diubah |

Rincian +110: +20 `log/log.logic` (A27 klasifikasi, filter, A29 statistik, grup per hari, A28 cari ts), +8 `operasional/operasional.logic` (ringkasan zona kustom, nominal, edit), +8 `notifications/notifications.logic` (A3), +14 `lib/t10-zone-fixes` (Import zoneMembers + zona terdaftar, Export per zona, Ringkasan WA, daftar zona bersama), +36 `features/t10-screens` (render Log/Operasional/Pengaturan/Notifikasi/Import/Panduan), +24 `lib/redesign-t10-guard` (penjaga mutu).
**Tampilan belum diverifikasi secara visual** (browser tidak bisa dipasang di sandbox). Yang terverifikasi: tipe, lint, test DOM (perilaku, aria, data), build uji. Mohon cek visual di perangkat: tema Terang/Gelap/Emas, mobile 380px dan desktop, mode Bottom Nav dan Sidebar; layar baru: Log (grup per hari, sheet Detail dan Statistik), Operasional (menu titik tiga, sheet), Pengaturan (6 grup + halaman isi), panel Notifikasi, layar kunci PIN, Panduan awal.

---

## 2. Peta kepemilikan file per tahap

Aturan: tiap tahap hanya mengubah file miliknya. File bersama (token, `components/ui`, shell) hanya T6; setelah itu hanya lewat "revisi eksplisit" yang dicatat di bagian 7.

| Pemilik | File |
|---|---|
| **T6 (selesai)** | `styles/*` (tokens, ui, layout, components.header, components.misc [bagian Splash/Login], reset), `app/globals.css`, `lib/design-tokens.ts`, `lib/navItems.tsx`, `store/slices/uiSlice.ts` (hanya A1/A2), `components/ui/*` **kecuali** PinLock*, OnboardingHint, `components/layout/*`, `components/features/auth/*`, `app/login/*`, `app/offline/*`, `public/offline.html`, `e2e/*` (selector login) |
| **T7** | `components/features/dashboard/*`, `components/features/entry/*`, **`components/features/members/MemberCard.tsx`** (hanya diimpor Entry; serah-terima T2 §3 + T4 tabel), `app/(app)/dashboard/*`, `app/(app)/entry/*` |
| **T8** | `components/features/rekap/*` (termasuk RekapModal*), `components/features/tunggakan/*`, `components/modals/RiwayatModal*`, `app/(app)/rekap/*`, `app/(app)/tunggakan/*` |
| **T9 (selesai)** | `components/features/members/{MembersView*.tsx, members.logic.ts, members.module.css}` (MemberCard.tsx milik T7), `components/features/grafik/*`, `components/modals/{FreeMemberModal*.tsx, freeMember.module.css}`, `app/(app)/members/*`, `app/(app)/grafik/*`; revisi eksplisit: `lib/payment.ts` (getZoneTotal), `lib/member.ts` + `lib/helpers.ts` (setMembersForZone), `lib/locales/{id,en}.ts` (blok T9) |
| **T10** | `components/features/log/*`, `components/features/operasional/*`, `components/features/settings/*`, `components/modals/{AccountModal,ExportModal,ImportModal,ShareModal}.tsx`, `components/ui/{PinLock,PinLock.Numpad,OnboardingHint}.tsx`, `app/(app)/{log,operasional,settings}/*`, isi Pusat Notifikasi, **kenaikan `APP_VERSION`** (`lib/constants.ts`) |
| **Belum dirancang di prototype mana pun** | `components/modals/GlobalSearch.tsx` (tetap berfungsi, tampilan lama; ikut token baru otomatis), `app/global-error.tsx`, `app/(app)/{error,not-found,loading,template,layout}.tsx`, `app/page.tsx`, `app/layout.tsx` → keputusan di T11 (restyle atau biarkan) |
| **Logika — tidak disentuh** (kecuali perbaikan percabangan KRS/SLK yang DIDAFTAR di serah-terima T4 §3 [T9: `lib/payment.ts`, `MembersView`, `GrafikView`] dan T5 §3 [T10: `lib/export.*`, `lib/db.ts` import zona kustom, dll.], hanya di tahap pemilik layarnya) | `lib/*` (selain 2 file T6 di atas + `lib/locales/*` append-only), `hooks/*`, `store/*` (selain uiSlice A1/A2), `types/*`, `proxy.ts`, `scripts/*`, `database.rules.json`, `next.config.ts` |
| **File i18n bersama** | `lib/locales/{id,en}.ts` — hanya **menambah** key baru di blok bertanda `// ── REDESAIN Tn` tahap masing-masing; tidak mengubah/menghapus key tahap lain |

---

## 3. File diubah/ditambah di T6

### Ditambah (39)
- `REDESAIN-MANIFEST.md` (berkas ini)
- `components/features/auth/AuthShell.tsx`
- `components/features/auth/GoogleButton.tsx`
- `components/features/auth/PasswordField.tsx`
- `components/layout/BottomNav.tsx`
- `components/layout/DisplayPrefs.tsx`
- `components/layout/Header.Notifications.tsx`
- `components/layout/MoreSheet.tsx`
- `components/layout/__tests__/shell.test.tsx`
- `components/layout/userInitials.ts`
- `components/ui/ActionCard.tsx`
- `components/ui/AppLogo.tsx`
- `components/ui/Checkbox.tsx`
- `components/ui/ChecklistRow.tsx`
- `components/ui/Chip.tsx`
- `components/ui/CollapsibleGroupHeader.tsx`
- `components/ui/ColorSwatch.tsx`
- `components/ui/GhostInput.tsx`
- `components/ui/HintBar.tsx`
- `components/ui/IconButton.tsx`
- `components/ui/IconTile.tsx`
- `components/ui/KpiCard.tsx`
- `components/ui/ListRow.tsx`
- `components/ui/Notice.tsx`
- `components/ui/Numpad.tsx`
- `components/ui/PinDots.tsx`
- `components/ui/PinScreen.tsx`
- `components/ui/ProgressBar.tsx`
- `components/ui/QuickPayGrid.tsx`
- `components/ui/Segmented.tsx`
- `components/ui/Sheet.tsx`
- `components/ui/Spinner.tsx`
- `components/ui/__tests__/Toast.test.tsx`
- `components/ui/__tests__/primitives.test.tsx`
- `components/ui/icons.ts`
- `lib/__tests__/design-tokens.test.ts`
- `lib/__tests__/redesign-t6-guard.test.ts`
- `store/__tests__/uiSlice.display.test.ts`
- `styles/ui.css`

### Diubah (40)
- `app/globals.css`
- `app/login/page.tsx`
- `app/offline/ReloadButton.tsx`
- `app/offline/page.tsx`
- `components/features/auth/LoginForm.tsx`
- `components/features/auth/RegisterForm.tsx`
- `components/features/auth/RememberedUser.tsx`
- `components/layout/AppErrorBoundary.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/Header.SyncPill.tsx`
- `components/layout/Header.ZoneTabs.tsx`
- `components/layout/Header.tsx`
- `components/layout/LoadingScreen.tsx`
- `components/layout/Sidebar.UserSection.tsx`
- `components/layout/Sidebar.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Confirm.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/Skeleton.tsx`
- `components/ui/Toast.tsx`
- `e2e/auth.spec.ts`
- `e2e/entry.spec.ts`
- `lib/__tests__/i18n-and-ui-consistency.test.ts`
- `lib/design-tokens.ts`
- `lib/locales/en.ts`
- `lib/locales/id.ts`
- `lib/navItems.tsx`
- `package.json`
- `pnpm-lock.yaml`
- `public/offline.html`
- `store/slices/uiSlice.ts`
- `styles/components.header.css`
- `styles/components.misc.css`
- `styles/layout.css`
- `styles/reset.css`
- `styles/tokens.css`

Dependency baru: `@phosphor-icons/react` **2.1.10** (versi dipin; rilis Mei 2025, jauh > 14 hari). `lucide-react` TETAP terpasang selama file tahap lain masih memakainya (48 file; hapus di T10/T11 setelah nol pemakai).

---

## 4. Primitive UI (`components/ui`) dan layar pemakainya

Gaya: `styles/ui.css`, kelas berawalan `wp-` (tidak bentrok dengan `.badge`, `.toast`, `.modal*` lama). Semua tanpa logika bisnis; teks i18n dioper pemanggil kecuali Toast/Sheet/Confirm (memakai `common.close`, `toast.undo`, `common.cancel`).

| Primitive | Sumber | Layar pemakai (rencana) |
|---|---|---|
| `Button`, `Card`, `Badge` (+ varian aging `baru/segera/kritis`), `Input`/`Textarea`/`Field`, `Select`, `Skeleton*`, `Spinner` | CORE v3 | semua (T7–T10); Login & Header sudah memakai |
| `IconTile` | CORE v3 `.tile` | T7 stat/aktivitas, T8, T9, T10 (baris Pengaturan, Log) |
| `IconButton` (gabungan `.sqb/.mab/.hbtn`) | CORE + T3/T4 | Header (T6), T7 MemberCard, T8 Rekap |
| `AppLogo` | aset asli `public/icon-512.png` | Header, Sidebar, Login, Splash, banner PWA (T6) |
| `EmptyState` | CORE v3 | T7–T10 (menerima ikon Phosphor ATAU Lucide selama transisi) |
| `Toast` (posisi Atas/Bawah, tipe `ok/err/info/warn`, deskripsi, Undo, tombol tutup) | CORE v3 + A2 | seluruh app |
| `Confirm` (`icon` = kunci semantik `trash/lock/warning/switch/signout/question/info`; nilai lama dipetakan) | CORE v3 | seluruh app (pemanggil: lihat bagian 8 butir 1) |
| `Sheet` (bottom sheet/dialog, portal, Esc, fokus, scroll-lock) | T3 `.md3` | MoreSheet (T6); T8 RekapModal/RiwayatModal; T9 sheet Member; T10 Log/Operasional/modal sisa |
| `Segmented` (`filter`/`tabs`) | T3 `.sg` | T8 Tunggakan, T9 segmen zona + tab Grafik, T10 tab Log/Operasional |
| `FilterChip`, `FilterChips`, `ZoneChip`, `IdChip` | T2/T4 | T7 Entry, T8 Rekap/Tunggakan (aging), T9 Member |
| `Checkbox` (kotak), `RoundCheckbox` (bulat) | CORE + T2 `.cbx` | Login ("Ingat saya", T6); T7 batch Entry; T8 batch Rekap; T10 Akun Penagih |
| `ProgressBar`, `DeltaPct` | T2 `.bar/.pct` | T7 Dashboard/Entry, T9 Grafik |
| `QuickPayGrid` | T2 `.qk` | T7 Entry (+ QuickPay), T8 RekapModal |
| `HintBar` | T3 `.hint` | T8 Rekap (petunjuk scroll) |
| `KpiGrid`, `KpiCard` | T4 `.kpi` | T9 Grafik |
| `CollapsibleGroupHeader` + `CollapsibleBody` | T5 `.gh5/.gb5` | T10 Pengaturan |
| `GhostInput` + `NominalWrap` | T5 `.gin/.nomw` | T10 Operasional |
| `Notice` | T5 `.okn5/.warn5` | Login (reset terkirim, T6); T10 Pengaturan (PIN, Biometrik) |
| `PinDots`, `Numpad`, `PinScreen` | T5 `.pdots/.npad/.pinl` | T10 PinLock + halaman PIN Pengaturan |
| `ChecklistRow` + `ChecklistHeader` | T5 `.tmr/.tzh` | T10 Akun Penagih |
| `ColorSwatch` | T5 `.swt` | T10 Pengaturan > Zona |
| `ActionCard` + `ActionGrid` | T5 `.bigact` | T10 Export & Import |
| `RowGroup`, `ListRow`, `ChoiceRows` | CORE + T1 `.rows/.row` | T10 Pengaturan (daftar menu + halaman pilihan Tema/Bahasa/Mode Navigasi/Posisi Toast) |
| `NavModePicker`, `ToastPositionPicker` (`components/layout/DisplayPrefs.tsx`) | A1/A2 | **T10: pasang di Pengaturan > Tampilan** (satu-satunya entri; sudah teruji) |

Tidak dijadikan primitive (spesifik satu layar, ditulis di layar dengan token): `.mc` kartu member (T7), `.rt` tabel Rekap (T8), `.tc` kartu aging (T8), `.chc/.cv/.ctip/.lgd/.dn` kanvas chart (T9, Chart.js).

---

## 5. Key i18n baru (id + en, 45 key)

| Key | id | en |
|---|---|---|
| `common.close` | Tutup | Close |
| `toast.undo` | Batalkan | Undo |
| `header.menuOpen` | Buka menu | Open menu |
| `header.searchMember` | Cari member | Search members |
| `header.syncStatus` | Status sinkronisasi | Sync status |
| `header.zoneAria` | Zona | Zone |
| `header.themeToast.light` | Mode Terang | Light mode |
| `header.themeToast.dark` | Mode Gelap | Dark mode |
| `header.themeToast.gold` | Mode Emas | Gold mode |
| `notif.title` | Notifikasi | Notifications |
| `notif.empty` | Belum ada notifikasi | No notifications yet |
| `notif.emptyDesc` | Aktivitas terbaru akan muncul di sini. | Recent activity will appear here. |
| `nav.more` | Lainnya | More |
| `nav.main` | Navigasi utama | Main navigation |
| `nav.sidebarAria` | Menu navigasi utama | Main navigation menu |
| `splash.tagline` | Sederhana. Andal. Untuk Usaha Anda. | Simple. Reliable. For Your Business. |
| `splash.loading` | Memuat data... | Loading data... |
| `login.showPassword` | Tampilkan password | Show password |
| `login.hidePassword` | Sembunyikan password | Hide password |
| `login.remember` | Ingat saya | Remember me |
| `login.forgot` | Lupa password? | Forgot password? |
| `login.orWith` | atau masuk dengan | or sign in with |
| `login.orRegisterWith` | atau daftar dengan | or sign up with |
| `login.connecting` | Menghubungkan... | Connecting... |
| `login.resetEmailRequired` | Masukkan email dulu. | Enter your email first. |
| `login.resetSending` | Mengirim... | Sending... |
| `login.resetSentTo` | Link reset dikirim ke | Reset link sent to |
| `login.resetSentCheck` | cek inbox | check your inbox |
| `offline.title` | Tidak Ada Akses Internet | No Internet Access |
| `offline.desc` | WiFi Pay memerlukan koneksi internet untuk mengakses data. Aktifkan WiFi atau paket data, lalu coba lagi. | WiFi Pay needs an internet connection to access your data. Turn on WiFi or mobile data, then try again. |
| `offline.tipsTitle` | YANG BISA DILAKUKAN | WHAT YOU CAN DO |
| `offline.tipWifi` | Aktifkan WiFi atau paket data | Turn on WiFi or mobile data |
| `offline.tipAirplane` | Pastikan mode pesawat tidak aktif | Make sure airplane mode is off |
| `offline.tipReload` | Muat ulang setelah internet aktif | Reload once the internet is back |
| `offline.retry` | Coba Lagi | Try Again |
| `display.navMode` | Mode Navigasi | Navigation Mode |
| `display.navBottom` | Navigasi Bawah | Bottom Navigation |
| `display.navBottomDesc` | Cepat dan nyaman untuk satu tangan di ponsel | Quick and comfortable one-handed use on a phone |
| `display.navSidebar` | Sidebar | Sidebar |
| `display.navSidebarDesc` | Ringkas dan cocok untuk layar lebih besar | Compact and suited to larger screens |
| `display.toastPos` | Posisi Toast | Toast Position |
| `display.toastTop` | Atas | Top |
| `display.toastTopDesc` | Muncul di bawah header | Appears below the header |
| `display.toastBottom` | Bawah | Bottom |
| `display.toastBottomDesc` | Muncul di atas navigasi bawah | Appears above the bottom navigation |

---

## 6. Keputusan & perilaku T6 (yang perlu diketahui tahap berikutnya)

1. **Token**: `styles/tokens.css` = CORE v3 (gelap navy `#0B1020`, terang, emas hangat). Skala final: display 20 / heading 16 / body 14 / data 14 mono / caption 12 / label 11 / micro 10; spacing 4–48; radius 4–20 + full; shadow xs–lg; `--accent`, `--on-accent`, `--grad-a`, `--glow`, `--hl`, `--surf`, `--halo`. Token turunan `--grad-a/--glow` dideklarasikan ulang per tema (`:root, body.light, body.gold`) karena `<html>` dan `<body>` adalah elemen berbeda. Mengubah skala ini membuat semua layar yang belum dimigrasi tampil sedikit lebih besar (body 14px) sampai tahap masing-masing.
2. **Tema Emas** memakai ikon mahkota (`Crown`), tanpa emoji; ikon tema: Matahari/Bulan/Mahkota.
3. **A1 Mode Navigasi** (`navMode`): `'bottom'` (default, sesuai gambar) | `'sidebar'`. Pengaturan PERANGKAT di `uiSlice` (key `wp_nav_mode`, pola sama dengan `wp_theme`). Bottom Nav = 4 tab + Lainnya (sheet: Grafik, Log, Member, Operasional, Pengaturan). Mode sidebar = perilaku zip (drawer di mobile, tetap ≥768px). **Sebelum T10 memasang pemilihnya, pengguna belum bisa pindah mode lewat UI** (default `bottom`).
4. **A2 Posisi Toast** (`toastPosition`): `'top'` (default, perilaku zip) | `'bottom'` (di atas Bottom Nav bila mode bottom). Key `wp_toast_pos`. API `showToast/showToastUndo` kompatibel; tambahan opsional `showToast(msg, type, description)` dan tipe `warn`.
5. **A3 Pusat Notifikasi**: HANYA kerangka (lonceng + panel + status kosong). Slot untuk T10: prop `unreadCount` (lencana) dan `children` (isi daftar) pada `Header.Notifications.tsx`; Header saat ini merender `<HeaderNotifications />` tanpa prop — T10 mengubah SATU baris itu (revisi eksplisit).
6. **Perbaikan percabangan KRS/SLK** (hanya file milik T6): `zoneColor(zone, customZones)` kini mengembalikan warna zona kustom (sebelumnya jatuh ke KRS); `Header.ZoneTabs.tsx` memakai `zoneCssColor()`; tidak ada `=== 'KRS'|'SLK'` di Header*/design-tokens (dijaga `redesign-t6-guard.test.ts`).
7. **Perubahan non-visual yang disengaja di Header** (tanpa menyentuh logika bisnis): warna zona aktif kini ditulis ke `<body>` (bukan `<html>`) lewat effect yang mengikuti `activeZone` → ikut tema Terang/Emas dan ikut perpindahan zona terprogram. Sebelumnya `body.light/body.gold` menimpa variabel `--zc` dan hanya klik tab yang mengubahnya.
8. **AccountModal** kini dimiliki `AppShell` (satu instance) dan dibuka dari avatar Header ATAU kartu akun Sidebar (mode bottom tidak punya sidebar, jadi akun/keluar harus tetap terjangkau).
9. **Login**: logika `app/login/page.tsx` tidak berubah; tampilan dipecah ke `components/features/auth/*` (3 file yatim sebelumnya kini dipakai, tanpa duplikasi). Dua perubahan kecil: (a) checkbox "Ingat saya" kini benar-benar mengoper `remember` ke `doLogin` (default dicentang = perilaku lama); (b) error Google saat di form Daftar kini tampil di form Daftar (sebelumnya hilang diam-diam).
10. **Logo**: aset asli `public/icon-512.png` ADA di zip (catatan T1 yang bilang tidak ada keliru) → dipakai lewat `AppLogo`.
11. **Teks**: sesuai prioritas kontrak, teks zip dipertahankan di tempat gambar berbeda: label tab/menu **"Dashboard"** (gambar: "Beranda"), deskripsi offline versi zip, teks login zip. Lihat pertanyaan di bagian 8 butir 6.
12. **Test diubah (alasan)**: 2 test "Label versi APP_VERSION_FULL" di `i18n-and-ui-consistency.test.ts` memeriksa gaya inline lama (`fontSize:'var(--fs-micro)'`). Prototype T1 menetapkan label versi 12px abu-abu via CSS; kedua test ditulis ulang untuk menjaga aturan yang SAMA (label versi Header = Sidebar, dari token, bukan literal) terhadap CSS baru. Jumlah test tidak berkurang. Test tombol kunci/status Header & Members (`header-lock-action-btn`, kata sifat Terkunci/Terbuka, warna, ikon hasil-aksi) tetap lulus TANPA perubahan.
13. **e2e** (`e2e/*.spec.ts`, tidak dijalankan di sandbox): selector login `button.lf-btn`/`p.lf-err` diganti `[data-testid="login-submit"|"login-error"]`.
14. `public/offline.html` (fallback statis SW): emoji diganti titik SVG, warna dark disamakan; teks versi usang "v11.5.2" dihapus agar tidak basi lagi.

---

## 7. Revisi eksplisit yang diizinkan di tahap berikutnya (file bersama)

| Tahap | Perubahan | File |
|---|---|---|
| T10 | tambah `<NavModePicker/>` + `<ToastPositionPicker/>` di Pengaturan > Tampilan | `SettingsAppSection.tsx` (milik T10) |
| T10 | beri prop ke `<HeaderNotifications unreadCount children/>` | `components/layout/Header.tsx` (1 baris) |
| T10 | naikkan `APP_VERSION` | `lib/constants.ts` |
| T7–T10 | tambah key i18n di blok tahap sendiri | `lib/locales/{id,en}.ts` (append-only). T7: blok "REDESAIN T7" sudah ada (45 key); T8–T10 buat blok sendiri |
| T7–T10 | bila butuh variasi primitive baru: tambahkan di T6-file HANYA lewat catatan di tabel ini (hindari; utamakan komposisi) | `components/ui/*`, `styles/ui.css` |

---

## 7b. Revisi eksplisit yang DIPAKAI di T7

**Tidak ada.** T7 tidak mengubah `components/ui/*`, `styles/*`, token, `AppShell.tsx`, `Header*`, `lib/constants.ts`, `store/*`, `lib/payment.ts`. Tidak ada primitive baru. Gaya khusus layar ditulis sebagai CSS Modules milik layar (`dashboard.module.css`, `entry.module.css`, `MemberCard.module.css`) yang hanya memakai token; ini cara yang disarankan untuk T8–T10 bila butuh gaya satu-layar (jangan menaruhnya di `styles/*`).



---

## 7c. Revisi eksplisit yang DIPAKAI di T8

**Tidak ada pada file bersama.** T8 tidak mengubah `components/ui/*`, `styles/*`, token, `AppShell.tsx`, `Header*`, `lib/constants.ts`, `store/*`, `lib/payment.ts`, `lib/*` selain `lib/locales/{id,en}.ts` (append-only), tidak ada primitive baru. Satu-satunya file di luar folder layar yang diubah adalah `hooks/useTunggakan.ts` (file logika yatim milik T8; perbaikan percabangan zona yang diizinkan prompt T8 butir 4) dan penghapusan `hooks/useRekap.ts` (yatim, lihat 11c). Gaya khusus layar = CSS Modules (`rekap.module.css`, `tunggakan.module.css`, `riwayat.module.css`).

## 7d. Revisi eksplisit yang DIPAKAI di T9

Semuanya tercantum di serah-terima T4 bagian 3 (disetujui user) dan prompt T9 butir 4:
1. `lib/payment.ts` `getZoneTotal`: daftar anggota lewat `getMembersForZone(zone, data)` (sebelumnya semua zona selain KRS jatuh ke anggota SLK). Zona KRS/SLK hasilnya identik; zona kustom kini dihitung dari anggotanya sendiri.
2. `lib/member.ts`: `setMembersForZone(appData, zone, list)` baru (pasangan `getMembersForZone`), mengembalikan PATCH `{krsMembers}` / `{slkMembers}` / `{zoneMembers: {...lama, [zona]: daftar}}`; `lib/helpers.ts` hanya menambah nama itu ke baris re-export.
3. `lib/design-tokens.ts` `zoneColor`: SUDAH benar sejak T6 (menerima `customZones`, zona tak dikenal tidak jatuh ke warna KRS) → tidak diubah.
4. `lib/locales/{id,en}.ts`: hanya menambah blok `// ── REDESAIN T9` (30 key) di akhir.
Tidak ada perubahan lain di `lib/*`, `store/*`, `styles/*`, `components/ui/*`, `components/layout/*`, `AppShell.tsx`, `APP_VERSION`.

---

## 7e. Revisi eksplisit yang DIPAKAI di T10

| # | File | Perubahan | Alasan |
|---|---|---|---|
| 1 | `components/layout/Header.tsx` | `<HeaderNotifications />` → `<NotificationCenter />` (1 baris + 1 impor) | Pemasangan isi Pusat Notifikasi (A3), sesuai tabel bagian 7 |
| 2 | `components/layout/Header.Notifications.tsx` | `children` boleh `ReactNode` ATAU fungsi `(close) => ReactNode` (kompatibel mundur; tanpa children = tampilan kosong lama) | Item notifikasi harus menutup panel setelah diketuk (berpindah ke Log/Pengaturan) |
| 3 | `store/slices/viewSlice.ts` | HANYA tipe: `logType`/`setLogType` dari `'all' \| 'pay'` menjadi `'all' \| 'pay' \| 'data' \| 'sys'` (nilai awal dan perilaku sama) | A27 (tab Data + Sistem) menyimpan pilihan seperti "Hanya Bayar" di zip |
| 4 | `lib/db.ts`, `lib/export.excel.ts`, `lib/export.wa.ts` | Perbaikan zona kustom (bagian 13.5) | Perubahan logika yang SUDAH disetujui user |
| 5 | `lib/constants.ts`, `README.md` | `APP_VERSION` v11.8.0; entri changelog baru paling atas, judul dan footer README | Kenaikan versi tunggal (kontrak bagian 9 butir 3) |

Tidak ada primitive baru, tidak ada perubahan `components/ui/*` selain `PinLock.tsx` dan `OnboardingHint.tsx` (milik T10), `styles/*`, token, `AppShell.tsx`, `package.json`.

## 8. Checklist Daftar Wajib-Ada — status per layar

Legenda: [x] ada & berfungsi di zip T6 · [ ] dikerjakan di tahap tercantum (fitur zip tetap utuh dengan tampilan lama).

**Header/global (T6)**
- [x] tab zona dinamis (zona kustom, zona tersembunyi) — `Header.ZoneTabs.tsx`  (catatan: "nama zona" `zoneNames` tidak dipakai Header di v11.7.1 maupun sekarang; perilaku sama)
- [x] SyncPill ok/loading/err/offline — `Header.SyncPill.tsx`
- [x] status + tombol Kunci/Buka global (rollback selektif dipertahankan) — `Header.tsx`
- [x] GlobalSearch (fungsi utuh; tampilan lama, belum dirancang) — `Header.tsx` → `modals/GlobalSearch.tsx`
- [x] ganti tema (Gelap → Terang → Emas) — `Header.tsx`
- [x] tombol buka sidebar (tampil di mode sidebar, <768px) — `Header.tsx`

**Lain-lain**
- [x] LoadingScreen — `LoadingScreen.tsx` · [x] halaman offline — `app/offline/page.tsx`, `public/offline.html`
- [x] banner update PWA — `AppShell.tsx` · [x] banner pasang PWA + banner online/offline — `AppShell.tsx`
- [x] error boundary (restyle ringan) — `AppErrorBoundary.tsx` · [ ] `global-error.tsx`, `(app)/error.tsx`, `not-found.tsx` (belum dirancang → T11)
- [x] Confirm dialog — `ui/Confirm.tsx` · [x] Toast + Undo — `ui/Toast.tsx`
- [x] login Google + email/password + ingat user — `app/login/page.tsx` + `features/auth/*`
- [x] bahasa ID/EN (semua teks baru ada id+en) · [x] pemilih bahasa di Pengaturan (T10: `SettingsAppSection` section `language`)
- [x] AccountModal terjangkau dari Header+Sidebar · [x] tampilan AccountModal (T10: Sheet `dialog`)
- [x] PinLock, OnboardingHint, ImportModal (T10); ExportModal + ShareModal DIHAPUS (yatim; fungsi hidup ada di `SettingsTarifSection` dan `DashboardView.Tools`)

**Dashboard (T7)** — semua butir ada; teks dari id/en
- [x] statistik Lunas / Belum / Gratis (semua zona aktif, Opsi A: gratis termasuk lunas) — `DashboardView.Stats.tsx` (`StatTiles`)
- [x] pendapatan bulan ini + Bersih (setelah operasional) + grafik batang 6 bulan A14 — `DashboardView.Stats.tsx` (`IncomeCard`)
- [x] insight (tunggakan, rasio lunas, perbandingan vs bulan lalu) — `DashboardView.Stats.tsx` (`InsightCard`)
- [x] kartu per zona KRS, SLK dan zona kustom aktif — `DashboardView.Stats.tsx` (`ZoneCards`)
- [x] kartu "Belum Bayar" + tombol Input Bayar — `DashboardView.Unpaid.tsx` (`UnpaidCard`)
- [x] Tunggakan Terbanyak (top 5, lompat ke Entry pada bulan/zona/member) — `DashboardView.Unpaid.tsx` (`TopArrearsCard`)
- [x] WA summary + kirim WA — `DashboardView.Tools.tsx` (`WaCard`)
- [x] info backup terakhir + Download + Bagikan — `DashboardView.Tools.tsx` (`BackupCard`)
- [x] baris Operasional — `DashboardView.Tools.tsx` (`OpsRow`)
- [x] A12 Aktivitas Terbaru (5 entri dari `activityLog` + Lihat Semua) — `DashboardView.RecentActivity.tsx`
- [x] A13 sapaan + Aksi Cepat (Entry, Rekap, Tunggakan, Grafik) — `DashboardView.tsx`, `DashboardView.Tools.tsx` (`QuickActions`)
- [x] pemilih bulan/tahun, state memuat/kosong/gagal — `DashboardView.tsx`

**Entry (T7)** — semua butir ada
- [x] pilih zona (Header) / bulan / tahun — `EntryView.tsx`
- [x] kartu member per periode (periode per kartu tidak bergeser, snapshot v11.5.7–v11.5.10 utuh) — `members/MemberCard.tsx`
- [x] QuickPay kustom (`settings.quickAmounts`, tarif diurutkan pertama + disorot) — `MemberCard.tsx` memakai primitive `QuickPayGrid`
- [x] lock per entry (catatan "Data terkunci" + toast) dan lock global (banner, ketuk = buka) — `MemberCard.tsx`, `EntryView.tsx`
- [x] scroll position tersimpan — `EntryView.tsx` (lihat bagian 10, butir 6: di zip fitur ini tidak pernah berfungsi; kini berfungsi)
- [x] tanggal bayar otomatis/manual (`settings.autoDate` mengunci field) — `MemberCard.tsx`
- [x] ringkasan periode + Potensi Belum Masuk + chip filter + pencarian + tampilan kosong/tidak ditemukan — `EntryView.tsx`, `EntryView.MemberList.tsx`
- [x] mode pilih banyak: tekan lama (perilaku zip) + tombol Bayar Semua, Pilih Semua, sheet total, guard "hanya belum bayar" — `EntryView.tsx`, `EntryView.Batch.tsx`, `entry/batch.ts`

**Rekap (T8)** — semua butir ada; teks dari id/en
- [x] grid 12 bulan (kontrak A10) dengan kolom `#`/Nama dan header menempel, bulan acuan disorot — `RekapView.Table.tsx`
- [x] scroll horizontal + petunjuk geser (`rekap.scrollHint`) + info "Menampilkan x–y dari z" — `RekapView.tsx`
- [x] pagination 20 per halaman (halaman direset saat zona/cari berubah, dipertahankan saat tahun berubah; v11.6.5) — `RekapView.tsx`, `rekap.logic.ts` (`paginate`)
- [x] subtotal halaman (hanya bila >1 halaman, v11.6.6) + total — `RekapView.Table.tsx` (tfoot)
- [x] pencarian, pilih tahun, total tahun — `RekapView.FilterBar.tsx`, `RekapView.tsx`; pilih bulan acuan baru (selMonth, T3 keputusan 1)
- [x] A15 filter status (Semua/Lunas/Belum/Gratis + jumlah) — `RekapView.FilterBar.tsx`, `rekap.logic.ts`
- [x] pilih sel: tekan lama 500 ms (zip) + A17 tombol Pilih Banyak (bulan acuan) + Pilih Semua/Batalkan Semua + sheet total + konfirmasi (Tandai Lunas Semua) + pengaman "hanya belum bayar" — `RekapView.tsx`, `RekapView.Batch.tsx`, `rekap.logic.ts`
- [x] tampilan terkunci (banner, ketuk = buka lewat tombol kunci Header; batch ditolak dengan toast; catatan terkunci di modal) — `RekapView.tsx`, `RekapModal.MonthGrid.tsx`
- [x] RekapModal (nominal "Rp … .000", hapus + Confirm, QuickPay tarif ★ di depan, Simpan, Free = catatan, Terkunci = catatan, Toast Undo setelah QuickPay/simpan) — `RekapModal.tsx`, `RekapModal.MonthGrid.tsx`
- [x] RiwayatModal final (bottom sheet; tab tahun + panah, ringkasan n/12, 3 statistik, 12 baris; ketuk baris = Entry) — `components/modals/RiwayatModal.tsx`, `RiwayatModal.MonthRow.tsx`
- [x] A18 ketuk nama membuka RiwayatModal; kilat sukses sel; state memuat/kosong/tidak ditemukan/gagal — `RekapView.tsx`

**Tunggakan (T8)** — semua butir ada; teks dari id/en
- [x] 3 mode (Nunggak / Rajin / Gratis) dengan jumlah — `TunggakanView.FilterBar.tsx`, `TunggakanView.tsx`
- [x] filter aging Baru (1) / Segera (2–3) / Kritis (4+) dengan jumlah — `TunggakanView.FilterBar.tsx`, `hooks/useTunggakan.ts` (`agingOf`)
- [x] ringkasan jumlah member + A16 Total Tunggakan — `TunggakanView.tsx`
- [x] kartu member: tile aging, nama bernomor, "N bulan tunggakan", A16 nominal, badge aging, chip bulan (maks 12 + "+N lagi"), Kirim WA (tarif individual), hint tarif default — `TunggakanView.Item.tsx`
- [x] kartu Rajin ("Lunas semua") dan Gratis ("Dari … s/d …" atau "(selamanya)") — `TunggakanView.Item.tsx`
- [x] pilih bulan/tahun (selMonth/selYear, dibagi dengan Entry/Dashboard) — `TunggakanView.tsx`
- [x] A19 pencarian nama; A18 ketuk kartu membuka RiwayatModal; state memuat/kosong (per aging/mode)/tidak ditemukan/gagal — `TunggakanView.tsx`
- [x] zona kustom dihitung penuh (tunggakan, tarif, gratis), mode TOTAL memakai `getAllActiveZones` — `hooks/useTunggakan.ts`

**Member (T9, selesai)**
- [x] tab zona dinamis + jumlah (zona bawaan, kustom, tersembunyi disaring; zona Member berdiri sendiri `newMemberZone`) — `MembersView.tsx` (`visibleZoneKeys`)
- [x] KUNCI/BUKA MEMBER terpisah dari kunci global; label AKSI, merah = terkunci, hijau = terbuka; status + tombol aksi pola Header — `MembersView.tsx`
- [x] tab Aktif/Terhapus (Recycle Bin): Pulihkan, Hapus Permanen dengan Confirm (`trash`) — `MembersView.tsx`, `MembersView.Deleted.tsx`
- [x] tambah (nama, ID, IP/link, tarif, catatan A23) + validasi nama (wajib, karakter terlarang, duplikat) — `MembersView.Form.tsx`, `members.logic.ts`
- [x] edit + rename memindahkan data bayar dan info — `members.logic.ts` (`buildEditMember`)
- [x] hapus ke Recycle Bin (pembayaran ikut) + pulihkan — `members.logic.ts`
- [x] urutan 6 mode (nama, ID, IP naik/turun) — `members.logic.ts` (`sortMembers`), `MembersView.Toolbar.tsx`
- [x] cari (A21: nama, ID, IP) + hitungan + kartu member (A20 status + filter, A22 salin IP, indikator catatan) — `MembersView.Toolbar.tsx`, `MembersView.Card.tsx`
- [x] FreeMemberModal (mulai, selamanya/sampai, validasi tanggal, kembalikan berbayar dengan Confirm `question`) — `FreeMemberModal.tsx`, `FreeMemberModal.Form.tsx`
- [x] RiwayatModal dari ketuk nama/kartu (antarmuka tidak berubah) — `MembersView.tsx`
- [x] state memuat / kosong (+ tombol tambah) / terkunci / tidak ditemukan (+ Reset Filter) / gagal-muat (Coba Lagi) — `MembersView.tsx`
- [x] persist: penjaga klik ganda + rollback selektif + sheet tetap terbuka bila gagal — `MembersView.tsx`
- [x] zona kustom = KRS/SLK di semua operasi Member — `members.logic.ts` + `lib/member.ts`

**Grafik (T9, selesai)**
- [x] pilih tahun + chip zona aktif — `GrafikView.tsx`
- [x] kartu Total / rata-rata / VS Tahun Lalu (persen sama di kedua kartu) — `GrafikView.Income.tsx`
- [x] Bulanan + proyeksi (batang ke-13), perbandingan zona (+TOTAL, satu garis per zona aktif, judul dinamis), Perbandingan Tahunan, kartu Proyeksi Bulan Depan, Perbandingan Dua Periode — `GrafikView.Income.tsx`
- [x] Komposisi donat + pilih bulan (zona terpilih; TOTAL = semua zona aktif) — `GrafikView.Counts.tsx`
- [x] A24 tab jenis data; A25 Transaksi; A26 Pelanggan Aktif — `GrafikView.tsx`, `GrafikView.Counts.tsx`
- [x] EmptyState + skeleton (tanpa teks, anti salah-bahasa saat hidrasi) + gagal-muat (Coba Lagi) — `GrafikView.tsx`, `app/(app)/grafik/page.tsx`
- [x] zona kustom dihitung dari anggotanya sendiri (total, donat, garis) — `lib/payment.ts` + `grafik.logic.ts`

**Log / Operasional / Pengaturan / Pusat Notifikasi** → T10 [x] (rincian bagian 13.9)
(fitur-fitur ini utuh dengan logika & tampilan lama; belum ada yang dihapus)

---

## 9. Sisa pekerjaan

> **Pembaruan T10:** butir yang menyebut "T10" di bagian ini sudah dikerjakan; sisa pekerjaan terkini ada di **bagian 13.10**.

**Dari T6 untuk tahap lain**
1. `showConfirm(icon, …)` masih dipanggil dengan emoji/simbol/kosong oleh file berikut — `Confirm` sudah memetakannya ke ikon Phosphor (tidak ada emoji tampil), tapi ganti ke kunci semantik di tahap pemilik: T7 `MemberCard.tsx`; T8 `RekapModal.tsx` [SELESAI di T8: kini kunci `trash`]; T9 `MembersView.tsx` (ikon tempat sampah, `[PURGE]`), `FreeMemberModal.tsx`; T10 `OperasionalView.tsx`, `AccountModal.tsx` (`↔`), `ImportModal.tsx`, `SettingsPinSection.tsx`, `SettingsZoneSection.tsx` (3× kosong), `SettingsBiometricSection.tsx` (ikon gembok), `SettingsIPSection.tsx`, `SettingsTenantSection.tsx`.
2. Ganti ikon Lucide → Phosphor di layar tiap tahap; hapus `lucide-react` dari `package.json` setelah nol pemakai (sekarang 48 file: 46 layar/modal/komponen tahap lain, `lib/constants.ts` [ikon aksi Log → T10, file yang sama dengan `APP_VERSION`], dan 1 test T6 yang sengaja memakainya untuk uji kompatibilitas `EmptyState`).
3. CSS lama yang menunggu migrasi layar: `styles/components.entry.css`, `components.modal.css`, bagian Chart/Log/Member/Operasional/Badge di `components.misc.css`, aturan responsif lama di `layout.css` (`#member-rows`, `.add-form`, `.ops-card`). Hapus di T11 setelah nol pemakai.
4. Hapus/rapikan `Checkbox`/`Input` lama di layar yang masih memakai `.lf-input` (`SettingsTarifSection`, T10).

5. `components/layout/AppShell.tsx` baris ±118: auto-backup dipicu oleh `appData.krsMembers?.length` (sinyal "data sudah termuat"). Bukan percabangan zona dan ini logika → TIDAK diubah di T6 (prompt membatasi perbaikan KRS/SLK ke Header.tsx, Header.ZoneTabs.tsx, design-tokens.ts). Risiko: pengguna yang hanya memakai zona kustom (KRS kosong) tidak memicu auto-backup. Evaluasi di T11.
6. `components/modals/GlobalSearch.tsx` (baris ±115–117) masih bercabang KRS/SLK untuk warna/daftar zona (T5 §3) — file tanpa pemilik tahap; ikut diputuskan di T11 (atau T10 bila di-restyle).
7. `Header.ZoneTabs.tsx` memuat daftar dasar `['KRS','SLK', …kustom]` yang disaring zona tersembunyi (perilaku v11.7.1 dipertahankan; `getAllActiveZones` di `lib/member.ts` beda: selalu menyertakan KRS/SLK — T5 §3 temuan 2, keputusan T10).

**Pertanyaan terbuka (satu, tidak memblokir)**: label tab/menu — pakai teks zip **"Dashboard"** (sekarang, tidak diubah di T7) atau teks gambar **"Beranda"**? Mengubahnya = ubah key `nav.dashboard` (id+en) saja; T7 tidak mengubahnya karena belum ada jawaban.

**Catatan keamanan (di luar cakupan, tidak diubah)**: fitur "ingat saya" di zip menyimpan password di `localStorage` (`saveRememberCred`). Sekarang pengguna bisa mematikannya lewat checkbox; pertimbangkan hardening terpisah.

**Dari T7 untuk tahap lain**
1. **T9**: setelah `getZoneTotal` di `lib/payment.ts` diperbaiki (zona kustom saat ini dihitung dari anggota SLK), ganti `zoneTotal()` lokal di `hooks/useDashboard.ts` dengan `getZoneTotal` (T11 boleh membersihkan; keduanya sama untuk KRS/SLK).
2. **T10 (Log)**: `getLogMeta` di `LogView.tsx` dan `getActivityMeta` di `DashboardView.RecentActivity.tsx` memuat aturan pencocokan yang sama (ikon + warna per jenis aksi). Bila LogView di-restyle, impor `getActivityMeta`/`stripActionTag` agar tidak ada dua sumber.
3. **T11**: `hooks/useEntry.ts` masih yatim (hook logika lama yang menduplikasi EntryView; ada di `hooks/` = file logika, tidak disentuh). Putuskan hapus/pakai. `membercard.setTarifHint` (id+en) kini tidak dipakai (berisi tag HTML mentah; diganti `entry.setTarifHint`).
4. **T11 (styles)**: di `styles/components.entry.css` blok `.mcard*`, `.mc-*`, `.qrow`, `.mc-success-check` kini tidak dipakai siapa pun (kartu Entry pindah ke `MemberCard.module.css`). `.sum-bar`, `.ctrl-row` masih dipakai Rekap/Tunggakan/Operasional/Grafik; `.qb`, `.mc-input`, `.delbtn` masih dipakai `RekapModal*` (T8). Hapus per blok setelah tahap pemakainya selesai (file milik T6).
5. **Banner terkunci Entry**: membuka kunci diteruskan ke tombol kunci Header (`.header-lock-action-btn`.click()) agar logika `toggleGlobalLock` (rollback selektif) tidak diduplikasi. Bila T11 mengangkat `toggleGlobalLock` menjadi hook/aksi bersama, ganti pemanggilan ini.
6. `lucide-react`: kini 43 file memakainya menurut pencarian `from 'lucide-react'` (T6 melaporkan 48); semua file milik T7 sudah bebas. `showConfirm` beremoji tersisa hanya di file tahap lain (ImportModal, OperasionalView, RekapModal, MembersView, FreeMemberModal, Settings*).
7. e2e: `e2e/entry.spec.ts` diberi selector `data-testid` (`member-card`, `entry-search`) di samping selector lama; tidak dijalankan di sandbox.
8. Catatan data: kunci payment memakai nama mentah (`${zona}__${nama}__${tahun}__${bulan}`) di MemberCard/EntryView (seperti zip), sedangkan `getKey` memakai `fbKey(nama)`. Sama selama nama tak memuat `. # $ [ ] /` (validator `hasInvalidFirebaseKeyChars` mencegahnya di form). Tidak diubah (logika).

**Dari T8 untuk tahap lain**
1. **T11 (styles)**: aturan CSS global lama yang kini NOL pemakai di kode (milik T6, hapus per blok): di `styles/components.entry.css` → `.qb`, `.mc-input`, `.delbtn`, `.sum-bar`, seluruh blok Rekap (`.rekap-wrap`, `.rekap-outer`, `.rekap-head`, `.rtable*`, `.rekap-header-wrap`, `.rekap-exp-cell`, `.rekap-scroll-hint`, `.rekap-cell-paid-flash`) dan Tunggakan (`.tcard`, `.tmonth`); di `styles/components.modal.css` → `.riwayat-box`, `.rw-month-row`, `.rw-year-tab`. Masih DIPAKAI tahap lain, jangan dihapus dulu: `.ctrl-row` (Log, Operasional, Grafik, Members), `.search-box`/`.search-wrap` (Log, Operasional, Grafik, Members). Kelas `.qrow`/`.mcard*` dari catatan T7 butir 4 tidak berubah.
2. **T9**: `RiwayatModal` kini bottom sheet (`Sheet`); antarmuka `open`/`onClose` dan store `riwayat*` tidak berubah, jadi `MembersView` tidak perlu diubah dan tetap boleh memanggilnya seperti sekarang. `RiwayatModal.MonthRow` hanya dipakai `RiwayatModal` (jangan ditiru di Member).
3. **T9**: pola filter status + pencarian + paginasi Rekap (`rekap.logic.ts`: `refStatus`, `statusCounts`, `filterByStatus`, `paginate`) bersifat murni dan bisa dipakai A20 (status/filter status Member) tanpa menulis ulang; pola lokal-state-untuk-filter (jangan memakai `filterStatus` store milik Entry) dijelaskan di 11e butir 8.
4. **T10**: `lucide-react` kini dipakai 34 file non-test (T7: 42); semua file milik T8 bebas lucide dan bebas emoji. `showConfirm` non-semantik tersisa hanya di file tahap lain (ImportModal, AccountModal, FreeMemberModal, OperasionalView, SettingsIP/Pin/Zone*).
5. **T11**: tiga file layar T8 dan kunci payment — Rekap menulis kunci lewat `getKey` (`fbKey(nama)`), sama seperti zip; Entry/MemberCard memakai nama mentah (catatan T7 butir 8). Tidak diubah.
6. **T11**: placeholder pencarian tidak seragam — Rekap `Cari member...` (teks zip, dikunci test paginasi), Tunggakan `Cari nama pelanggan...` (teks T3). Seragamkan bila diminta (ubah key `rekap.searchPlaceholder` dan test paginasi bersama).
7. **Nama bulan**: `MONTHS` zip = singkatan 3 huruf ("Okt", "Mar"); prototype T3 memakai nama penuh. Zip yang menang, jadi layar T8 menampilkan singkatan (juga di pemilih bulan). Nama penuh = perubahan `lib/constants.ts`/locale; keputusan user bila ingin.
8. **Keamanan dependensi (di luar cakupan T8, tidak diubah)**: `pnpm audit` pada 15 Okt 2026 melaporkan 30 temuan (1 kritis, 11 tinggi, 11 sedang, 7 rendah). Yang kritis: Next.js RCE di `next/og` `ImageResponse` (versi rentan >=16.2.0 <16.3.6; terpasang 16.3.5, lewat `@vercel/analytics`). Pencarian kode: app TIDAK memakai `next/og`/`ImageResponse` dan tidak punya rute `opengraph-image`, jadi tidak ada pemakaian langsung. Paket lain yang dilaporkan: `undici`, `brace-expansion`, `dompurify`, `@grpc/grpc-js`, `sharp`, `braces`, `source-map-js`. `package.json` dan `pnpm-lock.yaml` identik dengan zip T7 (diverifikasi `cmp`). Saran: sesi terpisah khusus pembaruan dependensi (pola lama: pin eksak, lockfile dibuat ulang, tsc+eslint+vitest+build ulang) SETELAH T11, atau sebelum rilis bila user mau; jangan dicampur ke tahap redesain.

**Dari T9 untuk tahap lain**
1. **T10**: `lucide-react` dan `showConfirm` non-semantik tersisa hanya di file tahap lain; semua file milik T9 bebas lucide, emoji, dan `showConfirm` beremoji (test penjaga T9).
2. **T11 (styles)**: aturan CSS global lama yang kini NOL pemakai di kode setelah T9 (di `styles/components.misc.css`, hapus per blok setelah `grep` ulang): `.add-form`, `.af-input` (+`:focus`), `.af-title`, `.af-grid`, `.chart-box`, `.chart-title`, `.chart-wrap`, `.del-card` (+`:hover`), `.del-card-name`, `.del-card-info`, `.restore-btn` (+`:hover`/`:active`). `.ctrl-row`, `.search-wrap`, `.search-box`, `.search-clear` MASIH dipakai `LogView.tsx` dan `OperasionalView.tsx` (T10) → jangan dihapus sebelum T10 selesai.
3. **T11**: `hooks/useDashboard.ts` masih punya `zoneTotal()` lokal (file milik T7; prompt T9 menyebutnya opsional). Sekarang `getZoneTotal` sudah benar untuk zona kustom, jadi boleh diganti `getZoneTotal` (hasil identik untuk KRS/SLK).
4. **T11**: `Header.ZoneTabs` (`visibleZoneKeys`, menyaring zona bawaan yang disembunyikan) dan `getAllActiveZones` (selalu menyertakan KRS/SLK) berbeda perilaku. Layar Member memakai `visibleZoneKeys` (perilaku zip), mode TOTAL Grafik memakai `getAllActiveZones` (instruksi prompt T9). Selaraskan bila diminta.
5. **Teks hitungan Member** (teks zip, dipertahankan, mungkin ingin dirapikan): saat kolom cari terisi, hitungan menambahkan "tidak ada hasil" di belakang jumlah, mis. "3 pelanggan tidak ada hasil · KRS · Okt 2026". Itu perilaku zip yang ikut ke prototype T4. Satu perubahan kecil: hanya tambahkan akhiran itu bila hasilnya nol (butuh persetujuan user).
6. **Rename + kosongkan tarif** (zip, dipertahankan): saat nama member diganti DAN kolom tarif dikosongkan, tarif lama ikut terbawa (hanya saat nama sama tarif benar-benar dihapus). Dicatat sebagai temuan; tidak diubah (di luar butir logika T9).
7. **Batang proyeksi Grafik**: prototype T4 menggambar batang putus-putus; Chart.js tidak mendukung batang putus-putus, jadi batang proyeksi memakai isi hijau muda + garis tepi hijau (zip: sama, tanpa putus-putus).
8. **Keamanan dependensi**: tidak diubah di T9 (lihat bagian 9, "Dari T8" butir 8).

**T11** membandingkan zip final vs zip asli v11.7.1 (tidak ada file logika berubah di luar Register Tambahan A1–A3, tidak ada fitur Daftar Wajib-Ada hilang, tidak ada duplikasi) dan memutuskan nasib file "belum dirancang" (bagian 2).

---

## 10. TAHAP 7 — Dashboard + Entry (file, i18n, keputusan)

### 10a. File diubah / ditambah / dihapus (vs zip T6)

**Ditambah (12)**
- `components/features/dashboard/dashboard.module.css`, `DashboardView.Unpaid.tsx`, `DashboardView.Tools.tsx`
- `components/features/entry/entry.module.css`, `batch.ts` (guard + rencana batch, fungsi murni), `EntryView.Batch.tsx`
- `components/features/members/MemberCard.module.css`
- test baru (5): `components/features/entry/__tests__/batch.test.ts`, `hooks/__tests__/useDashboard.compute.test.ts`, `components/features/dashboard/__tests__/activity.test.ts`, `components/features/__tests__/t7-screens.test.tsx`, `lib/__tests__/redesign-t7-guard.test.ts`

**Diubah (10)**
- `components/features/dashboard/DashboardView.tsx` (orkestrator), `DashboardView.Stats.tsx`, `DashboardView.RecentActivity.tsx` (ditulis ulang, kini dipakai)
- `components/features/entry/EntryView.tsx`, `EntryView.MemberList.tsx` (ditulis ulang, kini dipakai)
- `components/features/members/MemberCard.tsx` (JSX + teks + ikon; logika persist/undo/rollback/long press/snapshot periode dipertahankan)
- `hooks/useDashboard.ts` (kini satu-satunya sumber hitungan Dashboard)
- `lib/locales/id.ts`, `lib/locales/en.ts` (blok "REDESAIN T7", append-only)
- `e2e/entry.spec.ts` (selector)

**Dihapus (1)**: `components/features/entry/EntryView.QuickPay.tsx`.
`app/(app)/dashboard/page.tsx` dan `app/(app)/entry/page.tsx` tidak berubah (sudah merender `DashboardView`/`EntryView`).

### 10b. Key i18n baru (id + en, 45 key, blok "REDESAIN T7")

| Key | id | en |
|---|---|---|
| `dashboard.greeting` | Selamat datang, | Welcome, |
| `dashboard.recentActivity` | Aktivitas Terbaru | Recent Activity |
| `dashboard.seeAll` | Lihat Semua | See All |
| `dashboard.quickActions` | Aksi Cepat | Quick Actions |
| `dashboard.noActivity` | Belum ada aktivitas | No activity yet |
| `dashboard.noActivityDesc` | Aktivitas terbaru akan muncul di sini. | Recent activity will appear here. |
| `dashboard.incomeTrend` | Pendapatan 6 bulan terakhir | Income, last 6 months |
| `dashboard.ops` | Ops | Ops |
| `dashboard.vs` | vs | vs |
| `dashboard.pointsShort` | pp | pp |
| `dashboard.download` | Download | Download |
| `dashboard.share` | Bagikan | Share |
| `dashboard.backupDownloaded` | Backup berhasil diunduh | Backup downloaded |
| `dashboard.backupShared` | Backup berhasil dibagikan | Backup shared |
| `dashboard.shareCancelled` | Share dibatalkan | Share cancelled |
| `dashboard.today` | Hari ini | Today |
| `dashboard.yesterday` | Kemarin | Yesterday |
| `dashboard.zoneProgress` | Progres lunas | Paid progress |
| `dashboard.arrearsAria` | bulan tunggakan, ke Entry | months overdue, go to Entry |
| `dashboard.loadErrorTitle` | Gagal memuat data | Failed to load data |
| `dashboard.loadErrorDesc` | Periksa koneksi internet Anda, lalu coba lagi. | Check your internet connection, then try again. |
| `common.retry` | Coba Lagi | Try Again |
| `entry.paySaved` | Pembayaran berhasil disimpan | Payment saved |
| `entry.invalidNominal` | Nominal tidak valid | Invalid amount |
| `entry.deletePayTitle` | Hapus pembayaran | Delete payment for |
| `entry.cancelled` | dibatalkan | cancelled |
| `entry.resetSearch` | Reset Pencarian | Reset Search |
| `entry.noMatch` | Member tidak ditemukan | No members found |
| `entry.noMatchDesc` | Coba kata kunci lain atau pilih zona berbeda. | Try another keyword or pick a different zone. |
| `entry.tarifLabel` | Tarif: | Rate: |
| `entry.setTarifHint` | Set tarif di menu Member, lalu Edit. | Set the rate in Members, then Edit. |
| `entry.clearSearch` | Hapus pencarian | Clear search |
| `entry.deleteAria` | Hapus pembayaran | Delete payment |
| `entry.autoDate` | Tanggal diisi otomatis | Date is filled automatically |
| `entry.quickAria` | Nominal cepat | Quick amounts |
| `entry.filterAria` | Filter status pembayaran | Payment status filter |
| `entry.periodAria` | Periode entry | Entry period |
| `entry.batchNotEligible` | Sudah lunas atau gratis, tidak bisa dipilih | Already paid or free, cannot be selected |
| `entry.batchSkippedPaid` | member dilewati (sudah lunas atau gratis) | members skipped (already paid or free) |
| `entry.batchSelectedAria` | Pilih member | Select member |
| `entry.lockBannerAria` | Entry terkunci, ketuk untuk membuka | Entry locked, tap to unlock |
| `entry.summaryTotal` | Total periode | Period total |
| `entry.loadErrorTitle` | Gagal memuat data | Failed to load data |
| `entry.loadErrorDesc` | Periksa koneksi internet Anda, lalu coba lagi. | Check your internet connection, then try again. |
| `entry.zoneEmptyAction` | Buka Member | Open Members |

### 10c. Keputusan file yatim (T2 bagian 3)

| File | Keputusan |
|---|---|
| `DashboardView.Stats.tsx` | **dipakai ulang**: ditulis ulang menjadi StatTiles / IncomeCard / InsightCard / ZoneCards (sebelumnya memuat salinan kartu lama, tanpa pemakai) |
| `DashboardView.RecentActivity.tsx` | **dipakai ulang**: isinya kini memang Aktivitas Terbaru (A12); isi lama (tunggakan/backup/WA) pindah ke `.Unpaid` dan `.Tools` |
| `EntryView.MemberList.tsx` | **dipakai ulang**: satu-satunya pemilik markup daftar + state skeleton/kosong/tidak ditemukan/error; EntryView tidak lagi merender daftar sendiri |
| `EntryView.QuickPay.tsx` | **dihapus**: panel QuickPay-nya tidak terhubung ke aksi apa pun; QuickPay sesungguhnya sudah ada per kartu di `MemberCard` (`QuickPayGrid`). Test penjaga memastikan file tidak ada dan tidak ada file layar T7 yang tak diimpor |

### 10d. Perubahan logika yang disetujui user

- **(a) Guard batch (T2 keputusan 8b)**: hanya member BELUM BAYAR yang bisa dipilih. Diterapkan di tiga titik masuk lewat fungsi murni `entry/batch.ts`: `toggleBatchSelection` (satu member), `toggleSelectAll` (Pilih Semua = pemakai `setBatchSelected`), `buildBatchPayments` (eksekusi; juga TIDAK menimpa pembayaran lunas yang ikut terpilih bila data berubah setelah dipilih, dilewati dengan toast `entry.batchSkippedPaid`). **Penempatan**: guard ada di lapisan Entry, bukan di dalam `store/slices/viewSlice.ts`, karena slice itu berdiri sendiri (tanpa `appData`; test-nya membuatnya tanpa slice lain) sehingga tidak bisa menilai status bayar tanpa mengubah tipe store. Aksi store `toggleBatchMember` tidak lagi dipanggil EntryView (diganti `setBatchSelected` + guard); tidak ada pemanggil lain. Tekan lama pada member lunas/gratis tetap membuka mode pilih tanpa pilihan; member belum bayar tanpa tarif tetap bisa dipilih dan dilewati saat eksekusi (`entry.batchSkipped`, sesuai zip). 21 uji unit.
- **(b) Percabangan KRS/SLK** (T4 §3 butir 6, T5 §3): `getAllActiveZones` + `getMembersForZone` + `zoneCssColor` di `useDashboard.ts`, `DashboardView*`, `EntryView.tsx` (warna zona). `MemberCard.tsx` tidak bercabang KRS/SLK di v11.7.1 (tidak ada yang diubah untuk butir ini). Zona kustom kini ikut di statistik, pendapatan, insight, tunggakan, grafik 6 bulan, kartu zona; zona tersembunyi tidak. Test penjaga memindai file T7: tanpa `=== 'KRS'|'SLK'`, tanpa daftar `['KRS','SLK']`, tanpa ternary `--zc-krs/--zc-slk`. 18 uji unit. **Catatan**: total per zona dihitung oleh `zoneTotal()` lokal, BUKAN `getZoneTotal` (lihat bagian 9, T7 butir 1).
- Di luar dua hal ini: tidak ada logika bisnis diubah (`persistPayment`, `selectiveRollback`, kunci payment, lock global/entry, snapshot periode kartu, double-submit guard, undo utuh).

### 10e. Keputusan dan penyimpangan yang perlu diketahui

1. **Ringkasan periode dipertahankan dari zip** (total periode + jumlah lunas/belum/gratis, `sum-bar`) walau tidak ada di prototype T2; kontrak: tidak ada fitur zip yang hilang. Dipasang sebagai kartu ringkas di bawah bar periode.
2. **Kartu member**: tile huruf pertama berwarna status; nama + (chip ID, link IP bila ada) + tarif di baris kecil; badge status berteks (Lunas/Belum/Gratis) + nominal `rp()`. Nomor urut kartu (`mc-num`) tidak ditampilkan lagi (tidak ada di prototype). QuickPay TIDAK dinonaktifkan saat tarif kosong (zip mengizinkan; prototype menonaktifkan, zip menang). Label "Akm" hanya untuk nominal 0 (satu-satunya pemakaian "Akm" di zip; baris "Akm Rp…" di prototype adalah data contoh, tidak diada-adakan). Ripple tombol quick pay dibuang (diganti animasi tekan primitive).
3. **Sheet total batch** memakai `position: sticky` di dalam `#content` (bukan `fixed`): tidak menutupi Sidebar, tidak perlu `ResizeObserver` + spacer (perbaikan "ZAHDAN tak bisa diklik" tetap terjaga karena sheet ikut alur dokumen di akhir daftar); offset bawah mengikuti `navMode` (T6 §2 butir 7). Daftar preview per member di sheet (zip) diganti ringkasan jumlah + total + catatan "n member dilewati (belum ada tarif)" seperti prototype.
4. **Banner terkunci**: ketuk = buka, diteruskan ke tombol kunci Header (satu jalur unlock; lihat bagian 9, T7 butir 5).
5. **Perbaikan bug UI** (tanpa mengubah logika data): (i) klik yang menyusul tekan lama di mouse tidak lagi membatalkan pilihan member yang baru dipilih; (ii) `isLongPress` direset sebelum cek `batchMode` supaya ketukan pertama di layar sentuh tidak tertelan; (iii) tekan lama hanya dipicu dari baris atas kartu (bukan dari input/pilihan di badan kartu).
6. **Scroll Entry tersimpan**: di zip fitur ini tidak pernah berfungsi (handler `onScroll` dipasang pada `<div>` yang tidak scroll; yang scroll adalah `#content`) dan `setView()` di store selalu mereset `entryScrollTop` ke 0. Kini `EntryView` memantau `#content` dan menyimpan snapshot di modul; dipulihkan hanya bila zona + bulan + tahun sama dan tidak ada lompatan ke kartu tertentu dari Dashboard. Nilai tetap ditulis juga ke `entryScrollTop` (store tidak diubah).
7. **State baru** (siklus tampilan T2): Dashboard dan Entry punya skeleton (memuat), kosong (tombol ke Member), dan gagal-muat (`syncStatus === 'err'` tanpa data; tombol Coba Lagi = muat ulang halaman). Aksi "Coba Lagi" = muat ulang adalah asumsi sederhana; zip tidak punya aksi coba-ulang.
8. **A12**: nominal di baris aktivitas hanya diambil dari teks `detail` log `[PAY]` (regex `Rp …`), tidak dihitung ulang. Judul = teks aksi tanpa penanda `[PAY]` dsb; waktu "Hari ini/Kemarin, HH:MM" atau tanggal lokal seperti Log.
9. **Sapaan**: `userName`, bila kosong bagian lokal email; ikon `HandWaving` Phosphor (bukan emoji).
10. **Teks**: bug kecil di zip diperbaiki: `membercard.setTarifHint` berisi tag HTML yang tampil mentah di React → diganti key baru `entry.setTarifHint`. Toast/judul literal di MemberCard/EntryView ("Nominal tidak valid", "Hapus pembayaran", "dibatalkan", "Member tidak ditemukan", dst) kini lewat i18n. Teks yang ikut tersimpan di database (teks log `[PAY]`/`[UNDO]`) TIDAK diubah.
11. `showConfirm` di MemberCard: `info` (nominal di atas tarif) dan `trash` (hapus pembayaran).


---

## 11. TAHAP 8 — Rekap + Tunggakan + RiwayatModal (file, i18n, keputusan)

### 11a. File diubah / ditambah / dihapus (vs zip T7)

**Diubah (12)** — semuanya ditulis ulang kecuali dua file i18n (append-only)
- `components/features/rekap/RekapView.tsx` (661→429 baris; orkestrator), `RekapView.FilterBar.tsx`, `RekapModal.tsx` (dialog `Sheet`; logika tulis tetap), `RekapModal.MonthGrid.tsx`
- `components/features/tunggakan/TunggakanView.tsx` (281→201), `TunggakanView.FilterBar.tsx`, `TunggakanView.Item.tsx`
- `components/modals/RiwayatModal.tsx` (239→132; `Sheet`), `RiwayatModal.MonthRow.tsx`
- `hooks/useTunggakan.ts` (dipakai TunggakanView; perbaikan zona)
- `lib/locales/id.ts`, `lib/locales/en.ts` (+22 key, blok "REDESAIN T8", append-only)

**Ditambah (10)**
- `components/features/rekap/RekapView.Table.tsx`, `RekapView.Batch.tsx`, `rekap.logic.ts` (fungsi murni), `rekap.module.css`
- `components/features/tunggakan/tunggakan.module.css`, `components/modals/riwayat.module.css`
- Test: `components/features/rekap/__tests__/rekap.logic.test.ts` (15), `hooks/__tests__/useTunggakan.compute.test.ts` (11), `components/features/__tests__/t8-screens.test.tsx` (27), `lib/__tests__/redesign-t8-guard.test.ts` (17)

**Dihapus (1)**: `hooks/useRekap.ts` (yatim, lihat 11c).
**Diperbarui**: `REDESAIN-MANIFEST.md` (berkas ini). Tidak ada perubahan lain: pembandingan folder terhadap zip T7 hanya menunjukkan file di atas (`next-env.d.ts` dan `tsconfig.tsbuildinfo` adalah artefak build lokal, tidak ikut zip).

### 11b. Key i18n baru (id + en, 22 key, blok "REDESAIN T8", append-only)

| Key | id | en |
|---|---|---|
| `rekap.pickMulti` | Pilih Banyak | Select Multiple |
| `rekap.showing` / `rekap.of` | Menampilkan / dari | Showing / of |
| `rekap.periodAria` | Periode rekap | Recap period |
| `rekap.defaultTag` | default | default |
| `rekap.loadErrorTitle` / `rekap.loadErrorDesc` | Gagal memuat data / Periksa koneksi internet Anda, lalu coba lagi. | Failed to load data / Check your internet connection, then try again. |
| `tunggakan.searchPlaceholder` | Cari nama pelanggan... | Search customer name... |
| `tunggakan.totalArrears` | Total Tunggakan | Total Arrears |
| `tunggakan.sendWa` | Kirim WA | Send WA |
| `tunggakan.more` | lagi | more |
| `tunggakan.from` / `tunggakan.until` | Dari / s/d | From / to |
| `tunggakan.modeAria` / `agingAria` / `periodAria` | Mode tunggakan / Filter umur tunggakan / Periode tunggakan | Arrears mode / Arrears age filter / Arrears period |
| `tunggakan.loadErrorTitle` / `tunggakan.loadErrorDesc` | (sama dengan Rekap) | (same as Rekap) |
| `common.noMember` / `common.addMemberHint` | Belum ada member / Tambah member di menu Members | No members yet / Add members in the Members menu |
| `common.resetFilter` | Reset Filter | Reset Filter |
| `riwayat.open` | Lihat riwayat | View history |

Key zip yang dipakai ulang (tidak ditambah): `rekap.*` (page, subtotalPage, scrollHint, batchHint, batchSelected, batchConfirm, batchCancel, batchSuccess, allLocked, freeMember, dataLocked, accumulation), `entry.{selectAll, batchNotEligible, batchSkippedPaid, lockBannerAria, quickAria, filterAria, clearSearch, noMatch, invalidNominal, cancelled, zoneEmptyAction}`, `tunggakan.*` zip, `riwayat.*` zip, `status.*`, `common.*`, `lockbanner.message`. Dua teks T3 yang belum ada di zip tetapi sudah tercakup key di atas: "Nominal tidak valid" memakai `entry.invalidNominal`, "{nama} dibatalkan" memakai `entry.cancelled`.

### 11c. Keputusan file yatim (T3 bagian 3) — tidak ada duplikasi

| File | Keputusan |
|---|---|
| `RekapView.FilterBar.tsx` | DIPAKAI (ditulis ulang): periode, pencarian, chip status A15 |
| `RekapModal.MonthGrid.tsx` | DIPAKAI (ditulis ulang): isi RekapModal (input, hapus, QuickPay, Simpan, catatan) |
| `TunggakanView.FilterBar.tsx` | DIPAKAI (ditulis ulang): segmented 3 mode + chip aging |
| `TunggakanView.Item.tsx` | DIPAKAI (ditulis ulang): `ArrearsCard`, `OnTimeCard`, `FreeCard` |
| `RiwayatModal.MonthRow.tsx` | DIPAKAI (ditulis ulang): baris bulan RiwayatModal |
| `hooks/useTunggakan.ts` | DIPAKAI sebagai sumber tunggal perhitungan TunggakanView (`buildTunggakan` murni + hook). Percabangan zona tertanam diganti `getAllActiveZones` untuk mode TOTAL |
| `hooks/useRekap.ts` | DIHAPUS: subset logika `RekapView`, tidak diimpor siapa pun; logika Rekap kini murni di `rekap.logic.ts` dan teruji |

Test penjaga memastikan tidak ada file layar T8 yang tidak diimpor.

### 11d. Perubahan logika yang disetujui user (hanya yang tercantum di serah-terima T3 + perbaikan zona)

- A15 filter status Rekap · A16 nominal tunggakan per member + Total Tunggakan · A17 tombol Pilih Banyak · A18 ketuk nama/kartu membuka RiwayatModal · A19 pencarian di Tunggakan — semuanya dihitung dari `getPay`/`isFree`/`getArrears`/tarif; tanpa field data baru.
- Pengaman batch Rekap (T3 keputusan 5 dan 6): hanya sel belum bayar yang bisa dipilih dan yang ditulis; lunas, Akm, gratis dilewati (tidak ditimpa). Aturan satu sumber: `isBatchEligible`/`toggleBatchSelection`/`toggleSelectAll` milik Entry (`entry/batch.ts`) dipakai langsung, tidak disalin.
- Perbaikan percabangan zona di file milik T8: `hooks/useTunggakan.ts` (zona aktif atau `getAllActiveZones`), tanpa `=== 'KRS'`/`'SLK'` di seluruh file T8 (dijaga test). `getZoneTotal` TIDAK dipakai (Rekap menjumlah per anggota zona sendiri).
- Tidak diubah (logika zip utuh): `persistPayment`/`persistPaymentGranular`/`selectiveRollback`, kunci payment, lock global/entry, long press 500 ms, kilat sukses, pagination 20 baris, subtotal halaman, rumus total baris dan kolom, Toast Undo (`showToastUndo`), `doWABlast` dengan tarif individual, aging 1 / 2–3 / 4+.

### 11e. Keputusan dan penyimpangan yang perlu diketahui

1. **Nama bulan singkatan** ("Okt", "Mar") — `MONTHS` zip menang atas nama penuh di prototype (lihat 9, "Dari T8" butir 7).
2. **Placeholder pencarian** Rekap tetap `Cari member...` (teks zip + dikunci test paginasi); Tunggakan `Cari nama pelanggan...` (teks T3). Tidak seragam — butir 6 di bagian 9.
3. **Tag "default"** di sheet batch mengikuti rumus zip `tarif ?? QuickPay pertama`: tampil bila member tidak punya tarif. Tarif 0 tidak pernah tersimpan (form menyimpan tarif hanya bila >0), jadi "tarif 0" di teks T3 = "tanpa tarif".
4. **Total baris vs kolom** tidak disatukan (perilaku zip): total baris mengecualikan bulan gratis, total kolom/subtotal/total memakai nilai mentah. Hanya berbeda bila member gratis punya nilai bayar tercatat di bulan gratisnya. Dicatat, tidak diubah (logika).
5. **Label bulan di chip tunggakan** mengikuti bahasa pengguna (zip menampilkan label Indonesia mentah dari `getArrears`); pesan WA tetap memakai label Indonesia (zip).
6. **Tabel Rekap**: satu `<table>` dengan header dan kolom `#`/Nama `position: sticky` di kartu ber-`max-height: min(56vh, 520px)` (T3 keputusan 2). Mekanisme lama (tabel header terpisah + sinkron scroll untuk menghindari header beku di Chrome Android) DIHAPUS; belum diuji di perangkat nyata — cek visual wajib. Bila bermasalah, perbaikannya cukup di `rekap.module.css`.
7. **Periode**: Rekap kini punya bulan acuan (`selMonth`, dibagi dengan Entry/Dashboard/Tunggakan; sebelumnya hanya tahun). Ganti tahun menutup modal dan mode pilih (zip); ganti bulan tidak. Ganti zona juga membatalkan mode pilih Rekap (perilaku prototype T3; zip tidak mereset).
8. **Filter status Rekap** disimpan lokal di `RekapView` (bukan `filterStatus` store milik Entry) agar tidak bocor antar layar; mengubahnya mengembalikan ke halaman 1.
9. **RiwayatModal** dirender kondisional (`{riwOpen && …}`) di Rekap/Tunggakan karena komponen itu memakai `useRouter`; test paginasi Rekap berjalan tanpa mock `next/navigation`. `MemberCard`/`MembersView` tetap merendernya seperti dulu.
10. **Tombol "Buka Member"** pada keadaan kosong memakai `next/link` + `buttonVariants` (bukan `useRouter`) karena alasan yang sama.
11. **Fokus RekapModal**: input difokuskan satu tick setelah `Sheet` terbuka (Sheet memfokus kontrol pertamanya); Simpan ≡ Enter zip (menyimpan walau input belum diubah), blur tetap menyimpan seperti zip.
12. **Mode TOTAL** di `useTunggakan` (`activeZone === 'TOTAL'`) sudah didukung dan diuji, tetapi `TunggakanView` hanya memakainya bila store memberi zona itu; tampilan zona di kartu belum dirancang untuk TOTAL.
13. **Tidak diambil dari gambar (T3 §2b)**: navigator bulan sheet, Filter & Urutkan Tunggakan, Bayar Sekarang dari Tunggakan, dialog "Proses Pembayaran?", panel info total, status ikon penuh di semua sel — tidak dikerjakan.
14. **Belum diuji**: perangkat sentuh nyata (tekan lama diuji dengan event sintetis + timer palsu), Safari iOS, audit aksesibilitas penuh, tampilan visual bahasa Inggris, durasi toast Undo 4 detik di perangkat, e2e Playwright (tidak dijalankan).

---

## 12. TAHAP 9 — Member + Grafik + FreeMemberModal (file, i18n, keputusan)

### 12a. File diubah / ditambah / dihapus (vs zip T8)

**Ditambah (18)**
- `components/features/members/MembersView.Card.tsx`, `MembersView.Form.tsx`, `MembersView.Deleted.tsx`, `MembersView.Toolbar.tsx`, `members.logic.ts`, `members.module.css`
- `components/features/members/__tests__/members.logic.test.ts` (30 test)
- `components/features/grafik/GrafikView.Income.tsx`, `GrafikView.Counts.tsx`, `GrafikView.Parts.tsx`, `grafik.logic.ts`, `grafik.chart.ts`, `grafik.module.css`
- `components/features/grafik/__tests__/grafik.logic.test.ts` (16 test)
- `components/modals/freeMember.module.css`
- `components/features/__tests__/t9-screens.test.tsx` (33 test), `lib/__tests__/redesign-t9-guard.test.ts` (21 test), `lib/__tests__/zone-members.test.ts` (10 test)

**Diubah (10)**
- `components/features/members/MembersView.tsx` (ditulis ulang: orkestrator + persist; tampilan di file `MembersView.*`)
- `components/features/grafik/GrafikView.tsx` (ditulis ulang: kontrol + tab + state)
- `components/modals/FreeMemberModal.tsx` (bottom sheet pada `Sheet`, tanpa framer-motion), `FreeMemberModal.Form.tsx` (dipakai ulang, ditulis ulang)
- `app/(app)/grafik/page.tsx` (penanda muat = skeleton tanpa teks; sebelumnya teks "Memuat grafik…" tertanam tanpa i18n)
- `lib/payment.ts` (getZoneTotal), `lib/member.ts` (setMembersForZone), `lib/helpers.ts` (re-export)
- `lib/locales/id.ts`, `lib/locales/en.ts` (blok T9, 30 key, append-only)

**Dihapus (6)**: `components/features/grafik/GrafikView.{ComplianceChart,IncomeChart,ZoneChart}.tsx`, `lib/chartConfigs.ts`, `hooks/useMembersFilter.ts`, `components/modals/FreeMemberModal.List.tsx` (alasan: bagian 12c).

### 12b. Key i18n baru (id + en, 30 key, blok "REDESAIN T9", append-only)

| Key | id | en |
|---|---|---|
| `members.searchPlaceholder` | Cari nama, ID, atau IP... | Search name, ID, or IP... |
| `members.sort` | Urutkan | Sort |
| `members.copyIp` | Salin IP | Copy IP |
| `members.ipCopied` | IP disalin | IP copied |
| `members.copyFailed` | Gagal menyalin IP | Could not copy IP |
| `members.statusFor` | Status bulan | Status for |
| `members.freeSetAria` | Set member gratis | Set as free member |
| `members.freeUnsetAria` | Cabut status member gratis | Remove free member status |
| `members.editAria` | Edit member | Edit member |
| `members.deleteAria` | Hapus member | Delete member |
| `members.purgeAria` | Hapus permanen | Delete permanently |
| `members.records` | data | records |
| `members.tabsAria` | Daftar member | Member list |
| `members.loadErrorTitle` | Gagal memuat data | Failed to load data |
| `members.loadErrorDesc` | Periksa koneksi internet Anda, lalu coba lagi. | Check your internet connection, then try again. |
| `freemodal.title` | Free Member: | Free Member: |
| `grafik.tabIncome` | Pendapatan | Income |
| `grafik.tabPayments` | Pembayaran | Payments |
| `grafik.tabCustomers` | Pelanggan | Customers |
| `grafik.tabsAria` | Jenis data grafik | Chart data type |
| `grafik.transactions` | Transaksi | Transactions |
| `grafik.activeCustomers` | Pelanggan Aktif | Active Customers |
| `grafik.vsPrevMonth` | dari bulan lalu | vs last month |
| `grafik.txPerMonth` | Transaksi per Bulan | Transactions per Month |
| `grafik.activePerMonth` | Pelanggan Aktif per Bulan | Active Customers per Month |
| `grafik.txHint` | Pembayaran tercatat | Recorded payments |
| `grafik.totalCustomers` | Total pelanggan | Total customers |
| `grafik.registered` | terdaftar | registered |
| `grafik.loadErrorTitle` | Gagal memuat data | Failed to load data |
| `grafik.loadErrorDesc` | Periksa koneksi internet Anda, lalu coba lagi. | Check your internet connection, then try again. |

Key zip yang dipakai ulang (tidak ditambah): `members.*` (add, addTo, editTitle, saveChanges, namePlaceholder, nameRequired/InvalidChar/Duplicate, notFound, added, updated, delete, deleteNote, restore, restored, permDelete*, recycleBinEmpty/Desc, statusLocked/Unlocked, actionAria*, hasNotesHint, empty/emptyDesc, customerId, tarifShort, tarifLabel, ipLabel, notesLabel, notesPlaceholder), `grafik.*` (monthly, yearly, projection, basedOn, lastMonths, twoperiod, period1/2, diff, composition, avgMonth, vsLastYear, noDataTitle/Desc), `freemodal.*`, `entry.{filterAria, noMatch, noMatchDesc, clearSearch}`, `common.{resetFilter, retry, saveFailed, members, noResult, ...}`, `riwayat.open`, `status.*`.

### 12c. Keputusan file yatim (serah-terima T4 bagian 0) — tidak ada duplikasi

| File | Keputusan |
|---|---|
| `GrafikView.ComplianceChart.tsx`, `GrafikView.IncomeChart.tsx`, `GrafikView.ZoneChart.tsx` | **dihapus**: tidak diimpor siapa pun; fungsinya (donat komposisi, pendapatan bulanan, perbandingan zona) sudah ada di layar Grafik (kini `GrafikView.Counts.tsx` / `GrafikView.Income.tsx`). Test penjaga memastikan ketiganya tidak ada |
| `lib/chartConfigs.ts` | **dihapus**: satu-satunya pemakai adalah tiga file yatim di atas; opsi grafik kini `grafik.chart.ts` (token + label sumbu ringkas) |
| `hooks/useMembersFilter.ts` | **dihapus**: tidak diimpor; hanya mengenal KRS/SLK dan memakai pencocokan fuzzy yang beda dengan zip. Penggantinya `members.logic.ts` (`matchesQuery`, `sortMembers`; teruji, zona dinamis) |
| `FreeMemberModal.List.tsx` | **dihapus**: daftar "Member Free saat ini" tidak dipakai modal produksi dan tidak ada di prototype T4 (key `freemodal.existing` dibiarkan; tidak merugikan) |
| `FreeMemberModal.Form.tsx` | **dipakai** (ditulis ulang): satu-satunya pemilik isi form Free; `FreeMemberModal.tsx` memegang state + penyimpanan |

### 12d. Perubahan logika yang disetujui user (serah-terima T4 bagian 3 + prompt T9 butir 4)

1. **Perbaikan zona kustom**: zona kustom berlogika sama persis dengan KRS/SLK. `getZoneTotal` (anggota zona itu, bukan SLK); Member tambah/edit/hapus/pulihkan lewat `getMembersForZone` + `setMembersForZone` (tidak lagi menimpa daftar SLK); Grafik: semua perhitungan per zona lewat `getMembersForZone`/`getZoneTotal`, mode TOTAL = jumlah `getAllActiveZones`, grafik perbandingan = satu garis per zona aktif + TOTAL (judul dinamis), warna zona lewat `zoneColor(zona, customZones)`. Diuji 1–5 zona kustom.
2. **A20** status bulan acuan + filter status Member (memakai `refStatus`/`statusCounts`/`filterByStatus` milik Rekap; satu sumber aturan). **A21** cari lewat nama, ID, IP. **A22** salin IP. **A23** catatan opsional ikut tersimpan saat Tambah. **A24** tab jenis data Grafik. **A25** Transaksi. **A26** Pelanggan Aktif.
3. Diperbaiki sambil lalu di Grafik (akibat aturan "mode TOTAL = jumlah semua zona aktif"): pada mode TOTAL, zip menghitung total Dua Periode dari kunci pembayaran "TOTAL__nama" (hasilnya selalu 0) dan donat komposisi hanya memakai zona KRS; kini keduanya dijumlah dari semua zona aktif.

### 12e. Keputusan dan penyimpangan yang perlu diketahui

1. **Pola T8 ditiru**: logika murni di `members.logic.ts` / `grafik.logic.ts` (teruji tanpa React), gaya per layar di CSS Modul (hanya token), orkestrator + file `Layar.Bagian.tsx`, `Segmented`/`FilterChips`/`Sheet`/`EmptyState`/`Skeleton`/`KpiGrid`/`DeltaPct` dari `components/ui` (tidak ada primitive baru, tidak ada perubahan `components/ui`).
2. **Kunci Member** dipertahankan di dalam `MembersView.tsx` (bukan file terpisah) karena test lama `i18n-and-ui-consistency` memindai teks `MembersView.tsx` untuk pola status/tombol kunci (merah = terkunci, hijau = terbuka, `header-lock-action-btn`). Test itu tidak diubah dan tetap lulus.
3. **Tambah dan Edit = satu bottom sheet** (`MembersView.Form.tsx`). Tambah: sheet menutup setelah berhasil (form inline zip tetap terbuka untuk tambah berikutnya; prototype T4 menutup). Gagal simpan: sheet tetap terbuka + toast, data dikembalikan (rollback selektif). Galat nama tampil inline di kolom Nama + toast; Enter di kolom Nama menyimpan (hanya Tambah).
4. **Kartu member** memakai pola `.mc` T2/T7: status (Lunas/Belum/Gratis, bulan acuan) kini selalu tampil (zip: hanya badge Gratis); ketuk bagian atas kartu = RiwayatModal; baris bawah memuat tautan IP (membuka link router, seperti zip), salin IP, Free, Edit, Hapus (disembunyikan saat terkunci).
5. **RiwayatModal** dirender kondisional (`{riwOpen && …}`) karena memakai `useRouter` (sama seperti Rekap/Tunggakan); antarmuka tidak berubah.
6. **Grafik tetap Chart.js** (react-chartjs-2) dengan `chartTheme(..., theme)` (tema Emas kini diteruskan; zip hanya Terang/Gelap), warna dari token/konstanta `lib/design-tokens.ts` (kanvas tidak bisa memakai `var(--…)`). Sumbu memakai angka ringkas (`compactRp`: rb/jt/M), nilai penuh "Rp …" di tooltip. Legenda Chart.js diganti legenda kartu (mengikuti prototype).
7. **FreeMemberModal**: isi sheet dipasang hanya saat terbuka, jadi state awal selalu segar dari data member (zip: efek menyinkronkan saat data berubah ketika modal terbuka; tidak ada perilaku yang hilang untuk pemakaian normal). Judul "Free Member: nama" kini lewat key `freemodal.title`. Tidak ada penjaga klik ganda (zip juga tidak punya).
8. **Aksesibilitas**: tab zona/jenis data memakai `role=tab` (`Segmented mode="tabs"`), kanvas dibungkus `role=img` + `aria-label`, tombol ikon beraria-label berisi nama member, kartu bagian atas `role=button` + Enter/Spasi.
9. **Keadaan kosong** zona: tombol tambah muncul di toolbar (ikon plus) DAN di EmptyState (bila tidak terkunci) — dua jalur ke aksi yang sama, seperti prototype T4.
10. **Tab zona Member banyak zona**: `Segmented` (primitive T6) bisa digeser mendatar (`overflow-x: auto`) tetapi TIDAK membawa tab aktif ke tengah (prototype T4 melakukannya); tidak diubah karena `components/ui` bukan milik T9. Bila diinginkan = revisi eksplisit kecil di `Segmented.tsx` (scrollIntoView tab aktif).
11. **Key `grafik.activeHint` ("Lunas + gratis") tidak ditambahkan**: tidak ada tempat pemakaiannya di tampilan produksi (hanya kuncinya yang tercantum di daftar teks T4), jadi tidak dibuat key yatim.
12. **Tidak diubah**: `APP_VERSION`, `components/ui/*`, `styles/*`, `components/layout/*`, `AppShell.tsx`, Dashboard/Entry/`MemberCard.tsx` (T7), Rekap/Tunggakan/RiwayatModal (T8), layar T10, dependensi.

---

## 13. TAHAP 10 — Log + Operasional + Pengaturan + Notifikasi + modal sisa (file, i18n, keputusan)

### 13.1 Ringkasan
Semua layar milik T10 ditulis ulang dengan primitive T6 + CSS Modules (pola T7–T9): Log, Operasional, Pengaturan (dua level), Pusat Notifikasi (A3), AccountModal, ImportModal, PinLock, OnboardingHint. Logika zip dipertahankan; yang berubah hanya yang disetujui (A27–A29, A3, perbaikan zona kustom) dan beberapa perbaikan kecil yang dicatat di 13.6. Gerbang: bagian 1c.

### 13.2 Register Tambahan yang diputuskan di T10
| ID | Keputusan | Wujud |
|---|---|---|
| A27 | **DISETUJUI** (semua; alasan user: logika dan fungsi seperti zip, plus tambahan prototype bila lebih baik dan layak) | Tab Log: Semua / Hanya Bayar / Data / Sistem. Klasifikasi eksklusif di `log.logic.ts` `logKind`: Pembayaran = aturan zip `isPayLog` (tidak diubah); Sistem = awalan Login/Masuk/Logout/Keluar/Kunci/Lock/Sync (dengan atau tanpa tag `[..]`); Data = sisanya |
| A28 | **DISETUJUI** | Sheet Detail Aktivitas baca-saja (`LogView.Detail.tsx`): judul, rincian, nominal, tanggal+waktu, pelaku, jenis. Tanpa field baru di database |
| A29 | **DISETUJUI** | Sheet Statistik Log (`LogView.Stats.tsx`): total / Pembayaran / Data / Sistem, grafik batang per hari (CSS, tanpa Chart.js), 3 aktivitas terbaru (membuka Detail). Dihitung dari `activityLog` yang sudah difilter Tahun/Bulan/cari. Periode grafik: bulan terpilih; tanpa bulan = bulan entri terbaru |
| A3 | Isi Pusat Notifikasi (kerangka T6) | `notifications/NotificationCenter.tsx`: 8 aktivitas terbaru, ajakan backup (belum pernah / > 30 hari, dari `localStorage wp_last_backup`), item sementara "Gagal simpan" dan "Offline". Penanda dibaca PER-UID di `localStorage wp_notif_read_<uid>`; item sementara selalu belum dibaca. Item Log membuka Detail (`logDetailBridge`), item backup membuka Pengaturan > Export (`settingsBridge`) |

### 13.3 File
**Ditambah:** `components/features/log/{log.logic.ts, logDetailBridge.ts, LogView.Detail.tsx, LogView.Stats.tsx, log.module.css, __tests__/log.logic.test.ts}`; `components/features/operasional/{operasional.logic.ts, OperasionalView.Sheet.tsx, operasional.module.css, __tests__/operasional.logic.test.ts}`; `components/features/settings/{SettingsRow.tsx, SettingsPage.tsx, settings.logic.ts, settingsBridge.ts, settings.module.css}`; `components/features/notifications/{NotificationCenter.tsx, notifications.logic.ts, notifications.module.css, __tests__/notifications.logic.test.ts}`; `components/features/__tests__/t10-screens.test.tsx`; `lib/__tests__/{redesign-t10-guard.test.ts, t10-zone-fixes.test.ts}`.
**Ditulis ulang (nama sama):** `LogView.tsx`, `OperasionalView.tsx`, `SettingsView.tsx`, `SettingsAppSection.tsx`, `SettingsBiometricSection.tsx`, `SettingsEmailSection.tsx`, `SettingsIPSection.tsx`, `SettingsPinSection.tsx`, `SettingsTarifSection.tsx`, `SettingsTenantSection.tsx`, `SettingsZoneSection.tsx`, `AccountModal.tsx`, `ImportModal.tsx`, `PinLock.tsx`, `OnboardingHint.tsx`.
**Diubah kecil:** `Header.tsx`, `Header.Notifications.tsx`, `viewSlice.ts` (7e); `lib/db.ts`, `lib/export.excel.ts`, `lib/export.wa.ts` (13.5); `lib/locales/{id,en}.ts`; `lib/constants.ts`; `README.md`; `REDESAIN-MANIFEST.md`.
**Dihapus (yatim, tanpa duplikasi):** `OperasionalView.Form.tsx`, `CollapsibleGroup.tsx`, `CollapsibleSection.tsx`, `SettingsPinSection.Setup.tsx`, `SettingsPinSection.Change.tsx`, `SettingsTarifSection.Form.tsx`, `SettingsTarifSection.List.tsx`, `SettingsZoneSection.Form.tsx`, `SettingsZoneSection.List.tsx`, `ExportModal.tsx`, `ShareModal.tsx`, `PinLock.Numpad.tsx`, `lib/onboardingSteps.tsx`.

### 13.4 Keputusan yatim
- Semua yatim di atas dihapus; langkah PIN (aktifkan/ubah/nonaktifkan) kini satu alur di `SettingsPinSection.tsx`; Form/List Zona dan Tarif digabung ke file induk atau `PeriodPicker` lokal.
- **"Bagikan JSON via Web Share"** (unik di `ExportModal`) TIDAK dipindah ke Pengaturan: fungsi itu masih hidup di `DashboardView.Tools` (`doJSONShare`). Bila ingin kartu "Bagikan JSON" di Export & Import, tambahkan di T11 (1 `ActionCard`).
- `PinLock.Numpad.tsx` diganti primitive `Numpad`; `lib/onboardingSteps.tsx` diganti daftar langkah di `OnboardingHint.tsx` (teks via i18n).

### 13.5 Perbaikan zona kustom (disetujui; zona kustom = KRS/SLK)
| Tempat | Sebelum (zip) | Sesudah |
|---|---|---|
| `lib/db.ts` `normalizeImportedData` / `importToDB` | `zoneMembers` dan `customZones` tidak dibaca/ditulis (member zona kustom hilang saat Import) | `zoneMembers` dibaca (hanya array string) dan ditulis (diganti utuh; kosong bila file tak memuatnya). Baru: `extractImportedCustomZones`, `zonesToRegister` (zona yang belum terdaftar di Pengaturan didaftarkan otomatis dengan warna dari file atau palet cadangan) |
| `ImportModal` | Ringkasan hanya KRS + SLK + jumlah data | Ringkasan per zona (`importSummary`) di Confirm (`warning`) dan toast |
| `lib/export.excel.ts` (PDF + Excel) | `ALL` = KRS + SLK; zona lain jatuh ke SLK | `zoneRows(data, zone, zones?)` lewat `getMembersForZone`; `zonesFromData`; param opsional `zones` |
| `lib/export.wa.ts` `doWASummary` | Dua blok tetap KRS/SLK | Satu blok per zona aktif (`zones?` opsional; default `zonesFromData`); format pesan untuk 2 zona IDENTIK dengan zip, termasuk penanda di pesan |
| Operasional ringkasan | Dua baris tetap | Satu baris per zona aktif (`getAllActiveZones` + `getZoneTotal`) |
| Pengaturan Tarif/Export/Share | Pilihan zona KRS/SLK tertanam | `zoneChoices(settings, withAll)` |
| Pengaturan Zona, Akun Penagih, Konversi IP | Hitung member / daftar member bercabang KRS/SLK | `getMembersForZone` + `allZoneKeys` (`settings.logic.ts`) |
| OnboardingHint | "Ketuk tombol KRS atau SLK" | "Ketuk tab zona di header" |

Penjaga: `redesign-t10-guard.test.ts` memindai berkas T10 + `lib/export.excel.ts` + `lib/export.wa.ts` (tanpa percabangan zona tertanam dan tanpa `krsMembers/slkMembers` di layar). Uji: `t10-zone-fixes.test.ts` (2–3 zona), `t10-screens.test.tsx`.

### 13.6 Keputusan, penyimpangan, perbaikan kecil (mohon dicek)
1. **Dua level Pengaturan:** prompt menyebut `CollapsibleGroup + CollapsibleSection` "tetap seperti zip", sedangkan keputusan T5 D1/D2 + prototype menetapkan baris level-2 membuka HALAMAN ISI (drill-down). Diikuti keputusan T5: level-1 = primitive `CollapsibleGroupHeader/Body`, level-2 = `SettingsRow` → `SettingsPage`. Dua komponen lama dihapus karena nol pemakai. Pemetaan nama (A8) dan semua seksi zip tetap ada. Test lama yang mengunci `badgeColor="var(--c-lunas)"` dijaga (literal di `SettingsView.tsx`).
2. **Log:** pilihan jenis tersimpan di store (`logType`); awalan `[..]` disembunyikan di tampilan saja (data + pencarian memakai teks asli); batas 150 baris; kata "dari" kini lewat i18n (`log.countOf`; di zip tertulis langsung).
3. **Operasional:** simpan saat blur HANYA bila nilai berubah (zip menyimpan + mencatat log tiap blur); toast hapus sukses kini hijau (zip: merah); Tambah Item = sheet (keterangan wajib); `krsMembers` tidak lagi dipakai.
4. **Pengaturan:** teks `t('Aktif — app terkunci…')` (teks sebagai kunci) diganti key (`settings.pin.descActive/descInactive`); toast bahasa dan "Auto-lock" lewat i18n; Share Excel tanpa `ALL`: bila `ALL` terpilih saat pindah format, zona dikembalikan ke zona pertama (di zip pilihan menjadi tidak valid); Akun Penagih menampilkan Notice peringatan di layar sukses bila clone/daftar sebagian gagal (toast zip tetap ada); pesan WA ke luar aplikasi TIDAK diubah.
5. **Kamus (D14):** 8 nilai dibersihkan tanpa mengubah key: `account.badgeEmail`, `account.switchAccount`, `account.googleLinked`, `account.googleLinkedToast`, `biometric.verifySuccess`, `biometric.enablePinWarning`, `emailSection.sendResetBtn`, `emailSection.resetSentDesc` (id + en).
6. **PinLock:** DOM 6 `input[maxLength=1]` tersembunyi dipertahankan (test lama); teks "PIN salah, coba lagi" kini key `pin.wrongRetry`; hash identik dengan Pengaturan (dijaga guard). Logo Google di AccountModal memakai ikon Phosphor (bukan SVG berwarna merek).
7. **Notifikasi:** ambang backup 30 hari dan batas 8 aktivitas adalah pilihan T10 (konstanta di `notifications.logic.ts`); bukan dari prototype.
8. **Belum diaudit ulang satu per satu:** butir "Temuan lain" serah-terima T5 bagian 3 hanya ditangani bila tersentuh saat menulis ulang (daftar di atas). T11 perlu mencocokkannya.

### 13.7 Key i18n baru (id + en, blok "REDESAIN T10", append-only; 99 key)
- `log.*` (27): `log.typeData`, `log.typeSystem`, `log.typeAria`, `log.stats`, `log.statsTitle`, `log.statTotal`, `log.statPay`, `log.statData`, `log.statSys`, `log.perDay`, `log.recent`, `log.detailTitle`, `log.detailNote`, `log.detailWhen`, `log.detailActor`, `log.detailKind`, `log.detailAmount`, `log.countOf`, `log.yearAria`, `log.monthAria`, `log.resetAria`, `log.loadErrorTitle`, `log.loadErrorDesc`, `log.noActivity`, `log.notFound`, `log.openDetail`, `log.searchClear`
- `notif.*` (13): `notif.markAll`, `notif.unread`, `notif.allRead`, `notif.unreadMark`, `notif.syncErr`, `notif.syncErrDesc`, `notif.offline`, `notif.offlineDesc`, `notif.backup`, `notif.backupLast`, `notif.backupNever`, `notif.loadError`, `notif.loadErrorDesc`
- `onboarding.*` (10): `onboarding.title`, `onboarding.nav.title`, `onboarding.nav.desc`, `onboarding.zone.title`, `onboarding.zone.desc`, `onboarding.entry.title`, `onboarding.entry.desc`, `onboarding.next`, `onboarding.skip`, `onboarding.done`
- `ops.*` (17): `ops.addItemBtn`, `ops.editItem`, `ops.itemMenu`, `ops.labelField`, `ops.nominalField`, `ops.labelRequired`, `ops.emptyTitle`, `ops.emptyDesc`, `ops.loadErrorTitle`, `ops.loadErrorDesc`, `ops.itemAdded`, `ops.itemSaved`, `ops.itemDeleted`, `ops.yearAria`, `ops.monthAria`, `ops.itemsCount`, `ops.deleteHint`
- `pin.*` (4): `pin.wrongRetry`, `pin.backspace`, `pin.bioAria`, `pin.bioFailed`
- `settings.*` (17): `settings.back`, `settings.langToastId`, `settings.langToastEn`, `settings.zonesBadge`, `settings.navModeDesc`, `settings.toastPosDesc`, `settings.themeDesc`, `settings.languageDesc`, `settings.groupCount`, `settings.pin.descActive`, `settings.pin.descInactive`, `settings.autoLockToast`, `settings.ip.findPlaceholder`, `settings.ip.replacePlaceholder`, `settings.periodType`, `settings.pdfExcel`, `settings.shareNote`
- `zona.*` (11): `zona.prefix`, `zona.renameTitle`, `zona.hideTitle`, `zona.showTitle`, `zona.deleteTitle`, `zona.editAria`, `zona.hideAria`, `zona.showAria`, `zona.deleteAria`, `zona.custom`, `zona.colorPick`

### 13.8 Nilai kamus yang diubah (key tetap)
Lihat 13.6 butir 5.

### 13.9 Checklist Daftar Wajib-Ada — layar T10 (semua [x]; tampilan belum diverifikasi visual)
- [x] Log: cari, filter Semua/Hanya Bayar/Data/Sistem, Tahun+Bulan+Reset, ikon per aksi, loading/kosong/tidak ada hasil/error, tidak dikunci kunci global (`LogView.tsx`)
- [x] A27 tab Data + Sistem · A28 Detail Aktivitas · A29 Statistik (`log.logic.ts`, `LogView.Detail.tsx`, `LogView.Stats.tsx`)
- [x] Operasional: tahun/bulan, edit baris + simpan + rollback, tambah (sheet), hapus (Confirm trash), ringkasan per zona + bersih, kosong/loading/error (`OperasionalView.tsx`)
- [x] Pengaturan: 6 grup; Akun Saya (Email, Reset), Akun Penagih, PIN + Auto-lock, Biometrik, Zona (tambah/ubah nama/sembunyikan/hapus), Konversi IP, Quick Pay, Tanggal Otomatis, Export (JSON/PDF/Excel) + Import, Ringkasan WA + Share, Tema, Mode Navigasi (A1), Posisi Toast (A2), Bahasa, Info Aplikasi
- [x] Pusat Notifikasi A3 (lencana, daftar, tandai dibaca, navigasi)
- [x] AccountModal (Hubungkan Google, Ganti Akun, Keluar) · ImportModal (ringkasan + Confirm) · PinLock (+ biometrik) · OnboardingHint

### 13.10 Sisa pekerjaan untuk T11
1. **Audit menyeluruh** zip final vs zip asli v11.7.1 (kontrak bagian 9 butir 7): tidak ada file logika berubah di luar Register Tambahan dan perbaikan zona kustom; tidak ada fitur Daftar Wajib-Ada hilang.
2. **CSS/berkas nol pemakai** (hapus per blok setelah `grep` ulang): `.ctrl-row`, `.search-box`, `.search-wrap`, `.search-clear` di `styles/components.entry.css` kini NOL pemakai di TS/TSX; cek juga blok Log/Operasional/Pengaturan lama di `styles/*`.
3. **Layar tanpa pemilik:** `components/modals/GlobalSearch.tsx` (lucide, framer-motion, percabangan KRS/SLK), `app/(app)/error.tsx` dan `not-found.tsx` (lucide), `app/global-error.tsx`, `app/(app)/{loading,template,layout}.tsx`, `app/page.tsx`, `app/layout.tsx` → putuskan restyle atau biarkan.
4. **`lucide-react`** kini hanya di 4 berkas: `app/(app)/error.tsx`, `app/(app)/not-found.tsx`, `components/modals/GlobalSearch.tsx`, `lib/constants.ts` (ikon aksi log). Hapus dari `package.json` HANYA setelah nol pemakai (perubahan dependensi = keputusan T11).
5. `showConfirm` non-semantik: tidak ada lagi di kode non-test (diperiksa `grep`).
6. Opsional: kartu "Bagikan JSON" di Export & Import (13.4); verifikasi visual di perangkat (1c).

---

## 14. TAHAP T11 — verifikasi, pembersihan, zip final

Berkas ini dipindah dari root ke `docs/` di T11 (kontrak bagian 9 butir 5). Laporan audit lengkap T11 ada di luar zip (`WIFIPAY-T11-LAPORAN-AUDIT.md`).

### 14.1 Verifikasi
- Diff terhadap zip asli v11.7.1: 201 berkas asli → 281 (T10) → 286 setelah T11 (+9 baru, −4 dihapus, 17 diubah; `REDESAIN-MANIFEST.md` hanya pindah ke `docs/`); `package.json` dan `pnpm-lock.yaml` hanya bertambah `@phosphor-icons/react` (T10). `types/`, `proxy.ts`, `scripts/`, `database.rules.json`, `next.config.ts`, `lib/export.json.ts`, `lib/backup.ts` identik dengan zip asli.
- Semua perubahan file logika (`lib/`, `hooks/`, `store/`) berada di daftar izin (Register A1–A3, A27–A29, perbaikan zona kustom T7–T10, MANIFEST 7b–7e).
- Daftar Wajib-Ada: 102 butir diperiksa di kode, 102 ada. Register A12–A29: semua ada; A4 (Scan), A6 (Hapus Log), A9 (Mode Offline) tidak ada (sesuai keputusan).
- Gerbang: `tsc` bersih, `eslint .` bersih, `vitest` 738 test / 44 file lulus, build mentah gagal HANYA pada 2 galat Google Fonts, build uji (font di-stub) lulus 16/16 halaman.

### 14.2 Perubahan T11 (kecil, semua tampilan/a11y atau zona kustom)
1. `SettingsView.tsx`: judul baris Akun = "Akun Saya" / "Akun Penagih", deskripsi = judul seksi (sesuai zip dan prototype T5).
2. `GlobalSearch.tsx`: primitive Sheet + token + Phosphor; lencana zona kustom memakai `zoneCssColor` (dulu jatuh ke gaya SLK). Logika pencarian zip utuh.
3. `AppShell.tsx` + `shellLogic.ts`: `hasAnyMembers` (zona mana pun) memicu cek auto-backup; `useEscapeClose` menutup drawer Sidebar.
4. `app/(app)/error.tsx`, `not-found.tsx`, `app/global-error.tsx`: primitive/i18n/Phosphor, tanpa emoji. Keputusan "biarkan": `loading.tsx` (sudah memakai Skeleton T6), `template.tsx`, `(app)/layout.tsx`, `app/page.tsx` (tanpa UI); `app/layout.tsx` tidak disentuh.
5. Pembersihan nol-pemakai: CSS global, `@keyframes`, kunci i18n yatim yang jelas (56, id dan en), `hooks/useEntry.ts`, `PAGE_TITLES`/`PAGE_ICON_MAP` di `lib/constants.ts`.

### 14.3 Keputusan terbuka (perlu persetujuan user; tidak dilakukan T11)
- **`lucide-react` dan `framer-motion`**: nol pemakai di kode produksi, tetapi masih tercantum di `package.json`. Menghapusnya = perubahan dependensi + regenerasi `pnpm-lock.yaml`. `components/ui/__tests__/primitives.test.tsx` mengimpor satu ikon dari `lucide-react` (uji kompatibilitas EmptyState); bila paket dihapus, test itu harus diganti.

### 14.4 Dicatat, sengaja dibiarkan
- `lib/env.ts`: yatim sejak zip asli (validasi Zod env tidak pernah diimpor); bukan sisa redesain.
- 40 kunci i18n yatim bawaan zip (mis. `dashboard.title`, `sync.saved`, `common.error`): dilaporkan, tidak dihapus (bukan "jelas yatim" karena bukan sisa komponen yang dihapus).
- `getAllActiveZones` (selalu menyertakan KRS/SLK) vs `Header.ZoneTabs` (menyembunyikan KRS/SLK bila disembunyikan): perilaku v11.7.1, dipertahankan.
- `hooks/useDashboard.ts` memiliki `zoneTotal` lokal yang hasilnya sama dengan `getZoneTotal`: duplikasi kecil, tidak diubah (bukan perbaikan zona kustom).
- Sel tabel Rekap (`<td onClick>`) hanya bisa dioperasikan lewat klik/sentuhan, sama seperti zip.
- Simbol ★ pada label Quick Pay tarif Rekap berasal dari zip (bukan emoji; tidak ditandai `Extended_Pictographic`).
- Import mengganti `zoneMembers` utuh (sama dengan krs/slk): backup lama tanpa `zoneMembers` mengosongkan member zona kustom; ringkasan Confirm menampilkan jumlah per zona sebelum konfirmasi.

---

## 15. TAHAP T12 — Periode Member (FITUR, bukan redesain) + perbaikan tanggal bayar

Baseline: `wifi-pay-perfectionist-v11_8_0.zip` (v11.8.0, 286 berkas, 738 test / 44 file). Hasil: **v11.9.0**. Perubahan logika bisnis DISETUJUI user hanya untuk empat butir (kutipan user = sumber kebenaran); semua aturan keras kontrak T0 dan konvensi T11 tetap berlaku (tanpa pengurangan fitur, tanpa percabangan zona tertanam, tanpa dependensi baru, `app/layout.tsx` tidak disentuh, `database.rules.json` tidak berubah).

| Butir | Isi |
|---|---|
| **F1** | Free member bisa BANYAK periode (sebelumnya satu). |
| **F2** | "Aktif sejak terdaftar": bulan sebelum "Terdaftar sejak" tidak tercatat dan tidak terhitung (Rekap, Tunggakan, total, persen, ekspor, WA). Member lama tanpa nilai = "sejak awal" → angka lama TIDAK berubah. |
| **F3** | Nonaktif / Reaktivasi berulang lewat menu Member; Rekap/Tunggakan tidak mengakumulasi bulan nonaktif; tombol Reaktivasi hanya ada bila ada periode nonaktif terbuka. |
| **F4** | Tanggal pembayaran tercatat ke Riwayat member dari SEMUA jalur (Entry, Entry batch, Rekap), mengikuti pengaturan otomatis/manual. |

Keputusan desain D1–D12 (usulan default di prompt T12) disetujui user tanpa perubahan ("setuju semua").

### 15.1 Data dan kompatibilitas (D1, D11, D12)
- Sumber kebenaran baru: `AppData.memberPeriods?: Record<"ZONA__NAMA", { joined?: {y,m}; free?: Period[]; inactive?: Period[] }>`, `Period = {fromY, fromM, toY?, toM?}` (bulan 0–11, inklusif, tanpa `to` = terbuka). Kunci sama dengan `memberInfo` — zona kustom = KRS/SLK (tanpa percabangan zona).
- `DEFAULT_APP_DATA.memberPeriods = {}` (semua field AppData punya default eksplisit). Tidak ada nilai `undefined` yang pernah ditulis (Firebase `set()` menolaknya): semua pembangun membuang kunci kosong.
- **Migrasi OTOMATIS dan IDEMPOTEN** `freeMembers` → `memberPeriods` (`migrateFreeMembers`): saat load (`listenDB`), impor (`normalizeImportedData`), dan clone (`buildClonePatch`). Entri baru yang sudah ada tidak pernah ditimpa; rekaman cacat/tidak aktif diabaikan (sama seperti `isFree` lama). `freeMembers` tidak ditulis lagi oleh kode aplikasi: setiap penulisan periode satu member juga MENGONSUMSI rekaman lamanya (supaya tidak hidup lagi lewat migrasi), `importToDB` menulis `freeMembers: {}`.
- Resolver membaca rekaman lama sebagai cadangan bila entri baru belum ada, sehingga data/fixture yang belum dimigrasi tetap benar (paritas T11).
- Siklus data: **rename** memindahkan periode (menutup celah lama "rename → free hilang"); **hapus** membawa periode ke Recycle Bin (`DeletedMember.periods`, opsional) dan mengeluarkannya dari data aktif; **pulihkan** mengembalikannya (yang dipulihkan menang atas entri bernama sama, seperti pembayaran; entri bin lama tanpa `periods` tidak mengubah apa pun); **tambah** member baru membersihkan sisa periode nama yang sama (menutup celah "member baru mewarisi free milik nama yang dihapus"); **clone** ke akun penagih menyalin periode UTUH (Terdaftar sejak, Free, Nonaktif); **impor** mengganti utuh; **Backup JSON** otomatis memuat `memberPeriods` (seluruh AppData diserialisasi).
- **Risiko rollback:** v11.8.0 tidak membaca `memberPeriods`; setelah v11.9.0 menulis, rollback kehilangan periode baru dan (setelah penyimpanan pertama) rekaman free lama. **Unduh Backup JSON sebelum deploy.** Backup v11.8.0 lama tetap bisa diimpor.

### 15.2 Resolver status bulan (D2, D3, D4)
- `lib/payment.ts`: `getMonthStatus()` → `'belumTerdaftar' | 'nonaktif' | 'free' | 'lunas' | 'belum'`; iterator `billableMonths()` (bulan selain N/A); `isNotApplicable()`. `isFree/isLunas/getArrears/getEffectivePay/refStatus` tetap ada (API lama) dan diturunkan dari resolver.
- Prioritas: Belum terdaftar > Nonaktif > Free > (Lunas/Belum dari pembayaran). Pengecualian D3: pembayaran yang SUDAH tercatat di bulan Belum-terdaftar/Nonaktif tetap dihitung dan tampil **Lunas** (uang nyata tidak disembunyikan). **Free tetap menang atas pembayaran** (sama seperti T11: efektif Rp 0).
- N/A (Belum terdaftar/Nonaktif tanpa pembayaran) tidak masuk: tunggakan/aging, penyebut persen (Dashboard, donut Grafik), hitungan Belum, Rajin/Free di Tunggakan, batch, Ringkasan WA, dan tidak jadi sel kosong biasa di Rekap (penanda khusus `na`). Total/subtotal Rekap dan pendapatan tetap jumlah pembayaran apa adanya.
- `lib/memberPeriods.ts` (baru, murni): rentang inklusif, sanitasi, migrasi, tulis/rename/ambil, `addPeriod/updatePeriod/removePeriod/setJoined`, `deactivateFrom/reactivateFrom/getPeriodActions`, `crossOverlap`. Periode sejenis tidak boleh tumpang tindih (ditolak + pesan); Free vs Nonaktif boleh bertumpuk dengan peringatan (Nonaktif berlaku).

### 15.3 UI Member (D5–D8)
- **Satu pintu:** ikon hadiah di kartu Member membuka sheet **"Status & Periode"** (`FreeMemberModal` diperluas; `FreeMemberModal.Status.tsx` baru; `.Form.tsx` dipakai ulang untuk periode Free dan Nonaktif). Isi: status bulan terpilih, "Terdaftar sejak" (hanya info + pintasan Ubah ke form Edit Member — satu-satunya editor), tombol "Nonaktifkan mulai {bulan}" / "Aktifkan kembali mulai {bulan}" (hanya yang relevan; lewat Confirm), daftar periode Free dan Nonaktif dengan Tambah/Ubah/Hapus. Semua lewat primitive (Sheet, Select, Confirm, Badge, EmptyState, IconButton, Button), log aktivitas, dan toast. Fungsi modal Free lama (Set Free, selamanya, validasi tanggal selesai, Kembalikan Berbayar lewat Confirm) tetap ada di dalamnya.
- Form Tambah/Edit Member: kolom **Terdaftar sejak** (bulan + tahun; "Sejak awal" = kosong). Member baru default bulan berjalan (boleh lebih awal).
- Daftar Member: badge Nonaktif / Belum terdaftar (redup), chip + filter **Nonaktif**, hitungan header "· N aktif · M nonaktif (· K belum terdaftar)" hanya bila ada member N/A pada bulan itu.
- Entry: kartu N/A redup + chip; membuka kartu menampilkan catatan + tombol "Tetap catat" (Confirm) sebelum form bayar; batch mengecualikan N/A. Rekap: sel N/A bertanda khusus; modal sel N/A memakai gerbang yang sama. Riwayat/GlobalSearch/Tunggakan menampilkan N/A dan periode Free yang mencakup bulan acuan.

### 15.4 Tanggal bayar (F4, D9)
`lib/payDate.ts` — SATU helper untuk semua jalur. Mode otomatis = **tanggal LOKAL** perangkat (sebelumnya `toISOString()` = UTC, mundur sehari saat WIB dini hari). Mode manual = pemilih tanggal (default hari ini) di sheet batch Entry, sheet batch Rekap, dan modal Rekap; kartu Entry tetap memakai kolom "Tgl Bayar". Jalur granular (nominal diketik) menulis tanggal dalam `update()` atomik yang sama (`buildGranularPaymentPatch(..., payDate)`), dengan rollback selektif satu kunci.

| Jalur | Sebelum T12 | T12 (otomatis) | T12 (manual) |
|---|---|---|---|
| Entry QuickPay | tanggal UTC | tanggal lokal | kolom "Tgl Bayar" kartu |
| Entry nominal diketik | tidak tercatat | tanggal lokal | kolom "Tgl Bayar" kartu |
| Entry batch | tidak tercatat | tanggal lokal | pemilih di sheet batch |
| Rekap QuickPay | tanggal UTC | tanggal lokal | pemilih di modal |
| Rekap nominal diketik | tidak tercatat | tanggal lokal | pemilih di modal |
| Rekap batch | tanggal UTC | tanggal lokal | pemilih di sheet batch |

### 15.5 Perubahan logika (di luar tampilan) dan alasannya
1. Struktur data periode member + migrasi (F1–F3, D1).
2. Resolver status bulan; N/A tidak terhitung di semua konsumen status (F2/F3, D4).
3. Pembayaran tercatat di bulan N/A tetap dihitung/tampil Lunas; pencatatan baru butuh konfirmasi (D3).
4. Tanggal bayar: semua jalur lewat helper tunggal, tanggal lokal (F4, D9).
5. Rename/hapus/pulihkan/tambah/clone/impor membawa atau membersihkan periode (D11).
6. **Label status ekspor bulanan (PDF/Excel) untuk member Free tanpa pembayaran: "Belum" → "Gratis"** — mengikuti D4/S1 ("Free bukan Belum di semua konsumen"); sebelumnya tercetak "Belum" (cacat T11). Nominal dan total ekspor tidak berubah.
7. Kartu Dashboard: `ZoneStat.members` = member yang terhitung bulan itu (penyebut persen); `totalListed` baru untuk keadaan kosong/memuat. Data lama: nilainya sama.
8. Riwayat: "x/12 bulan lunas" → "x/n" dengan n = bulan terhitung pada tahun itu (data lama: n = 12).

### 15.6 Test lama yang diperbarui (struktur data baru; asersi setara, tidak dilemahkan)
- `components/features/__tests__/t9-screens.test.tsx` — 2 test modal Free: jalur melalui ikon hadiah → sheet "Status & Periode" → "Tambah/Ubah periode Free"; asersi data kini pada `memberPeriods` (dan `freeMembers` tidak ditulis lagi).
- `lib/__tests__/db.test.ts` — 2 test clone: status free ikut ter-clone UTUH lewat `memberPeriods` (bukan `freeMembers`); test clone ketiga hanya ditambah 1 asersi (`memberPeriods` tidak muncul tanpa periode).
734 test lama lainnya tidak diubah dan tetap lulus.

### 15.7 Berkas baru
`lib/memberPeriods.ts`, `lib/payDate.ts`, `components/modals/FreeMemberModal.Status.tsx`; test: `lib/__tests__/{memberPeriods,payment-status,memberPeriods-db,t12-consumers,t12-parity}.test.ts`, `components/features/members/__tests__/members.periods.test.ts`, `components/features/__tests__/t12-screens.test.tsx`. Total: 296 berkas (T11: 286), **1048 test / 51 file** (T11: 738 / 44). Hasil gerbang terukur dari isi zip: lihat `WIFIPAY-T12-LAPORAN-AUDIT.md`.

### 15.8 Dicatat / sengaja dibiarkan
- Nama berkas Backup JSON memakai tanggal UTC (nama berkas, bukan tanggal bayar) — tidak diubah (di luar F4).
- Kunci kamus `members.freeSetAria`, `members.freeUnsetAria`, `freemodal.title` tidak lagi dipakai tetapi tidak dihapus (kamus append-only).
- Catatan di Pengaturan → Tanggal Bayar memakai kunci baru (`settings.autoDate.noteAutoAll/noteManualAll`) karena perilakunya kini berlaku untuk semua jalur; kunci lama tidak dihapus.
- Filter Rekap tetap Semua/Lunas/Belum/Gratis (D8 hanya meminta chip Nonaktif di daftar Member); member N/A hanya tampil di "Semua".

---

## 16. TAHAP T13 — penerapan hasil uji prototipe (R1–R17) ke zip produksi

Baseline: `wifi-pay-perfectionist-v11_9_0.zip` (v11.9.0, 296 berkas, 1048 test / 51 file). Hasil: **v11.10.0**, 1101 test / 58 file. Sumber kebenaran: `WIFIPAY-T13-SPESIFIKASI.md` (di luar zip); implementasi referensi: `wifi-pay-patch-T13.zip` (47 UBAH + 6 BARU). Prioritas bila beda: kontrak T0 (kecuali E1–E7) > spesifikasi > zip v11.9.0 > serah-terima T12 > patch. Bukan fitur baru, bukan redesain baru.

### 16.1 Pengecualian "tanpa pengurangan fitur" (atas permintaan eksplisit user)
| # | Pengurangan |
|---|---|
| E1 | Tekan lama (long-press) untuk pilih banyak dihapus di Entry (kartu member) dan Rekap (sel tabel). |
| E2 | Tab zona milik halaman Member dihapus; zona Member mengikuti tab zona Header. |
| E3 | "Bayar Semua" (Entry) → "Pilih Banyak", mulai TANPA pilihan awal. |
| E4 | Label filter Log "Hanya Bayar" → "Pembayaran". |
| E5 | Hitungan ikon (lunas/belum/gratis) di kartu ringkasan Entry dihapus (angka yang sama ada di chips). |
| E6 | Ikon hadiah di kartu Member → tombol berlabel "Status" (sheet "Status & Periode" yang sama). |
| E7 | "Tambah Item" (Operasional) dan "+" (Member) → FAB kanan bawah. |

### 16.2 Peta berkas T13
- **BARU (6 dari patch + tes T13):** `components/ui/CardFilter.tsx` (+ `Vis`), `components/ui/Fab.tsx` (+ `FabSpace`), `hooks/useAxisLock.ts`, `components/features/operasional/OperasionalView.Icons.ts`; test: `components/ui/__tests__/{CardFilter,Fab}.test.tsx`, `hooks/__tests__/useAxisLock.test.tsx`, `lib/__tests__/t13-data-compat.test.ts`, `components/features/__tests__/t13-screens.test.tsx`, `components/layout/__tests__/t13-shell.test.tsx`, `store/__tests__/uiPrefs.persist.test.ts`.
- **UBAH:** `app/(app)/template.tsx` (`minHeight`), `styles/ui.css` (V2, `.wp-pbar`, `.wp-fab`, `.wp-filterbtn`, Ukuran Teks Besar, tab zona), `store/slices/uiSlice.ts` (`textSize`, `hiddenCards`), `types/index.ts` (`OpsItem.icon?`), `components/layout/{AppShell,DisplayPrefs,Header.ZoneTabs}.tsx`, `lib/locales/{id,en}.ts` (blok "REDESAIN T13", append-only; hanya NILAI `entry.batchPay` dan `log.payOnly` yang berubah), seluruh layar fitur (dashboard, entry, rekap, tunggakan, grafik, log, members, operasional, settings), tes layar T7–T10/T12 (disesuaikan ke perilaku baru; asersi setara).
- **TIDAK berubah:** `app/layout.tsx` (md5 `26d6279d179ef6debbaf3f821ab57296`), `database.rules.json`, `package.json`, `pnpm-lock.yaml`, `lib/db.ts` (tanpa migrasi baru).

### 16.3 Perilaku penting
- **Period bar** `.wp-pbar`: Tahun | Bulan | (chip zona di Grafik) | ikon Atur Tampilan; Log: bar di atas Segmented; Member tanpa periode. Selektor Bulan Grafik hanya di tab Pembayaran/Pelanggan.
- **Pilih Banyak:** Entry — tombol di kartu ringkasan; mode pilih mengganti period bar dengan BatchBar, pencarian tetap; "Pilih Semua" hanya yang belum bayar (aturan 8b zip). Sheet batch Entry/Rekap: offset sticky bawah `var(--sp-2)` (sebelumnya tinggi nav terhitung dua kali; diuji di Chromium: sheet berhenti di atas nav, tidak menutup kartu terakhir).
- **Atur Tampilan:** `uiSlice.hiddenCards[layar] = id[]` di `localStorage['wp_hidden_cards']` (perangkat; bukan Firebase, bukan Backup JSON). Tidak dipasang di Log dan Pengaturan.
- **Ukuran Teks:** `uiSlice.textSize` → `document.documentElement.dataset.textSize`; CSS `html[data-text-size="large"]` menggeser token font/tinggi tombol/nav. Layar login/splash di luar AppShell tidak terpengaruh.
- **Operasional:** `OpsItem.icon?` dari `OPS_ICON_KEYS` (11 kunci + "Otomatis"); kosong = TANPA kunci (Firebase `set()` menolak `undefined`); nilai tak dikenal jatuh ke ikon otomatis dari nama.
- **Member:** `zone = zones.includes(activeZone) ? activeZone : zones[0]`; pindah zona di Header mereset pencarian/tab/filter hanya saat zona BERUBAH. `newMemberZone` di store tidak dipakai lagi (jangan dihapus).
- **Tab zona Header:** pudar tepi kanan (`mask-image`) hanya aktif bila `data-more="true"` (masih ada tab tersembunyi di kanan; dihitung `ResizeObserver` + `scroll`).

### 16.4 Kontrak data (jaminan data lama)
Tidak ada migrasi destruktif dan tidak ada penulisan massal saat upgrade; migrasi `freeMembers → memberPeriods` (T12) tetap hanya saat BACA. Satu-satunya field data baru: `OpsItem.icon?`. Backup JSON v11.7.x/v11.8.0/v11.9.0 tetap bisa diimpor tanpa perubahan kode impor. Preferensi `wp_text_size` dan `wp_hidden_cards` hanya di perangkat. Rollback ke v11.9.0 aman (field `icon` asing diabaikan); rollback ke v11.8.0 tetap butuh Backup JSON. **Unduh Backup JSON sebelum deploy.**

### 16.5 Perbaikan yang ditemukan saat penerapan (di luar patch)
1. **Pudar tab zona** (`.zone-sw`): mask-image di patch aktif SELALU, sehingga saat semua tab muat, ujung kanan pil tab terakhir yang aktif ikut memudar (terukur di Chromium). Kini bersyarat (`data-more`).
2. **Lencana jumlah filter** (`.wp-filterbtn__n`): teks `#fff` di atas aksen Emas (#C9952A) hanya kontras 2,69:1; kini `var(--on-accent)` (Gelap/Terang tetap putih; Emas gelap, 7,36:1).
3. **Kamus i18n:** kunci baru dipindah dari tengah berkas ke blok "REDESAIN T13" (append-only), sesuai konvensi.
4. **`loadHiddenCards` (`store/slices/uiSlice.ts`):** hanya mengecek "objek", sehingga `wp_hidden_cards` berstruktur salah (array, `{"entry":"sum"}`, isi bukan string) lolos dan `toggleCardVisible` bisa melempar galat (string tak punya `.filter`). Kini hanya `{ layar: string[] }` yang diterima; sisanya dibuang → bawaan (spesifikasi 5 butir 4: "rusak/tidak ada → bawaan"). Terbukti dengan tes yang gagal sebelum perbaikan (6 dari 9).

### 16.6 Tes T13
Di atas 1056 tes dari patch: T13-01 `useAxisLock` (5), T13-02 `Fab`/`FabSpace` + FAB di Member/Operasional, T13-03 period bar semua layar, T13-04 urutan blok + Pilih Banyak + sheet Entry, T13-05 Ukuran Teks (AppShell + pemilih), T13-06 ikon Operasional, T13-07 Atur Tampilan per layar, T13-10 `template.tsx`, T13-11 pudar tab zona. Ketahanan preferensi perangkat (`uiPrefs.persist`, 9 tes: muat ulang bertahan, data situs kosong → bawaan, struktur rusak dibersihkan). T13-08 (zona Member ikut Header) dan T13-09 (guard CSS global T11) sudah tercakup di `t9-screens` dan `redesign-t11-guard`.

### 16.7 Dicatat / sengaja dibiarkan (keputusan terbuka K1–K5, default dipakai)
K1 Dashboard menghitung Gratis ke "Lunas" (Entry memisahkannya), K2 kunci Member vs kunci Header terlihat ganda, K3 format nominal Operasional "1200 .000", K4 urutan Segmented/chips Tunggakan: TIDAK diubah. K5: versi v11.10.0.

---

## 17. v11.10.1 — pembaruan keamanan Next.js 16.3.5 → 16.4.3 (di atas T13)

Permintaan user: naik ke Next.js stable terbaru (user mengira 16.3.4; yang benar 16.4.3, rilis 2026-10-23, dist-tag `latest` di registry npm; 16.3.4 rilis 2026-08-31, lebih lama dari 16.3.5).
- **Yang berubah:** `package.json` hanya 2 baris (`next` dan `eslint-config-next` → `16.4.3`, pin eksak); `pnpm-lock.yaml` hanya keluarga Next + `sharp` 0.35.5 / libvips 1.3.4 (pembaruan terarah `pnpm install --no-frozen-lockfile`, BUKAN regenerasi dari nol, supaya dampak bisa dikaitkan ke Next saja); `lib/constants.ts` (v11.10.1); README; berkas ini. Kode aplikasi, data, dan tampilan tidak berubah.
- **Tidak berubah:** `vercel.json`, `next.config.ts`, `proxy.ts`, `app/layout.tsx` (md5 `26d6279d179ef6debbaf3f821ab57296`), `database.rules.json`.
- **Gerbang:** tsc bersih, `eslint .` bersih, 1101 test / 58 file lulus; build produksi uji lolos (14 rute + Proxy, tanpa peringatan).
- **Audit:** 54 → 42 advisori; 12 ditutup (3 critical + 2 high Next, 1 high sharp, 5 moderate dan 1 low Next). Sisa tidak dari Next (dompurify via jspdf, grpc-js/re2js via firebase, source-map-js via postcss, zod, dan alat test/dev).
- **Catatan Vercel:** `vercel.json` memakai `installCommand: npm install` sedangkan lockfile proyek pnpm; `next` dipin eksak (16.4.3 pasti terpasang), tetapi versi transitif lain di deploy bisa berbeda dari lockfile. Tidak diubah di sini.
- **Jebakan baru:** npm 10.9.7 di sandbox gagal (`Cannot read properties of null (reading 'edgesOut')`) pada package.json lama maupun baru, jadi resolusi npm ala Vercel tidak bisa disimulasikan; itu bug npm lingkungan, bukan akibat upgrade.
