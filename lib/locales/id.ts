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
  'common.offline'   : 'Offline',
  'header.lock'      : 'KUNCI',
  'header.unlock'    : 'BUKA',
  'common.noData'    : 'Tidak ada data',
  'common.noResult'  : 'Tidak ada hasil',
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
  'settings.export'          : 'Export Data',
  'settings.autoDate'        : 'Tanggal Otomatis',
  'settings.quickPay'        : 'Quick Pay Amount',
  'settings.appInfo'         : 'Info Aplikasi',
  'settings.version'         : 'Versi',

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
  'dashboard.unpaidTitle': 'Belum Bayar',
  'dashboard.topArrears' : 'Tunggakan Terbanyak',
  'dashboard.allPaid'    : 'Semua Lunas!',
  'dashboard.lastBackup' : 'Backup Terakhir',
  'dashboard.backupNow'  : 'Backup Sekarang',
  'dashboard.waSummary'  : 'Ringkasan WA',
  'dashboard.sendWA'     : 'Kirim Ringkasan',
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
  'settings.pin.disableConfirm': 'Nonaktifkan PIN?<br><span style="font-size:11px;color:var(--txt3)">App tidak akan terkunci saat dibuka</span>',

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

  // Header entry lock
  'header.entryLocked'           : 'Entry dikunci',
  'header.entryUnlocked'         : 'Entry dibuka',

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
  'login.continue': 'Lanjutkan',
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

};

export default id;
