// store/__tests__/viewSlice.test.ts
// v11.5 — unit test untuk viewSlice navigasi:
//   setView (reset period vs keepPeriod), setViewWithPeriod (atomic navigation + auto-expand)
//
// Konteks bug yang diperbaiki: sebelumnya, navigasi dari Dashboard ("klik member tunggakan")
// memanggil setSelMonth/setSelYear/setView secara terpisah, lalu AppShell's pathname-sync
// effect memanggil setView(seg) LAGI saat router.push selesai — yang mereset selYear/selMonth
// balik ke bulan sekarang. Test ini memvalidasi bahwa fix (keepPeriod + setViewWithPeriod)
// benar-benar mencegah reset tersebut.

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createViewSlice, type ViewSlice } from '../slices/viewSlice';

// localStorage mock — viewSlice membaca/menulis wp_global_locked dkk saat init
const lsStore: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => lsStore[k] ?? null,
    setItem:    (k: string, v: string) => { lsStore[k] = v; },
    removeItem: (k: string) => { delete lsStore[k]; },
    clear:      () => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
  },
  writable: true,
});

function makeStore() {
  return create<ViewSlice>(createViewSlice);
}

describe('viewSlice — setView', () => {
  beforeEach(() => { Object.keys(lsStore).forEach(k => delete lsStore[k]); });

  it('reset selYear/selMonth ke bulan sekarang secara default (perilaku lama dipertahankan)', () => {
    const store = makeStore();
    const now = new Date();
    // Set ke periode lampau dulu
    store.getState().setSelYear(2020);
    store.getState().setSelMonth(0);
    // Navigasi biasa tanpa opts — harus reset
    store.getState().setView('rekap');
    expect(store.getState().selYear).toBe(now.getFullYear());
    expect(store.getState().selMonth).toBe(now.getMonth());
    expect(store.getState().currentView).toBe('rekap');
  });

  it('TIDAK reset selYear/selMonth saat keepPeriod:true', () => {
    const store = makeStore();
    store.getState().setSelYear(2024);
    store.getState().setSelMonth(5);
    store.getState().setView('entry', { keepPeriod: true });
    expect(store.getState().selYear).toBe(2024);
    expect(store.getState().selMonth).toBe(5);
    expect(store.getState().currentView).toBe('entry');
  });

  it('clear entryCardYear/Month saat pindah ke view selain entry', () => {
    const store = makeStore();
    store.getState().setEntryCard('BUDI', 2023, 3);
    store.getState().setView('dashboard');
    expect(store.getState().entryCardYear).toEqual({});
    expect(store.getState().entryCardMonth).toEqual({});
  });

  it('TIDAK clear entryCardYear/Month saat pindah ke view entry', () => {
    const store = makeStore();
    store.getState().setEntryCard('BUDI', 2023, 3);
    store.getState().setView('entry');
    expect(store.getState().entryCardYear).toEqual({ BUDI: 2023 });
  });
});

describe('viewSlice — setViewWithPeriod (v11.5 fix)', () => {
  beforeEach(() => { Object.keys(lsStore).forEach(k => delete lsStore[k]); });

  it('set currentView + selYear + selMonth dalam satu operasi atomic', () => {
    const store = makeStore();
    store.getState().setViewWithPeriod('entry', 2024, 2);
    const s = store.getState();
    expect(s.currentView).toBe('entry');
    expect(s.selYear).toBe(2024);
    expect(s.selMonth).toBe(2);
  });

  it('TIDAK menimpa balik period meski dipanggil setelah setSelYear/setSelMonth manual', () => {
    // Simulasi urutan asli: dashboard set selYear/selMonth dulu, lalu pindah view
    const store = makeStore();
    store.getState().setSelYear(2099); // nilai sembarang sebelumnya
    store.getState().setSelMonth(11);
    store.getState().setViewWithPeriod('entry', 2024, 2);
    expect(store.getState().selYear).toBe(2024);
    expect(store.getState().selMonth).toBe(2);
  });

  it('mengubah activeZone jika parameter zone diberikan', () => {
    const store = makeStore();
    store.getState().setViewWithPeriod('entry', 2024, 2, 'SLK');
    expect(store.getState().activeZone).toBe('SLK');
  });

  it('TIDAK mengubah activeZone jika parameter zone tidak diberikan', () => {
    const store = makeStore();
    const before = store.getState().activeZone;
    store.getState().setViewWithPeriod('entry', 2024, 2);
    expect(store.getState().activeZone).toBe(before);
  });

  it('set expandedCard ke targetMember jika diberikan — auto-expand kartu', () => {
    const store = makeStore();
    store.getState().setViewWithPeriod('entry', 2024, 2, 'SLK', 'BUDI');
    expect(store.getState().expandedCard).toBe('BUDI');
  });

  it('mengisi entryCardYear/Month untuk targetMember agar MemberCard default ke bulan yang benar', () => {
    const store = makeStore();
    store.getState().setViewWithPeriod('entry', 2024, 2, 'SLK', 'BUDI');
    expect(store.getState().entryCardYear.BUDI).toBe(2024);
    expect(store.getState().entryCardMonth.BUDI).toBe(2);
  });

  it('expandedCard null jika targetMember tidak diberikan', () => {
    const store = makeStore();
    store.getState().setExpandedCard('SISA_SEBELUMNYA');
    store.getState().setViewWithPeriod('entry', 2024, 2);
    expect(store.getState().expandedCard).toBeNull();
  });

  it('tidak menghapus entryCardYear member lain yang sudah ada saat targetMember diisi (merge, bukan replace)', () => {
    const store = makeStore();
    store.getState().setEntryCard('ANI', 2022, 7);
    store.getState().setViewWithPeriod('entry', 2024, 2, 'SLK', 'BUDI');
    expect(store.getState().entryCardYear.ANI).toBe(2022);
    expect(store.getState().entryCardYear.BUDI).toBe(2024);
  });

  it('simulasi end-to-end: dashboard klik tunggakan tidak menyebabkan reset period oleh setView(keepPeriod) berikutnya', () => {
    // Simulasi: dashboard panggil setViewWithPeriod, lalu AppShell's pathname-sync effect
    // memanggil setView(seg, {keepPeriod:true}) — period TIDAK boleh berubah.
    const store = makeStore();
    store.getState().setViewWithPeriod('entry', 2023, 9, 'KRS', 'SARI');
    store.getState().setView('entry', { keepPeriod: true }); // simulasi AppShell effect
    const s = store.getState();
    expect(s.selYear).toBe(2023);
    expect(s.selMonth).toBe(9);
    expect(s.expandedCard).toBe('SARI');
    expect(s.entryCardYear.SARI).toBe(2023);
  });
});

// ── clearEntryCardFor (v11.5.9) ──────────────────────────────────────────────
// Fix bug: kartu member yang ditutup lalu dibuka lagi setelah toggle period diubah
// tetap menampilkan bulan LAMA (snapshot dari pembukaan pertama), bukan bulan toggle
// terkini — karena entryCardYear/Month[name] tersimpan permanen dan tidak pernah
// dibersihkan saat kartu ditutup. MemberCard.tsx memanggil clearEntryCardFor(name) saat
// kartu ditutup (HANYA jika tidak ada override manual — dilacak via ref lokal komponen,
// tidak bisa diuji di level store test ini, tapi efek clearEntryCardFor itu sendiri bisa).

describe('viewSlice — clearEntryCardFor (v11.5.9)', () => {
  it('menghapus entry SATU member saja, member lain tidak tersentuh', () => {
    const store = makeStore();
    store.getState().setEntryCard('ABIL', 2026, 5); // Jun
    store.getState().setEntryCard('ADIT', 2026, 3); // Apr
    store.getState().clearEntryCardFor('ABIL');
    const s = store.getState();
    expect('ABIL' in s.entryCardYear).toBe(false);
    expect('ABIL' in s.entryCardMonth).toBe(false);
    expect(s.entryCardYear.ADIT).toBe(2026);
    expect(s.entryCardMonth.ADIT).toBe(3);
  });

  it('idempoten: memanggil pada member yang tidak punya entry tidak error dan tidak mengubah apapun', () => {
    const store = makeStore();
    store.getState().setEntryCard('ADIT', 2026, 3);
    store.getState().clearEntryCardFor('TIDAK_ADA');
    const s = store.getState();
    expect(s.entryCardYear.ADIT).toBe(2026);
    expect(Object.keys(s.entryCardYear)).toEqual(['ADIT']);
  });

  it('siklus buka→tutup→ganti toggle→buka lagi: kartu kembali mengikuti toggle terkini (reproduksi bug yang dilaporkan)', () => {
    const store = makeStore();
    // Buka kartu ABIL saat toggle = Jun 2026 (simulasi effect MemberCard saat isExp jadi true)
    store.getState().setSelYear(2026);
    store.getState().setSelMonth(5); // Jun
    store.getState().setEntryCard('ABIL', store.getState().selYear, store.getState().selMonth);
    expect(store.getState().entryCardMonth.ABIL).toBe(5);

    // Tutup kartu TANPA override manual (simulasi effect MemberCard saat isExp jadi false)
    store.getState().clearEntryCardFor('ABIL');
    expect('ABIL' in store.getState().entryCardMonth).toBe(false);

    // User ganti toggle ke Jul
    store.getState().setSelMonth(6);

    // Buka lagi kartu ABIL — snapshot baru harus ambil dari toggle TERKINI (Jul), bukan Jun lama
    store.getState().setEntryCard('ABIL', store.getState().selYear, store.getState().selMonth);
    expect(store.getState().entryCardMonth.ABIL).toBe(6); // Jul, BUKAN 5 (Jun) yang lama
  });

  it('override manual TIDAK dihapus oleh clearEntryCardFor jika komponen memilih tidak memanggilnya (kontrak: pemanggil yang memutuskan, bukan fungsi ini)', () => {
    // clearEntryCardFor sendiri selalu menghapus jika dipanggil — proteksi terhadap override
    // manual ada di LEVEL PEMANGGIL (monthManuallyChanged ref di MemberCard.tsx), bukan di
    // fungsi store ini. Test ini mengunci kontrak itu: fungsi store selalu unconditional,
    // keputusan "kapan memanggil" adalah tanggung jawab caller.
    const store = makeStore();
    store.getState().setEntryCard('ABIL', 2025, 11); // override manual ke Des 2025
    store.getState().clearEntryCardFor('ABIL'); // caller MEMILIH memanggil ini
    expect('ABIL' in store.getState().entryCardYear).toBe(false); // maka terhapus, sesuai kontrak
  });
});

