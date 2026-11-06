// v11.11.1 — pesan WA dan label ekspor mengikuti bahasa app. Teks bahasa Indonesia TIDAK berubah dari sebelumnya.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { doWABlast, doWASummary } from '@/lib/export.wa';
import { exportStatusLabel } from '@/lib/export.excel';
import { emptyAppData } from '@/lib/db';
import type { AppData } from '@/types';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

let openSpy: ReturnType<typeof vi.fn>;
const msgOf = () => decodeURIComponent((openSpy.mock.calls[0][0] as string).replace('https://wa.me/?text=', ''));
const setLang = (language: 'id' | 'en') => localStorage.setItem('wp_settings', JSON.stringify({ language }));

beforeEach(() => { localStorage.clear(); openSpy = vi.fn(); vi.stubGlobal('open', openSpy); });
afterEach(() => { vi.unstubAllGlobals(); });

const data = (): AppData => ({
  ...emptyAppData(),
  krsMembers: ['AA', 'BB'],
  payments: { 'KRS__AA__2026__9': 100 },
});

describe('doWASummary', () => {
  it('Indonesia: format TETAP persis seperti sebelumnya', () => {
    setLang('id');
    doWASummary(data(), 2026, 9, ['KRS']);
    const m = msgOf();
    expect(m).toContain('📶 *WiFi Pay – Rekap Okt 2026*');
    expect(m).toContain('💰 *Pendapatan*');
    expect(m).toContain('  Total: Rp ');
    expect(m).toContain('✅ *Lunas*');
    expect(m).toContain('⚠️ *Belum Bayar Okt 2026*');
    expect(m).toContain('🔴 *Ada Tunggakan*');
    expect(m).toContain('💸 Operasional : Rp ');
    expect(m).toContain('✨ Bersih         : Rp ');
  });

  it('Inggris: judul, label, dan nama bulan mengikuti bahasa', () => {
    setLang('en');
    doWASummary(data(), 2026, 9, ['KRS']);
    const m = msgOf();
    expect(m).toContain('📶 *WiFi Pay – Oct 2026 Summary*');
    expect(m).toContain('💰 *Income*');
    expect(m).toContain('✅ *Paid*');
    expect(m).toContain('⚠️ *Unpaid Oct 2026*');
    expect(m).toContain('🔴 *Has Arrears*');
    expect(m).toContain('💸 Operations : Rp ');
    expect(m).toContain('✨ Net        : Rp ');
    expect(m).not.toMatch(/Pendapatan|Lunas|Tunggakan|Operasional|Bersih/);
  });
});

describe('doWABlast (pesan ke pelanggan)', () => {
  it('Indonesia: teks tetap', () => {
    setLang('id');
    doWABlast('ANI', 'KRS', [{ label: 'Jan 2026' }, { label: 'Feb 2026' }], 100);
    const m = msgOf();
    expect(m).toContain('Halo *ANI*,');
    expect(m).toContain('Tagihan WiFi zona *KRS* bulan *Jan 2026, Feb 2026* (2 bulan)');
    expect(m).toContain('sebesar *Rp 200.000* belum dibayar.');
    expect(m).toContain('Mohon segera melakukan pembayaran. Terima kasih 🙏');
  });
  it('Inggris: seluruh pesan berbahasa Inggris, angka rupiah tetap', () => {
    setLang('en');
    doWABlast('ANI', 'KRS', [{ label: 'Jan 2026' }], 100);
    const m = msgOf();
    expect(m).toContain('Hello *ANI*,');
    expect(m).toContain('WiFi bill for zone *KRS*');
    expect(m).toContain('*Rp 100.000*');
    expect(m).toContain('Thank you 🙏');
    expect(m).not.toMatch(/Halo|Tagihan|Mohon|Terima kasih/);
  });
});

describe('exportStatusLabel', () => {
  it('Indonesia: Lunas / Belum', () => {
    setLang('id');
    expect(exportStatusLabel(data(), 'KRS', 'AA', 2026, 9)).toBe('Lunas');
    expect(exportStatusLabel(data(), 'KRS', 'BB', 2026, 9)).toBe('Belum');
  });
  it('Inggris: Paid / Unpaid', () => {
    setLang('en');
    expect(exportStatusLabel(data(), 'KRS', 'AA', 2026, 9)).toBe('Paid');
    expect(exportStatusLabel(data(), 'KRS', 'BB', 2026, 9)).toBe('Unpaid');
  });
});
