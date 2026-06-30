# WiFi Pay Next — Update v11.5.5

> **Bug paling krusial dari rangkaian fix v11.5.3/v11.5.4.** Laporan: "tiap edit member selalu gagal tersimpan, dan saat klik ulang member tidak ditemukan." Ini BUKAN race condition double-tap (sudah ditutup di v11.5.4) — ini bug desain yang lebih dasar: begitu simpan ke Firebase gagal SEKALI (apa pun sebabnya), retry berikutnya rusak SECARA OTOMATIS, tanpa perlu tap ganda sama sekali. Sudah diperbaiki di seluruh app (10 file), plus ditambahkan logging error asli supaya penyebab kegagalan Firebase yang sesungguhnya bisa diperiksa lewat console browser.

## v11.5.5 — Fix Krusial: State Lokal Tidak Pernah Rollback Saat Simpan Gagal

**Root cause sebenarnya (lebih dalam dari v11.5.3/v11.5.4):** Semua fungsi `persist()` di seluruh app punya urutan: (1) `setAppData(newData)` — state lokal diubah duluan, **synchronous**, **tanpa syarat**; (2) baru `await` kirim ke Firebase. Sebelum perbaikan ini, kalau langkah (2) gagal, state lokal dari langkah (1) **tidak pernah dikembalikan**. Untuk edit nama:

1. Edit "HAJI ZAINI" → "H.ZAINI", tekan Simpan **satu kali saja** (tidak perlu double-tap).
2. State lokal langsung berubah: array member sekarang berisi "H.ZAINI", "HAJI ZAINI" lenyap dari situ.
3. Kirim ke Firebase **gagal** (sebab aslinya tidak pernah terlihat — lihat poin "Logging" di bawah).
4. Toast "Gagal tersimpan ke server" muncul, modal tetap terbuka (sesuai fix v11.5.3) supaya bisa dicoba lagi.
5. Tekan "Simpan" lagi (retry, tanpa mengubah apa pun) → kode mencari "HAJI ZAINI" di array member... tapi array itu **sudah** berisi "H.ZAINI" sejak langkah 2. "HAJI ZAINI" tidak ada lagi di sana.
6. → **"Member tidak ditemukan."**

Jadi begitu satu kali gagal, **setiap retry berikutnya otomatis ikut gagal** dengan pesan yang berbeda dan membingungkan — bukan karena menu Member rusak, tapi karena state lokal sudah "kebablasan" berubah sebelum tahu hasil sebenarnya, dan tidak pernah dikembalikan.

**Perbaikan struktural:** setiap `persist()`/handler simpan di **10 file** sekarang menyimpan *snapshot* state sebelum optimistic update. Jika Firebase gagal, state dikembalikan (rollback) ke snapshot itu — sehingga percobaan simpan berikutnya selalu bertumpu pada data yang benar-benar cocok dengan apa yang ada di server, bukan pada hasil percobaan gagal sebelumnya.

**Perbaikan diagnostik (sama pentingnya):** seluruh blok `catch {}` di app ini sebelumnya membuang pesan error Firebase yang sebenarnya — jadi "Gagal simpan" selalu generik, tidak pernah kelihatan apakah itu `PERMISSION_DENIED`, sesi auth kadaluwarsa, offline, atau data tidak valid. Sekarang setiap kegagalan dicatat lewat `logger.error()` (sudah ada di project, mencatat ke console di dev **maupun produksi**) — jadi penyebab pasti kegagalan yang berulang bisa diperiksa langsung lewat DevTools → Console di browser/WebView, tanpa perlu menebak.

> **Catatan penting untuk Hakiki:** rollback ini memperbaiki *konsekuensi* dari kegagalan (retry yang rusak), tapi **tidak otomatis memperbaiki kenapa Firebase-nya gagal di awal**. Kalau setelah update ini simpan tetap gagal terus-menerus (bukan cuma sesekali karena koneksi), tolong buka Console di browser/WebView saat kejadian — sekarang akan ada baris log `[WiFi Pay] ❌ Gagal simpan ke Firebase — action: ...` lengkap dengan error code aslinya (mis. `PERMISSION_DENIED`, `auth/...`, dll). Itu kunci untuk diagnosis langkah selanjutnya — kemungkinan terkait rules Firebase, status login/token, atau koneksi yang memang konsisten buruk di sisi device.

**File yang berubah (v11.5.5):**

| File | Perubahan |
|------|-----------|
| `components/features/members/MembersView.tsx` | `persist()`: rollback ke snapshot + `logger.error()` saat gagal |
| `components/features/members/MemberCard.tsx` | `persist()` & `doQuickPay()`: rollback + logging (snapshot diambil sebelum optimistic update, dioper eksplisit untuk `doQuickPay`) |
| `components/features/rekap/RekapView.tsx` | `persist()`: rollback + logging |
| `components/features/rekap/RekapModal.tsx` | `persist()` menerima `prevData` sebagai parameter eksplisit (bukan baca closure `appData`, supaya tidak salah snapshot untuk `quickPay()` yang fire-and-forget) + logging |
| `components/features/entry/EntryView.tsx` | `executeBatch()`: rollback + logging |
| `components/modals/FreeMemberModal.tsx` | `persist()`: rollback + logging |
| `components/features/operasional/OperasionalView.tsx` | `persist()`: rollback + logging |
| `components/features/settings/SettingsIPSection.tsx` | `persist()`: rollback + logging |
| `components/features/settings/SettingsZoneSection.tsx` | `persistData()`: rollback + logging |
| `components/layout/Header.tsx` | `toggleGlobalLock()`: rollback (state lock + appData) + logging |
| `lib/constants.ts` | Versi → v11.5.5 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **135/135 unit test lulus** (tidak ada regresi; tidak ada test baru — perubahan murni pada penanganan kegagalan async yang sudah ada).

---

# WiFi Pay Next — Update v11.5.4

> Patch lanjutan dari v11.5.3 — menutup race condition lain yang ditemukan saat menguji fix sebelumnya: edit nama member bisa gagal dengan pesan "Member tidak ditemukan" jika tombol "Simpan" tertekan dua kali (double-tap, atau tap kedua karena koneksi lambat) sebelum proses simpan pertama selesai. **Menu Member tetap berfungsi normal untuk edit/tambah/hapus** — bug ini spesifik untuk kasus tap berulang di tengah proses simpan, bukan kegagalan total fitur.

## v11.5.4 — Fix: Race Condition "Member Tidak Ditemukan" Akibat Double-Tap

**Root cause:** Tombol "Simpan" di modal Edit Member (dan tombol "+ Tambah" di form Add Member) tidak punya proteksi sama sekali terhadap penekanan ganda. Urutan kejadian:

1. Tap "Simpan" → `saveEdit()` jalan, menemukan member di list, lalu memanggil `persist()`.
2. Baris pertama di dalam `persist()` adalah `setAppData(newData)` — ini synchronous, jadi state lokal **langsung** berubah (mis. "HAJI ZAINI" → "H.ZAINI" di list member), SEBELUM proses kirim ke Firebase (yang memakan waktu, terutama saat koneksi lambat) selesai.
3. Jika dalam rentang waktu menunggu itu tombol "Simpan" tertekan lagi, `saveEdit()` berjalan untuk **kedua kalinya** dengan data form yang sama (nama asal masih "HAJI ZAINI").
4. Tapi list member yang dipakai untuk pencarian sekarang sudah berisi "H.ZAINI" (hasil langkah 2) — "HAJI ZAINI" sudah tidak ada lagi di sana.
5. Pencarian `list.indexOf("HAJI ZAINI")` gagal → `idx === -1` → toast **"Member tidak ditemukan"**, walau proses pertamanya sendiri valid dan (jika koneksi normal) akan tetap berhasil tersimpan.

**Perbaikan:** menambahkan double-submit guard (`isSavingRef`) di `MembersView.tsx` — pola yang sama dengan yang sudah dipakai di `MemberCard.tsx` (Entry). Selagi satu proses simpan masih berjalan, semua percobaan simpan lain (edit, tambah, hapus, restore, purge) langsung diabaikan tanpa efek samping apa pun — tidak ada toast aneh, tidak ada race. Tombol "Simpan" dan "+ Tambah" juga sekarang menunjukkan status nonaktif + spinner kecil selama proses berjalan, supaya pengguna tahu prosesnya masih berjalan dan tidak perlu (atau tidak bisa) menekan lagi.

**File yang berubah (v11.5.4):**

| File | Perubahan |
|------|-----------|
| `components/features/members/MembersView.tsx` | `isSavingRef`/`isSaving` guard di `persist()` + early-return di `addMember`/`saveEdit`/`deleteMember`/`restoreMember`/`permanentDelete`; tombol "Simpan" & "+ Tambah" dapat status disabled+spinner saat menyimpan |
| `lib/constants.ts` | Versi → v11.5.4 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **135/135 unit test lulus** (tidak ada regresi).

---

# WiFi Pay Next — Update v11.5.3

> Patch fix konsistensi toast sukses/gagal vs status sync — bug yang dilaporkan saat edit nama member ("H.ZAINI berhasil diupdate" tapi pill header menunjukkan "Gagal simpan", dan nama balik ke semula setelah app ditutup-buka kembali). Root cause sama ditemukan di 9 file lain saat audit menyeluruh ke seluruh menu Entry, Rekap, dan Member — semua sudah diperbaiki dengan pola yang konsisten.

## v11.5.3 — Fix: Toast Sukses Tampil Walau Simpan ke Server Gagal

**Root cause:** Hampir semua fungsi `persist()`/handler simpan di app ini punya pola sama:
1. Update state lokal (`setAppData`) — UI langsung berubah, *optimistic update*.
2. `await` panggilan Firebase (`saveDB`/`persistPayment`) di dalam `try/catch`.
3. Di blok `catch`, hanya `setSyncStatus('err')` dipanggil (mengubah pill di header jadi "Gagal simpan").
4. **Tapi** baris `showToast('...berhasil...')` setelah `await persist(...)` dieksekusi **tanpa syarat** — fungsi `persist()` tidak mengembalikan nilai apa pun, sehingga caller tidak tahu (dan tidak peduli) apakah save-nya sukses atau gagal.

Akibatnya: saat Firebase gagal (offline, koneksi lambat, dll), pengguna melihat toast hijau "berhasil" **bersamaan** dengan pill merah "Gagal simpan" di pojok kiri atas header — dua sinyal yang saling bertentangan dalam satu aksi. Karena perubahan hanya tersimpan optimis di state lokal (bukan di Firebase), begitu app ditutup dan dibuka kembali (data di-fetch ulang dari server), perubahan itu hilang dan kembali ke nilai lama — persis seperti dilaporkan: nama "HAJI ZAINI" balik lagi setelah sempat tampil "H.ZAINI".

**Perbaikan:** setiap fungsi `persist()`/handler simpan sekarang **mengembalikan boolean** hasil sebenarnya, dan setiap pemanggilnya **mengecek hasil itu** sebelum menampilkan toast — toast sukses hanya muncul jika benar-benar tersimpan ke server, toast gagal (`t('common.saveFailed')`, key locale baru: "Gagal tersimpan ke server, periksa koneksi") muncul jika gagal. Untuk aksi yang menutup modal setelah simpan (Edit Member, Free Member, dsb), modal **tidak ditutup** jika gagal, supaya pengguna bisa langsung coba lagi tanpa kehilangan input yang sudah diketik.

| # | Lokasi | Fungsi yang diperbaiki |
|---|--------|------------------------|
| 1 | **Members** — `MembersView.tsx` | `addMember`, `saveEdit` (bug yang dilaporkan), `deleteMember`, `restoreMember`, `permanentDelete` |
| 2 | **Members** — `MemberCard.tsx` | `doQuickPay` (toast error tambahan jika background save gagal), `saveDate` (sebelumnya tidak ada toast sama sekali, sukses maupun gagal) |
| 3 | **Rekap** — `RekapView.tsx` | `handleBatchPay` |
| 4 | **Rekap** — `RekapModal.tsx` | `quickPay`, `manualPay`, `clearPay` |
| 5 | **Entry** — `EntryView.tsx` | `executeBatch` |
| 6 | **Modal Free Member** — `FreeMemberModal.tsx` | `handleSave`, `handleRemove` |
| 7 | **Operasional** — `OperasionalView.tsx` | `addItem`, `updateItem`, `deleteItem` |
| 8 | **Settings — Konversi IP** — `SettingsIPSection.tsx` | `doConvert` |
| 9 | **Settings — Zona** — `SettingsZoneSection.tsx` | `deleteCustomZona` |
| 10 | **Header** — `Header.tsx` | `toggleGlobalLock` (kunci/buka entry) |

**Dengan sengaja TIDAK diubah:** `ImportModal.tsx` dan `hooks/useAppData.ts` — keduanya sudah benar sejak awal (toast error spesifik di blok `catch`, terpisah dari toast sukses lokal), jadi tidak ada perubahan di sana. `SettingsZoneSection.tsx` (`saveEditZona`, `toggleHideZona`, `addZona`) juga tidak disentuh — fungsi-fungsi itu hanya menulis ke `localStorage` via `updateSettings()` (sinkron, tidak terhubung Firebase), jadi tidak punya kelas bug yang sama.

**File yang berubah (v11.5.3):**

| File | Perubahan |
|------|-----------|
| `components/features/members/MembersView.tsx` | `persist()` return `Promise<boolean>`; 5 caller dikondisikan ke hasilnya |
| `components/features/members/MemberCard.tsx` | `doQuickPay` & `saveDate` dapat toast error eksplisit saat gagal |
| `components/features/rekap/RekapView.tsx` | `persist()` return `Promise<boolean>`; `handleBatchPay` dikondisikan |
| `components/features/rekap/RekapModal.tsx` | `persist()` return `Promise<boolean>`; `quickPay`/`manualPay`/`clearPay` dikondisikan |
| `components/features/entry/EntryView.tsx` | `executeBatch` dikondisikan ke hasil save |
| `components/modals/FreeMemberModal.tsx` | `persist()` return `Promise<boolean>`; modal tidak tertutup jika gagal |
| `components/features/operasional/OperasionalView.tsx` | `persist()` return `Promise<boolean>`; toast error utk `addItem`/`updateItem`/`deleteItem` |
| `components/features/settings/SettingsIPSection.tsx` | `persist()` return `Promise<boolean>`; `doConvert` dikondisikan |
| `components/features/settings/SettingsZoneSection.tsx` | `persistData()` return `Promise<boolean>`; `deleteCustomZona` dikondisikan |
| `components/layout/Header.tsx` | `toggleGlobalLock` dikondisikan ke hasil save |
| `lib/locales/id.ts`, `en.ts` | Key baru: `common.saveFailed` |
| `lib/constants.ts` | Versi → v11.5.3 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **135/135 unit test lulus** (tidak ada test baru ditambahkan — perubahan murni alur kontrol pada kode yang sudah ada, bukan logic baru; semua test eksisting termasuk integritas i18n tetap lulus setelah penambahan key locale).

---

# WiFi Pay Next — Update v11.5.2

> Gabungan: 2 perbaikan terisolasi untuk Rekap (rendering saat scroll) + 3 fitur baru. Tidak urgent — v11.5.1 tetap aman dan nyaman dipakai jika versi ini belum mau dipasang.

## v11.5.2 — Perbaikan Rekap (low-risk, bukan garansi 100%)

**Penting:** kedua perbaikan ini secara teknis benar dan diverifikasi (tidak ada error/regresi), tapi karena tidak bisa diuji secara visual langsung pada device sungguhan, tidak ada garansi ini akan menghilangkan SELURUH simptom yang dilaporkan (nama hilang saat scroll, scroll kurang smooth, konten tembus kolom judul). Keduanya kecil, terisolasi, dan mudah di-rollback (cukup pakai v11.5.1 lagi) jika tidak membantu.

| # | Perbaikan | Detail teknis |
|---|-----------|---------------|
| 1 | Background solid sel nilai pembayaran | `.cv`/`.cz` sebelumnya transparan (`rgba(...,0.10)`), `.cn` tanpa background sama sekali. Background transparan pada tabel dengan kolom sticky adalah penyebab dikenal untuk artefak render saat scroll cepat (lihat histori proyek). Diganti `color-mix()` solid — fitur CSS standar, pola yang sudah dipakai aman di tempat lain di app ini. |
| 2 | Scroll sync header tanpa delay | Header tabel Rekap sebelumnya mengikuti scroll body lewat `requestAnimationFrame`, yang menambah 1 frame delay tanpa manfaat performa (event scroll browser sudah dibatasi ke refresh rate). Diganti assignment langsung — header sinkron presisi dengan body, tanpa lag yang terlihat saat scroll horizontal cepat. |

**Dengan sengaja TIDAK dilakukan:** GPU layer promotion (`transform: translateZ`/`will-change`) — histori proyek (CHANGES.md) mencatat eksplisit bahwa pendekatan ini pernah jadi PENYEBAB bug lain (blank hitam saat scroll), bukan solusi. Pendekatan itu dihindari sepenuhnya di update ini.

## v11.5.2 — Fitur Baru

| # | Fitur | Detail |
|---|-------|--------|
| 1 | Catatan per member | Textarea bebas di halaman Members (area Edit) — ditimpa setiap diedit ulang. Indikator ikon kecil di list member jika ada catatan (isi catatan hanya terlihat saat Edit dibuka). |
| 2 | Insight kontekstual Dashboard | Card baru di Dashboard: jumlah tunggakan & rasio lunas, bulan ini dibandingkan bulan lalu, dengan badge naik/turun. Polaritas warna disesuaikan — untuk tunggakan, TURUN adalah hijau (baik), berbeda dari income di mana NAIK adalah hijau. |
| 3 | Micro-interaction "tandai lunas" diperkuat | **Entry/MemberCard**: kartu kini glow hijau lembut (bernapas) + badge checkmark kecil muncul di pojok kartu saat bayar berhasil — diperkuat dari sebelumnya yang hanya toast+haptic. **Rekap**: flash minimal pada sel yang baru dibayar (animasi yang sudah dirancang sebelumnya di CSS, sekarang baru benar-benar disambungkan) — sengaja dibuat lebih halus dari Entry karena dipakai untuk klik cepat berturut-turut di grid padat. |

**File yang berubah (v11.5.2):**

| File | Perubahan |
|------|-----------|
| `styles/components.entry.css` | `.cv`/`.cz`/`.cn` solid background; class `.payment-success`/`.mc-success-check` (MemberCard glow+checkmark) |
| `styles/animations.css` | Keyframes baru: `paymentGlow` (pulse bernapas), `checkPop` (checkmark muncul) |
| `components/features/rekap/RekapView.tsx` | Scroll sync tanpa rAF; state `flashCell` untuk trigger flash minimal pada sel yang baru dibayar |
| `components/features/rekap/RekapModal.tsx` | `onClose` menerima info sel yang dibayar (opsional) untuk trigger flash di parent — hanya untuk bayar sukses, bukan untuk hapus/tutup biasa |
| `components/features/members/MemberCard.tsx` | Glow animasi + badge checkmark saat `showSuccess`, dengan `successKey` counter untuk memastikan animasi selalu replay meski diklik cepat berturut-turut |
| `components/features/members/MembersView.tsx` | Field catatan di modal Edit; indikator ikon catatan di list member |
| `components/features/dashboard/DashboardView.tsx` | Card insight baru; `PctBadge` diperluas dengan opsi `invertColor` (untuk metrik di mana naik = buruk) |
| `types/index.ts` | `MemberInfo.notes?: string` |
| `lib/payment.ts` | **Baru:** `getPrevMonth()`, `calcPctDelta()` — pure function, diekstrak dari logic Dashboard agar testable |
| `lib/helpers.ts` | Re-export `getPrevMonth`, `calcPctDelta` |
| `lib/locales/id.ts`, `en.ts` | Key baru: `members.notes*`, `members.hasNotesHint`, `dashboard.insight*` |
| `lib/__tests__/helpers.test.ts` | +9 test: `getPrevMonth`, `calcPctDelta` |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **135/135 unit test lulus** (126 dari v11.5.1 + 9 baru) · diverifikasi dari diff lengkap terhadap v11.5.1 yang sebenarnya dikirim (bukan kode eksperimen).

---

# WiFi Pay Next — Update v11.5.1

> Patch cepat dari v11.5, berdasarkan temuan setelah deploy. 3 laporan dari pengguna + 2 bug laten (pre-existing) yang ditemukan saat audit menyeluruh.

## v11.5.1 — Ringkasan Perbaikan

| # | Area | Perbaikan |
|---|------|-----------|
| 1 | Pengaturan — Badge | "Tema Tampilan" dan "Bahasa" sekarang juga bertanda hijau (`var(--c-lunas)`) seperti badge status lain, sesuai permintaan eksplisit agar semua badge "aktif" konsisten hijau. |
| 2 | Members — Kunci/Buka | **Bug nyata ditemukan:** warna tombol "KUNCI MEMBER"/"BUKA MEMBER" terbalik — sebelumnya status TERKUNCI tampil hijau dan TERBUKA tampil merah (kebalikan dari konvensi Header yang sudah benar: terkunci=merah, terbuka=hijau). Sudah diperbaiki agar konsisten. |
| 3 | Pengaturan — Konversi IP | **Bug nyata ditemukan:** label seperti "SETTINGS.IP.ZONELABEL" tampil mentah (raw key, dengan titik literal) di UI. Akar masalah: pola `t('key') \|\| 'fallback'` yang dipakai mengasumsikan `t()` mengembalikan nilai falsy untuk key yang belum terdaftar — padahal `t()` selalu mengembalikan key itu sendiri (truthy), sehingga fallback tidak pernah tercapai. Semua key `settings.ip.*` kini didaftarkan resmi di `lib/locales/id.ts` dan `en.ts`. |

**Bonus — ditemukan saat audit menyeluruh (bug lama, sudah ada sebelum v11.5):**
- Key terjemahan PIN (`settings.pin.new`, `.confirm`, `.current`, `.activate`, `.change`, `.deactivate`, `.invalid`, `.mismatch`, `.wrongCurrent`) tidak pernah terdaftar di locale — layar setup/ganti PIN menampilkan raw key.
- `common.searchMember`, `freemodal.existing`, `settings.zones.placeholder` juga hilang dari locale.
- Satu pola `t('key') || 'fallback'` lain ditemukan di `TunggakanView.tsx` (hint tarif default) — diganti dengan key locale yang benar (`tunggakan.tarifDefaultHint`), karena key lama yang dipakai (`membercard.setTarifHint`) berisi HTML inline yang tidak cocok untuk konteks teks biasa.

**Pencegahan regresi — test baru:**
- `lib/__tests__/i18n-and-ui-consistency.test.ts` (11 test baru): men-scan **seluruh** source code untuk memvalidasi setiap pemanggilan `t('key.literal')` benar-benar terdaftar di kedua file locale (id.ts & en.ts), mendeteksi key yang hanya ada di satu bahasa, mendeteksi pola `t('key') || 'fallback'` yang berbahaya, dan memvalidasi konvensi warna kunci/buka konsisten antara Header dan Members.

**File yang berubah (v11.5.1):**

| File | Perubahan |
|------|-----------|
| `components/features/settings/SettingsView.tsx` | Tambah `badgeColor="var(--c-lunas)"` ke badge Tema Tampilan & Bahasa |
| `components/features/members/MembersView.tsx` | Fix warna terbalik tombol kunci/buka member |
| `components/features/settings/SettingsIPSection.tsx` | Hapus pola fallback `\|\| 'teks'` yang tidak berfungsi; pakai key locale resmi |
| `components/features/tunggakan/TunggakanView.tsx` | Pakai key locale baru `tunggakan.tarifDefaultHint` (bukan `membercard.setTarifHint` yang salah konteks) |
| `lib/locales/id.ts`, `en.ts` | Tambah 14 key `settings.ip.*`, 9 key `settings.pin.*`, + `common.searchMember`, `freemodal.existing`, `settings.zones.placeholder`, `tunggakan.tarifDefaultHint` |
| `lib/__tests__/i18n-and-ui-consistency.test.ts` | **Baru** — 11 test: cakupan key i18n menyeluruh + konvensi warna lock/unlock + badge hijau |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **126/126 unit test lulus** (115 dari v11.5 + 11 baru).

---

# WiFi Pay Next — Update v11.5

> Patch perbaikan v11.4 → v11.5. Fokus pada 10 temuan: WA Blast tarif per-member, lebar kolom rekap, navigasi dashboard (klik tunggakan), konsistensi versi tampilan, bug autocollapse akun, performa scroll rekap, konsistensi icon & search log, migrasi konversi IP ke Settings, dan audit konsistensi badge status.

---

## v11.5 — Ringkasan Perbaikan

| # | Area | Perbaikan |
|---|------|-----------|
| 1 | WA Blast | Total tagihan kini memakai **tarif individual member** (`memberInfo.tarif`), bukan selalu tarif default global. Member dengan tarif 50rb vs 100rb sekarang dihitung benar. |
| 2 | Rekap | Kolom NAMA dipersempit (120px → 86px) — lebih proporsional, tidak memakan ruang berlebih. |
| 3, 4 | Dashboard | Klik member di "Top Tunggakan" sekarang **langsung membuka Entry pada bulan tunggakan tertua** dengan kartu member auto-expand. Sebelumnya baris ini tidak punya `onClick` sama sekali (tombol tidak berfungsi). Juga memperbaiki dua tombol "BUKA" (Header vs Members) yang membingungkan karena label identik — Members kini berlabel "BUKA MEMBER" / "KUNCI MEMBER". |
| 5 | Versi & Nama App | `APP_NAME`/`APP_VERSION` kini terpusat di `lib/constants.ts` (single source of truth). Memperbaiki PDF export yang sebelumnya tampil "v11.4" tanpa suffix "Next" (tidak konsisten dengan tempat lain), dan menghapus duplikasi versi di footer Sidebar. |
| 6 | Akun (Sidebar) | Modal akun sekarang terbuka langsung tanpa menutup sidebar dahulu — sebelumnya sidebar auto-collapse sebelum modal muncul, sehingga harus dibuka ulang untuk melihat opsi ganti akun/keluar. |
| 7 | Rekap (Performa) | Throttle `requestAnimationFrame` pada scroll handler halaman (`AppShell`) — mengurangi overhead render berlebih saat scroll cepat di tabel besar (100+ baris), mengatasi jank/delay yang dirasakan. |
| 8 | Log | Tombol filter "Bayar" sekarang punya icon (sebelumnya hanya "Semua" yang punya icon — inkonsisten). Dua search box yang fungsinya identik ("Cari aksi" & "Filter nama", keduanya mencari field yang sama) digabung menjadi satu search box. |
| 9 | Konversi IP | Dipindah dari menu Members ke **Pengaturan** sebagai section collapsible. Sekarang bisa cari & ganti **substring apa pun** pada IP (bukan hanya oktet ke-2 `.13→.90` yang hardcoded) — fleksibel untuk skenario konversi apa pun. |
| 10 | Badge Status | Diaudit menyeluruh — badge "Aktif" (PIN, Sidik Jari, Tanggal Otomatis) sudah konsisten hijau (`var(--c-lunas)`) di kode. Tidak ditemukan bug nyata; perbedaan visual yang terlihat adalah badge status (hijau) vs badge informasi netral (Tema/Bahasa, abu — sesuai desain karena bukan representasi ON/OFF). |

**File yang berubah (v11.5):**

| File | Perubahan |
|------|-----------|
| `lib/constants.ts` | **Baru:** `APP_NAME`, `APP_VERSION`, `APP_VERSION_FULL` — single source of truth versi/nama app |
| `lib/member.ts` | **Baru:** `convertMemberIPs()` — fungsi murni konversi IP find & replace, unit-tested |
| `lib/export.wa.ts` | (tidak berubah — sudah benar; bug ada di caller) |
| `lib/export.excel.ts` | PDF footer pakai `APP_NAME`/`APP_VERSION_FULL` (fix inkonsistensi "v11.4" tanpa suffix) |
| `lib/helpers.ts` | Re-export `convertMemberIPs` |
| `store/slices/viewSlice.ts` | **Baru:** `setViewWithPeriod()` — navigasi atomic dengan periode eksplisit + auto-expand member. `setView()` dapat opsi `keepPeriod` untuk navigasi terprogram tanpa reset periode |
| `components/layout/AppShell.tsx` | Pathname-sync effect pakai `keepPeriod:true` (fix race condition reset periode). Scroll handler di-throttle rAF |
| `components/layout/Header.tsx`, `Sidebar.tsx`, `LoadingScreen.tsx` | Pakai `APP_NAME`/`APP_VERSION_FULL` terpusat. Sidebar: hapus duplikasi footer versi, fix autocollapse modal akun |
| `components/features/dashboard/DashboardView.tsx` | Tombol tunggakan kini punya `onClick` → `goToEntryAt()` |
| `components/features/tunggakan/TunggakanView.tsx` | WA Blast pakai tarif individual member |
| `components/features/rekap/RekapView.tsx` | Kolom NAMA dipersempit (header + body colgroup) |
| `components/features/log/LogView.tsx` | Icon filter "Bayar" ditambahkan, search box digabung jadi satu |
| `components/features/members/MembersView.tsx` | Tombol konversi IP dipindah (lihat `SettingsIPSection.tsx`), label kunci member diperjelas, refactor `addRef` ke individual refs |
| `components/features/settings/SettingsView.tsx` | Tambah section "Konversi IP" |
| `components/features/settings/SettingsIPSection.tsx` | **Baru** — UI konversi IP fleksibel di Settings |
| `components/features/settings/SettingsAppSection.tsx` | Pakai `APP_NAME`/`APP_VERSION_FULL` terpusat |
| `app/login/page.tsx`, `app/offline/page.tsx` | Pakai `APP_NAME`/`APP_VERSION_FULL` terpusat |
| `public/offline.html` | Versi disinkronkan manual ke v11.5 (file statis, tidak bisa import TS constants) |
| `lib/locales/id.ts`, `en.ts` | Tambah key `members.lock`/`unlock`/`locked`/`unlocked` (disambiguasi dari `header.lock`/`unlock`) |
| `styles/components.entry.css` | Hapus deklarasi CSS zebra-stripe duplikat (dead code, tidak mengubah hasil visual) |
| `store/__tests__/viewSlice.test.ts` | **Baru** — 13 test untuk `setView`/`setViewWithPeriod` |
| `lib/__tests__/export.wa.test.ts` | **Baru** — 7 test untuk `doWABlast` |
| `lib/__tests__/helpers.test.ts` | Tambah 10 test untuk `convertMemberIPs` |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **115/115 unit test lulus** (85 lama + 30 baru).

---

# WiFi Pay Next — Update v11.2

> Patch perbaikan dan peningkatan dari v11.1. Fokus pada 4 area: grafik gelap, zona dinamis, area klik IP, dan sistem bahasa.

---

## File yang Berubah

| File | Perubahan |
|------|-----------|
| `components/views/GrafikView.tsx` | Fix warna axis/tick chart gelap |
| `components/views/MembersView.tsx` | Fix area klik IP + support zona custom |
| `components/views/SettingsView.tsx` | Tambah zona baru + hapus zona custom |
| `components/layout/Header.tsx` | Zona switch dinamis + label bahasa |
| `components/layout/Sidebar.tsx` | Label navigasi terjemahan |
| `hooks/useT.ts` | **BARU** — hook translator reactive |
| `types/index.ts` | `Zone` string, `CustomZone`, `zoneMembers`, `customZones` di settings |
| `lib/locales/id.ts` | Tambah key: `sync.error`, `header.lock`, `header.unlock` |
| `lib/locales/en.ts` | Tambah key: `sync.error`, `header.lock`, `header.unlock` |

---

## Detail Perbaikan

### 1. Grafik Mode Gelap — Axis & Label Tidak Terbaca

**Root cause:** `tickColor` di chart bulanan, KRS vs SLK, dan perbandingan tahunan menggunakan `'var(--txt3)'`. Chart.js tidak bisa membaca CSS variables — hanya bisa menerima nilai warna literal (hex/rgba).

**Fix:** Semua `tickColor` dan `legendColor` di `GrafikView.tsx` diganti ke hex literal:
- Dark mode: `'#6B7494'` (sama dengan nilai aktual `--txt3`)
- Light mode: `'#6B7280'`
- Legend KRS vs SLK: `'#A1A8C1'` (lebih terang agar terbaca)

Sekarang label bulan, label rupiah, dan legend chart semua terbaca jelas di dark mode maupun light mode.

---

### 2. Tambah Zona Baru (Manajemen Zona Dinamis)

Fitur baru di menu **Pengaturan → Manajemen Zona**: pengguna sekarang bisa menambah zona WiFi baru selain KRS dan SLK.

**Cara pakai:**
1. Buka Pengaturan → Manajemen Zona
2. Klik tombol **"Tambah Zona Baru"** (ungu di bawah daftar zona)
3. Isi nama zona (maks 6 huruf, otomatis kapital) dan pilih warna
4. Klik **Tambah Zona**

**Zona custom:**
- Tampil di header zone switch bersama KRS dan SLK
- Tampil di tabs zona di menu Member
- Ditandai badge `Custom` di daftar zona
- Bisa diedit nama, disembunyikan, atau dihapus
- Data member zona custom disimpan di `appData.zoneMembers[zoneKey]`
- Warna zona custom muncul di header saat zona tersebut aktif

**Perubahan teknis:**
- `types/index.ts`: `Zone` berubah dari `'KRS' | 'SLK'` ke `string` (backward compatible)
- `types/index.ts`: tambah interface `CustomZone { key, name, color }`
- `types/index.ts`: tambah `zoneMembers?: Record<string, string[]>` di `AppData`
- `types/index.ts`: tambah `customZones: CustomZone[]` di `AppSettings`
- Header zona switch sekarang render dinamis dari `['KRS','SLK', ...customZones]` dengan filter `hiddenZones`

---

### 3. Area Klik IP — Tidak Sengaja Terpencet

**Root cause:** Elemen `<a>` (link IP) menggunakan `flex:1` sehingga area klika-nya memenuhi seluruh lebar baris, termasuk ruang kosong di sebelah kanan IP.

**Fix di `MembersView.tsx`:**
- `<a>` IP: hapus `flex:1`, ganti ke `flexShrink:0` + `maxWidth:160px` + `display:block`
- Tambah `<span style={{ flex:1 }} />` sebagai spacer terpisah di antara IP dan tombol aksi
- Sekarang area klik IP **hanya selebar teks IP itu sendiri** — ruang kosong di kanan tidak ikut ter-klik

---

### 4. Bahasa / Language — English Tidak Berfungsi

**Root cause:** Sistem i18n (`lib/i18n.ts`, `lib/locales/`) sudah ada sejak v11.1, tapi tidak ada komponen yang memanggilnya. Bahasa disimpan di settings tapi UI tetap render string Indonesia hardcoded.

**Fix:** Buat hook baru `hooks/useT.ts`:

```typescript
// hooks/useT.ts
export function useT() {
  const lang = useAppStore(s => s.settings.language) ?? 'id';
  return createTranslator(lang);
}
```

Hook ini reactive — saat bahasa diubah di Pengaturan, komponen yang pakai `useT()` langsung re-render dengan bahasa baru tanpa reload.

**Komponen yang sudah menggunakan `useT()`:**
- `Sidebar.tsx` — semua label navigasi (Dashboard, Entry, Rekap, Tunggakan, Grafik, Log, Member, Operasional, Pengaturan, Ganti Akun, Keluar)
- `Header.tsx` — sync pill (Tersimpan / Saved, Menyimpan / Saving, Gagal sync / Sync failed, Offline), tombol KUNCI/BUKA (LOCK/OPEN)

**Catatan:** View-view lain (DashboardView, EntryView, dll) masih menggunakan teks Indonesia hardcoded. Integrasi `useT()` ke seluruh view adalah pekerjaan lanjutan yang bisa dilakukan bertahap.

---

## Cara Update dari v11.1

Karena ini patch minor, **tidak perlu backup Firebase** — tidak ada perubahan struktur data yang breaking. Cukup replace file-file berikut:

```
hooks/useT.ts                          ← FILE BARU, tambahkan
types/index.ts                         ← replace
lib/locales/id.ts                      ← replace
lib/locales/en.ts                      ← replace
components/layout/Header.tsx           ← replace
components/layout/Sidebar.tsx          ← replace
components/views/GrafikView.tsx        ← replace
components/views/MembersView.tsx       ← replace
components/views/SettingsView.tsx      ← replace
```

File lain tidak berubah.

---

## Changelog

```
v11.5.2 Next — Rekap Fix + 3 Fitur Baru (Jun 2026)
🔧 Fix (low-risk, bukan garansi 100%): background solid .cv/.cz/.cn — kemungkinan penyebab nama hilang saat scroll
🔧 Fix: scroll sync header Rekap tanpa rAF delay — kemungkinan penyebab konten tembus kolom judul
✨ Fitur: Catatan bebas per member (textarea, hanya di halaman Members)
✨ Fitur: Insight kontekstual Dashboard — tunggakan & rasio lunas vs bulan lalu
✨ Fitur: Micro-interaction "tandai lunas" diperkuat (glow+checkmark di Entry, flash minimal di Rekap)
✅ Test: +9 unit test baru (getPrevMonth, calcPctDelta) — total 135/135 lulus

v11.5.1 Next — Patch Pasca-Deploy (Jun 2026)
✅ Fix: Badge "Tema Tampilan" & "Bahasa" di Pengaturan kini hijau (konsisten dengan badge status lain)
✅ Fix: Warna tombol "KUNCI MEMBER"/"BUKA MEMBER" yang terbalik (terkunci sempat hijau, terbuka sempat merah)
✅ Fix: Raw translation key (mis. "settings.ip.zoneLabel") tampil mentah di Konversi IP — root cause: t('key') || 'fallback' tidak pernah bekerja karena t() selalu return truthy
✅ Fix: Key terjemahan PIN, search member, free member modal, placeholder zona yang hilang (bug lama, ditemukan saat audit)
✅ Test: +11 unit test baru — scan otomatis cakupan key i18n + konvensi warna lock/unlock

v11.5 Next — Perbaikan 10 Temuan (Jun 2026)
✅ Fix: WA Blast total tagihan kini pakai tarif individual member (bukan tarif default global)
✅ Fix: Kolom NAMA di Rekap dipersempit (120px → 86px)
✅ Fix: Dashboard "Top Tunggakan" — klik member sekarang berfungsi, langsung ke Entry bulan tunggakan tertua + auto-expand kartu
✅ Fix: Bug race condition navigasi — setView() tidak lagi menimpa balik periode/expandedCard saat navigasi terprogram (setViewWithPeriod baru)
✅ Fix: Disambiguasi tombol "BUKA" Header vs Members (label "BUKA MEMBER"/"KUNCI MEMBER")
✅ Fix: Versi/nama app dipusatkan (lib/constants.ts) — PDF export sebelumnya tampil "v11.4" tanpa suffix "Next", kini konsisten
✅ Fix: Hapus duplikasi tampilan versi di footer Sidebar
✅ Fix: Modal akun tidak lagi auto-collapse sidebar sebelum terbuka
✅ Fix: Render jank/delay saat scroll cepat di Rekap — scroll handler AppShell di-throttle rAF
✅ Fix: Icon filter "Bayar" di Log yang sebelumnya hilang (inkonsisten dengan "Semua")
✅ Fix: Gabung 2 search box redundan di Log (Cari aksi + Filter nama → 1 search box)
✅ Fitur: Konversi IP dipindah ke Pengaturan, kini fleksibel (cari/ganti substring apa pun, bukan hanya oktet ke-2)
✅ Refactor: addRef di MembersView jadi individual useRef (defensif terhadap eslint-plugin-react-hooks v7 false-positive)
✅ Cleanup: Hapus dead-code CSS duplikat untuk zebra-stripe Rekap (tidak mengubah hasil visual)
✅ Test: +30 unit test baru (setView/setViewWithPeriod, doWABlast, convertMemberIPs) — total 115/115 lulus

v11.2 Next — Fase 2: UI Primitives (Apr 2026)
✅ Baru: components/ui/Button.tsx — CVA variants (primary, secondary, ghost, danger, icon)
✅ Baru: components/ui/Input.tsx — CVA variants dengan label, error, icon support
✅ Baru: components/ui/Badge.tsx — CVA variants (lunas, belum, free, zone, neutral)
✅ Baru: components/ui/Card.tsx — CVA variants + CardHeader/Title/Body/Footer
✅ Baru: components/ui/Select.tsx — Styled select dengan Lucide chevron
✅ Baru: components/ui/Skeleton.tsx — Skeleton loading (base + SkeletonList/Card/Stat)
✅ Baru: components/ui/EmptyState.tsx — Reusable empty state component
✅ Baru: lib/helpers.ts — getAllActiveZones() + getMembersForZone()
✅ Fix: PAGE_ICON_MAP menggantikan PAGE_ICONS (Lucide vs emoji)
✅ Fix: BottomNav sekarang gunakan Lucide icons (bukan emoji)
✅ Fix: persistPayment() dipakai di semua views (RekapView, EntryView, OperasionalView, MembersView)
✅ Fix: Semua emoji di UI (.tsx) diganti plain text / dihapus

v11.2 Next — Patch Perbaikan (Apr 2026)
✅ Fix: grafik dark mode — axis X/Y dan label terbaca (hex literal, bukan CSS var)
✅ Fix: area klik IP member tidak lagi melebar ke kanan
✅ Fitur: tambah zona WiFi baru dari Pengaturan → Manajemen Zona
✅ Fitur: hapus zona custom dari Pengaturan → Manajemen Zona
✅ Fitur: zona custom tampil di header zone switch dan tabs Member
✅ Fix: bahasa English sekarang berfungsi (hook useT reactive)
✅ Label navigasi Sidebar terjemah saat ganti bahasa
✅ Sync pill dan tombol lock/unlock di Header terjemah
✅ Versi diupdate ke v11.2 Next di seluruh tampilan
```

---

*WiFi Pay Next v11.5.2 · [@13angganh](https://github.com/13angganh)*

---

## Technical Debt — Dark Mode Implementation

**Status:** Terdokumentasi, tidak direfactor (task 3.05 — Fase 3)

### Perbedaan implementasi vs spec

| | Spec (`prompt-personal.md`) | Implementasi app |
|---|---|---|
| Default | `:root` = light | `:root` = dark |
| Dark override | `.dark` class | (sudah default) |
| Light override | — | `body.light` class |
| Gold override | — | `body.gold` class |

### Alasan tidak direfactor

App sudah berjalan dengan implementasi ini. Refactor ke spec memerlukan:
- Invert semua nilai token di `:root`
- Rename semua `body.light` → `body:not(.dark)` atau sejenisnya
- Risiko regresi visual tinggi di seluruh halaman

**Keputusan:** Pertahankan implementasi yang ada. Catat di sini agar developer berikutnya tidak bingung.
