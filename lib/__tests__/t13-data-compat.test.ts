// T13 — kontrak data: data lama (zip v11.7.x/v11.8.0/v11.9.0) tetap terpakai; field baru bersifat opsional dan aman untuk Firebase.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));

import { normalizeImportedData } from '@/lib/db';
import { getMemberPeriods } from '@/lib/memberPeriods';
import { itemFromForm, resolveOpsIcon, OPS_ICON_KEYS } from '@/components/features/operasional/operasional.logic';

const legacyBackup = {
  // bentuk Backup JSON v11.8.0: hanya freeMembers (satu periode), item Operasional tanpa field icon
  krsMembers: ['ABIL', 'ANA'], slkMembers: ['SARI'],
  payments: { 'KRS__ABIL__2026__8': 100 }, memberInfo: {},
  freeMembers: { KRS__ANA: { active: true, fromYear: 2025, fromMonth: 8, toYear: 2026, toMonth: 2 } },
  operasional: { '2026_9': { items: [{ label: 'Bandwidth ISP', nominal: 1200 }, { label: 'Penagih', nominal: 1000 }] } },
};

describe('T13 · kompatibilitas data lama', () => {
  it('Backup JSON lama (hanya freeMembers) tetap bisa diimpor dan free-nya dimigrasikan ke memberPeriods', () => {
    const d = normalizeImportedData(legacyBackup);
    expect(d).not.toBeNull();
    expect(getMemberPeriods(d!, 'KRS', 'ANA')?.free).toEqual([{ fromY: 2025, fromM: 8, toY: 2026, toM: 2 }]);
  });

  it('item Operasional lama tanpa field icon dipertahankan apa adanya (tidak ditambah field apa pun)', () => {
    const d = normalizeImportedData(legacyBackup)!;
    expect(d.operasional['2026_9'].items[0]).toEqual({ label: 'Bandwidth ISP', nominal: 1200 });
    expect('icon' in d.operasional['2026_9'].items[1]).toBe(false);
  });

  it('item lama tanpa icon memakai ikon otomatis dari nama; icon tak dikenal juga jatuh ke otomatis', () => {
    expect(resolveOpsIcon({ label: 'Bandwidth ISP' })).toBe('internet');
    expect(resolveOpsIcon({ label: 'Penagih' })).toBe('other');
    expect(resolveOpsIcon({ label: 'Penagih', icon: 'tidak-ada' })).toBe('other');
    expect(resolveOpsIcon({ label: 'Penagih', icon: 'collector' })).toBe('collector');
  });

  it('itemFromForm: icon kosong = TANPA kunci icon (Firebase set() menolak undefined); icon dipilih = tersimpan', () => {
    const tanpa = itemFromForm({ label: 'Penagih', nominal: '1000', icon: '' });
    expect(Object.keys(tanpa)).toEqual(['label', 'nominal']);
    const dengan = itemFromForm({ label: 'Penagih', nominal: '1000', icon: 'collector' });
    expect(dengan.icon).toBe('collector');
    expect(Object.values(dengan).every(v => v !== undefined)).toBe(true);
  });

  it('Backup JSON baru membawa icon item Operasional dan tidak membuangnya saat diimpor ulang (bolak-balik)', () => {
    const d = normalizeImportedData({ ...legacyBackup, operasional: { '2026_9': { items: [{ label: 'X', nominal: 5, icon: 'rent' }] } } })!;
    const again = normalizeImportedData(JSON.parse(JSON.stringify(d)))!;
    expect(again.operasional['2026_9'].items[0].icon).toBe('rent');
  });

  it('semua kunci ikon Operasional terdaftar punya pemetaan (tidak ada kunci yatim)', () => {
    expect(new Set(OPS_ICON_KEYS).size).toBe(OPS_ICON_KEYS.length);
    expect(OPS_ICON_KEYS).toContain('other');
  });
});
