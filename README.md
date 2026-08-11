# WiFi Pay Next — Update v11.5.19

> Tindak lanjut dari temuan terpisah di v11.5.18: pesan error PIN yang tidak hilang otomatis, sekarang diminta untuk ikut diperbaiki.

## Bug: Pesan "PIN salah, coba lagi" tidak hilang otomatis

Di v11.5.18, `setTimeout(600ms)` yang mereset `digits` setelah PIN salah tidak memanggil `setError('')` — pesan error baru hilang saat user mulai mengetik ulang. Efeknya: setelah PIN salah, dot indikator sudah kosong lagi dan siap menerima input baru, tapi teks "PIN salah, coba lagi" masih nyangkut di layar selama itu — kombinasi yang membingungkan, terlihat seperti komponen macet padahal sudah siap dipakai lagi.

Diperbaiki dengan menambahkan `setError('')` di dalam callback `setTimeout` yang sama, sejajar dengan `setDigits(...)` dan `setShake(false)` yang sudah ada di situ.

Test regresi yang ditambahkan di v11.5.18 (`PinLock.test.tsx`) diperluas: test yang sebelumnya sengaja menunggu digits reset saja kini juga memverifikasi pesan error ikut hilang di titik yang sama. Sama seperti v11.5.18, kode sempat dikembalikan sementara ke versi tanpa `setError('')` untuk membuktikan assersi barunya benar-benar gagal seperti yang diharapkan, sebelum fix dikembalikan.

## File yang berubah (v11.5.19)

| File | Perubahan |
|------|-----------|
| `components/ui/PinLock.tsx` | `setError('')` ditambahkan ke callback `setTimeout` reset PIN salah |
| `components/ui/__tests__/PinLock.test.tsx` | Test digabung: 1 test kini memverifikasi digits DAN pesan error, keduanya reset otomatis |
| `lib/constants.ts` | Versi → v11.5.19 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **204/204 unit test lulus** (jumlah test tidak bertambah — perluasan assersi pada test yang sudah ada, bukan test baru) · assersi baru dikonfirmasi menangkap bug lewat revert-sementara-ke-versi-lama sebelum fix dikembalikan.

---

# WiFi Pay Next — Update v11.5.18

> Bug dari laporan penggunaan nyata: saat mengetik PIN di layar login, jumlah digit yang tampil kadang 6 kadang 4, padahal PIN sudah 6 digit sejak beberapa versi lalu.

## Bug: Jumlah digit PIN tidak konsisten (6 vs 4) saat login

`components/ui/PinLock.tsx` menyimpan PIN yang sedang diketik di state `digits`, diinisialisasi sebagai array 6 elemen. Tapi baris yang mereset `digits` setelah PIN salah dimasukkan masih memakai `setDigits(['','','',''])` — array 4 elemen, sisa dari sebelum PIN di-upgrade dari 4 ke 6 digit. Dot indikator dan input tersembunyi sama-sama di-`map()` dari `digits`, jadi begitu user salah mengetik PIN sekali, keduanya mendadak menyusut dari 6 slot ke 4 slot di tengah sesi yang sama — persis gejala yang dilaporkan.

Diperbaiki dengan menyamakan array reset itu jadi 6 elemen, konsisten dengan state awal.

## Test regresi (komponen React pertama di test suite proyek ini)

Ditambahkan `components/ui/__tests__/PinLock.test.tsx` — merender `PinLock` sungguhan dan mengetik PIN lewat numpad, persis alur asli user, bukan menguji state secara langsung. Proses menulis test ini sempat menemukan dua hal di luar bug utamanya sendiri:

- Import chain `PinLock` → `useAppStore` → `dataSlice` → `lib/db.ts` → `lib/firebase.ts` menginisialisasi koneksi Firebase sungguhan saat modul di-import, yang butuh kredensial environment nyata. Di-mock di level test (`vi.mock('@/lib/firebase', ...)`) supaya test PIN tidak bergantung pada koneksi eksternal.
- **Temuan terpisah, TIDAK diperbaiki di versi ini:** pesan error "PIN salah, coba lagi" tidak pernah hilang otomatis — `setTimeout(600ms)` yang mereset digit tidak memanggil `setError('')`, jadi pesan itu baru hilang saat user mulai mengetik ulang. Ini dikonfirmasi lewat investigasi timer langsung (spy pada `setTimeout`, advance timer, render ulang DOM), bukan sekadar dugaan. Perilaku ini sudah ada sebelum v11.5.18 dan di luar cakupan laporan bug ini (soal jumlah digit, bukan soal pesan error) — dicatat di sini apa adanya, keputusan apakah perlu diperbaiki diserahkan ke penggunanya.

Untuk membuktikan test regresinya benar-benar menangkap bug (bukan lulus kebetulan), kode sempat dikembalikan sementara ke versi 4-elemen dan dikonfirmasi 2 dari 4 test gagal seperti yang diharapkan, sebelum fix dikembalikan.

## File yang berubah (v11.5.18)

| File | Perubahan |
|------|-----------|
| `components/ui/PinLock.tsx` | Reset `digits` setelah PIN salah kini 6 elemen, bukan 4 |
| `components/ui/__tests__/PinLock.test.tsx` | Baru — 4 test regresi untuk alur PIN salah/benar via numpad sungguhan |
| `lib/constants.ts` | Versi → v11.5.18 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **204/204 unit test lulus** (200 sebelumnya + 4 baru) · test regresi dikonfirmasi menangkap bug lewat revert-sementara-ke-versi-lama sebelum fix dikembalikan.

---

# WiFi Pay Next — Update v11.5.17

> Satu bug lanjutan dari laporan penggunaan nyata di menu Rekap tahunan (PDF terlampir): baris GRAND TOTAL yang baru ditambahkan di v11.5.16 ternyata cuma berisi satu angka rupiah gabungan seluruh tahun — 12 kolom bulan (Jan..Des) di baris itu tetap kosong, padahal setiap halaman sudah punya subtotal per bulannya sendiri ("TOTAL HALAMAN").

## Bug: GRAND TOTAL di PDF Rekap tahunan tidak punya angka per bulan

Baris footer "GRAND TOTAL" (ditambahkan v11.5.16 untuk memisahkan grand total dari subtotal per halaman) hanya mengisi 2 sel: label "GRAND TOTAL" dan satu angka rupiah di kolom "Total" paling kanan — 12 kolom bulan lainnya sengaja dibiarkan string kosong sejak awal ditulis. Ini persis yang dilaporkan: rekap tahunan tidak punya grand total seluruh halaman untuk tiap bulannya, cuma total tahunan gabungan.

Diperbaiki dengan menghitung total per bulan langsung dari data mentah (pola yang sama seperti perhitungan grand total tahunan yang sudah ada), lalu mengisi tiap kolom bulan di baris GRAND TOTAL dengan angka itu — akumulasi seluruh member lintas semua halaman, bukan cuma halaman terakhir.

Percobaan pertama perbaikan ini sempat salah: label "GRAND TOTAL" awalnya ditaruh di kolom bulan terakhir (Des), karena di mode tahunan tidak ada kolom kosong khusus untuk label seperti di mode bulanan. Begitu kolom Des juga diisi angka totalnya, angka itu menimpa teks labelnya sendiri — dikonfirmasi langsung dengan generate PDF nyata dan membaca isinya via `pdftotext`, bukan sekadar dugaan dari kode. Diperbaiki dengan memindah label ke kolom "Nama" (satu-satunya kolom yang secara alami tak butuh angka di baris grand-total), sehingga ke-12 bulan bisa terisi tanpa terkecuali. Mode bulanan (rekap 1 bulan) tidak disentuh sama sekali — label di sana tetap di posisi aslinya karena tidak mengalami masalah yang sama.

Sudah diverifikasi dengan generate PDF nyata dari data uji 40 member multi-halaman: baris GRAND TOTAL menampilkan angka per bulan yang benar (diperiksa langsung lewat `pdftotext -layout`, bukan cuma dibaca dari kode), label tetap utuh, dan mode bulanan terbukti tidak berubah lewat PDF uji terpisah.

## File yang berubah (v11.5.17)

| File | Perubahan |
|------|-----------|
| `lib/export.excel.ts` | `generatePDF()`: baris GRAND TOTAL (mode tahunan) kini diisi per bulan, bukan cuma 1 angka rupiah gabungan; label dipindah ke kolom "Nama" agar tidak menimpa kolom bulan Des |
| `lib/constants.ts` | Versi → v11.5.17 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **200/200 unit test lulus** (tidak ada test baru — sama seperti v11.5.16, perubahan ini pada `generatePDF()` yang outputnya file biner PDF; validasi dilakukan dengan generate PDF nyata dari data multi-halaman lalu memeriksa teksnya langsung via `pdftotext`, termasuk kasus mode bulanan untuk memastikan tidak ada regresi).

---

# WiFi Pay Next — Update v11.5.16

> Dua bug dari laporan penggunaan nyata di menu Rekap ALL (PDF terlampir): warna zebra-stripe & teks yang hampir tak terbaca, dan angka "TOTAL" yang ternyata sama persis di setiap halaman alih-alih subtotal halaman itu sendiri. Investigasi kedua bug ini juga menemukan satu masalah insidental lama (bukan bagian dari laporan) yang ikut dibereskan sekalian demi kerapian kode.

## Bug: zebra-stripe & teks PDF Rekap hampir tak terbaca

Warna baris selang-seling (`alternateRowStyles`) dan warna baris footer (`footStyles`) sebelumnya nyaris identik satu sama lain (RGB `[15,18,28]` vs `[20,24,36]`), dan warna teks header (`[170,170,160]`, abu redup) berada di atas latar yang juga gelap (`[30,34,49]`) — kombinasi kontras rendah yang membuat sebagian teks sulit terbaca, terutama saat dicetak atau di-zoom.

Diperbaiki dengan mengambil warna langsung dari token tema resmi app (`lib/design-tokens.ts` — `bg2`/`bg3`/`bg4` untuk latar, `txt2` untuk teks), sehingga PDF kini konsisten dengan tampilan dark-theme app itu sendiri dan kontrasnya sudah pasti memadai karena token yang sama sudah dipakai dan terbukti terbaca di seluruh UI aplikasi.

## Bug: "TOTAL" di PDF Rekap ALL sama persis di setiap halaman, bukan subtotal halaman

Root cause: `jspdf-autotable` (library pembuat tabel PDF) punya perilaku default `showFoot: 'everyPage'` — artinya baris `foot` yang didefinisikan di kode (berisi **satu angka grand total untuk seluruh periode**) otomatis digambar ulang di **setiap** halaman apa adanya. Karena angkanya memang satu angka yang sama, hasilnya persis seperti yang dilaporkan: baris "TOTAL" di halaman 1, 2, 3, dst semuanya menunjukkan angka identik — bukan subtotal member-member yang ada di halaman itu.

Diperbaiki dengan pendekatan berbeda sepenuhnya, bukan sekadar mengubah opsi:
- Grand total asli kini hanya digambar **sekali**, di halaman terakhir (`showFoot: 'lastPage'`), dengan label "GRAND TOTAL" berwarna hijau agar jelas berbeda dari subtotal.
- Baris baru "TOTAL HALAMAN" ditambahkan di setiap halaman, dihitung ulang murni dari baris-baris yang **benar-benar tercetak di halaman itu** — bukan diambil dari opsi `foot` statis.
- Nilai numerik untuk perhitungan ini diambil dari data mentah (bukan dari teks tabel yang sudah diformat), untuk menghindari salah baca akibat titik pemisah ribuan Indonesia (mis. string "10.180" bila diparsing sebagai angka biasa bisa salah terbaca sebagai "10,18").

Sudah diverifikasi dengan generate PDF nyata dari data uji multi-halaman: subtotal tiap halaman berbeda satu sama lain sesuai isi halamannya masing-masing, dan totalnya menjumlah tepat ke grand total yang tampil di halaman terakhir.

## Perbaikan insidental: warning konsol "width could not fit page" pada setiap export PDF

Ditemukan saat menginvestigasi dua bug di atas, di luar cakupan laporan awal — bukan disebabkan oleh perubahan pada versi ini. Kode lama sempat memanggil `autoTable(doc, { head:[[]], body:[] })` (tabel kosong tanpa kolom) di awal fungsi, dengan komentar "Daftarkan plugin autotable". Ditelusuri ke source code `jspdf-autotable`: pendaftaran plugin ke instance PDF sebenarnya sudah terjadi **otomatis** saat library ini pertama kali dimuat — pemanggilan manual dengan tabel kosong itu tidak pernah benar-benar dibutuhkan sejak awal, dan efek sampingnya justru memicu warning tersebut pada console setiap kali PDF dibuat (tabel 0-kolom membuat kalkulasi lebar minimum vs lebar halaman jadi tidak wajar).

Baris tersebut dihapus. Dikonfirmasi lewat pengujian langsung: warning hilang total, sementara tabel data yang sesungguhnya di bawahnya tetap tergambar tanpa perubahan apa pun (bukan cuma tampak sama — subtotal per halaman dan grand total pada data uji tetap menghasilkan angka yang identik sebelum dan sesudah baris ini dihapus).

## File yang berubah (v11.5.16)

| File | Perubahan |
|------|-----------|
| `lib/export.excel.ts` | `generatePDF()`: palet warna disamakan dengan token tema app; subtotal per halaman dihitung ulang dari baris yang benar-benar tercetak di halaman itu (bukan lagi grand total statis yang diulang); grand total dipisah tegas ke halaman terakhir saja; baris inisialisasi plugin yang sudah tidak diperlukan (sumber warning konsol) dihapus |
| `lib/constants.ts` | Versi → v11.5.16 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **200/200 unit test lulus** (tidak ada test baru — perubahan ini murni pada `generatePDF()`, yang tidak tercakup unit test yang ada karena outputnya adalah file biner PDF; validasi dilakukan dengan generate PDF nyata dari data multi-halaman dan pemeriksaan visual + numerik langsung terhadap hasilnya, termasuk verifikasi independen bahwa subtotal tiap halaman menjumlah tepat ke grand total).

---

> Dua laporan bug dari penggunaan nyata di menu Entry (screenshot terlampir), plus satu upgrade framework yang sudah direncanakan sejak beberapa minggu lalu: Next.js akhirnya mencapai versi 16.3 stable, momen yang sudah ditetapkan sebagai syarat sebelumnya.

## Bug: kartu member tak bisa diklik saat batch pembayaran berisi 4+ member

Bottom sheet preview batch (mengambang di bagian bawah layar, `position:fixed`) punya tinggi yang tumbuh mengikuti jumlah member yang dipilih — makin banyak dipilih, makin tinggi. Tapi ruang kosong penyeimbang di akhir daftar kartu member selalu tetap di angka 300px, berapa pun jumlah member. Begitu sheet tumbuh melebihi 300px (sekitar 4 member ke atas), sheet mulai menutupi kartu paling bawah **secara fisik** — sheet tetap menerima ketukan di area itu meski kartu di baliknya masih tampak sebagian, sehingga ketukan di kartu itu tidak pernah benar-benar sampai. Ini sebab laporan: kartu ZAHDAN terlihat tapi tidak merespons ketukan begitu daftar terpilih bertambah.

Diperbaiki dengan mengukur tinggi asli sheet secara langsung (bukan dihitung manual dari jumlah item, supaya tidak basi kalau layout-nya berubah lagi nanti) dan menyesuaikan ruang kosong penyeimbang mengikuti angka itu — sehingga daftar kartu selalu bisa di-scroll sepenuhnya melewati sheet, apa pun jumlah member yang dipilih.

## Bug: tak bisa menambah member lain ke batch saat masuk lewat fitur pencarian

Kotak pencarian disembunyikan total begitu mode pembayaran batch aktif — padahal apa pun yang sempat diketik di kotak itu sebelumnya (mis. "Zam") tetap tersimpan dan terus dipakai untuk menyaring daftar, tanpa ada cara mengubah atau menghapusnya karena kotaknya sendiri sudah hilang dari layar. Akibatnya: begitu mode batch dimulai dari hasil pencarian nama tertentu, daftar member yang tampil selamanya cuma hasil pencarian itu — mustahil menambah member lain ke pembayaran gabungan.

Diperbaiki dengan membuat kotak pencarian tetap tampil selama mode batch berlangsung, sehingga pencarian bisa diubah atau dihapus kapan saja untuk melihat dan menambah member lain ke daftar terpilih.

## Upgrade: Next.js 16.2.6 → 16.3.0 (stable, rilis 3 Agustus 2026)

Sesuai rencana yang sudah ditetapkan sebelumnya (skip 16.2.12 karena update itu murni patch keamanan untuk fitur yang tidak dipakai app ini — middleware, i18n locales, Server Actions, rewrites — sambil menunggu 16.3 stabil). 16.3 kini rilis dan membawa seluruh perbaikan keamanan kumulatif dari 16.2.11/16.2.12 sekaligus, jadi upgrade ini otomatis membawa app ke titik terkini tanpa perlu dua langkah terpisah.

Perubahan utama di 16.3 murni performa infrastruktur, tanpa mengubah kode aplikasi sama sekali: Turbopack memakai memori jauh lebih hemat saat development (disk caching + memory eviction, otomatis aktif), dan build cache kini juga berlaku untuk build produksi (sebelumnya hanya development) — berpotensi mempercepat build CI/Vercel ke depannya. Fitur baru Instant Navigations bersifat opt-in dan tidak aktif tanpa konfigurasi eksplisit, jadi tidak berdampak pada perilaku app saat ini.

Diperiksa ulang seluruh syarat yang sebelumnya membuat app ini aman dari security release Juli — tidak ada `middleware.ts`, tidak ada `i18n.locales`, tidak ada Server Actions (`'use server'`), tidak ada `runtime: 'edge'` di manapun di codebase — semuanya masih berlaku sama untuk 16.3, dan tidak ditemukan advisory keamanan baru yang spesifik menyasar 16.3 di luar yang sudah tercakup 16.2.12. `eslint-config-next` turut disinkronkan ke 16.3.0 agar tidak tertinggal dari versi core.

**Catatan verifikasi build:** `next build` tidak bisa dijalankan sampai selesai di lingkungan kerja sesi ini karena keterbatasan akses jaringan ke `fonts.googleapis.com` (dipakai `next/font/google` di `app/layout.tsx` untuk font Inter & JetBrains Mono) — bukan soal kode. TypeScript, ESLint, dan seluruh test suite tetap dijalankan penuh dan lulus bersih; disarankan menjalankan `npm run build` sekali di lingkungan dengan akses internet normal (mis. lokal atau CI Vercel) sebelum deploy, sebagai langkah verifikasi akhir yang belum sempat dilakukan di sesi ini.

## File yang berubah (v11.5.15)

| File | Perubahan |
|------|-----------|
| `components/features/entry/EntryView.tsx` | Ruang kosong penyeimbang di bawah daftar kartu kini dinamis mengikuti tinggi asli bottom sheet (via ResizeObserver), bukan angka tetap 300px; kotak pencarian kini tetap tampil selama mode batch aktif |
| `package.json` | `next` → `^16.3.0`, `eslint-config-next` → `^16.3.0` |
| `lib/constants.ts` | Versi → v11.5.15 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **200/200 unit test lulus** (tidak ada test baru — kedua bug adalah murni masalah tata letak/rendering UI, di luar cakupan unit test yang ada, yang berfokus ke `lib/`, `hooks/`, `store/`). `next build` belum terverifikasi penuh di sesi ini — lihat catatan di atas.

---

> Dua temuan: satu sisa teks yang lolos dari sisiran sebelumnya (menu Operasional), dan satu masukan soal kejelasan nama section — Import Data yang baru dipasang minggu lalu ternyata tidak terlihat dari luar sebelum section-nya dibuka, karena masih bernama "Export Data" saja.

## Sisa teks yang belum ikut bahasa: toggle bulan di menu Operasional

Dropdown pilihan bulan di menu Operasional selalu menampilkan nama bulan Bahasa Indonesia, meski label ringkasan di sebelahnya sudah benar mengikuti pengaturan bahasa. Pola yang sama juga ditemukan di satu tempat lain yang sebelumnya lolos — angka "MULAI" di kartu riwayat member (yang labelnya sudah diperbaiki sebelumnya, tapi isinya sendiri belum). Sudah ditelusuri ke seluruh bagian aplikasi yang punya potensi masalah serupa; keduanya adalah satu-satunya sisa yang ditemukan.

## Export Data → Export & Import Data

Sesuai masukan: sebelum section ini dibuka, judulnya cuma "Export Data" — Import ada di dalamnya, tapi tidak ada petunjuk apa pun dari luar. Judul section sekarang mencakup keduanya secara eksplisit, tanpa dipisah jadi section tersendiri (backup dan restore tetap satu kesatuan konsep, berdampingan seperti sebelumnya). Ikon section juga disesuaikan — sebelumnya panah unduh (mengarah satu arah, ke luar), sekarang panah dua arah yang mewakili keduanya sekaligus.

## File yang berubah (v11.5.14)

| File | Perubahan |
|------|-----------|
| `components/features/operasional/OperasionalView.tsx` | Dropdown bulan disambungkan ke sistem terjemahan |
| `components/modals/RiwayatModal.tsx` | Nilai "MULAI" di kartu statistik disambungkan ke sistem terjemahan |
| `components/features/settings/SettingsView.tsx` | Ikon section Export & Import diperbarui |
| `components/features/settings/SettingsTarifSection.tsx` | Ikon card Export & Import diperbarui (ikon tombol JSON Backup di dalamnya tidak berubah) |
| `lib/locales/id.ts`, `en.ts` | Nilai `settings.export` diperbarui dari "Export Data" menjadi "Export & Import Data" (satu key ini menentukan judul di kedua tempat sekaligus) |
| `lib/constants.ts` | Versi → v11.5.14 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **200/200 unit test lulus** (tidak ada test baru — perubahan ini murni bug fix teks dan penyesuaian nama/ikon, sudah tercakup pemeriksaan konsistensi terjemahan yang ada).

---

> Empat temuan sekaligus: tiga sisa teks Bahasa Indonesia yang lolos dari sisiran sebelumnya, dan satu permintaan fitur baru — Import data, sebagai jaring pengaman preventif untuk skenario kesalahan login atau data terhapus. Import ternyata sudah pernah ditulis sebelumnya (logic intinya lengkap), tapi tidak pernah benar-benar bisa diakses dari mana pun di aplikasi — sekarang sudah tersambung, dengan beberapa perbaikan keamanan tambahan mengingat sifatnya yang menimpa seluruh data.

## Tiga sisa teks yang belum ikut bahasa

- **Dashboard**: tombol "Input Bayar [bulan]" di kartu tunggakan bawah — sudah tersambung.
- **Pengaturan → WA Summary & Export Data**: toggle "Bulanan/Tahunan" pada bagian "Share PDF/Excel" (dipakai bersama oleh kedua menu, makanya muncul di keduanya) — sudah tersambung. Sekalian ditemukan dan diperbaiki bug terpisah: dropdown bulan di komponen berbagi WhatsApp sempat selalu memakai Bahasa Indonesia meski sudah ada variabel bahasa yang benar tersedia.
- **Riwayat per member** (modal yang sama, muncul baik dari menu Member maupun Entry — dikonfirmasi keduanya memang satu komponen bersama): label "TOTAL", "BAYAR", "MULAI" di kartu statistik, singkatan "bln", dan status "Free" — semuanya sudah tersambung.

Saat menelusuri perbaikan di atas, ditemukan juga satu bug yang jangkauannya lebih luas: tombol "Batal" di **seluruh** dialog konfirmasi aplikasi (dipakai puluhan kali — hapus member, ganti akun, nonaktifkan biometrik, dan sekarang juga konfirmasi import) ternyata selalu Bahasa Indonesia, tidak peduli pengaturan bahasa. Sudah diperbaiki di sumbernya, jadi otomatis berlaku ke semua tempat yang memakainya.

## Fitur Import: dari kode yang sudah ada tapi tidak bisa diakses, sekarang aktif dengan pengaman tambahan

Investigasi awal menunjukkan logic inti untuk membaca dan memproses file backup JSON sudah lengkap sebelumnya — masalahnya murni tidak ada satu pun tombol di aplikasi yang memanggilnya. Sebelum menyambungkannya, ditemukan dan diperbaiki dua celah yang penting mengingat fitur ini secara eksplisit dimaksudkan sebagai jaring pengaman untuk skenario kehilangan data — jadi harus benar-benar bisa diandalkan, bukan berisiko menambah masalah baru:

- **Proses simpan ke server sebelumnya dilakukan bertahap** (ganti data utama dulu, baru payment menyusul dalam beberapa batch terpisah). Kalau prosesnya terhenti di tengah jalan — koneksi terputus, aplikasi tertutup — hasilnya bisa jadi data tercampur: sebagian sudah baru, sebagian masih lama. Sekarang seluruh proses jadi satu langkah tunggal yang menjamin selesai penuh atau tidak berubah sama sekali, tidak ada kondisi setengah jalan.
- **Belum ada konfirmasi sebelum data ditimpa.** Karena import mengganti *seluruh* data yang sedang berjalan, dan ini persis operasi yang paling berisiko kalau sampai salah pilih file, sekarang ditambahkan langkah konfirmasi wajib sebelum apa pun benar-benar berubah — lengkap dengan ringkasan singkat isi file yang akan diimpor (jumlah member KRS, SLK, dan data pembayaran), supaya ada kesempatan terakhir untuk memastikan file yang dipilih memang benar sebelum melanjutkan.

Tombol Import sekarang ada di menu **Pengaturan → Export Data**, tepat di bawah opsi export yang sudah ada — sesuai permintaan, format dan lokasinya berdekatan dengan Export supaya mudah ditemukan sebagai satu pasangan (backup keluar, restore masuk).

## File yang berubah (v11.5.13)

| File | Perubahan |
|------|-----------|
| `components/features/dashboard/DashboardView.tsx` | Teks "Input Bayar" disambungkan ke sistem terjemahan |
| `components/features/settings/SettingsTarifSection.tsx` | Toggle Bulanan/Tahunan (dipakai bersama WA Summary & Export) disambungkan; tombol Import Data ditambahkan di bagian Export |
| `components/modals/RiwayatModal.tsx` | Label TOTAL/BAYAR/MULAI, singkatan "bln", dan status "Free" disambungkan ke sistem terjemahan |
| `components/ui/Confirm.tsx` | Tombol "Batal" pada seluruh dialog konfirmasi aplikasi disambungkan ke sistem terjemahan |
| `components/modals/ImportModal.tsx` | Ditulis ulang: langkah konfirmasi dengan ringkasan data ditambahkan sebelum data ditimpa; logic validasi diekstrak agar bisa diuji terpisah |
| `lib/db.ts` | `importToDB` ditulis ulang jadi satu langkah tunggal (bukan bertahap) untuk mencegah kondisi data setengah-jalan; fungsi baru `normalizeImportedData()` untuk validasi data yang bisa diuji terpisah |
| `lib/locales/id.ts`, `en.ts` | Key baru untuk seluruh temuan di atas |
| `lib/__tests__/db.test.ts` | 9 unit test baru untuk `normalizeImportedData`, mencakup data valid, tidak valid, sebagian rusak, dan skala realistis |
| `lib/constants.ts` | Versi → v11.5.13 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **200/200 unit test lulus** (191 sebelumnya + 9 test baru).

---

> Pertanyaan sederhana ("sudah dicek teks collapse/expand di Pengaturan?") ternyata membuka temuan yang jauh lebih luas dari dugaan awal. Jawaban jujurnya: belum, sesi sebelumnya cuma fokus ke tiga laporan eksplisit (Log, Grafik, Akun) tanpa menyisir Pengaturan sendiri. Setelah diperiksa menyeluruh: 12 judul section di menu Pengaturan memang belum tersambung bahasa, dua bagian di dalamnya (Sidik Jari & Face ID, Ubah Email) ternyata belum pernah tersambung sama sekali sejak awal, dan audit yang lebih luas ke seluruh aplikasi menemukan pola yang sama di beberapa tempat lain — termasuk temuan yang tidak terduga: tiga bagian kode (Share, Export lewat modal lama, Import lewat modal lama) yang ternyata sama sekali tidak pernah aktif dipakai di aplikasi manapun, dan dua di antaranya (Import, Share) sepertinya benar-benar tidak punya tombol pemicu di manapun — bukan cuma soal bahasa, tapi kemungkinan fitur yang hilang.

## Pengaturan: 12 judul section collapse/expand belum tersambung bahasa

Dikonfirmasi lewat tangkapan layar sebelumnya: "PIN Keamanan", "Sidik Jari & Face ID", "Email & Reset Password", "Manajemen Zona", "Konversi IP", "Export Data", "Ringkasan WhatsApp", "Quick Pay", "Tema Tampilan", "Bahasa", "Tanggal Bayar Otomatis", "Info Aplikasi" — semua judul yang tampil di baris collapse/expand, plus badge status di sampingnya (Aktif/Nonaktif, Terang/Gelap/Emas, English/Indonesia, Otomatis/Manual), tetap Bahasa Indonesia berapa pun pengaturan bahasa aplikasi. Sebagian judul ini kebetulan sudah punya terjemahan siap pakai di tempat lain (halaman ini sudah pernah tersambung bahasa untuk sebagian, tapi berhenti di tengah jalan) — sisanya dibuatkan terjemahan baru, dengan teks Indonesia dijaga sama persis seperti yang sudah tampil sekarang, supaya tidak ada yang berubah selain versi Inggrisnya yang sekarang benar-benar muncul.

## Dua bagian isi Pengaturan yang ternyata belum pernah tersambung bahasa sama sekali

Saat menelusuri kenapa judul section tidak tersambung, ditemukan dua bagian **isi** section (yang muncul setelah di-expand) yang levelnya lebih parah — bukan cuma judul header, tapi **seluruh isinya** (deskripsi, tombol, pesan sukses/gagal, konfirmasi) tetap Bahasa Indonesia total:

- **Sidik Jari & Face ID**: status aktif/nonaktif, penjelasan fitur, peringatan "aktifkan PIN dulu", tombol aktifkan/uji/nonaktifkan, catatan privasi — semuanya belum tersambung.
- **Ubah Email Akun**: label email saat ini, pesan verifikasi terkirim, catatan proses Firebase, tombol kirim, bagian reset password — semuanya juga belum tersambung.

Sudah diperbaiki sepenuhnya untuk keduanya.

## Audit menyeluruh ke seluruh aplikasi: ditemukan pola yang sama di beberapa tempat lain

Karena dua temuan di atas menunjukkan pola yang bisa saja berulang di tempat lain, dilakukan pemeriksaan sistematis ke setiap bagian aplikasi yang berpotensi punya masalah serupa. Hasilnya, beberapa bagian kecil lain juga ditemukan belum tersambung bahasa — pesan status di tombol akun sidebar ("Kelola akun"), dan (dalam proses perbaikan) modal untuk berbagi hasil rekap via WhatsApp serta modal export/import data.

**Temuan tak terduga saat proses ini**: tiga file yang disebut terakhir (modal berbagi WhatsApp, modal export versi lama, modal import) ternyata **sama sekali tidak pernah dipanggil dari mana pun** di aplikasi — sudah ditulis lengkap, tapi tidak ada satu pun tombol atau menu yang memicunya. Ditelusuri lebih jauh:

- **Export data** — masih berfungsi normal, hanya lewat jalur berbeda (menu Pengaturan → Export Data, yang sudah benar sejak awal). Modal versi lama ini kemungkinan sisa sebelum fitur export dipindah ke sana.
- **Import data** — tidak ditemukan jalur lain yang memanggilnya sama sekali. Kemungkinan fitur ini sudah tidak bisa diakses dari UI manapun.
- **Berbagi via WhatsApp** — sama, tidak ditemukan jalur lain. Kemungkinan juga sudah tidak bisa diakses dari UI manapun.

Ini di luar scope pertanyaan awal (soal teks, bukan soal fitur hilang), jadi belum ditindaklanjuti — perbaikan bahasa di ketiga file itu tetap diselesaikan (tidak merugikan meski saat ini tidak terpakai), tapi soal apakah Import dan Share memang sengaja dihilangkan atau tidak sengaja terlepas saat pembaruan sebelumnya, itu perlu jadi keputusan tersendiri. Kalau kedua fitur itu memang masih dibutuhkan, perlu dicari tahu di mana seharusnya tombol pemicunya dulu dipasang.

Ditemukan juga empat file lain dengan pola serupa (fungsinya sudah dipindah ke tempat lain secara langsung, filenya tersisa tidak terpakai): daftar member di menu Entry, tombol bayar cepat di menu Entry, kartu tunggakan, dan tab zona di header. Keempatnya tidak disentuh sama sekali karena memang tidak aktif — disebutkan di sini murni sebagai catatan housekeeping, bukan sesuatu yang perlu segera ditindaklanjuti.

## File yang berubah (v11.5.12)

| File | Perubahan |
|------|-----------|
| `components/features/settings/SettingsView.tsx` | 12 judul section + 6 badge status disambungkan ke sistem terjemahan |
| `components/features/settings/SettingsBiometricSection.tsx` | Seluruh isi (sebelumnya 100% hardcoded) disambungkan ke sistem terjemahan |
| `components/features/settings/SettingsEmailSection.tsx` | Seluruh isi (sebelumnya 100% hardcoded) disambungkan ke sistem terjemahan |
| `components/layout/Sidebar.UserSection.tsx` | Dua teks disambungkan ke sistem terjemahan |
| `components/modals/ShareModal.tsx` | Seluruh isi disambungkan ke sistem terjemahan; sekalian diperbaiki bug terpisah — dropdown bulan selalu pakai Bahasa Indonesia meski sudah ada variabel yang benar tersedia. **Catatan: file ini saat ini tidak terpanggil dari mana pun di aplikasi** |
| `components/modals/ExportModal.tsx` | Seluruh isi disambungkan ke sistem terjemahan. **Catatan: file ini saat ini tidak terpanggil dari mana pun; fitur export sesungguhnya berjalan lewat menu Pengaturan yang terpisah** |
| `components/modals/ImportModal.tsx` | Seluruh isi disambungkan ke sistem terjemahan. **Catatan: file ini saat ini tidak terpanggil dari mana pun di aplikasi** |
| `lib/locales/id.ts`, `en.ts` | Key baru untuk seluruh temuan di atas |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **191/191 unit test lulus** (tidak ada test baru — perubahan ini murni teks UI, sudah tercakup oleh pemeriksaan konsistensi terjemahan yang sudah ada).

---

> Tiga temuan dari pengujian menyeluruh: pencarian di menu Log yang kurang presisi (cari "uci" tapi muncul member yang tidak relevan sama sekali), teks Bahasa Indonesia sekilas muncul di menu Grafik saat memakai Bahasa Inggris, dan seluruh menu Akun di sidebar yang ternyata belum pernah diterjemahkan sama sekali sejak awal dibuat.

## Log: pencarian nama tidak presisi, hasil tidak relevan

Dikonfirmasi: cari "uci" di Log menampilkan WILDAN, VIO, VINA, SIFA — tidak satupun nama itu benar-benar mengandung kata "uci". Penyebabnya: mesin pencarian yang dipakai di Log dirancang untuk mencari huruf-huruf yang tersebar (tidak harus berdekatan) di dalam teks — cara ini bagus untuk mencari nama pendek (ketik "wldn" tetap ketemu "WILDAN"), tapi jadi longgar berlebihan untuk kalimat panjang seperti catatan aktivitas ("[PAY] Quick Pay Rekap KRS - WILDAN") — kata "Quick" yang muncul di **setiap** baris log kebetulan sudah mengandung huruf u, c, i secara berurutan, sehingga hampir semua baris log ikut muncul untuk pencarian pendek apapun, terlepas relevan atau tidak.

**Perbaikan:** pencarian di Log sekarang memakai pencocokan yang presisi — kata yang diketik harus benar-benar muncul utuh sebagai bagian dari kalimat, bukan sekadar huruf-hurufnya tersebar. Pencarian nama pendek di menu lain (Entry, Rekap, pencarian global) tidak diubah — cara lama memang tepat untuk kasus itu. Pesan "tidak ada hasil" saat pencarian tidak menemukan apapun juga diperbaiki agar ikut berganti bahasa sesuai pengaturan (sebelumnya selalu Bahasa Indonesia).

## Grafik: teks Bahasa Indonesia sekilas muncul saat memakai Bahasa Inggris

**Penyebab:** saat aplikasi pertama kali dimuat, bagian yang menyiapkan tampilan awal (di server, sebelum sepenuhnya berjalan di perangkat) belum bisa membaca pengaturan bahasa yang tersimpan di perangkat — jadi sesaat memakai bahasa default (Indonesia) sampai perangkat selesai mengambil alih dan membaca pengaturan yang sebenarnya. Ini sebenarnya berlaku untuk seluruh aplikasi secara merata, tapi baru benar-benar **terlihat** di Grafik karena proses menggambar grafik itu sendiri butuh waktu sedikit lebih lama dibanding menampilkan teks biasa — jeda itu jadi cukup lama untuk sempat terlihat mata sebelum bahasa yang benar mengambil alih.

**Perbaikan:** Grafik sekarang menunggu sampai benar-benar siap membaca pengaturan bahasa yang sesungguhnya sebelum menampilkan apapun yang mengandung teks — selama menunggu (sepersekian detik), yang tampil adalah kerangka kosong tanpa teks sama sekali, sehingga tidak ada apapun yang bisa "salah bahasa" untuk sempat terlihat.

**Temuan tambahan yang belum ditangani (perlu keputusan prioritas):** pola penyebab yang sama berlaku juga di 15 bagian lain aplikasi yang turut membaca pengaturan bahasa dengan cara serupa — RiwayatModal, ShareModal, FreeMemberModal, Log, Tunggakan, Operasional, Rekap (tampilan utama & modal), tiga bagian Pengaturan (Aplikasi, Tarif, tampilan utama), Entry, kartu member di Entry, Dashboard, dan Header. Belum tentu semuanya benar-benar terlihat bermasalah seperti Grafik — kemungkinan besar sebagian besar re-render-nya cukup cepat sehingga tidak sempat terlihat mata — tapi berpotensi sama secara teknis. Sengaja belum disentuh karena scope-nya jauh lebih besar dari laporan awal (spesifik Grafik) dan sebaiknya jadi keputusan terpisah: mana yang perlu diprioritaskan, atau apakah lebih baik ditangani sekaligus di satu pembaruan besar untuk konsistensi penuh.

## Akun (sidebar): belum pernah diterjemahkan sama sekali

Dikonfirmasi lewat tangkapan layar: judul "Akun", label "LOGIN SEBAGAI", badge "EMAIL"/"GOOGLE", tombol "Hubungkan Akun Google", pesan status terhubung, tombol "Ganti Akun" dan "Keluar" — semuanya tetap Bahasa Indonesia meski pengaturan aplikasi sudah Bahasa Inggris. Bukan sesuatu yang baru rusak — bagian ini memang belum pernah dihubungkan ke sistem terjemahan sejak awal dibuat, berbeda dari hampir semua bagian lain aplikasi yang sudah konsisten mendukung dua bahasa.

**Perbaikan:** seluruh teks di menu Akun sekarang mengikuti pengaturan bahasa aplikasi, konsisten dengan bagian lain.

## File yang berubah (v11.5.11)

| File | Perubahan |
|------|-----------|
| `lib/member.ts` | Fungsi baru `textMatch()` (pencocokan presisi) — pengganti pencarian di Log; `fuzzyMatch()` diberi komentar penjelasan kapan dipakai vs tidak, agar kesalahan yang sama tidak terulang di tempat lain |
| `lib/helpers.ts` | Ekspor `textMatch` |
| `components/features/log/LogView.tsx` | Pencarian beralih ke `textMatch`; pesan "tidak ada hasil" diterjemahkan (sebelumnya hardcoded Indonesia) |
| `hooks/useMounted.ts` *(baru)* | Hook deteksi "sudah siap di perangkat" — dasar dari perbaikan Grafik |
| `components/features/grafik/GrafikView.tsx` | Menunggu `useMounted()` sebelum menampilkan konten berteks; kerangka kosong (tanpa teks) selama menunggu; teks "belum ada data" yang sebelumnya hardcoded Indonesia diterjemahkan |
| `components/modals/AccountModal.tsx` | Seluruh teks (14 string) dihubungkan ke sistem terjemahan, sebelumnya sepenuhnya hardcoded Indonesia |
| `lib/locales/id.ts`, `en.ts` | Key baru: `log.noResultsDesc`, `grafik.noDataTitle`, `grafik.noDataDesc`, 13 key `account.*` |
| `lib/__tests__/helpers.test.ts` | 7 unit test baru untuk `textMatch`, termasuk reproduksi persis bug "uci" yang dilaporkan sebagai bukti perbaikan |
| `lib/constants.ts` | Versi → v11.5.11 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **191/191 unit test lulus** (184 sebelumnya + 7 test baru).

---

> Satu temuan lagi dari pengujian v11.5.9: field NOMINAL dan tombol hapus di dalam kartu yang terbuka sudah benar ikut berubah saat dropdown BULAN diganti — tapi badge status (ikon centang/silang) dan warna garis di sisi kiri kartu tetap diam mengikuti toggle atas, tidak ikut bulan yang sedang dipilih di dalam kartu. Mekanisme yang benar sudah dijelaskan dengan jelas: kartu tertutup mengikuti toggle atas; begitu kartu dibuka, seluruh isinya — termasuk header/badge-nya sendiri — menyesuaikan ke bulan yang dipilih di dalam kartu itu; begitu ditutup lagi, otomatis kembali ke toggle atas untuk pembukaan berikutnya.

## Entry: badge status & warna garis kartu tidak ikut bulan yang dipilih saat kartu terbuka

Dikonfirmasi lewat 4 screenshot berurutan: toggle atas tetap di bulan Juli sepanjang pengujian, sementara dropdown BULAN di dalam kartu ABIL yang terbuka dipindah Jan→Mei→Mei→Mar. Nominal dan tombol hapus terlihat benar mengikuti setiap perpindahan itu — tapi badge silang merah di pojok kanan atas kartu tetap diam, padahal semestinya berubah (misal jadi centang hijau saat bulan yang dipilih ternyata sudah lunas).

**Penyebab:** badge status dan warna garis kiri kartu memang sejak awal dirancang membaca status untuk bulan toggle atas — masuk akal untuk kartu yang tertutup (ringkasan cepat "member ini lunas atau belum untuk bulan yang sedang dilihat"). Tapi begitu kartu dibuka, bagian ini tidak ikut menyesuaikan ke bulan yang sedang dipilih di dalam kartu, padahal field-field lain di kartu yang sama (nominal, tombol hapus) sudah menyesuaikan sejak perbaikan sebelumnya — jadi ada bagian kartu yang "ketinggalan" mengikuti, membuat tampilan terasa tidak sinkron dengan isinya sendiri.

**Perbaikan:** badge, warna garis kiri, dan angka ringkas di header kartu sekarang otomatis menyesuaikan sumbernya tergantung status kartu — mengikuti toggle atas saat kartu tertutup, dan mengikuti bulan yang sedang dipilih di dalam kartu begitu kartu dibuka. Ini persis mekanisme yang diminta: tertutup ikut acuan atas, terbuka menyesuaikan sendiri, ditutup lagi otomatis kembali ke acuan atas untuk pembukaan berikutnya (bagian "kembali ke acuan atas saat ditutup" ini sudah ditangani oleh perbaikan sebelumnya).

## File yang berubah (v11.5.10)

| File | Perubahan |
|------|-----------|
| `components/features/members/MemberCard.tsx` | Badge status, warna garis kiri kartu, dan nominal ringkas di header sekarang menyesuaikan sumbernya (toggle atas vs bulan yang dipilih di kartu) tergantung status buka/tutup kartu |
| `lib/payment.ts` | Fungsi baru `resolveDisplayStatus()` — logic penentuan sumber tampilan, diekstrak agar bisa diuji terpisah |
| `lib/helpers.ts` | Ekspor `resolveDisplayStatus` |
| `lib/__tests__/helpers.test.ts` | 7 unit test baru untuk `resolveDisplayStatus`, termasuk simulasi penuh siklus dari laporan (toggle diam, dropdown internal berpindah 3 bulan, lalu kartu ditutup) |
| `lib/constants.ts` | Versi → v11.5.10 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **184/184 unit test lulus** (177 sebelumnya + 7 test baru).

---

> Dua hal dari pengujian v11.5.8: fix dropdown BULAN kemarin ternyata **tidak menyentuh akar masalah sesungguhnya** — root cause baru ditemukan dan diperbaiki di update ini. Untuk Rekap, laporannya "sudah membaik, kalau bisa dioptimalkan lagi" — sudah ditelusuri opsi lanjutan yang paling masuk akal, tapi hasilnya justru terbukti tidak valid secara spesifikasi untuk elemen tabel, jadi tidak ada perubahan baru di Rekap pada update ini (penjelasan lengkap di bawah, bukan sekadar dilewati).

## Entry: root cause sesungguhnya dari dropdown BULAN yang tidak ikut berubah

Fix v11.5.8 (`key` pada `<select>`) terbukti **tidak cukup** — dikonfirmasi lewat 6 screenshot berurutan, dropdown BULAN tetap diam di "Jul" meski toggle atas berpindah Agu→Jun→Jul→Mei→Jul→Jan. Setelah ditelusuri ulang dari awal, ditemukan dua masalah yang sebelumnya salah didiagnosis:

**Masalah 1 (akar sesungguhnya):** kartu member yang sekali dibuka akan **mengunci permanen** bulan/tahunnya di penyimpanan internal — bahkan setelah kartu **ditutup**. Efeknya: kartu ABIL yang pertama kali dibuka saat toggle di bulan Juli akan **selalu** kembali ke Juli setiap dibuka lagi, berapa kalipun toggle di atas diganti, sampai override manual dilakukan lewat dropdown itu sendiri. Mekanisme "sekali dibuka terkunci" ini sebenarnya sengaja dibuat sebelumnya (supaya kartu yang sedang diisi tidak tiba-tiba geser bulan kalau toggle diubah di tengah proses) — tapi ternyata berlaku terlalu luas: seharusnya hanya berlaku **selama kartu masih terbuka**, bukan selamanya.

**Perbaikan:** saat kartu ditutup, penguncian bulan/tahunnya otomatis dilepas — **kecuali** kalau di dalam sesi kartu itu user memang sengaja mengubah dropdown BULAN secara manual (untuk kasus "sesekali expand 1 kartu untuk cek/koreksi cepat" dengan bulan yang berbeda dari toggle, sesuai cara pakai yang disampaikan) — itu tetap dilindungi dan tidak ikut terhapus. Jadi: kartu yang hanya dibuka lewat navigasi biasa akan selalu mengikuti toggle terkini setiap dibuka ulang; kartu yang bulannya sengaja diubah manual tetap mengingat pilihan itu sampai user sendiri yang mengubahnya lagi.

**Masalah 2 (kontributor tambahan, kemungkinan besar yang paling terasa):** field **NOMINAL** — bagian paling sering diperhatikan — ternyata dari awal memang tidak didesain untuk ikut ter-refresh sama sekali saat bulan/tahun kartu berubah dari luar. Field ini sengaja dibuat begitu untuk alasan lain (supaya tidak mengganggu saat sedang mengetik angka), tapi efek sampingnya: field itu selalu menampilkan nilai dari bulan pertama kali kartu dibuka, tidak peduli toggle sudah berubah berapa kali. Field TGL BAYAR punya pola yang sama persis. Keduanya sekarang ikut ter-refresh dengan benar saat bulan/tahun kartu berubah, tanpa mengorbankan kenyamanan mengetik yang jadi alasan desain awalnya.

## Rekap: ditelusuri opsi optimasi lanjutan, hasilnya tidak diterapkan (dengan alasan)

Dua arah lanjutan dipertimbangkan setelah fix v11.5.8:

1. **Mengurangi animasi transisi warna per sel.** Sel tabel biasa punya transisi halus untuk efek hover dan highlight pembayaran baru. Secara teori mengurangi ini bisa meringankan beban render untuk ribuan sel sekaligus — tapi transisi ini perlu tetap ada di kondisi dasar sel agar animasinya terasa mulus di kedua arah (masuk maupun keluar highlight); memindahkannya akan membuat animasi terasa patah sebelah arah. Trade-off ini dianggap tidak sepadan untuk manfaat yang belum tentu terukur signifikan.

2. **Menunda render sel yang sedang di luar layar (opsi CSS modern yang lebih agresif dari yang sudah diterapkan).** Sempat terlihat menjanjikan, tapi setelah ditelusuri ke spesifikasi resminya, cara kerja opsi ini **secara eksplisit dikecualikan** oleh standar CSS untuk elemen sel tabel — artinya penerapannya kemungkinan besar tidak akan berfungsi sebagaimana mestinya, atau berperilaku tidak terduga. Opsi yang sudah diterapkan di v11.5.8 (yang sudah terasa membantu) tetap yang paling tepat untuk elemen sel tabel menurut spesifikasi yang sama.

**Kesimpulan jujur:** tidak ada langkah CSS tambahan yang bisa dipastikan aman dan berdampak nyata untuk dicoba saat ini tanpa risiko sia-sia atau efek samping. Kalau blank sesaat saat scroll masih terasa mengganggu meski sudah jauh berkurang, opsi yang tersisa adalah perubahan arsitektur lebih besar (render hanya baris yang benar-benar terlihat, bukan seluruhnya sekaligus) — ini di luar scope perbaikan kecil dan perlu didiskusikan terpisah kalau memang diperlukan.

## File yang berubah (v11.5.9)

| File | Perubahan |
|------|-----------|
| `components/features/members/MemberCard.tsx` | Penguncian bulan/tahun kartu dilepas saat kartu ditutup (kecuali ada override manual); field NOMINAL & TGL BAYAR diberi `key` agar ikut ter-refresh saat bulan/tahun kartu berubah dari luar |
| `store/slices/viewSlice.ts` | Fungsi baru `clearEntryCardFor(name)` — melepas penguncian satu member saja tanpa mempengaruhi member lain |
| `store/__tests__/viewSlice.test.ts` | 4 unit test baru untuk `clearEntryCardFor`, termasuk reproduksi persis siklus tutup-buka-ganti toggle-buka lagi yang dilaporkan |
| `lib/constants.ts` | Versi → v11.5.9 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **177/177 unit test lulus** (173 sebelumnya + 4 test baru).

---

> Dua temuan kecil dari pengujian langsung setelah v11.5.7: dropdown BULAN di kartu Entry yang sedang terbuka tidak ikut ter-refresh visualnya saat toggle period diubah dari luar (meski nilai di baliknya sudah benar — dibuktikan lewat screenshot berurutan yang menunjukkan nominal ikut berubah tapi dropdown-nya diam), dan sisa "blank sesaat lalu cepat pulih" di baris data Rekap saat scroll sangat cepat — kali ini dilaporkan spesifik terbatas di baris body biasa, bukan lagi kolom sticky kiri (yang sudah tuntas di v11.5.7) dan bukan di header (yang memang sudah baik).

## Entry: dropdown BULAN di kartu tidak ter-refresh visualnya

Dikonfirmasi lewat 3 screenshot berurutan: toggle period atas berpindah Jun→Jul→Jan 2026, dan setiap kali nominal di kartu ikut berubah dengan benar (badge status, angka pembayaran) — tapi field dropdown **BULAN** di dalam kartu yang sama tetap menampilkan "Jun" di ketiganya. Karena nominal (teks murni) dan dropdown sama-sama membaca nilai `cardYear`/`cardMonth` yang identik di render yang sama, ini membuktikan nilainya sendiri sudah benar — murni soal lapisan visual `<select>` yang tidak ikut refresh.

**Root cause:** React 19 punya edge case yang sudah dilaporkan (termasuk bug report terbuka untuk Radix UI khusus React 19) di mana elemen `<select>` controlled yang `value`-nya berubah dari **sumber luar** — bukan dari interaksi langsung user dengan dropdown itu sendiri, di sini dipicu oleh toggle period di komponen lain — tidak selalu memicu repaint visual, meski `value` yang dikirim React ke DOM sudah benar.

**Fix:** dropdown tahun diberi `key={cardYear}`, dropdown bulan diberi `key={`${cardYear}-${cardMonth}`}` (digabung, supaya tetap ter-remount baik saat tahun maupun bulan yang berubah). Memberi `key` memaksa React membuat node `<select>` yang benar-benar baru saat nilainya berubah dari luar, alih-alih mengandalkan update-in-place yang ternyata tidak reliable untuk kasus ini di React 19.

## Rekap: sisa blank sesaat di baris data saat scroll sangat cepat

Berbeda dari bug v11.5.7 (kolom sticky kiri macet sampai ada scroll tambahan) — laporan kali ini spesifik: header kolom selalu baik, tapi **baris data di bawahnya** (nomor, nama, nominal per bulan) sempat blank sesaat lalu pulih cepat sendiri saat scroll sangat cepat.

**Root cause:** tabel Rekap merender **seluruh** member yang lolos filter sekaligus tanpa virtualisasi/windowing — untuk zona dengan >100 member × 12 kolom bulan, ini lebih dari 1.300 elemen sel dalam satu waktu. Header tidak terpengaruh karena sticky dan statis (tidak pernah perlu di-render ulang selama scroll, karena posisinya tidak pernah berubah relatif terhadap viewport) — sedangkan baris data benar-benar bergerak melewati viewport saat scroll, dan pada fling-scroll cepat, browser bisa tertinggal me-render ulang (rasterize) sel yang baru masuk area terlihat, menampilkan blank sesaat sampai catch up.

**Fix:** `contain: style` → `contain: content` pada sel tabel biasa (non-sticky) — memberi izin eksplisit ke browser untuk mengoptimalkan proses render sel yang sedang di luar area terlihat, mengurangi beban rasterisasi mendadak saat scroll cepat. Menurut spesifikasi resmi, jenis optimisasi ini hanya berlaku pada sel tabel itu sendiri (bukan baris) — jadi diterapkan tepat di elemen yang seharusnya. Kolom sticky kiri tidak tersentuh sama sekali karena punya pengaturan sendiri yang lebih spesifik dan selalu diprioritaskan.

**Catatan jujur:** ini mitigasi yang mengurangi frekuensi dan durasi kemunculannya, bukan penghapusan total — akar masalah paling dalam (jumlah baris yang sangat banyak dirender sekaligus) butuh perubahan arsitektur lebih besar (virtual scrolling: hanya me-render baris yang benar-benar terlihat) yang tidak dikerjakan di update ini karena scope-nya jauh lebih besar dan berisiko. Kalau setelah update ini masih terasa mengganggu, itu sinyal untuk mempertimbangkan perubahan tersebut secara terpisah.

## File yang berubah (v11.5.8)

| File | Perubahan |
|------|-----------|
| `components/features/members/MemberCard.tsx` | Dropdown BULAN (tahun & bulan) diberi `key` agar ter-refresh visual saat toggle period berubah dari luar |
| `styles/components.entry.css` | `.rtable td` (sel biasa, bukan sticky): `contain: style` → `contain: content` — mitigasi blank sesaat saat scroll cepat |
| `lib/constants.ts` | Versi → v11.5.8 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **173/173 unit test lulus** (tidak ada penambahan test baru — kedua fix ini murni CSS/rendering behavior yang tidak bisa diverifikasi bermakna lewat unit test di lingkungan tanpa browser sungguhan; validasi utamanya adalah pengujian langsung oleh Hakiki di device).

---

> Empat laporan bug ditangani sekaligus: render Rekap yang blank/glitch acak saat scroll, toggle bulan di Entry yang tidak sinkron dengan kartu member, delay saat menyimpan nominal, dan (ditemukan saat investigasi delay, bukan dilaporkan) bug data-loss nyata pada mekanisme rollback yang dipakai di 9 file berbeda. Root cause Rekap khususnya penting: fix lama di v7.1 mendiagnosis arah yang salah (dianggap soal GPU compositor layer) — bug tetap ada setelahnya, hanya lebih jarang muncul. Root cause sesungguhnya baru ditemukan sesi ini.

## Rekap: Blank/glitch render acak saat scroll

**Kenapa fix v7.1 tidak menuntaskan masalah.** v7.1 menyimpulkan penyebabnya "terlalu banyak GPU compositor layer" dan menghapus semua `transform`/`will-change`/`-webkit-overflow-scrolling`, diganti `contain: style layout` + `isolation: isolate`. Itu mengurangi force-GPU-layer, tapi ternyata bukan akar masalah — bug tetap terjadi, hanya lebih jarang, persis seperti yang dilaporkan ("terjadi begitu sering dan random posisinya").

**Root cause sesungguhnya:** `.rekap-wrap { overflow-x: auto; overflow-y: visible; }`. Menurut spesifikasi CSS Overflow (computed value rule), begitu **satu** axis overflow diset ke nilai selain `visible` (di sini `overflow-x: auto`), axis lainnya yang `visible` **otomatis dikomputasi ulang oleh browser menjadi `auto` juga** — bukan tetap `visible` seperti yang ditulis. Jadi `.rekap-wrap` diam-diam menjadi scroll container untuk **kedua** axis, meski scrollbar vertikal tidak pernah terlihat (tinggi tabel selalu pas dengan kontennya, jadi terlihat baik-baik saja).

Akibatnya: kolom sticky kiri (`td.stk`, `position: sticky; left: 0`) berada di dalam nested scroll container (vertikal ganda: `#content` **dan** `.rekap-wrap`). Sinkronisasi horizontal antara header dan body tabel dilakukan manual lewat JavaScript, bukan native browser — sehingga saat scroll vertikal cepat di `#content`, Chromium kadang tidak mentrigger repaint compositor layer untuk kolom sticky itu, sampai ada event scroll lain (geser horizontal, atau scroll balik arah) yang memaksa recompute. Ini menjelaskan tepat apa yang dilaporkan: "kadang harus scroll keatas atau kebawah dulu agar tampilan bisa terender dengan benar", dan posisinya random karena tergantung baris mana yang sedang di-render ulang browser saat momen itu terjadi.

**Perbaikan:** `overflow-y: clip` (bukan `visible`). Beda dari `visible`, nilai `clip` tidak pernah mengalami override otomatis di atas — ia eksplisit tidak pernah membuat scrollport, sehingga `.rekap-wrap` benar-benar murni scroll container satu axis (horizontal saja), sesuai niat aslinya. Didukung penuh di Chrome for Android. Sebagai langkah kehati-hatian tambahan, `contain: style layout` di kolom sticky juga dikurangi jadi `contain: style` saja (mengurangi containment yang tidak perlu pada elemen `position: sticky`).

Saat investigasi bug ini juga ditemukan anti-pattern React kecil yang jadi kontributor tambahan: kolom yang baru saja dibayar sempat memakai `key` yang berubah-ubah pada elemen `<td>` untuk memicu ulang animasi "flash hijau" — ini memaksa React membongkar-pasang ulang seluruh sel (termasuk semua tombol/klik di dalamnya) setiap kali animasi itu terpicu. Sudah dipindah ke elemen overlay terpisah supaya animasi tetap jalan tanpa mengganggu sel aslinya.

## Rekap: teks kurang jelas (nomor urut, header kolom, label total) + posisi ikon gratis

Diperiksa dengan pengukuran kontras warna resmi (WCAG): kolom nomor urut (`#`) memakai warna dengan kontras hanya **1,55:1** terhadap latar belakang — jauh di bawah standar minimum keterbacaan (4,5:1). Header kolom bulan dan label "TOTAL" di baris bawah juga di bawah standar (2,45:1). Ketiganya dinaikkan ke warna dengan kontras 8–10:1 (lolos standar di ketiga tema — gelap, terang, emas), tanpa mengubah hierarki visual (nomor & header tetap terlihat lebih redup dibanding nama & angka utama, cuma tidak sampai nyaris tak terbaca).

Ikon "gratis" (hadiah) yang sebelumnya rata kiri sekarang eksplisit dibuat rata kanan, konsisten dengan posisi nominal pembayaran di kolom yang sama setiap bulannya.

## Entry: toggle bulan di atas tidak sinkron dengan bulan di kartu member

**Penyebab:** kartu member yang belum pernah dibuka sebelumnya selalu memakai bulan **kalender hari ini yang sesungguhnya** sebagai default — bukan bulan yang dipilih di toggle atas. Jadi toggle ke April, lalu buka kartu member baru, kartu itu menampilkan bulan sistem saat ini (dalam kasus yang dilaporkan: Juli), mengabaikan toggle April sepenuhnya. Ini sisa dari perbaikan lama yang punya niat baik (mencegah kartu yang sedang terbuka ikut bergeser mendadak kalau toggle diubah di tengah proses isi form) tapi salah pilih sumber nilai default-nya.

**Perbaikan:** default sekarang mengikuti toggle bulan Entry yang aktif. Mekanisme "sekali dibuka, terkunci ke bulan saat itu" tetap dipertahankan penuh — kartu yang sudah pernah dibuka tidak ikut bergeser kalau toggle diubah setelahnya (supaya tidak mengganggu yang sedang diisi), dan kalau ada kartu member lain yang bulannya sudah diubah manual lewat dropdown di dalam kartu itu sendiri, itu juga tidak tersentuh oleh perubahan ini.

## Data hilang diam-diam saat gagal simpan (bug tersembunyi, ditemukan saat investigasi delay)

Ini bug yang tidak dilaporkan tapi ditemukan saat menelusuri penyebab delay — dan berpotensi lebih serius dari semua bug lain di update ini karena bisa membuat **data pembayaran yang sudah berhasil tersimpan ikut terhapus tanpa peringatan**.

**Bagaimana bug ini bisa terjadi:** di 9 tempat berbeda di app ini, pola penyimpanan selalu: simpan perubahan ke tampilan dulu (supaya terasa instan), baru kirim ke server di belakang layar. Kalau pengiriman ke server gagal (misalnya koneksi terputus sebentar), tampilan dikembalikan ke kondisi "sebelum" — tapi caranya adalah mengganti **seluruh** data ke sebuah salinan lama, bukan cuma membatalkan bagian yang gagal saja. Kalau di rentang waktu itu (pengiriman yang gagal bisa memakan beberapa detik, dan tombol "Batalkan" pada notifikasi bertahan 4 detik) ada **pembayaran member lain** yang berhasil tersimpan, penggantian ke salinan lama itu ikut menghapus pembayaran member lain itu juga — padahal sudah berhasil tersimpan sendiri.

**Perbaikan:** mekanisme pembatalan sekarang selalu membaca kondisi data yang paling terkini dulu, baru membatalkan **secara spesifik** hanya bagian yang benar-benar gagal — pembayaran member lain yang kebetulan berhasil di rentang waktu yang sama tidak lagi ikut terhapus. Diterapkan konsisten di kesepuluh tempat yang tadinya rentan, dengan pengujian otomatis yang juga divalidasi langsung terhadap salinan data asli dari Firebase Hakiki (5.815 entri pembayaran) untuk memastikan tidak ada satupun entri yang tertukar atau hilang.

## Delay saat mengetik/menyimpan nominal

**Penyebab yang terukur, bukan cuma terasa lambat:** setiap kali menyimpan satu angka pembayaran, aplikasi mengirim **seluruh** data ke server — termasuk daftar semua member di kedua zona, info IP/tarif tiap member, riwayat aktivitas, dan sebagainya — padahal yang benar-benar berubah cuma satu angka. Diukur langsung dari salinan data Firebase milik Hakiki: ukuran pengiriman penuh mencapai **201 KB**, di mana riwayat pembayaran itu sendiri menyumbang **77% dari total** (5.815 entri, riwayat sejak 2023). Di koneksi yang sedang lambat (terlihat dari kecepatan upload di layar saat laporan ini dibuat), pengiriman sebesar itu untuk perubahan satu angka menjelaskan jeda yang dirasakan sebelum notifikasi hasil muncul.

**Perbaikan:** jalur penyimpanan untuk pembayaran murni (isi nominal di Entry, isi/hapus nominal di Rekap) sekarang hanya mengirim satu entri pembayaran yang berubah beserta catatan aktivitasnya — bukan seluruh data. Diukur pada salinan data Firebase yang sama: ukuran pengiriman turun dari 186 KB menjadi **25 KB**, penghematan 87%. Bagian app yang menyentuh data lebih kompleks (tambah/ubah/hapus member, pengaturan zona, dll) tidak diubah — itu memang perlu mengirim data lebih lengkap.

## File yang berubah (v11.5.7)

| File | Perubahan |
|------|-----------|
| `styles/components.entry.css` | `.rekap-wrap`: `overflow-y: visible` → `clip` (root cause blank-render); `td.stk`: `contain: style layout` → `contain: style`; kontras header kolom `--txt4` → `--txt2` |
| `components/features/rekap/RekapView.tsx` | Kontras nomor urut & label total → `--txt2`; ikon gratis rata kanan eksplisit; `key` `<td>` distabilkan, animasi flash dipindah ke overlay terpisah; rollback via `selectiveRollback` |
| `components/features/members/MemberCard.tsx` | `resolveEntryCardPeriod()` untuk fix sinkronisasi toggle↔kartu; `persistPaymentOnly()` (penyimpanan granular) untuk `saveEntryPay`/`clearPay`; rollback via `selectiveRollback`; fix closure pada toast "Batalkan" |
| `components/features/rekap/RekapModal.tsx` | `persistPaymentOnly()` untuk `manualPay`/`clearPay`; rollback via `selectiveRollback`; fix closure pada toast "Batalkan" |
| `components/features/entry/EntryView.tsx` | Rollback batch pay via `selectiveRollback` |
| `components/layout/Header.tsx` | Rollback toggle kunci via `selectiveRollback` |
| `components/features/members/MembersView.tsx` | Rollback tambah/edit/hapus/pulihkan member via `selectiveRollback` |
| `components/features/operasional/OperasionalView.tsx` | Rollback data operasional via `selectiveRollback` |
| `components/modals/FreeMemberModal.tsx` | Rollback status member gratis via `selectiveRollback` |
| `components/features/settings/SettingsIPSection.tsx` | Rollback perubahan IP via `selectiveRollback` |
| `components/features/settings/SettingsZoneSection.tsx` | Rollback pengaturan zona via `selectiveRollback` |
| `lib/rollback.ts` *(baru)* | `selectiveRollback()` — rollback per-entri yang aman terhadap perubahan bersamaan, dipakai di 10 file di atas |
| `lib/db.ts` | `persistPaymentGranular()` & `buildGranularPaymentPatch()` *(baru)* — penyimpanan pembayaran hemat-bandwidth |
| `lib/payment.ts` | `resolveEntryCardPeriod()` *(baru)* — logic murni sinkronisasi toggle↔kartu, diekstrak agar bisa diuji |
| `lib/helpers.ts` | Ekspor `resolveEntryCardPeriod` |
| `lib/__tests__/rollback.test.ts` *(baru)* | 9 unit test untuk `selectiveRollback`, termasuk skenario data bersamaan yang jadi motivasi utama fix |
| `lib/__tests__/db.test.ts` *(baru)* | 13 unit test untuk `buildGranularPaymentPatch`, termasuk pola nama member dari data produksi nyata |
| `lib/__tests__/helpers.test.ts` | 7 unit test baru untuk `resolveEntryCardPeriod` |
| `lib/constants.ts` | Versi → v11.5.7 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning di seluruh project · **173/173 unit test lulus** (144 sebelumnya + 29 test baru). Rollback dan penyimpanan granular juga divalidasi terpisah terhadap salinan data Firebase asli Hakiki (bukan cuma data uji buatan) untuk memastikan hasilnya benar pada skala data sesungguhnya — file salinan data itu sendiri tidak disertakan dalam kode karena berisi data pribadi.

---

# WiFi Pay Next — Update v11.5.6

> **ROOT CAUSE SEBENARNYA — sudah dikonfirmasi langsung oleh Hakiki: edit "HAJI ZAINI" → "H-ZAINI" (pakai strip, bukan titik) BERHASIL tersimpan.** Bug "edit member selalu gagal" dari v11.5.3–v11.5.5 ternyata bukan soal race condition atau koneksi sama sekali — **Firebase Realtime Database menolak SELURUH operasi simpan jika ada satu saja nama field objek yang mengandung karakter `.` `#` `$` `[` `]` `/`**. Nama "H.ZAINI" mengandung titik, dipakai sebagai bagian nama field di `memberInfo`, sehingga Firebase menolak total. Root cause v11.5.3–v11.5.5 (toast tidak sinkron dengan status simpan, race condition double-tap, state tidak rollback saat gagal) **tetap valid dan tetap berguna** — tapi semuanya cuma menangani *akibat*, bukan penyebab aslinya. v11.5.6 menutup penyebab aslinya.

## v11.5.6 — Root Cause Fix: Validasi Karakter Terlarang Firebase di Nama Member

**Apa yang sebenarnya terjadi:** Firebase Realtime Database punya aturan ketat — nama field di dalam objek (disebut "key") **tidak boleh** mengandung karakter `.` `#` `$` `[` `]` `/`. Ini bukan soal isi/value field (jadi nomor IP `10.90.200.8` aman-aman saja sebagai *value*), tapi soal nama field-nya sendiri.

Di app ini, nama member dipakai langsung sebagai bagian nama field saat menyimpan info tambahan (ID, IP, tarif, catatan), status free member, dan riwayat member yang dihapus — formatnya `ZONA__NAMA` (mis. `"KRS__HAJI ZAINI"`). Ketika Hakiki mengganti nama "HAJI ZAINI" jadi "H.ZAINI", sistem mencoba membuat field bernama `"KRS__H.ZAINI"` — **field dengan titik di dalamnya**. Firebase RTDB menolak ini, dan karena cara app menyimpan data (kirim semua data sekaligus dalam satu operasi, bukan per-bagian), **penolakan pada satu field ini membuat SELURUH proses penyimpanan gagal** — bukan cuma field itu saja yang gagal, tapi semuanya, termasuk data lain yang sebenarnya valid.

Ini menjelaskan dengan tepat semua yang dilaporkan Hakiki: member baru "A" → "ASU" berhasil (nama "ASU" tidak ada karakter bermasalah), pembayaran di Entry & Rekap semua berhasil (nama-nama member yang dibayar tidak ada yang mengandung titik), tapi "HAJI ZAINI" → "H.ZAINI" gagal terus — dan setelah gagal, percobaan ulang malah memunculkan "Member tidak ditemukan" (ini bagian dari bug terpisah yang sudah diperbaiki di v11.5.5: tampilan sudah terlanjur berubah duluan sebelum tahu hasil sebenarnya).

**Perbaikan:** menambahkan validasi nama member di form Tambah Member dan Edit Member — kalau nama mengandung karakter `.` `#` `$` `[` `]` `/`, sistem langsung menolak dengan pesan jelas ("Nama tidak boleh mengandung karakter . # $ [ ] /") **sebelum** sempat dicoba disimpan ke server. Ini mencegah masalah dari sumbernya, bukan menambal satu-satu di puluhan tempat berbeda di app yang membentuk nama field serupa (ditemukan ada di hampir setiap menu — Entry, Rekap, Member, Tunggakan, Settings).

**Workaround untuk nama yang sudah terlanjur ingin dipakai:** ganti karakter bermasalah dengan yang aman — titik (`.`) bisa diganti tanda hubung (`-`) atau spasi. Contoh: "H.ZAINI" → "H-ZAINI" (sudah dikonfirmasi berhasil) atau "H ZAINI".

**Audit data:** seluruh 162 nama member yang sudah tersimpan di database Hakiki (104 KRS + 58 SLK) sudah diperiksa — **tidak ada satu pun** yang mengandung karakter bermasalah ini, jadi tidak perlu migrasi atau perbaikan data apa pun. Masalah ini murni soal mencegah kejadian serupa terulang di masa depan.

**File yang berubah (v11.5.6):**

| File | Perubahan |
|------|-----------|
| `lib/firebase-key.ts` | Fungsi baru `hasInvalidFirebaseKeyChars()` — validator karakter terlarang Firebase |
| `components/features/members/MembersView.tsx` | Validasi dipanggil di `addMember()` dan `saveEdit()` sebelum proses simpan |
| `lib/locales/id.ts`, `en.ts` | Key baru: `members.nameInvalidChar` |
| `lib/__tests__/helpers.test.ts` | 9 unit test baru untuk `hasInvalidFirebaseKeyChars()` — regression test permanen untuk bug ini |
| `lib/constants.ts` | Versi → v11.5.6 |

**Hasil validasi:** `tsc --noEmit` bersih · `eslint` 0 error/warning · **144/144 unit test lulus** (135 sebelumnya + 9 test baru khusus untuk bug ini, memastikan tidak regresi di masa depan).

---

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

**Dengan sengaja TIDAK dilakukan:** GPU layer promotion (`transform: translateZ`/`will-change`) — histori proyek mencatat eksplisit bahwa pendekatan ini pernah jadi PENYEBAB bug lain (blank hitam saat scroll), bukan solusi (lihat juga bagian root cause blank/glitch render di update v11.5.7 di atas). Pendekatan itu dihindari sepenuhnya di update ini.

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

*WiFi Pay Next v11.5.19 · [@13angganh](https://github.com/13angganh)*

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
