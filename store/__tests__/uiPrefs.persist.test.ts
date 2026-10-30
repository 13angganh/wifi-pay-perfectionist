// T13 (spesifikasi 5.1 butir 5) — preferensi perangkat: tahan muat ulang, dan data situs kosong/rusak → bawaan.
import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

async function freshStore() {
  vi.resetModules();
  return (await import('@/store/useAppStore')).useAppStore;
}

describe('T13 — preferensi tampilan per perangkat (wp_text_size, wp_hidden_cards)', () => {
  beforeEach(() => { localStorage.clear(); });

  it('Ukuran Teks Besar bertahan setelah muat ulang (store dibuat ulang)', async () => {
    const a = await freshStore();
    a.getState().setTextSize('large');
    const b = await freshStore();
    expect(b.getState().textSize).toBe('large');
  });

  it('kartu yang disembunyikan bertahan setelah muat ulang; Tampilkan semua juga tersimpan', async () => {
    const a = await freshStore();
    a.getState().toggleCardVisible('entry', 'sum');
    a.getState().toggleCardVisible('entry', 'pot');
    const b = await freshStore();
    expect(b.getState().hiddenCards.entry).toEqual(['sum', 'pot']);
    b.getState().showAllCards('entry');
    const c = await freshStore();
    expect(c.getState().hiddenCards.entry).toEqual([]);
  });

  it('data situs dihapus (localStorage kosong) → bawaan: Normal dan semua kartu tampil', async () => {
    const a = await freshStore();
    a.getState().setTextSize('large'); a.getState().toggleCardVisible('rekap', 'sum');
    localStorage.clear();
    const b = await freshStore();
    expect(b.getState().textSize).toBe('normal');
    expect(b.getState().hiddenCards).toEqual({});
  });

  it('nilai rusak → bawaan, tanpa galat', async () => {
    localStorage.setItem('wp_text_size', 'raksasa');
    localStorage.setItem('wp_hidden_cards', '{bukan json');
    const a = await freshStore();
    expect(a.getState().textSize).toBe('normal');
    expect(a.getState().hiddenCards).toEqual({});
  });

  it.each([
    ['array', '[1,2,3]', {}],
    ['angka', '42', {}],
    ['null', 'null', {}],
    ['nilai per layar bukan array', '{"entry":"sum","rekap":["chips"]}', { rekap: ['chips'] }],
    ['isi array bukan string', '{"entry":["sum",5,null,"pot"]}', { entry: ['sum', 'pot'] }],
  ])('struktur wp_hidden_cards salah (%s) dibersihkan; toggle tetap aman', async (_n, raw, expected) => {
    localStorage.setItem('wp_hidden_cards', raw);
    const a = await freshStore();
    expect(a.getState().hiddenCards).toEqual(expected);
    const wasHidden = (expected as Record<string, string[]>).entry?.includes('sum') ?? false;
    expect(() => a.getState().toggleCardVisible('entry', 'sum')).not.toThrow();
    expect(a.getState().hiddenCards.entry?.includes('sum') ?? false).toBe(!wasHidden);   // toggle membalik keadaan
  });
});
