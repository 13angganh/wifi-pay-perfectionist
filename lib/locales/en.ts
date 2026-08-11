// lib/locales/en.ts — English
const en: Record<string, string> = {
  // Nav
  'nav.dashboard'    : 'Dashboard',
  'nav.entry'        : 'Entry',
  'nav.rekap'        : 'Summary',
  'nav.tunggakan'    : 'Arrears',
  'nav.grafik'       : 'Chart',
  'nav.log'          : 'Log',
  'nav.members'      : 'Members',
  'nav.operasional'  : 'Operational',
  'nav.settings'     : 'Settings',

  // Status
  'status.lunas'     : 'Paid',
  'status.belum'     : 'Unpaid',
  'status.free'      : 'Free',

  // Actions
  'action.save'      : 'Save',
  'action.cancel'    : 'Cancel',
  'action.delete'    : 'Delete',
  'action.confirm'   : 'Confirm',
  'action.edit'      : 'Edit',
  'action.add'       : 'Add',
  'action.close'     : 'Close',
  'action.back'      : 'Back',
  'action.search'    : 'Search',
  'action.export'    : 'Export',
  'action.share'     : 'Share',
  'action.logout'    : 'Sign Out',
  'action.changeAccount' : 'Switch Account',

  // Common
  'common.loading'   : 'Loading...',
  'common.saving'    : 'Saving...',
  'common.saved'     : 'Saved',
  'common.error'     : 'Error',
  'common.saveFailed': 'Failed to save to server, check connection',
  'common.offline'   : 'Offline',
  'header.lock'      : 'LOCK',
  'header.unlock'    : 'OPEN',
  // v11.5: label spesifik untuk toggle kunci di menu Member
  'members.lock'     : 'LOCK MEMBERS',
  'members.unlock'   : 'OPEN MEMBERS',
  'common.noData'    : 'No data',
  'common.noResult'  : 'No results',
  'common.active'    : 'Active',
  'common.inactive'  : 'Inactive',
  'common.cancel'    : 'Cancel',
  'common.total'     : 'Total',
  'common.month'     : 'Month',
  'common.year'      : 'Year',
  'common.zone'      : 'Zone',
  'common.name'      : 'Name',
  'common.amount'    : 'Amount',
  'common.date'      : 'Date',
  'common.all'       : 'All',

  // Dashboard
  'dashboard.title'          : 'Dashboard',
  'dashboard.income'         : 'Total Income',
  'dashboard.members'        : 'Members',
  'dashboard.paid'           : 'Paid',
  'dashboard.unpaid'         : 'Unpaid',
  'dashboard.operasional'    : 'Operational',

  // Entry
  'entry.title'              : 'Payment Entry',
  'entry.markPaid'           : 'Mark as Paid',
  'entry.batchPay'           : 'Pay All',
  'entry.quickPay'           : 'Quick Pay',
  'entry.confirmHighNominal' : 'Amount exceeds the member\'s rate, continue?',
  'entry.batchSuccess'       : 'members marked as paid',

  // Rekap
  'rekap.title'              : 'Summary',
  'rekap.batchConfirm'       : 'Mark All as Paid',

  // Tunggakan
  'tunggakan.title'          : 'Arrears',
  'tunggakan.filter.total'   : 'Total',
  'tunggakan.filter.new'     : 'New',
  'tunggakan.filter.soon'    : 'Soon',
  'tunggakan.filter.critical': 'Critical',
  'tunggakan.months'         : 'months overdue',

  // Grafik
  'grafik.title'             : 'Chart',

  // Log
  'log.title'                : 'Activity Log',
  'log.empty'                : 'No activity yet',

  // Members
  'members.title'            : 'Member List',
  'members.add'              : 'Add Member',
  'members.empty'            : 'No members yet',
  'members.delete'           : 'Delete Member',
  'members.restore'          : 'Restore',

  // Operasional
  'ops.title'                : 'Operational',
  'ops.income'               : 'Income',
  'ops.expense'              : 'Expense',
  'ops.net'                  : 'Net',

  // Settings
  'settings.title'           : 'Settings',
  'settings.pin'             : 'PIN Security',
  'settings.zones'           : 'Zone Management',
  'settings.language'        : 'Language',
  'settings.theme'           : 'Display Theme',
  'settings.theme.light'     : 'Light',
  'settings.theme.dark'      : 'Dark',
  'settings.theme.gold'      : 'Gold',
  'settings.theme.lightDesc' : 'Bright display, great for daytime use',
  'settings.theme.darkDesc'  : 'Dark display, easy on the eyes',
  'settings.theme.goldDesc'  : 'Elegant display with premium gold accents',
  'settings.export'          : 'Export & Import Data',
  'settings.autoDate'        : 'Auto Date',
  'settings.quickPay'        : 'Quick Pay Amount',
  'settings.appInfo'         : 'App Info',
  'settings.version'         : 'Version',

  // v11.5.12: CollapsibleSection titles/badges in SettingsView.tsx — previously
  // hardcoded Indonesian, never wired into the translation system at all (unlike the
  // sub-content text inside each section, which was already connected long ago).
  'settings.pinSectionTitle'       : 'PIN Security',
  'settings.biometricSectionTitle' : 'Fingerprint & Face ID',
  'settings.emailSectionTitle'     : 'Email & Reset Password',
  'settings.ipSectionTitle'        : 'IP Conversion',
  'settings.waSummaryTitle'        : 'WhatsApp Summary',
  'settings.quickPaySectionTitle'  : 'Quick Pay',
  'settings.autoDateSectionTitle'  : 'Auto Payment Date',
  'settings.autoDateBadgeAuto'     : 'Automatic',
  'settings.autoDateBadgeManual'   : 'Manual',
  'settings.languageBadgeEn'       : 'English',
  'settings.languageBadgeId'       : 'Indonesian',

  // Sync
  'sync.saved'               : 'Saved',
  'sync.saving'              : 'Saving',
  'sync.error'               : 'Save failed',
  'sync.offline'             : 'Offline',

  // Onboarding
  'onboarding.step1'         : 'Start by adding members in the Members menu',
  'onboarding.step2'         : 'Record payments in the Entry menu',
  'onboarding.step3'         : 'Monitor your summary in the Dashboard',
  'onboarding.dismiss'       : 'Got it',

  // Login
  'login.greeting'           : 'Welcome back',
  'login.greetingNew'        : 'Welcome',
  'login.email'              : 'Email',
  'login.password'           : 'Password',
  'login.submit'             : 'Sign In',
  'login.changeAccount'      : 'Switch Account',

  // PIN
  'pin.enter'                : 'Enter PIN',
  'pin.wrong'                : 'Wrong PIN',
  'pin.set'                  : 'Set PIN',
  'pin.confirm'              : 'Confirm PIN',
  'pin.notMatch'             : 'PIN does not match',

  // Offline
  'offline.message'          : 'No internet connection',

  // Errors
  'error.loadFailed'         : 'Failed to load data',
  'error.saveFailed'         : 'Failed to save',
  'error.deleteFailed'       : 'Failed to delete',
  // Dashboard tambahan
  'dashboard.thisMonth'  : 'Monthly Income',
  'dashboard.net'        : 'Net',
  // v11.5.2: contextual insight card
  'dashboard.insightTitle'      : 'This Month\'s Insight',
  'dashboard.insightTunggakan'  : 'Arrears',
  'dashboard.insightLunasRatio' : 'Paid Ratio',
  'dashboard.insightNoBaseline' : 'No data for last month',
  'dashboard.insightSame'       : 'Same as last month',
  'dashboard.unpaidTitle': 'Unpaid',
  'dashboard.topArrears' : 'Most Arrears',
  'dashboard.allPaid'    : 'All Paid!',
  'dashboard.lastBackup' : 'Last Backup',
  'dashboard.backupNow'  : 'Backup Now',
  'dashboard.waSummary'  : 'WA Summary',
  'dashboard.sendWA'     : 'Send Summary',
  'dashboard.inputPay'   : 'Input Payment',
  'dashboard.periodNote' : 'Period follows selector above',

  // Common tambahan
  'common.members'    : 'customers',
  'common.more'       : 'more',
  'common.months'     : 'months',
  'common.since'      : 'since',
  'common.optional'   : 'Optional',

  // Tunggakan tambahan
  'tunggakan.nakal'        : 'Overdue',
  'tunggakan.rajin'        : 'On-time',
  'tunggakan.sumLabel'     : 'ARREARS UNTIL',
  'tunggakan.sumLunas'     : 'PAID UNTIL',
  'tunggakan.sumFree'      : 'FREE MEMBER',
  'tunggakan.emptyTotal'   : 'No arrears up to this month',
  'tunggakan.emptyNew'     : 'No 1-month arrears',
  'tunggakan.emptySoon'    : 'No 2-3 month arrears',
  'tunggakan.emptyCritical': 'No 4+ month arrears',
  'tunggakan.paidAll'      : 'All paid',
  'tunggakan.emptyRajin'   : 'No members fully paid yet',
  'tunggakan.emptyFree'    : 'No active free members this month',
  'tunggakan.forever'      : 'forever',

  // Log tambahan
  'log.payOnly'           : 'Payments Only',
  'log.searchPlaceholder' : 'Search name / action...',
  'log.filterName'        : 'Filter member name...',
  'log.allYears'          : 'All Years',
  'log.allMonths'         : 'All Months',
  'log.autoDelete'        : 'LOG · Auto-deleted after 30 days',
  'log.emptyDesc'         : 'No activity recorded yet',
  'log.noResultsDesc'     : 'Try adjusting your search keyword or filters',

  // Entry tambahan
  'entry.locked'           : 'Data locked! Unlock first',
  'entry.lockedShort'      : 'locked',
  'entry.noTarif'          : 'No members with registered rates',
  'entry.noTarifShort'     : 'No rate set',
  'entry.selectAll'        : 'Select All',
  'entry.potentialUnpaid'  : 'Potential Unpaid',
  'entry.from'             : 'from',
  'entry.membersUnpaid'    : 'members unpaid',
  'entry.searchPlaceholder': 'Search in',
  'entry.batchSkipped'     : 'members skipped (no rate)',

  // Rekap tambahan
  'rekap.batchCancel' : 'Cancel All',

  // Members tambahan
  'members.nameRequired'   : 'Name is required',
  'members.nameDuplicate'  : 'Name already exists!',
  'members.nameInvalidChar': 'Name cannot contain . # $ [ ] / characters',
  'members.notFound'       : 'Member not found',
  'members.added'          : 'added!',
  'members.updated'        : 'updated successfully!',
  'members.deleted'        : 'deleted',
  'members.restored'       : 'restored successfully!',
  'members.emptyDesc'      : 'Add a new member above',
  'members.recycleBinEmpty': 'Recycle Bin Empty',
  'members.recycleBinDesc' : 'No deleted members',
  'members.saveChanges'    : 'Save Changes',
  'members.editTitle'      : 'Edit Member',
  'members.customerId'     : 'Customer ID',
  'members.ipLabel'        : 'IP / Router Link',
  'members.tarifLabel'     : 'Monthly Rate (×1000)',
  'members.tarifShort'     : 'Rate (×1000)',
  // v11.5.2: catatan bebas per member
  'members.notesLabel'     : 'Notes',
  'members.notesPlaceholder': 'Free-text note about this member (optional)...',
  'members.hasNotesHint'    : 'This member has a note',
  'members.namePlaceholder': 'Member name',
  'members.addTitle'       : 'ADD NEW MEMBER TO',
  'members.addTo'          : 'Add to',

  // Ops tambahan
  'ops.expenseTitle'   : 'OPERATIONAL EXPENSES',
  'ops.itemPlaceholder': 'Description (electricity, internet...)',
  'ops.addItem'        : '+ Add Item',
  'ops.incomeKRS'      : 'KRS Income',
  'ops.incomeSLK'      : 'SLK Income',
  'ops.grossIncome'    : 'Gross Income',
  'ops.totalExpense'   : 'Total Expenses',
  'ops.netIncome'      : 'NET INCOME',

  // Settings tambahan
  'settings.pinEnable' : 'Enable PIN',
  'settings.pinDisable': 'Disable PIN',
  'settings.pinChange' : 'Change PIN',
  'settings.pinSave'   : 'Save & Enable',
  'settings.addZone'   : 'Add New Zone',
  'settings.zonesNote' : 'Hiding a zone does not delete data. Hidden zones do not appear in the header.',
  'Aktif — app terkunci saat dibuka' : 'Enabled — app locks when opened',
  'Nonaktif — app langsung terbuka' : 'Disabled — app opens immediately',

  // Action tambahan
  'action.reset'  : 'Reset',

  // Settings PIN steps
  'settings.pinStatus.active'   : 'Active',
  'settings.pinStatus.inactive' : 'Inactive',
  'settings.pin.newTitle'       : 'Create New PIN',
  'settings.pin.enterNew'       : 'Enter 4-digit PIN',
  'settings.pin.reenterNew'     : 'Re-enter the same PIN',
  'settings.pin.enterCurrent'   : 'Enter current PIN to confirm',
  'settings.pin.enterOld'       : 'Enter old PIN',

  // Settings Auto-lock
  'settings.autoLock'           : 'AUTO-LOCK PIN',
  'settings.autoLockDesc'       : 'Auto-lock screen when idle. Firebase stays active.',
  'settings.timeout.never'      : 'Never',
  'settings.timeout.5m'         : '5 minutes',
  'settings.timeout.10m'        : '10 minutes',
  'settings.timeout.30m'        : '30 minutes',
  'settings.timeout.1h'         : '1 hour',

  // Settings Zona
  'settings.zona.hidden'        : 'Hidden',
  'settings.zona.namePlaceholder': 'Zone name (max 6 chars)',
  'settings.zona.color'         : 'Color',

  // Settings WA
  'settings.waPeriod'           : 'SUMMARY PERIOD',
  'settings.sendToWA'           : 'Send to WhatsApp',

  // Settings Tanggal Bayar
  'settings.autoDate.descAuto'   : 'Auto — today\'s date on payment entry',
  'settings.autoDate.descManual' : 'Manual — enter date yourself each time',
  'settings.autoDate.auto'       : 'Auto',
  'settings.autoDate.manual'     : 'Manual',
  'settings.autoDate.toastAuto'  : 'Payment date: Auto',
  'settings.autoDate.toastManual': 'Payment date: Manual',
  'settings.autoDate.noteAuto'   : 'On quick pay, date is automatically set to today.',
  'settings.autoDate.noteManual' : 'Date is not auto-filled — useful when entering late.',

  // Settings Quick Pay
  'settings.quickPayDesc'  : 'Quick pay amount for members without a custom rate.',
  'settings.quickPayLabel' : 'AMOUNT (×1000) — separate with commas',
  'settings.quickPaySave'  : 'Save Default Amount',
  'settings.quickPayNote'  : 'Per-member rate is set in Members → Edit → Rate.',

  // Settings Export
  'settings.export.monthly' : 'Monthly',
  'settings.export.yearly'  : 'Yearly',

  // Common deleted
  'common.deleted' : 'deleted',

  // Settings PIN toast & confirm
  'settings.pin.toastEnabled'  : 'PIN enabled successfully',
  'settings.pin.toastDisabled' : 'PIN disabled',
  'settings.pin.toastChanged'  : 'PIN changed successfully',
  'settings.pin.disableConfirm': 'Disable PIN?',
  'settings.pin.disableConfirmDesc': 'App will open immediately without PIN',

  // Settings Quick Pay toast
  'settings.quickPay.minError' : 'Minimum 2 amounts required',
  'settings.quickPay.maxError' : 'Maximum 8 amounts allowed',
  'settings.quickPay.saved'    : 'Quick pay amounts saved',

  // Settings Export toast
  'settings.export.makingPDF'    : 'Generating PDF...',
  'settings.export.pdfDone'      : 'PDF downloaded successfully',
  'settings.export.pdfError'     : 'Failed to generate PDF',
  'settings.export.makingExcel'  : 'Generating Excel...',
  'settings.export.excelDone'    : 'Excel downloaded successfully',
  'settings.export.excelError'   : 'Failed to generate Excel',
  'settings.export.makingFile'   : 'Generating file...',
  'settings.export.fileDownloaded': 'File downloaded (share not supported)',
  'settings.export.fileError'    : 'Failed to generate file',

  // Settings page title
  'settings.pageTitle'           : 'Settings',

  // Settings JSON Backup
  'settings.jsonBackup'          : 'JSON Backup',
  'settings.jsonBackupDesc'      : 'Direct download',
  'settings.importData'          : 'Import Data',
  'settings.importDataDesc'      : 'From JSON file',
  'settings.jsonBackupDone'      : 'JSON backup downloaded',

  // Settings Share
  'settings.sharePdfExcel'       : 'Share PDF / Excel',
  'settings.format'              : 'FORMAT',
  'settings.generateShare'       : 'Generate & Share',

  // Zona management toasts & confirms
  'zona.nameRequired'            : 'Zone name is required',
  'zona.nameTooLong'             : 'Zone name max 6 characters',
  'zona.duplicate'               : 'Zone already exists',
  'zona.added'                   : 'Zone added',
  'zona.deleted'                 : 'Zone deleted',
  'zona.hidden'                  : 'Zone hidden',
  'zona.shown'                   : 'Zone visible again',
  'zona.renameNote'              : 'This only changes the display name, not Firebase data.',
  'zona.renameYes'               : 'Yes, Rename',
  'zona.renamed'                 : 'renamed (display)',
  'zona.hideConfirmWithMembers'  : 'members. Data stays safe.',
  'zona.hideYes'                 : 'Yes, Hide',
  'zona.showYes'                 : 'Yes, Show',
  'zona.deleteHasMembers'        : 'members will also be deleted!',
  'zona.deleteYes'               : 'Yes, Delete Zone',

  // AppShell error boundary
  'app.errorTitle'               : 'Oops, something went wrong',
  'app.errorDesc'                : 'The app encountered an unexpected error. Try reloading the page.',
  'app.reload'                   : 'Reload',

  // AppShell offline/update banners
  'app.offline'                  : 'Offline — data saved locally',
  'app.backOnline'               : 'Back online',
  'app.updateAvailable'          : 'New version of WiFi Pay available!',
  'app.updateNow'                : 'Update Now',
  'pwa.installTitle'             : 'Install WiFi Pay',
  'pwa.installDesc'              : 'Add to home screen for quick access',
  'pwa.installBtn'               : 'Install',

  // Header entry lock
  'header.entryLocked'           : 'Entry locked',
  'header.entryUnlocked'         : 'Entry unlocked',
  // v11.5: toast spesifik untuk toggle kunci di menu Member
  'members.locked'               : 'Member list locked',
  'members.unlocked'             : 'Member list unlocked',
  // v11.5.1: key untuk SettingsIPSection
  'settings.ip.zoneLabel'        : 'ZONE',
  'settings.ip.findLabel'        : 'FIND (IP/text portion to replace)',
  'settings.ip.replaceLabel'     : 'REPLACE WITH',
  'settings.ip.findRequired'     : 'Enter a value to search for',
  'settings.ip.noneFound'        : 'No matching IP found in zone',
  'settings.ip.noMatch'          : 'No matching IP found in zone',
  'settings.ip.willBeChanged'    : 'member(s) will be updated in zone',
  'settings.ip.converted'        : 'converted successfully',
  'settings.ip.convertButton'    : 'Convert IP',
  'settings.ip.convertYes'       : 'Convert',
  'settings.ip.confirmPrefix'    : 'Convert all IPs in zone',
  'settings.ip.confirmFrom'      : 'from',
  'settings.ip.confirmTo'        : 'to',
  'settings.ip.confirmNote'      : 'Only members in the selected zone whose IP contains this value will be changed.',
  'settings.ip.note'             : 'This converts (find & replace) text in the IP/Router Link field for every member in the selected zone. Works on any octet or text portion — not limited to a fixed pattern.',
  // v11.5.1: hint tarif default di Tunggakan
  'tunggakan.tarifDefaultHint'   : 'Rate not set, using default',
  // v11.5.1: key PIN yang ditemukan hilang saat audit (bug pre-existing)
  'settings.pin.new'             : 'NEW PIN (6 DIGITS)',
  'settings.pin.confirm'         : 'CONFIRM PIN',
  'settings.pin.current'         : 'CURRENT PIN',
  'settings.pin.activate'        : 'Activate PIN',
  'settings.pin.change'          : 'Change PIN',
  'settings.pin.deactivate'      : 'Deactivate PIN',
  'settings.pin.invalid'         : 'PIN must be 6 digits',
  'settings.pin.mismatch'        : 'PIN confirmation does not match',
  'settings.pin.wrongCurrent'    : 'Current PIN is incorrect',
  // v11.5.1: key lain yang juga ditemukan hilang saat audit
  'common.searchMember'          : 'Search member name...',
  'freemodal.existing'           : 'Current Free Members',
  'settings.zones.placeholder'   : 'New zone name (e.g. PRM)',

  // RekapView
  'rekap.dateLocked'             : 'Data locked!',
  'rekap.accumulation'           : 'Accum.',
  'rekap.freeMember'             : 'Free Member this period',
  'rekap.dataLocked'             : 'Data locked',
  'rekap.allLocked'              : 'All members locked',
  'rekap.batchSuccess'           : 'members marked as paid',
  'rekap.scrollHint'             : '← scroll right to see all months →',
  'rekap.deletePayment'          : 'Delete payment',
  'rekap.batchSelected'          : 'Members Selected',

  'common.search' : 'Search',


  // ─── Added keys ───
  'lockbanner.message': 'Entry locked — tap to unlock',
  'lockbanner.unlock': 'Unlock',
  'membercard.payDate': 'Pay Date',
  'membercard.history': 'History',
  'membercard.acm': 'Acc.',
  'membercard.setTarifHint': 'Set rate in <b style="color:var(--txt3)">Members → Edit</b>',
  'membercard.deleteYes': 'Yes, Delete',
  'members.deleteNote': 'Payment data saved in recycle bin',
  'members.permDelete': 'Permanently delete',
  'members.permDeleteNote': 'Cannot be undone!',
  'members.permDeleteYes': 'Yes, Delete Permanently',
  'login.continue': 'Sign in as this account',
  'login.or': 'or',
  'login.continuePrompt': 'Sign in to continue',
  'login.requiredFields': 'All fields are required',
  'login.passwordMin': 'Password must be at least 6 characters',
  'login.passwordMin6': 'PASSWORD (min 6 characters)',
  'login.noAccount': "Don't have an account?",
  'login.registerHere': 'Register here',
  'login.hasAccount': "Already have an account?",
  'login.loginHere': 'Sign in here',
  'login.createAccount': 'Create New Account',
  'login.namePlaceholder': 'Your name',
  'login.registerSubmit': 'Register & Sign In',
  'login.username': 'Username',
  'grafik.avgMonth': 'Avg/month',
  'grafik.vsLastYear': 'VS Last Year',
  'grafik.monthly': 'Monthly',
  'grafik.yearly': 'Yearly Comparison',
  'grafik.composition': 'Composition',
  'grafik.projection': 'Next Month Projection',
  'grafik.basedOn': 'based on',
  'grafik.lastMonths': 'last months',
  'grafik.twoperiod': 'Two Period Comparison',
  'grafik.period1': 'Period 1',
  'grafik.period2': 'Period 2',
  'grafik.diff': 'period difference',
  'grafik.proj': 'proj.',
  'grafik.noDataTitle': 'No Chart Data Yet',
  'grafik.noDataDesc': 'Add members and payment data to see statistics charts.',
  'rekap.batchHint': 'tap cell to select/deselect',
  'rekap.searchPlaceholder': 'Search member...',


  // ─── Session 4 keys ───
  'globalsearch.placeholder': 'Search member name...',
  'globalsearch.title': 'Search Members',
  'globalsearch.hint': 'Type a member name to search across all zones',
  'globalsearch.notFound': 'No member found with name',
  'riwayat.monthsPaid': 'months paid',
  'riwayat.noHistory': 'No payment history for',
  'riwayat.prevYear': 'Previous year',
  'riwayat.nextYear': 'Next year',
  'riwayat.statTotal': 'TOTAL',
  'riwayat.statBayar': 'PAID',
  'riwayat.statMulai': 'START',
  'riwayat.monthAbbr': 'mo',
  'log.action.deletePay': 'Delete payment',
  'log.action.quickPay': 'Quick Pay',
  'log.action.pay': 'Pay',
  'log.action.batchPay': 'Batch Pay',
  'log.action.updateDate': 'Update date',
  'log.action.addMember': 'Add member',
  'log.action.editMember': 'Edit member',
  'log.action.deleteMember': 'Delete member',
  'log.action.restoreMember': 'Restore member',
  'log.action.permDelete': 'Permanently delete',
  'log.action.updateOps': 'Update operational',
  'log.detail.deleted': 'deleted',
  'lang': 'en',


  // ─── FreeMemberModal keys ───
  'freemodal.dateError': 'End date must be after start date',
  'freemodal.setFree': 'set as free member',
  'freemodal.removed': 'returned to paid',
  'freemodal.removeConfirm': 'Return to paid',
  'freemodal.removeNote': 'Free member status will be removed. Payment history stays safe.',
  'freemodal.removeYes': 'Yes, Return to Paid',
  'freemodal.startFrom': 'Free from',
  'freemodal.forever': 'Free forever (no end date)',
  'freemodal.until': 'Until',
  'freemodal.save': 'Save Free Member',
  'freemodal.remove': 'Return to Paid',

  // v11.5.11: AccountModal — previously never internationalized at all
  'account.title': 'Account',
  'account.close': 'Close',
  'account.loggedInAs': 'LOGGED IN AS',
  'account.badgeEmail': '✉ EMAIL',
  'account.badgeGoogle': 'G GOOGLE',
  'account.linkGoogle': 'Link Google Account',
  'account.linking': 'Linking...',
  'account.googleLinked': '✓ Google is linked — you can log in via Google or Email',
  'account.switchAccount': '↔ Switch Account',
  'account.switchConfirmYes': 'Switch Account',
  'account.switchConfirmQuestion': 'Switch account? You will be logged out of this account.',
  'account.logout': 'Log Out',
  'account.googleLinkedToast': 'Google linked successfully ✓',

  // v11.5.12: SettingsBiometricSection — previously never internationalized at all
  'biometric.enablePinFirst':     'Enable PIN first before using biometrics',
  'biometric.enabled':            'Biometrics enabled successfully',
  'biometric.registerFailed':     'Failed to register biometrics',
  'biometric.notSupportedOrCancel': 'Biometrics not supported or cancelled',
  'biometric.disableConfirm':     'Disable biometrics?',
  'biometric.disableYes':         'Disable',
  'biometric.disabled':           'Biometrics disabled',
  'biometric.verifySuccess':      'Verification successful ✓',
  'biometric.verifyFailed':       'Verification failed',
  'biometric.cancelled':          'Biometrics cancelled',
  'biometric.title':              'Fingerprint & Face ID',
  'biometric.subtitle':           'Unlock the app with biometrics without a PIN',
  'biometric.checkingDevice':     'Checking device...',
  'biometric.notSupported':       'This device does not support fingerprint / Face ID, or permission has not been granted.',
  'biometric.enablePinWarning':   '⚠️ Enable PIN first to use biometrics.',
  'biometric.enableBtn':          'Enable Biometrics',
  'biometric.testBtn':            'Test Biometrics',
  'biometric.reregisterBtn':      'Re-register',
  'biometric.disableBtn':         'Disable Biometrics',
  'biometric.privacyNote':        'Biometric data is not sent to the server — verification happens directly on your device via the standard browser API (WebAuthn).',

  // v11.5.12: SettingsEmailSection — previously never internationalized at all
  'emailSection.enterNew':        'Enter a new email',
  'emailSection.sameAsCurrent':   'Email is the same as current',
  'emailSection.invalidFormat':   'Invalid email format',
  'emailSection.verifySent':      'Verification email sent — check inbox ',
  'emailSection.title':           'Change Account Email',
  'emailSection.currentLabel':    'Current:',
  'emailSection.verifySentDesc':  'Verification email sent. Check your inbox and click the link to confirm the change.',
  'emailSection.newEmailLabel':   'NEW EMAIL',
  'emailSection.firebaseNote':    'Firebase will send a verification email to the new address. The old email stays active until you click the confirmation link in your inbox.',
  'emailSection.sending':         'Sending...',
  'emailSection.sendVerifyBtn':   'Send Verification Email',
  'emailSection.forgotPassword':  'Forgot password? Send a reset link to your active email.',
  'emailSection.resetSentDesc':   '✓ Reset link sent to',
  'emailSection.sendResetBtn':    '🔑 Send Password Reset Link',

  // v11.5.12: ShareModal — previously never internationalized at all
  'share.creating':          'Creating file...',
  'share.ready':             'File ready, opening WhatsApp!',
  'share.failed':            'Failed to generate file',
  'share.title':             'Share Report',
  'share.closeAria':         'Close share modal',
  'share.typeLabel':         'REPORT TYPE',
  'share.monthly':           'Monthly',
  'share.yearly':            'Yearly',
  'share.monthLabel':        'MONTH',
  'share.yearLabel':         'YEAR',
  'share.zoneLabel':         'ZONE',
  'share.zoneCombined':      'KRS + SLK (Combined)',
  'share.formatLabel':       'FORMAT',
  'share.creatingBtn':       'Creating...',
  'share.generateBtn':       'Generate & Share via WhatsApp',

  // v11.5.12: ExportModal — previously never internationalized at all
  'exportModal.jsonSuccess':      'JSON backup downloaded successfully',
  'exportModal.excelSuccess':     'successful!',
  'exportModal.shareSuccess':     'Backup shared successfully',
  'exportModal.shareCancelled':   'Share cancelled or not supported',
  'exportModal.title':            'Export Data',
  'exportModal.closeAria':        'Close export modal',
  'exportModal.formatLabel':      'FORMAT',
  'exportModal.jsonBackup':       'JSON (Backup)',
  'exportModal.yearLabel':        'YEAR',
  'exportModal.zoneLabel':        'ZONE',
  'exportModal.shareInfoBold':     'Share',
  'exportModal.shareInfoRest':     'to send via Gmail, WhatsApp, Google Drive, etc — the file becomes an attachment directly.',
  'exportModal.download':         'Download',
  'exportModal.sharing':          'Sharing...',
  'exportModal.share':            'Share',

  // v11.5.12: ImportModal — previously never internationalized at all
  'importModal.invalidFile':    'Invalid file!',
  'importModal.successPrefix':  'Import successful!',
  'importModal.cloudSyncDone':  'Cloud sync complete!',
  'importModal.syncFailed':     'Sync failed:',
  'importModal.readFailed':     'Failed to read file:',
  'importModal.confirmTitle':   'Import this data?',
  'importModal.confirmDesc':    'ALL current data (members, payments, info) will be COMPLETELY REPLACED with this file\'s contents. This action cannot be undone. Make sure this is the right file before continuing.',
  'importModal.confirmYes':     'Yes, Replace Data',
  'importModal.summaryPayments': 'payment records',

  // v11.5.12: Remaining small findings from the comprehensive audit
  'sidebar.accountAria':   'Open account settings',
  'sidebar.manageAccount': 'Manage account',

};

export default en;

// (appended)
