// ══════════════════════════════════════════
// lib/greeting.ts — v11.11.0
// Sapaan Beranda yang dinamis: judul mengikuti WAKTU (pagi/siang/sore/malam/larut) dengan nada FORMAL atau SANTAI yang
// berganti-ganti, plus satu baris konteks dari data nyata (lunas, tunggakan, pergantian bulan, dst). Modul ini murni
// (tanpa React/DOM/localStorage) supaya mudah diuji; sesi + riwayat ada di hooks/useGreeting.ts.
// Aturan: tanpa emoji (ikon saja, sesuai aturan app), dua bahasa dengan id yang SAMA di kedua bahasa, nama kosong = kalimat
// tetap utuh tanpa nama, dan kalimat yang baru dipakai tidak diulang (riwayat).
// ══════════════════════════════════════════

export type GreetLang = 'id' | 'en';
export type GreetTone = 'formal' | 'casual';
export type GreetSlot = 'late' | 'morning' | 'noon' | 'afternoon' | 'evening';

export interface GreetClock { hour: number; day: number; daysInMonth: number; weekday: number }
export interface GreetStats {
  /** periode yang sedang dilihat = bulan berjalan (baris konteks berbasis data hanya untuk bulan berjalan) */
  current: boolean;
  members: number; lunas: number; belum: number; lunasPct: number;
  hasIncome: boolean; incomeLabel: string; incomePct: number | null;
  arrears: { name: string; count: number } | null;
}
export interface GreetCtx { clock: GreetClock; slot: GreetSlot; stats: GreetStats }
export interface GreetHistory { titles: string[]; lines: string[]; tones: GreetTone[] }

export const EMPTY_HISTORY: GreetHistory = { titles: [], lines: [], tones: [] };
export const HISTORY_KEEP = 4;

type Rng = () => number;
type L<T> = Record<GreetLang, T>;

/** "Selamat pagi" + nama → "Selamat pagi, Budi"; tanpa nama → "Selamat pagi". */
const w = (s: string, n: string, sep = ', ') => (n ? `${s}${sep}${n}` : s);

// ── Judul (menurut waktu) ──────────────────────────────────────────────────────────────────────────────────────
interface TitleDef { id: string; tone: GreetTone; slot: GreetSlot | 'any'; text: L<(n: string) => string> }

const TITLES: TitleDef[] = [
  // pagi
  { id: 'm-f1', tone: 'formal', slot: 'morning', text: { id: n => w('Selamat pagi', n), en: n => w('Good morning', n) } },
  { id: 'm-f2', tone: 'formal', slot: 'morning', text: { id: n => w('Semoga pagi Anda menyenangkan', n), en: n => w('Wishing you a pleasant morning', n) } },
  { id: 'm-f3', tone: 'formal', slot: 'morning', text: { id: n => w('Pagi yang baik', n), en: n => w('A good morning to you', n) } },
  { id: 'm-c1', tone: 'casual', slot: 'morning', text: { id: n => (n ? `Pagi, ${n}. Siap mulai?` : 'Pagi. Siap mulai?'), en: n => (n ? `Morning, ${n}. Ready to start?` : 'Morning. Ready to start?') } },
  { id: 'm-c2', tone: 'casual', slot: 'morning', text: { id: n => (n ? `Pagi, ${n}! Kopi dulu?` : 'Pagi! Kopi dulu?'), en: n => (n ? `Morning, ${n}! Coffee first?` : 'Morning! Coffee first?') } },
  { id: 'm-c3', tone: 'casual', slot: 'morning', text: { id: n => w('Halo pagi', n), en: n => w('Rise and shine', n) } },
  // siang
  { id: 'n-f1', tone: 'formal', slot: 'noon', text: { id: n => w('Selamat siang', n), en: n => w('Good afternoon', n) } },
  { id: 'n-f2', tone: 'formal', slot: 'noon', text: { id: n => w('Semoga siang Anda lancar', n), en: n => w('Hope your day is going well', n) } },
  { id: 'n-f3', tone: 'formal', slot: 'noon', text: { id: n => w('Siang yang baik', n), en: n => w('A good day to you', n) } },
  { id: 'n-c1', tone: 'casual', slot: 'noon', text: { id: n => (n ? `Siang, ${n}. Sudah makan?` : 'Siang. Sudah makan?'), en: n => (n ? `Hey ${n}. Had lunch yet?` : 'Hey. Had lunch yet?') } },
  { id: 'n-c2', tone: 'casual', slot: 'noon', text: { id: n => (n ? `Siang, ${n}. Lancar hari ini?` : 'Siang. Lancar hari ini?'), en: n => (n ? `Afternoon, ${n}. Smooth day so far?` : 'Afternoon. Smooth day so far?') } },
  { id: 'n-c3', tone: 'casual', slot: 'noon', text: { id: n => (n ? `Hai, ${n}. Siang yang sibuk?` : 'Hai. Siang yang sibuk?'), en: n => (n ? `Hi ${n}. Busy day?` : 'Hi. Busy day?') } },
  // sore
  { id: 'a-f1', tone: 'formal', slot: 'afternoon', text: { id: n => w('Selamat sore', n), en: n => w('Good afternoon', n) } },
  { id: 'a-f2', tone: 'formal', slot: 'afternoon', text: { id: n => w('Sore yang baik', n), en: n => w('A pleasant afternoon to you', n) } },
  { id: 'a-f3', tone: 'formal', slot: 'afternoon', text: { id: n => w('Semoga sore Anda menyenangkan', n), en: n => w('Wishing you a pleasant afternoon', n) } },
  { id: 'a-c1', tone: 'casual', slot: 'afternoon', text: { id: n => (n ? `Sore, ${n}. Hampir tutup hari.` : 'Sore. Hampir tutup hari.'), en: n => (n ? `Afternoon, ${n}. Nearly end of the day.` : 'Afternoon. Nearly end of the day.') } },
  { id: 'a-c2', tone: 'casual', slot: 'afternoon', text: { id: n => (n ? `Sore, ${n}. Cek yang tersisa?` : 'Sore. Cek yang tersisa?'), en: n => (n ? `Afternoon, ${n}. Check what is left?` : 'Afternoon. Check what is left?') } },
  { id: 'a-c3', tone: 'casual', slot: 'afternoon', text: { id: n => (n ? `Hai, ${n}. Sore begini enaknya rekap.` : 'Hai. Sore begini enaknya rekap.'), en: n => (n ? `Hi ${n}. A good time for a recap.` : 'Hi. A good time for a recap.') } },
  // malam
  { id: 'e-f1', tone: 'formal', slot: 'evening', text: { id: n => w('Selamat malam', n), en: n => w('Good evening', n) } },
  { id: 'e-f2', tone: 'formal', slot: 'evening', text: { id: n => w('Malam yang tenang', n), en: n => w('A calm evening to you', n) } },
  { id: 'e-f3', tone: 'formal', slot: 'evening', text: { id: n => w('Semoga malam Anda tenang', n), en: n => w('Wishing you a restful evening', n) } },
  { id: 'e-c1', tone: 'casual', slot: 'evening', text: { id: n => (n ? `Malam, ${n}. Santai dulu, ya.` : 'Malam. Santai dulu, ya.'), en: n => (n ? `Evening, ${n}. Take it easy.` : 'Evening. Take it easy.') } },
  { id: 'e-c2', tone: 'casual', slot: 'evening', text: { id: n => (n ? `Malam, ${n}. Hari yang panjang?` : 'Malam. Hari yang panjang?'), en: n => (n ? `Evening, ${n}. Long day?` : 'Evening. Long day?') } },
  { id: 'e-c3', tone: 'casual', slot: 'evening', text: { id: n => w('Halo malam', n), en: n => (n ? `Hey ${n}, evening` : 'Hey, evening') } },
  // larut malam
  { id: 'l-f1', tone: 'formal', slot: 'late', text: { id: n => (n ? `Selamat malam, ${n}. Sudah larut.` : 'Selamat malam. Sudah larut.'), en: n => (n ? `Good evening, ${n}. It is late.` : 'Good evening. It is late.') } },
  { id: 'l-f2', tone: 'formal', slot: 'late', text: { id: n => (n ? `Masih bekerja, ${n}?` : 'Masih bekerja?'), en: n => (n ? `Still working, ${n}?` : 'Still working?') } },
  { id: 'l-f3', tone: 'formal', slot: 'late', text: { id: n => w('Larut malam', n), en: n => w('Late evening', n) } },
  { id: 'l-c1', tone: 'casual', slot: 'late', text: { id: n => (n ? `Belum tidur, ${n}?` : 'Belum tidur?'), en: n => (n ? `Still up, ${n}?` : 'Still up?') } },
  { id: 'l-c2', tone: 'casual', slot: 'late', text: { id: n => (n ? `Masih terjaga, ${n}?` : 'Masih terjaga?'), en: n => (n ? `Burning the midnight oil, ${n}?` : 'Burning the midnight oil?') } },
  { id: 'l-c3', tone: 'casual', slot: 'late', text: { id: n => (n ? `Masih melek, ${n}?` : 'Masih melek?'), en: n => (n ? `Night owl, ${n}?` : 'Night owl?') } },
  // kapan saja
  { id: 'x-f1', tone: 'formal', slot: 'any', text: { id: n => w('Selamat datang kembali', n), en: n => w('Welcome back', n) } },
  { id: 'x-f2', tone: 'formal', slot: 'any', text: { id: n => w('Senang melihat Anda kembali', n), en: n => w('Good to see you again', n) } },
  { id: 'x-c1', tone: 'casual', slot: 'any', text: { id: n => w('Halo lagi', n), en: n => w('Hey again', n) } },
  { id: 'x-c2', tone: 'casual', slot: 'any', text: { id: n => (n ? `Apa kabar, ${n}?` : 'Apa kabar?'), en: n => (n ? `How are you, ${n}?` : 'How are you?') } },
  { id: 'x-c3', tone: 'casual', slot: 'any', text: { id: n => (n ? `Hai, ${n}!` : 'Hai!'), en: n => (n ? `Hi, ${n}!` : 'Hi!') } },
  { id: 'x-c4', tone: 'casual', slot: 'any', text: { id: n => (n ? `Balik lagi, ${n}. Yuk lanjut.` : 'Balik lagi. Yuk lanjut.'), en: n => (n ? `Back again, ${n}. Let us go.` : 'Back again. Let us go.') } },
];

// ── Baris konteks (dari data nyata + kalender) ─────────────────────────────────────────────────────────────────────
interface LineDef { id: string; tone: GreetTone; weight: number; when: (c: GreetCtx) => boolean; text: L<(c: GreetCtx) => string> }

const daysLeft = (c: GreetCtx) => c.clock.daysInMonth - c.clock.day;
const live = (c: GreetCtx) => c.stats.current && c.stats.members > 0;

const LINES: LineDef[] = [
  { id: 'paid-f', tone: 'formal', weight: 5, when: c => live(c) && c.stats.belum === 0,
    text: { id: () => 'Semua pelanggan bulan ini sudah lunas.', en: () => 'Every customer is paid up this month.' } },
  { id: 'paid-c', tone: 'casual', weight: 5, when: c => live(c) && c.stats.belum === 0,
    text: { id: () => 'Lunas semua. Rapi sekali.', en: () => 'All paid. Beautifully tidy.' } },

  { id: 'start-f', tone: 'formal', weight: 3, when: c => live(c) && c.clock.day <= 5 && c.stats.lunas < c.stats.members,
    text: { id: c => `Bulan baru dimulai. ${c.stats.lunas} dari ${c.stats.members} pelanggan sudah lunas.`, en: c => `A new month has begun. ${c.stats.lunas} of ${c.stats.members} customers are paid.` } },
  { id: 'start-c', tone: 'casual', weight: 3, when: c => live(c) && c.clock.day <= 5 && c.stats.lunas < c.stats.members,
    text: { id: c => `Bulan baru, waktunya menagih. Baru ${c.stats.lunas} dari ${c.stats.members} yang lunas.`, en: c => `New month, time to collect. Only ${c.stats.lunas} of ${c.stats.members} paid so far.` } },

  { id: 'end-f', tone: 'formal', weight: 4, when: c => live(c) && daysLeft(c) <= 3 && c.stats.belum > 0,
    text: {
      id: c => `${daysLeft(c) === 0 ? 'Hari ini hari terakhir bulan ini' : `${daysLeft(c)} hari lagi pergantian bulan`}. Masih ada ${c.stats.belum} pelanggan belum bayar.`,
      en: c => `${daysLeft(c) === 0 ? 'Today is the last day of the month' : `${daysLeft(c)} ${daysLeft(c) === 1 ? 'day' : 'days'} until the month ends`}. ${c.stats.belum} customers have yet to pay.`,
    } },
  { id: 'end-c', tone: 'casual', weight: 4, when: c => live(c) && daysLeft(c) <= 3 && c.stats.belum > 0,
    text: {
      id: c => (daysLeft(c) === 0 ? `Hari terakhir bulan ini! ${c.stats.belum} pelanggan belum bayar.` : `Tinggal ${daysLeft(c)} hari lagi ganti bulan. ${c.stats.belum} pelanggan belum bayar.`),
      en: c => (daysLeft(c) === 0 ? `Last day of the month! ${c.stats.belum} customers have not paid.` : `Only ${daysLeft(c)} ${daysLeft(c) === 1 ? 'day' : 'days'} left in the month. ${c.stats.belum} customers have not paid.`),
    } },

  { id: 'arrear-f', tone: 'formal', weight: 3, when: c => live(c) && !!c.stats.arrears && c.stats.arrears.count >= 3,
    text: { id: c => `Tunggakan terlama: ${c.stats.arrears!.name}, ${c.stats.arrears!.count} bulan.`, en: c => `Longest arrears: ${c.stats.arrears!.name}, ${c.stats.arrears!.count} months.` } },
  { id: 'arrear-c', tone: 'casual', weight: 3, when: c => live(c) && !!c.stats.arrears && c.stats.arrears.count >= 3,
    text: { id: c => `${c.stats.arrears!.name} sudah ${c.stats.arrears!.count} bulan belum bayar. Ingatkan?`, en: c => `${c.stats.arrears!.name} is ${c.stats.arrears!.count} months behind. Send a nudge?` } },

  { id: 'near-f', tone: 'formal', weight: 2, when: c => live(c) && c.stats.lunasPct >= 70 && c.stats.belum > 0,
    text: { id: c => `${c.stats.lunasPct}% pelanggan sudah lunas. Tinggal ${c.stats.belum} lagi.`, en: c => `${c.stats.lunasPct}% of customers are paid. ${c.stats.belum} to go.` } },
  { id: 'near-c', tone: 'casual', weight: 2, when: c => live(c) && c.stats.lunasPct >= 70 && c.stats.belum > 0,
    text: { id: c => `Sudah ${c.stats.lunasPct}% lunas. Sedikit lagi!`, en: c => `${c.stats.lunasPct}% paid. Almost there!` } },

  { id: 'up-f', tone: 'formal', weight: 2, when: c => live(c) && c.stats.incomePct !== null && c.stats.incomePct >= 10,
    text: { id: c => `Pendapatan bulan ini naik ${c.stats.incomePct}% dari bulan lalu.`, en: c => `Income this month is up ${c.stats.incomePct}% from last month.` } },
  { id: 'up-c', tone: 'casual', weight: 2, when: c => live(c) && c.stats.incomePct !== null && c.stats.incomePct >= 10,
    text: { id: c => `Pendapatan naik ${c.stats.incomePct}% dibanding bulan lalu. Mantap.`, en: c => `Income is up ${c.stats.incomePct}% on last month. Nice.` } },

  { id: 'income-f', tone: 'formal', weight: 1, when: c => live(c) && c.stats.hasIncome,
    text: { id: c => `Pendapatan bulan ini ${c.stats.incomeLabel}.`, en: c => `Income this month: ${c.stats.incomeLabel}.` } },
  { id: 'income-c', tone: 'casual', weight: 1, when: c => live(c) && c.stats.hasIncome,
    text: { id: c => `Sejauh ini masuk ${c.stats.incomeLabel} bulan ini.`, en: c => `${c.stats.incomeLabel} in so far this month.` } },

  { id: 'unpaid-f', tone: 'formal', weight: 1, when: c => live(c) && c.stats.belum > 0,
    text: { id: c => `${c.stats.belum} pelanggan belum bayar bulan ini.`, en: c => `${c.stats.belum} customers have yet to pay this month.` } },
  { id: 'unpaid-c', tone: 'casual', weight: 1, when: c => live(c) && c.stats.belum > 0,
    text: { id: c => `Masih ada ${c.stats.belum} pelanggan yang belum bayar.`, en: c => `${c.stats.belum} customers still have not paid.` } },

  { id: 'mon-f', tone: 'formal', weight: 2, when: c => c.clock.weekday === 1,
    text: { id: () => 'Awal pekan. Semoga lancar.', en: () => 'A new week begins. Wishing you a smooth one.' } },
  { id: 'mon-c', tone: 'casual', weight: 2, when: c => c.clock.weekday === 1,
    text: { id: () => 'Senin lagi. Semangat!', en: () => 'Monday again. Let us go!' } },
  { id: 'fri-f', tone: 'formal', weight: 2, when: c => c.clock.weekday === 5,
    text: { id: () => 'Hari Jumat. Waktu yang baik untuk menutup pekan.', en: () => 'It is Friday. A good time to close out the week.' } },
  { id: 'fri-c', tone: 'casual', weight: 2, when: c => c.clock.weekday === 5,
    text: { id: () => 'Jumat! Sebentar lagi akhir pekan.', en: () => 'Friday! The weekend is close.' } },

  { id: 'late-f', tone: 'formal', weight: 6, when: c => c.slot === 'late',
    text: { id: () => 'Data tersimpan aman. Besok bisa dilanjutkan.', en: () => 'Your data is saved. It can wait until tomorrow.' } },
  { id: 'late-c', tone: 'casual', weight: 6, when: c => c.slot === 'late',
    text: { id: () => 'Istirahat dulu, besok lanjut.', en: () => 'Get some rest and pick it up tomorrow.' } },

  { id: 'ever-f', tone: 'formal', weight: 1, when: () => true,
    text: { id: () => 'Semoga hari ini lancar.', en: () => 'Wishing you a smooth day.' } },
  { id: 'ever-c', tone: 'casual', weight: 1, when: () => true,
    text: { id: () => 'Yuk, kita rapikan tagihan hari ini.', en: () => 'Let us tidy up the billing today.' } },
];

export const GREETING_TITLE_IDS = TITLES.map(t => t.id);
export const GREETING_LINE_IDS = LINES.map(l => l.id);

// ── Waktu ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function slotForHour(hour: number): GreetSlot {
  if (hour < 4) return 'late';
  if (hour < 12) return 'morning';
  if (hour < 15) return 'noon';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function clockOf(d: Date): GreetClock {
  return {
    hour: d.getHours(), day: d.getDate(), weekday: d.getDay(),
    daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
  };
}

// ── Riwayat ────────────────────────────────────────────────────────────────────────────────────────────────────
export function pushHistory(h: GreetHistory, entry: { title?: string; line?: string; tone?: GreetTone }): GreetHistory {
  const add = <T,>(list: T[], v: T | undefined) => (v === undefined ? list : [v, ...list.filter(x => x !== v)].slice(0, HISTORY_KEEP));
  return {
    titles: add(h.titles, entry.title),
    lines: add(h.lines, entry.line),
    // nada: simpan tiap sesi (boleh berulang) agar bisa dihitung beruntun
    tones: entry.tone ? [entry.tone, ...h.tones].slice(0, HISTORY_KEEP) : h.tones,
  };
}

// ── Pemilih ────────────────────────────────────────────────────────────────────────────────────────────────────
function weighted<T>(items: T[], weightOf: (x: T) => number, rng: Rng): T {
  const total = items.reduce((s, x) => s + weightOf(x), 0);
  let r = rng() * total;
  for (const x of items) { r -= weightOf(x); if (r < 0) return x; }
  return items[items.length - 1];
}

/** Nada sesi ini: acak, tetapi tidak sama tiga kali berturut-turut. */
export function pickTone(history: GreetHistory, rng: Rng): GreetTone {
  const [a, b] = history.tones;
  if (a && a === b) return a === 'formal' ? 'casual' : 'formal';
  return rng() < 0.5 ? 'formal' : 'casual';
}

/** Id judul untuk sesi baru: sesuai slot waktu + nada, bukan salah satu judul terakhir. */
export function pickTitleId(opts: { slot: GreetSlot; tone: GreetTone; recent: string[]; rng: Rng }): string {
  const all = TITLES.filter(t => t.tone === opts.tone && (t.slot === opts.slot || t.slot === 'any'));
  const fresh = all.filter(t => !opts.recent.includes(t.id));
  const pool = fresh.length ? fresh : all;
  // judul khusus waktu lebih diutamakan daripada judul "kapan saja"
  return weighted(pool, t => (t.slot === 'any' ? 1 : 3), opts.rng).id;
}

export function titleText(id: string, name: string, lang: GreetLang): string {
  const def = TITLES.find(t => t.id === id) ?? TITLES[0];
  return def.text[lang](name.trim());
}

/** Baris konteks: berbobot menurut kekuatan sinyal, tidak mengulang baris terakhir; `roll` (0–1) tetap selama sesi. */
export function pickLine(opts: { ctx: GreetCtx; tone: GreetTone; lang: GreetLang; recent: string[]; roll: number }): { id: string; text: string } | null {
  const all = LINES.filter(l => l.tone === opts.tone && l.when(opts.ctx));
  if (!all.length) return null;
  const fresh = all.filter(l => !opts.recent.includes(l.id));
  const pool = fresh.length ? fresh : all;
  const pick = weighted(pool, l => l.weight, () => opts.roll);
  return { id: pick.id, text: pick.text[opts.lang](opts.ctx) };
}

/** Contoh judul untuk pratinjau di Pengaturan (nada formal, slot waktu sekarang). */
export function previewTitle(name: string, lang: GreetLang, now: Date = new Date()): string {
  const slot = slotForHour(now.getHours());
  const def = TITLES.find(t => t.tone === 'formal' && t.slot === slot) ?? TITLES.find(t => t.tone === 'formal')!;
  return def.text[lang](name.trim());
}

export function slotOfTitle(id: string): GreetSlot | 'any' {
  return TITLES.find(t => t.id === id)?.slot ?? 'any';
}
