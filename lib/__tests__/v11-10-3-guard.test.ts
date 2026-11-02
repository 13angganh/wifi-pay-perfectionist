// lib/__tests__/v11-10-3-guard.test.ts — penjaga regresi level sumber untuk v11.10.3.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('v11.10.3 — Beranda: satu tombol, aksi di tengah', () => {
  const css = read('components/features/dashboard/dashboard.module.css');
  const rule = (sel: string) => css.split('\n').find(l => l.startsWith(sel)) ?? '';

  it('"+N lainnya ›" = satu tombol flex rata tengah (panah tidak turun ke baris baru)', () => {
    const r = rule('.moreLink {');
    expect(r).toContain('display: flex');
    expect(r).toContain('justify-content: center');
    expect(read('styles/ui.css')).toMatch(/\.wp-lnk \{[^}]*display: inline-flex/);
  });

  it('baris tombol Cadangan / Ringkasan WA: baris sendiri + rata tengah', () => {
    const r = rule('.rowActs {');
    expect(r).toContain('flex: 1 0 100%');
    expect(r).toContain('justify-content: center');
    const tools = read('components/features/dashboard/DashboardView.Tools.tsx');
    // tombol WA kini dibungkus rowActs (sama seperti tombol Cadangan)
    expect(tools).toMatch(/<div className=\{s\.rowActs\}>\s*<Button variant="success"/);
  });

  it('class global di CSS module memakai :global() — "sejak Jun 2025" tidak lagi menempel pada "5 bulan"', () => {
    expect(rule('.trEnd :global')).toContain(':global(.wp-t-micro)');
  });
});

describe('v11.10.3 — pencarian & scroll Entri', () => {
  it('Entri, Rekap, Tunggakan memakai SearchField bersama (bukan salinan markup)', () => {
    for (const f of [
      'components/features/entry/EntryView.tsx',
      'components/features/rekap/RekapView.FilterBar.tsx',
      'components/features/tunggakan/TunggakanView.tsx',
    ]) {
      const src = read(f);
      expect(src, f).toContain('<SearchField');
      expect(src, f).toContain('useMemberSearchPlaceholder');
      expect(src, f).not.toContain('wp-inpw');
    }
  });

  it('handler scroll Entri tidak memanggil setEntryScrollTop (tulis store tiap frame)', () => {
    expect(read('components/features/entry/EntryView.tsx')).not.toMatch(/setEntryScrollTop\(/);
  });

  it('MemberCard memasang RiwayatModal hanya saat dibuka (bukan 107 modal tersembunyi berlangganan seluruh store)', () => {
    const src = read('components/features/members/MemberCard.tsx');
    expect(src).toMatch(/\{riwOpen && typeof window !== 'undefined' && createPortal\(/);
    expect(src).not.toMatch(/<RiwayatModal open=\{riwOpen\}/);
  });

  it('layar daftar utama berlangganan store dengan useShallow (bukan seluruh store)', () => {
    for (const f of [
      'components/features/entry/EntryView.tsx',
      'components/features/members/MemberCard.tsx',
      'components/features/rekap/RekapView.tsx',
      'components/features/tunggakan/TunggakanView.tsx',
      'components/features/members/MembersView.tsx',
      'components/features/dashboard/DashboardView.tsx',
    ]) {
      const src = read(f);
      expect(src, f).not.toMatch(/\} = useAppStore\(\);/);
      expect(src, f).toContain('useShallow');
    }
  });
});
