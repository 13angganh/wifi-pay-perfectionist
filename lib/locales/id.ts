// lib/locales/id.ts — Bahasa Indonesia (default)
const id: Record<string, string> = {
  // Nav
  'nav.dashboard'    : 'Dashboard',
  'nav.entry'        : 'Entry',
  'nav.rekap'        : 'Rekap',
  'nav.tunggakan'    : 'Tunggakan',
  'nav.grafik'       : 'Grafik',
  'nav.log'          : 'Log',
  'nav.members'      : 'Member',
  'nav.operasional'  : 'Operasional',
  'nav.settings'     : 'Pengaturan',

  // Status
  'status.lunas'     : 'Lunas',
  'status.belum'     : 'Belum',
  'status.free'      : 'Gratis',

  // Actions
  'action.save'      : 'Simpan',
  'action.cancel'    : 'Batal',
  'action.delete'    : 'Hapus',
  'action.confirm'   : 'Konfirmasi',
  'action.edit'      : 'Edit',
  'action.add'       : 'Tambah',
  'action.close'     : 'Tutup',
  'action.back'      : 'Kembali',
  'action.search'    : 'Cari',
  'action.export'    : 'Export',
  'action.share'     : 'Bagikan',
  'action.logout'    : 'Keluar',
  'action.changeAccount' : 'Ganti Akun',

  // Common
  'common.loading'   : 'Memuat...',
  'common.saving'    : 'Menyimpan...',
  'common.saved'     : 'Tersimpan',
  'common.error'     : 'Gagal',
  'common.saveFailed': 'Gagal tersimpan ke server, periksa koneksi',
  'common.offline'   : 'Offline',
  'header.lock'      : 'KUNCI',
  'header.unlock'    : 'BUKA',
  // v11.5: label spesifik untuk toggle kunci di menu Member — dibedakan dari header.lock/unlock
  // (yang mengontrol kunci ENTRY PEMBAYARAN global) agar tidak membingungkan, karena toggle
  // ini di Members mengontrol izin EDIT/HAPUS/TAMBAH MEMBER, bukan entry pembayaran.
  'members.lock'     : 'KUNCI MEMBER',
  'members.unlock'   : 'BUKA MEMBER',
  'common.noData'    : 'Tidak ada data',
  'common.noResult'  : 'Tidak ada hasil',
  'common.active'    : 'Aktif',
  'common.inactive'  : 'Nonaktif',
  'common.cancel'    : 'Batal',
  'common.total'     : 'Total',
  'common.month'     : 'Bulan',
  'common.year'      : 'Tahun',
  'common.zone'      : 'Zona',
  'common.name'      : 'Nama',
  'common.amount'    : 'Nominal',
  'common.date'      : 'Tanggal',
  'common.all'       : 'Semua',

  // Dashboard
  'dashboard.title'          : 'Dashboard',
  'dashboard.income'         : 'Total Pendapatan',
  'dashboard.members'        : 'Member',
  'dashboard.paid'           : 'Lunas',
  'dashboard.unpaid'         : 'Belum',
  'dashboard.operasional'    : 'Operasional',

  // Entry
  'entry.title'              : 'Entry Pembayaran',
  'entry.markPaid'           : 'Tandai Lunas',
  'entry.batchPay'           : 'Bayar Semua',
  'entry.quickPay'           : 'Quick Pay',
  'entry.confirmHighNominal' : 'Nominal lebih tinggi dari tarif, lanjutkan?',
  'entry.batchSuccess'       : 'member berhasil ditandai lunas',

  // Rekap
  'rekap.title'              : 'Rekap',
  'rekap.batchConfirm'       : 'Tandai Lunas Semua',

  // Tunggakan
  'tunggakan.title'          : 'Tunggakan',
  'tunggakan.filter.total'   : 'Total',
  'tunggakan.filter.new'     : 'Baru',
  'tunggakan.filter.soon'    : 'Segera',
  'tunggakan.filter.critical': 'Kritis',
  'tunggakan.months'         : 'bulan tunggakan',

  // Grafik
  'grafik.title'             : 'Grafik',

  // Log
  'log.title'                : 'Log Aktivitas',
  'log.empty'                : 'Belum ada aktivitas',

  // Members
  'members.title'            : 'Daftar Member',
  'members.add'              : 'Tambah Member',
  'members.empty'            : 'Belum ada member',
  'members.delete'           : 'Hapus Member',
  'members.restore'          : 'Pulihkan',

  // Operasional
  'ops.title'                : 'Operasional',
  'ops.income'               : 'Pendapatan',
  'ops.expense'              : 'Pengeluaran',
  'ops.net'                  : 'Net',

  // Settings
  'settings.title'           : 'Pengaturan',
  'settings.pin'             : 'Keamanan PIN',
  'settings.zones'           : 'Manajemen Zona',
  'settings.language'        : 'Bahasa',
  'settings.theme'           : 'Tema Tampilan',
  'settings.theme.light'     : 'Terang',
  'settings.theme.dark'      : 'Gelap',
  'settings.theme.gold'      : 'Emas',
  'settings.theme.lightDesc' : 'Tampilan terang, cocok untuk siang hari',
  'settings.theme.darkDesc'  : 'Tampilan gelap, nyaman untuk mata',
  'settings.theme.goldDesc'  : 'Tampilan elegan dengan aksen emas premium',
  'settings.export'          : 'Export & Import Data',
  'settings.autoDate'        : 'Tanggal Otomatis',
  'settings.quickPay'        : 'Quick Pay Amount',
  'settings.appInfo'         : 'Info Aplikasi',
  'settings.version'         : 'Versi',

  // v11.5.12: judul & badge header CollapsibleSection di SettingsView.tsx — sebelumnya
  // hardcoded, tidak pernah tersambung ke sistem terjemahan sama sekali (beda dari
  // teks sub-konten di dalamnya yang sudah lama terhubung). Nilai di sini SAMA PERSIS
  // dengan teks yang sudah tampil sekarang (bukan mengubah copy) — hanya menyambungkan
  // ke t() agar versi Inggrisnya juga benar-benar muncul.
  'settings.pinSectionTitle'       : 'PIN Keamanan',
  'settings.biometricSectionTitle' : 'Sidik Jari & Face ID',
  'settings.emailSectionTitle'     : 'Email & Reset Password',
  'settings.ipSectionTitle'        : 'Konversi IP',
  'settings.waSummaryTitle'        : 'Ringkasan WhatsApp',
  'settings.quickPaySectionTitle'  : 'Quick Pay',
  'settings.autoDateSectionTitle'  : 'Tanggal Bayar Otomatis',
  'settings.autoDateBadgeAuto'     : 'Otomatis',
  'settings.autoDateBadgeManual'   : 'Manual',
  'settings.languageBadgeEn'       : 'English',
  'settings.languageBadgeId'       : 'Indonesia',

  // Sync
  'sync.saved'               : 'Tersimpan',
  'sync.saving'              : 'Menyimpan',
  'sync.error'               : 'Gagal simpan',
  'sync.offline'             : 'Offline',

  // Onboarding
  'onboarding.step1'         : 'Mulai tambah member di menu Member',
  'onboarding.step2'         : 'Catat pembayaran di menu Entry',
  'onboarding.step3'         : 'Pantau ringkasan di Dashboard',
  'onboarding.dismiss'       : 'Mengerti',

  // Login
  'login.greeting'           : 'Selamat datang kembali',
  'login.greetingNew'        : 'Selamat datang',
  'login.email'              : 'Email',
  'login.password'           : 'Password',
  'login.submit'             : 'Masuk',
  'login.changeAccount'      : 'Ganti Akun',

  // PIN
  'pin.enter'                : 'Masukkan PIN',
  'pin.wrong'                : 'PIN salah',
  'pin.set'                  : 'Buat PIN',
  'pin.confirm'              : 'Konfirmasi PIN',
  'pin.notMatch'             : 'PIN tidak cocok',

  // Offline
  'offline.message'          : 'Tidak ada koneksi internet',

  // Errors
  'error.loadFailed'         : 'Gagal memuat data',
  'error.saveFailed'         : 'Gagal menyimpan',
  'error.deleteFailed'       : 'Gagal menghapus',
  // Dashboard tambahan
  'dashboard.thisMonth'  : 'Pendapatan Bulan Ini',
  'dashboard.net'        : 'Bersih',
  // v11.5.2: card insight kontekstual — tunggakan & rasio lunas vs bulan lalu
  'dashboard.insightTitle'      : 'Insight Bulan Ini',
  'dashboard.insightTunggakan'  : 'Tunggakan',
  'dashboard.insightLunasRatio' : 'Rasio Lunas',
  'dashboard.insightNoBaseline' : 'Tidak ada data bulan lalu',
  'dashboard.insightSame'       : 'Sama dengan bulan lalu',
  'dashboard.unpaidTitle': 'Belum Bayar',
  'dashboard.topArrears' : 'Tunggakan Terbanyak',
  'dashboard.allPaid'    : 'Semua Lunas!',
  'dashboard.lastBackup' : 'Backup Terakhir',
  'dashboard.backupNow'  : 'Backup Sekarang',
  'dashboard.waSummary'  : 'Ringkasan WA',
  'dashboard.sendWA'     : 'Kirim Ringkasan',
  'dashboard.inputPay'   : 'Input Bayar',
  'dashboard.periodNote' : 'Periode sesuai selector di atas',

  // Common tambahan
  'common.members'    : 'pelanggan',
  'common.more'       : 'lainnya',
  'common.months'     : 'bulan',
  'common.since'      : 'sejak',
  'common.optional'   : 'Opsional',

  // Tunggakan tambahan
  'tunggakan.nakal'        : 'Nunggak',
  'tunggakan.rajin'        : 'Rajin',
  'tunggakan.sumLabel'     : 'TUNGGAKAN S/D',
  'tunggakan.sumLunas'     : 'LUNAS S/D',
  'tunggakan.sumFree'      : 'FREE MEMBER',
  'tunggakan.emptyTotal'   : 'Tidak ada tunggakan sampai bulan ini',
  'tunggakan.emptyNew'     : 'Tidak ada tunggakan 1 bulan',
  'tunggakan.emptySoon'    : 'Tidak ada tunggakan 2-3 bulan',
  'tunggakan.emptyCritical': 'Tidak ada tunggakan 4+ bulan',
  'tunggakan.paidAll'      : 'Lunas semua',
  'tunggakan.emptyRajin'   : 'Belum ada member yang lunas semua bulan',
  'tunggakan.emptyFree'    : 'Tidak ada free member aktif bulan ini',
  'tunggakan.forever'      : 'selamanya',

  // Log tambahan
  'log.payOnly'           : 'Hanya Bayar',
  'log.searchPlaceholder' : 'Cari nama / aksi...',
  'log.filterName'        : 'Filter nama member...',
  'log.allYears'          : 'Semua Tahun',
  'log.allMonths'         : 'Semua Bulan',
  'log.autoDelete'        : 'LOG · Log dihapus otomatis 30 hari',
  'log.emptyDesc'         : 'Belum ada aktivitas yang tercatat',
  'log.noResultsDesc'     : 'Coba ubah kata kunci atau filter pencarian',

  // Entry tambahan
  'entry.locked'           : 'Data terkunci! Unlock dulu',
  'entry.lockedShort'      : 'terkunci',
  'entry.noTarif'          : 'Tidak ada member dengan tarif terdaftar',
  'entry.noTarifShort'     : 'Belum ada tarif',
  'entry.selectAll'        : 'Pilih Semua',
  'entry.potentialUnpaid'  : 'Potensi Belum Masuk',
  'entry.from'             : 'dari',
  'entry.membersUnpaid'    : 'member belum bayar',
  'entry.searchPlaceholder': 'Cari nama di',
  'entry.batchSkipped'     : 'member dilewati (belum ada tarif)',

  // Rekap tambahan
  'rekap.batchCancel' : 'Batalkan Semua',

  // Members tambahan
  'members.nameRequired'   : 'Nama wajib diisi',
  'members.nameDuplicate'  : 'Nama sudah ada!',
  'members.nameInvalidChar': 'Nama tidak boleh mengandung karakter . # $ [ ] /',
  'members.notFound'       : 'Member tidak ditemukan',
  'members.added'          : 'ditambahkan!',
  'members.updated'        : 'berhasil diupdate!',
  'members.deleted'        : 'dihapus',
  'members.restored'       : 'berhasil dikembalikan!',
  'members.emptyDesc'      : 'Tambahkan member baru di atas',
  'members.recycleBinEmpty': 'Recycle Bin Kosong',
  'members.recycleBinDesc' : 'Tidak ada member yang dihapus',
  'members.saveChanges'    : 'Simpan Perubahan',
  'members.editTitle'      : 'Edit Member',
  'members.customerId'     : 'ID Pelanggan',
  'members.ipLabel'        : 'IP / Link Router',
  'members.tarifLabel'     : 'Tarif Bulanan (×1000)',
  'members.tarifShort'     : 'Tarif (×1000)',
  // v11.5.2: catatan bebas per member (textarea, ditimpa saat diedit ulang)
  'members.notesLabel'     : 'Catatan',
  'members.notesPlaceholder': 'Catatan bebas tentang member ini (opsional)...',
  'members.hasNotesHint'    : 'Member ini punya catatan',
  'members.namePlaceholder': 'Nama member',
  'members.addTitle'       : 'TAMBAH MEMBER BARU KE',
  'members.addTo'          : 'Tambah ke',

  // Ops tambahan
  'ops.expenseTitle'   : 'PENGELUARAN OPERASIONAL',
  'ops.itemPlaceholder': 'Keterangan (listrik, internet...)',
  'ops.addItem'        : '+ Tambah Item',
  'ops.incomeKRS'      : 'Pendapatan KRS',
  'ops.incomeSLK'      : 'Pendapatan SLK',
  'ops.grossIncome'    : 'Pendapatan Kotor',
  'ops.totalExpense'   : 'Total Pengeluaran',
  'ops.netIncome'      : 'PENDAPATAN BERSIH',

  // Settings tambahan
  'settings.pinEnable' : 'Aktifkan PIN',
  'settings.pinDisable': 'Nonaktifkan PIN',
  'settings.pinChange' : 'Ganti PIN',
  'settings.pinSave'   : 'Simpan & Aktifkan',
  'settings.addZone'   : 'Tambah Zona Baru',
  'settings.zonesNote' : 'Menyembunyikan zona tidak menghapus data. Zona tersembunyi tidak tampil di header.',
  'Aktif — app terkunci saat dibuka' : 'Aktif — app terkunci saat dibuka',
  'Nonaktif — app langsung terbuka' : 'Nonaktif — app langsung terbuka',

  // Action tambahan
  'action.reset'  : 'Reset',

  // Settings PIN steps
  'settings.pinStatus.active'   : 'Aktif',
  'settings.pinStatus.inactive' : 'Nonaktif',
  'settings.pin.newTitle'       : 'Buat PIN Baru',
  'settings.pin.enterNew'       : 'Masukkan 4 digit PIN',
  'settings.pin.reenterNew'     : 'Masukkan PIN yang sama lagi',
  'settings.pin.enterCurrent'   : 'Masukkan PIN saat ini untuk konfirmasi',
  'settings.pin.enterOld'       : 'Masukkan PIN lama',

  // Settings Auto-lock
  'settings.autoLock'           : 'AUTO-LOCK PIN',
  'settings.autoLockDesc'       : 'Kunci layar otomatis jika tidak ada aktivitas. Firebase tetap aktif.',
  'settings.timeout.never'      : 'Tidak pernah',
  'settings.timeout.5m'         : '5 menit',
  'settings.timeout.10m'        : '10 menit',
  'settings.timeout.30m'        : '30 menit',
  'settings.timeout.1h'         : '1 jam',

  // Settings Zona
  'settings.zona.hidden'        : 'Tersembunyi',
  'settings.zona.namePlaceholder': 'Nama zona (maks 6 huruf)',
  'settings.zona.color'         : 'Warna',

  // Settings WA
  'settings.waPeriod'           : 'PERIODE RINGKASAN',
  'settings.sendToWA'           : 'Kirim ke WhatsApp',

  // Settings Tanggal Bayar
  'settings.autoDate.descAuto'   : 'Otomatis — tanggal hari ini saat entry bayar',
  'settings.autoDate.descManual' : 'Manual — isi tanggal sendiri setiap entry',
  'settings.autoDate.auto'       : 'Otomatis',
  'settings.autoDate.manual'     : 'Manual',
  'settings.autoDate.toastAuto'  : 'Tanggal bayar: Otomatis',
  'settings.autoDate.toastManual': 'Tanggal bayar: Manual',
  'settings.autoDate.noteAuto'   : 'Saat quick pay, tanggal otomatis terisi dengan hari ini.',
  'settings.autoDate.noteManual' : 'Tanggal tidak otomatis terisi — berguna saat rekap telat.',

  // Settings Quick Pay
  'settings.quickPayDesc'  : 'Nominal quick pay untuk member tanpa tarif khusus.',
  'settings.quickPayLabel' : 'NOMINAL (×1000) — pisahkan dengan koma',
  'settings.quickPaySave'  : 'Simpan Nominal Default',
  'settings.quickPayNote'  : 'Tarif per member diatur di menu Member → Edit → Tarif.',

  // Settings Export
  'settings.export.monthly' : 'Bulanan',
  'settings.export.yearly'  : 'Tahunan',

  // Common deleted
  'common.deleted' : 'dihapus',

  // Settings PIN toast & confirm
  'settings.pin.toastEnabled'  : 'PIN berhasil diaktifkan',
  'settings.pin.toastDisabled' : 'PIN dinonaktifkan',
  'settings.pin.toastChanged'  : 'PIN berhasil diubah',
  'settings.pin.disableConfirm': 'Nonaktifkan PIN?',
  'settings.pin.disableConfirmDesc': 'App tidak akan terkunci saat dibuka',

  // Settings Quick Pay toast
  'settings.quickPay.minError' : 'Minimal 2 nominal',
  'settings.quickPay.maxError' : 'Maksimal 8 nominal',
  'settings.quickPay.saved'    : 'Nominal quick pay disimpan',

  // Settings Export toast
  'settings.export.makingPDF'    : 'Membuat PDF...',
  'settings.export.pdfDone'      : 'PDF berhasil didownload',
  'settings.export.pdfError'     : 'Gagal buat PDF',
  'settings.export.makingExcel'  : 'Membuat Excel...',
  'settings.export.excelDone'    : 'Excel berhasil didownload',
  'settings.export.excelError'   : 'Gagal buat Excel',
  'settings.export.makingFile'   : 'Membuat file...',
  'settings.export.fileDownloaded': 'File didownload (share tidak didukung)',
  'settings.export.fileError'    : 'Gagal membuat file',

  // Settings page title
  'settings.pageTitle'           : 'Pengaturan',

  // Settings JSON Backup
  'settings.jsonBackup'          : 'JSON Backup',
  'settings.jsonBackupDesc'      : 'Download langsung',
  'settings.importData'          : 'Import Data',
  'settings.importDataDesc'      : 'Dari file JSON',
  'settings.jsonBackupDone'      : 'Backup JSON didownload',

  // Settings Share
  'settings.sharePdfExcel'       : 'Share PDF / Excel',
  'settings.format'              : 'FORMAT',
  'settings.generateShare'       : 'Generate & Share',

  // Zona management toasts & confirms
  'zona.nameRequired'            : 'Nama zona wajib diisi',
  'zona.nameTooLong'             : 'Nama zona maks 6 karakter',
  'zona.duplicate'               : 'Zona sudah ada',
  'zona.added'                   : 'Zona ditambahkan',
  'zona.deleted'                 : 'Zona dihapus',
  'zona.hidden'                  : 'Zona disembunyikan',
  'zona.shown'                   : 'Zona ditampilkan kembali',
  'zona.renameNote'              : 'Ini hanya mengubah nama tampilan, tidak mengubah data Firebase.',
  'zona.renameYes'               : 'Ya, Ganti Nama',
  'zona.renamed'                 : 'diubah ke (display)',
  'zona.hideConfirmWithMembers'  : 'member. Data tetap aman.',
  'zona.hideYes'                 : 'Ya, Sembunyikan',
  'zona.showYes'                 : 'Ya, Tampilkan',
  'zona.deleteHasMembers'        : 'member akan ikut terhapus!',
  'zona.deleteYes'               : 'Ya, Hapus Zona',

  // AppShell error boundary
  'app.errorTitle'               : 'Oops, ada yang error',
  'app.errorDesc'                : 'Aplikasi mengalami error tidak terduga. Coba muat ulang halaman.',
  'app.reload'                   : 'Muat Ulang',

  // AppShell offline/update banners
  'app.offline'                  : 'Offline — data tersimpan lokal',
  'app.backOnline'               : 'Kembali online',
  'app.updateAvailable'          : 'Ada versi terbaru WiFi Pay!',
  'app.updateNow'                : 'Update Sekarang',
  'pwa.installTitle'             : 'Pasang WiFi Pay',
  'pwa.installDesc'              : 'Tambahkan ke layar beranda untuk akses cepat',
  'pwa.installBtn'               : 'Pasang',

  // Header entry lock
  'header.entryLocked'           : 'Entry dikunci',
  'header.entryUnlocked'         : 'Entry dibuka',
  // v11.5: toast spesifik untuk toggle kunci di menu Member
  'members.locked'               : 'Daftar member dikunci',
  'members.unlocked'             : 'Daftar member dibuka',
  // v11.5.1: key untuk SettingsIPSection — sebelumnya TIDAK ADA di file ini, sehingga
  // t() mengembalikan raw key string (mis. "settings.ip.zoneLabel") karena fallback "||"
  // di kode tidak pernah tercapai (t() tidak mengembalikan falsy untuk key yang hilang).
  'settings.ip.zoneLabel'        : 'ZONA',
  'settings.ip.findLabel'        : 'CARI (bagian IP/teks yang ingin diganti)',
  'settings.ip.replaceLabel'     : 'GANTI DENGAN',
  'settings.ip.findRequired'     : 'Isi nilai yang dicari',
  'settings.ip.noneFound'        : 'Tidak ada IP yang cocok di zona',
  'settings.ip.noMatch'          : 'Tidak ada IP yang cocok di zona',
  'settings.ip.willBeChanged'    : 'member akan diubah di zona',
  'settings.ip.converted'        : 'berhasil dikonversi',
  'settings.ip.convertButton'    : 'Konversi IP',
  'settings.ip.convertYes'       : 'Konversi',
  'settings.ip.confirmPrefix'    : 'Konversi semua IP zona',
  'settings.ip.confirmFrom'      : 'dari',
  'settings.ip.confirmTo'        : 'ke',
  'settings.ip.confirmNote'      : 'Hanya member di zona terpilih yang IP-nya mengandung nilai ini akan diubah.',
  'settings.ip.note'             : 'Konversi mencari dan mengganti teks pada field IP/Link Router setiap member di zona terpilih. Bisa untuk oktet manapun atau bagian teks lain — tidak terbatas pada satu pola tertentu.',
  // v11.5.1: hint tarif default di Tunggakan — teks polos (BUKAN membercard.setTarifHint
  // yang mengandung HTML inline untuk dangerouslySetInnerHTML, tidak cocok dirender sebagai teks biasa)
  'tunggakan.tarifDefaultHint'   : 'Tarif belum diset, pakai default',
  // v11.5.1: ditemukan saat audit menyeluruh — key PIN ini sudah dipakai sejak lama
  // (SettingsPinSection.Setup.tsx & .Change.tsx) tapi TIDAK PERNAH terdaftar di locale,
  // menyebabkan label/error PIN tampil sebagai raw key string. Bug pre-existing, bukan
  // diperkenalkan sesi ini — diperbaiki sekaligus karena pola persis sama dengan bug #3.
  'settings.pin.new'             : 'PIN BARU (6 DIGIT)',
  'settings.pin.confirm'         : 'KONFIRMASI PIN',
  'settings.pin.current'         : 'PIN SAAT INI',
  'settings.pin.activate'        : 'Aktifkan PIN',
  'settings.pin.change'          : 'Ganti PIN',
  'settings.pin.deactivate'      : 'Nonaktifkan PIN',
  'settings.pin.invalid'         : 'PIN harus 6 digit angka',
  'settings.pin.mismatch'        : 'Konfirmasi PIN tidak cocok',
  'settings.pin.wrongCurrent'    : 'PIN saat ini salah',
  // v11.5.1: key lain yang juga ditemukan hilang saat audit
  'common.searchMember'          : 'Cari nama member...',
  'freemodal.existing'           : 'Member Free Saat Ini',
  'settings.zones.placeholder'   : 'Nama zona baru (mis. PRM)',

  // RekapView
  'rekap.dateLocked'             : 'Data terkunci!',
  'rekap.accumulation'           : 'Akumulasi',
  'rekap.freeMember'             : 'Member Gratis periode ini',
  'rekap.dataLocked'             : 'Data terkunci',
  'rekap.allLocked'              : 'Semua member terkunci',
  'rekap.batchSuccess'           : 'member berhasil ditandai lunas',
  'rekap.scrollHint'             : '← geser kanan untuk lihat semua bulan →',
  'rekap.deletePayment'          : 'Hapus pembayaran',
  'rekap.batchSelected'          : 'Member Dipilih',

  'common.search' : 'Cari',


  // ─── Added keys ───
  'lockbanner.message': 'Entry terkunci — ketuk untuk membuka',
  'lockbanner.unlock': 'Buka',
  'membercard.payDate': 'Tgl Bayar',
  'membercard.history': 'Riwayat',
  'membercard.acm': 'Akm',
  'membercard.setTarifHint': 'Set tarif di menu <b style="color:var(--txt3)">Member → Edit</b>',
  'membercard.deleteYes': 'Ya, Hapus',
  'members.deleteNote': 'Data bayar disimpan di recycle bin',
  'members.permDelete': 'Hapus permanen',
  'members.permDeleteNote': 'Tidak bisa dikembalikan!',
  'members.permDeleteYes': 'Ya, Hapus Permanen',
  'login.continue': 'Masuk sebagai akun ini',
  'login.or': 'atau',
  'login.continuePrompt': 'Masuk untuk melanjutkan',
  'login.requiredFields': 'Semua field wajib diisi',
  'login.passwordMin': 'Password minimal 6 karakter',
  'login.passwordMin6': 'PASSWORD (min 6 karakter)',
  'login.noAccount': 'Belum punya akun?',
  'login.registerHere': 'Daftar di sini',
  'login.hasAccount': 'Sudah punya akun?',
  'login.loginHere': 'Masuk di sini',
  'login.createAccount': 'Buat Akun Baru',
  'login.namePlaceholder': 'Nama kamu',
  'login.registerSubmit': 'Daftar & Masuk',
  'login.username': 'Nama Pengguna',
  'grafik.avgMonth': 'Avg/bulan',
  'grafik.vsLastYear': 'VS Tahun Lalu',
  'grafik.monthly': 'Bulanan',
  'grafik.yearly': 'Perbandingan Tahunan',
  'grafik.composition': 'Komposisi',
  'grafik.projection': 'Proyeksi Bulan Depan',
  'grafik.basedOn': 'berdasarkan',
  'grafik.lastMonths': 'bulan terakhir',
  'grafik.twoperiod': 'Perbandingan Dua Periode',
  'grafik.period1': 'Periode 1',
  'grafik.period2': 'Periode 2',
  'grafik.diff': 'selisih periode',
  'grafik.proj': 'proj.',
  'grafik.noDataTitle': 'Belum Ada Data Grafik',
  'grafik.noDataDesc': 'Tambahkan member dan data pembayaran untuk melihat grafik statistik.',
  'rekap.batchHint': 'tap sel untuk pilih/batal',
  'rekap.searchPlaceholder': 'Cari member...',


  // ─── Session 4 keys ───
  'globalsearch.placeholder': 'Cari nama member...',
  'globalsearch.title': 'Cari Member',
  'globalsearch.hint': 'Ketik nama member untuk mencari di semua zona',
  'globalsearch.notFound': 'Tidak ada member dengan nama',
  'riwayat.monthsPaid': 'bulan lunas',
  'riwayat.noHistory': 'Belum ada riwayat pembayaran tahun',
  'riwayat.prevYear': 'Tahun sebelumnya',
  'riwayat.nextYear': 'Tahun berikutnya',
  'riwayat.statTotal': 'TOTAL',
  'riwayat.statBayar': 'BAYAR',
  'riwayat.statMulai': 'MULAI',
  'riwayat.monthAbbr': 'bln',
  'log.action.deletePay': 'Hapus bayar',
  'log.action.quickPay': 'Quick Pay',
  'log.action.pay': 'Bayar',
  'log.action.batchPay': 'Batch Pay',
  'log.action.updateDate': 'Update tanggal',
  'log.action.addMember': 'Tambah member',
  'log.action.editMember': 'Edit member',
  'log.action.deleteMember': 'Hapus member',
  'log.action.restoreMember': 'Restore member',
  'log.action.permDelete': 'Hapus permanen',
  'log.action.updateOps': 'Update operasional',
  'log.detail.deleted': 'dihapus',
  'lang': 'id',


  // ─── FreeMemberModal keys ───
  'freemodal.dateError': 'Tanggal selesai harus setelah tanggal mulai',
  'freemodal.setFree': 'dijadikan free member',
  'freemodal.removed': 'dikembalikan ke berbayar',
  'freemodal.removeConfirm': 'Kembalikan ke berbayar',
  'freemodal.removeNote': 'Status free member akan dihapus. Riwayat bayar tetap aman.',
  'freemodal.removeYes': 'Ya, Kembalikan Berbayar',
  'freemodal.startFrom': 'Mulai gratis dari',
  'freemodal.forever': 'Gratis selamanya (tanpa tanggal selesai)',
  'freemodal.until': 'Sampai dengan',
  'freemodal.save': 'Simpan Free Member',
  'freemodal.remove': 'Kembalikan Berbayar',

  // v11.5.11: AccountModal — sebelumnya belum pernah di-i18n-kan sama sekali
  'account.title': 'Akun',
  'account.close': 'Tutup',
  'account.loggedInAs': 'LOGIN SEBAGAI',
  'account.badgeEmail': '✉ EMAIL',
  'account.badgeGoogle': 'G GOOGLE',
  'account.linkGoogle': 'Hubungkan Akun Google',
  'account.linking': 'Menghubungkan...',
  'account.googleLinked': '✓ Google sudah terhubung — bisa login via Google atau Email',
  'account.switchAccount': '↔ Ganti Akun',
  'account.switchConfirmYes': 'Ganti Akun',
  'account.switchConfirmQuestion': 'Ganti akun? Kamu akan keluar dari akun ini.',
  'account.logout': 'Keluar',
  'account.googleLinkedToast': 'Google berhasil dihubungkan ✓',

  // v11.5.12: SettingsBiometricSection — sebelumnya belum pernah di-i18n-kan sama sekali
  'biometric.enablePinFirst':     'Aktifkan PIN dulu sebelum menggunakan biometrik',
  'biometric.enabled':            'Biometrik berhasil diaktifkan',
  'biometric.registerFailed':     'Gagal mendaftarkan biometrik',
  'biometric.notSupportedOrCancel': 'Biometrik tidak didukung atau dibatalkan',
  'biometric.disableConfirm':     'Nonaktifkan biometrik?',
  'biometric.disableYes':         'Nonaktifkan',
  'biometric.disabled':           'Biometrik dinonaktifkan',
  'biometric.verifySuccess':      'Verifikasi berhasil ✓',
  'biometric.verifyFailed':       'Verifikasi gagal',
  'biometric.cancelled':          'Biometrik dibatalkan',
  'biometric.title':              'Sidik Jari & Face ID',
  'biometric.subtitle':           'Buka kunci app dengan biometrik tanpa PIN',
  'biometric.checkingDevice':     'Memeriksa perangkat...',
  'biometric.notSupported':       'Perangkat ini tidak mendukung sidik jari / Face ID, atau izin belum diberikan.',
  'biometric.enablePinWarning':   '⚠️ Aktifkan PIN terlebih dahulu untuk menggunakan biometrik.',
  'biometric.enableBtn':          'Aktifkan Biometrik',
  'biometric.testBtn':            'Uji Biometrik',
  'biometric.reregisterBtn':      'Daftarkan Ulang',
  'biometric.disableBtn':         'Nonaktifkan Biometrik',
  'biometric.privacyNote':        'Data biometrik tidak dikirim ke server — verifikasi terjadi langsung di perangkat Anda via API browser standar (WebAuthn).',

  // v11.5.12: SettingsEmailSection — sebelumnya belum pernah di-i18n-kan sama sekali
  'emailSection.enterNew':        'Masukkan email baru',
  'emailSection.sameAsCurrent':   'Email sama dengan yang sekarang',
  'emailSection.invalidFormat':   'Format email tidak valid',
  'emailSection.verifySent':      'Email verifikasi terkirim — cek inbox ',
  'emailSection.title':           'Ubah Email Akun',
  'emailSection.currentLabel':    'Saat ini:',
  'emailSection.verifySentDesc':  'Email verifikasi terkirim. Cek inbox dan klik link untuk konfirmasi perubahan.',
  'emailSection.newEmailLabel':   'EMAIL BARU',
  'emailSection.firebaseNote':    'Firebase akan kirim email verifikasi ke alamat baru. Email lama tetap aktif sampai kamu klik link konfirmasi di inbox.',
  'emailSection.sending':         'Mengirim...',
  'emailSection.sendVerifyBtn':   'Kirim Email Verifikasi',
  'emailSection.forgotPassword':  'Lupa password? Kirim link reset ke email aktif.',
  'emailSection.resetSentDesc':   '✓ Link reset terkirim ke',
  'emailSection.sendResetBtn':    '🔑 Kirim Link Reset Password',

  // v11.5.12: ShareModal — sebelumnya belum pernah di-i18n-kan sama sekali
  'share.creating':          'Membuat file...',
  'share.ready':             'File siap, WhatsApp dibuka!',
  'share.failed':            'Gagal generate file',
  'share.title':             'Share Rekap',
  'share.closeAria':         'Tutup modal share',
  'share.typeLabel':         'TIPE REKAP',
  'share.monthly':           'Bulanan',
  'share.yearly':            'Tahunan',
  'share.monthLabel':        'BULAN',
  'share.yearLabel':         'TAHUN',
  'share.zoneLabel':         'ZONA',
  'share.zoneCombined':      'KRS + SLK (Gabungan)',
  'share.formatLabel':       'FORMAT',
  'share.creatingBtn':       'Membuat...',
  'share.generateBtn':       'Generate & Share via WhatsApp',

  // v11.5.12: ExportModal — sebelumnya belum pernah di-i18n-kan sama sekali
  'exportModal.jsonSuccess':      'Backup JSON berhasil diunduh',
  'exportModal.excelSuccess':     'berhasil!',
  'exportModal.shareSuccess':     'Backup berhasil dibagikan',
  'exportModal.shareCancelled':   'Share dibatalkan atau tidak didukung',
  'exportModal.title':            'Export Data',
  'exportModal.closeAria':        'Tutup modal export',
  'exportModal.formatLabel':      'FORMAT',
  'exportModal.jsonBackup':       'JSON (Backup)',
  'exportModal.yearLabel':        'TAHUN',
  'exportModal.zoneLabel':        'ZONA',
  'exportModal.shareInfoBold':     'Bagikan',
  'exportModal.shareInfoRest':     'untuk kirim via Gmail, WhatsApp, Google Drive, dll — file langsung jadi attachment.',
  'exportModal.download':         'Download',
  'exportModal.sharing':          'Membagikan...',
  'exportModal.share':            'Bagikan',

  // v11.5.12: ImportModal — sebelumnya belum pernah di-i18n-kan sama sekali
  'importModal.invalidFile':    'File tidak valid!',
  'importModal.successPrefix':  'Import OK!',
  'importModal.cloudSyncDone':  'Cloud sync selesai!',
  'importModal.syncFailed':     'Sync gagal:',
  'importModal.readFailed':     'Gagal baca file:',
  'importModal.confirmTitle':   'Import data ini?',
  'importModal.confirmDesc':    'Seluruh data saat ini (member, pembayaran, info) akan DIGANTI TOTAL dengan isi file ini. Tindakan ini tidak bisa dibatalkan. Pastikan file ini benar sebelum lanjut.',
  'importModal.confirmYes':     'Ya, Ganti Data',
  'importModal.summaryPayments': 'data pembayaran',

  // v11.5.12: Sisa temuan kecil dari audit menyeluruh
  'sidebar.accountAria':   'Buka pengaturan akun',
  'sidebar.manageAccount': 'Kelola akun',

};

export default id;
