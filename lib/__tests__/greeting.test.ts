// lib/__tests__/greeting.test.ts — v11.11.0: sapaan Beranda dinamis (formal/santai, menurut waktu, tidak mengulang).
import { describe, it, expect } from 'vitest';
import {
  EMPTY_HISTORY, GREETING_LINE_IDS, GREETING_TITLE_IDS, HISTORY_KEEP,
  clockOf, pickLine, pickTitleId, pickTone, previewTitle, pushHistory, slotForHour, slotOfTitle, titleText,
  type GreetCtx, type GreetHistory, type GreetLang, type GreetSlot, type GreetStats, type GreetTone,
} from '@/lib/greeting';

function seeded(seed: number) { // mulberry32 — deterministik
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const SLOTS: GreetSlot[] = ['late', 'morning', 'noon', 'afternoon', 'evening'];
const LANGS: GreetLang[] = ['id', 'en'];
const TONES: GreetTone[] = ['formal', 'casual'];

const stats = (o: Partial<GreetStats> = {}): GreetStats => ({
  current: true, members: 107, lunas: 40, belum: 67, lunasPct: 37, hasIncome: true, incomeLabel: 'Rp 4.000.000', incomePct: 12,
  arrears: { name: 'YENI', count: 10 }, ...o,
});
const ctx = (o: { hour?: number; day?: number; daysInMonth?: number; weekday?: number } & Partial<GreetStats> = {}): GreetCtx => {
  const { hour = 9, day = 15, daysInMonth = 30, weekday = 3, ...st } = o;
  return { clock: { hour, day, daysInMonth, weekday }, slot: slotForHour(hour), stats: stats(st) };
};

describe('slot waktu', () => {
  it('batas jam', () => {
    const cases: [number, GreetSlot][] = [[0, 'late'], [3, 'late'], [4, 'morning'], [11, 'morning'], [12, 'noon'], [14, 'noon'], [15, 'afternoon'], [17, 'afternoon'], [18, 'evening'], [23, 'evening']];
    for (const [h, slot] of cases) expect(slotForHour(h), `jam ${h}`).toBe(slot);
  });
  it('clockOf: hari dalam bulan & hari pekan', () => {
    const c = clockOf(new Date(2026, 1, 10, 7, 0)); // 10 Feb 2026 (Selasa)
    expect(c).toEqual({ hour: 7, day: 10, daysInMonth: 28, weekday: 2 });
  });
});

describe('judul', () => {
  it('semua judul: dua bahasa, dengan & tanpa nama → teks utuh (tanpa undefined/emoji/tanda baca menggantung)', () => {
    for (const id of GREETING_TITLE_IDS) for (const lang of LANGS) for (const name of ['', 'Budi']) {
      const text = titleText(id, name, lang);
      const label = `${id}/${lang}/${name || 'tanpa nama'}: ${text}`;
      expect(text.length, label).toBeGreaterThan(2);
      expect(text.length, label).toBeLessThanOrEqual(60);
      expect(text, label).not.toMatch(/undefined|null|\{|\}/);
      expect(text, label).not.toMatch(EMOJI);
      expect(text, label).not.toMatch(/\s{2,}|,\s*[?!.]|^\s|\s$|,\s*$/);
      if (name) expect(text, label).toContain(name); else expect(text, label).not.toMatch(/,\s*$/);
    }
  });

  it('setiap slot punya ≥ 5 judul formal dan ≥ 5 judul santai (lebih banyak dari riwayat 4 sapaan, jadi selalu ada yang baru)', () => {
    for (const slot of SLOTS) for (const tone of TONES) {
      const n = GREETING_TITLE_IDS.filter(id => { const s = slotOfTitle(id); return (s === slot || s === 'any') && (id.includes('-f') ? 'formal' : 'casual') === tone; }).length;
      expect(n, `${slot}/${tone}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('id judul unik', () => { expect(new Set(GREETING_TITLE_IDS).size).toBe(GREETING_TITLE_IDS.length); });

  it('judul sesi sesuai slot waktu dan nada yang dipilih', () => {
    const rng = seeded(7);
    for (const slot of SLOTS) for (const tone of TONES) for (let i = 0; i < 20; i++) {
      const id = pickTitleId({ slot, tone, recent: [], rng });
      expect(['any', slot]).toContain(slotOfTitle(id));
      expect(id.includes('-f') ? 'formal' : 'casual').toBe(tone);
    }
  });

  it('pratinjau Pengaturan: nada formal, slot jam sekarang, nama dipakai bila ada', () => {
    expect(previewTitle('Budi', 'id', new Date(2026, 0, 5, 8))).toBe('Selamat pagi, Budi');
    expect(previewTitle('', 'id', new Date(2026, 0, 5, 8))).toBe('Selamat pagi');
    expect(previewTitle('Alex', 'en', new Date(2026, 0, 5, 19))).toBe('Good evening, Alex');
  });
});

describe('selalu BARU setiap app dibuka (riwayat)', () => {
  it('simulasi 300 kali tutup-buka: judul tidak sama dengan 3 sesi sebelumnya', () => {
    const rng = seeded(2026);
    let history: GreetHistory = EMPTY_HISTORY;
    const seen: string[] = [];
    for (let i = 0; i < 300; i++) {
      const slot = SLOTS[i % SLOTS.length];
      const tone = pickTone(history, rng);
      const id = pickTitleId({ slot, tone, recent: history.titles, rng });
      for (const prev of seen.slice(-3)) expect(id, `sesi ${i}`).not.toBe(prev);
      seen.push(id);
      history = pushHistory(history, { title: id, tone });
    }
    expect(new Set(seen).size).toBeGreaterThan(15); // bervariasi, bukan 2-3 kalimat bergantian
  });

  it('nada: bercampur formal & santai, tidak pernah sama tiga kali berturut-turut', () => {
    const rng = seeded(11);
    let history: GreetHistory = EMPTY_HISTORY;
    const tones: GreetTone[] = [];
    for (let i = 0; i < 400; i++) { const t = pickTone(history, rng); tones.push(t); history = pushHistory(history, { tone: t }); }
    for (let i = 2; i < tones.length; i++) expect(!(tones[i] === tones[i - 1] && tones[i] === tones[i - 2]), `sesi ${i}`).toBe(true);
    const formal = tones.filter(t => t === 'formal').length;
    expect(formal).toBeGreaterThan(120); expect(formal).toBeLessThan(280);
  });

  it('riwayat dibatasi dan tanpa duplikat', () => {
    let h: GreetHistory = EMPTY_HISTORY;
    for (const id of ['a', 'b', 'c', 'd', 'e', 'a']) h = pushHistory(h, { title: id, line: id });
    expect(h.titles.length).toBeLessThanOrEqual(HISTORY_KEEP);
    expect(h.titles[0]).toBe('a'); expect(h.titles.filter(x => x === 'a')).toHaveLength(1);
  });
});

describe('baris konteks', () => {
  it('semua baris: dua bahasa, tanpa undefined/emoji, ≤ 100 karakter, id unik', () => {
    const rich = ctx({ day: 29, daysInMonth: 30, weekday: 1 });
    expect(new Set(GREETING_LINE_IDS).size).toBe(GREETING_LINE_IDS.length);
    const variants: GreetCtx[] = [
      rich, ctx({ day: 30, weekday: 5 }), ctx({ day: 3 }), ctx({ belum: 0, lunas: 107, lunasPct: 100 }), ctx({ hour: 2 }), ctx({ lunasPct: 80, belum: 20 }),
    ];
    for (const c of variants) for (const lang of LANGS) for (const tone of TONES) for (let k = 0; k < 20; k++) {
      const line = pickLine({ ctx: c, tone, lang, recent: [], roll: k / 20 });
      expect(line).not.toBeNull();
      expect(line!.text.length).toBeLessThanOrEqual(100);
      expect(line!.text).not.toMatch(/undefined|null|NaN|\{|\}/);
      expect(line!.text).not.toMatch(EMOJI);
    }
  });

  it('aturan sinyal: semua lunas, awal bulan, akhir bulan, tunggakan lama', () => {
    const ids = (c: GreetCtx, tone: GreetTone = 'formal') => {
      const out = new Set<string>();
      for (let k = 0; k < 60; k++) { const l = pickLine({ ctx: c, tone, lang: 'id', recent: [], roll: k / 60 }); if (l) out.add(l.id); }
      return out;
    };
    expect(ids(ctx({ belum: 0, lunas: 107, lunasPct: 100 }))).toContain('paid-f');
    expect(ids(ctx({ belum: 0, lunas: 107, lunasPct: 100 }))).not.toContain('unpaid-f');
    expect(ids(ctx({ day: 2 }))).toContain('start-f');
    expect(ids(ctx({ day: 15 }))).not.toContain('start-f');
    expect(ids(ctx({ day: 28, daysInMonth: 30 }))).toContain('end-f');
    expect(ids(ctx({ day: 15 }))).not.toContain('end-f');
    expect(ids(ctx({ arrears: { name: 'YENI', count: 10 } }))).toContain('arrear-f');
    expect(ids(ctx({ arrears: { name: 'ANA', count: 1 } }))).not.toContain('arrear-f');
    expect(ids(ctx({ hour: 1 }))).toContain('late-f');
  });

  it('periode BUKAN bulan berjalan → tidak ada baris berbasis data (hanya kalender/umum)', () => {
    const dataLines = ['paid', 'start', 'end', 'arrear', 'near', 'up', 'income', 'unpaid'];
    for (let k = 0; k < 80; k++) for (const tone of TONES) {
      const l = pickLine({ ctx: ctx({ current: false, day: 29, weekday: 3 }), tone, lang: 'id', recent: [], roll: k / 80 });
      expect(dataLines.some(p => l!.id.startsWith(p + '-')), l!.id).toBe(false);
    }
  });

  it('baris konteks hanya angka dari data yang diberikan', () => {
    const l = pickLine({ ctx: ctx({ day: 29, belum: 12, lunas: 95 }), tone: 'casual', lang: 'id', recent: [], roll: 0 });
    expect(l!.text).toMatch(/12/);
  });

  it('tidak mengulang baris terakhir bila ada alternatif; roll tetap = hasil tetap', () => {
    const c = ctx({ day: 29, daysInMonth: 30, weekday: 5 });
    const a = pickLine({ ctx: c, tone: 'formal', lang: 'id', recent: [], roll: 0.3 })!;
    expect(pickLine({ ctx: c, tone: 'formal', lang: 'id', recent: [], roll: 0.3 })!.id).toBe(a.id);
    for (let k = 0; k < 40; k++) expect(pickLine({ ctx: c, tone: 'formal', lang: 'id', recent: [a.id], roll: k / 40 })!.id).not.toBe(a.id);
  });
});
