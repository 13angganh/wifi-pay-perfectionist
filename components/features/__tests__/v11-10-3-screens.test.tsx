// components/features/__tests__/v11-10-3-screens.test.tsx
// v11.10.3 — render sungguhan: (1) placeholder pencarian seragam Entri/Rekap/Tunggakan, (2) scroll Entri TIDAK menulis ke store
// dan perubahan store yang tidak relevan tidak merender ulang daftar member (penyebab scroll Entri tertunda).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Profiler } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_APP_DATA } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/types';
import type { AppData } from '@/types';
import EntryView from '../entry/EntryView';
import RekapView from '../rekap/RekapView';
import TunggakanView from '../tunggakan/TunggakanView';

vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, default: {} }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: nav.push }) }));

const Y = 2026, M = 9;

function makeData(): AppData {
  return {
    ...DEFAULT_APP_DATA,
    krsMembers: ['ABIL', 'ADIT', 'AKBAR'],
    slkMembers: ['SARI'],
    zoneMembers: {},
    payments: { [`KRS__ADIT__${Y}__${M}`]: 100 },
    memberInfo: { KRS__ABIL: { tarif: 100 }, KRS__ADIT: { tarif: 100 }, KRS__AKBAR: { tarif: 150 } },
    freeMembers: {}, deletedMembers: {}, operasional: {}, activityLog: [],
  };
}

function setup(zone = 'KRS') {
  useAppStore.setState({
    appData: makeData(),
    settings: { ...DEFAULT_SETTINGS, language: 'id', customZones: [], hiddenZones: [] },
    activeZone: zone, selYear: Y, selMonth: M,
    uid: '', userEmail: 'hakiki@test.com', userName: 'Hakiki',
    search: '', filterStatus: 'all', batchMode: false, batchSelected: [], expandedCard: null,
    globalLocked: false, lockedEntries: {}, syncStatus: 'ok', entryScrollTop: 0,
  } as never);
}

beforeEach(() => { nav.push.mockClear(); setup(); });

describe('v11.10.3 #2 — placeholder pencarian seragam', () => {
  it('Entri, Rekap, dan Tunggakan memakai teks yang sama persis, mengikuti zona aktif', () => {
    const texts: string[] = [];
    for (const [View, testId] of [[EntryView, 'entry-search'], [RekapView, 'rekap-search'], [TunggakanView, 'tunggakan-search']] as const) {
      const r = render(<View />);
      texts.push((screen.getByTestId(testId) as HTMLInputElement).placeholder);
      r.unmount();
    }
    expect(texts).toEqual(['Cari nama pelanggan di KRS...', 'Cari nama pelanggan di KRS...', 'Cari nama pelanggan di KRS...']);
  });

  it('ikut berganti saat zona aktif berganti, dan tombol hapus seragam di ketiga layar', () => {
    setup('SLK');
    for (const [View, testId] of [[EntryView, 'entry-search'], [RekapView, 'rekap-search'], [TunggakanView, 'tunggakan-search']] as const) {
      const r = render(<View />);
      const box = screen.getByTestId(testId) as HTMLInputElement;
      expect(box.placeholder).toBe('Cari nama pelanggan di SLK...');
      expect(box).toHaveAttribute('aria-label', 'Cari pelanggan');
      expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).toBeNull();
      act(() => { useAppStore.setState({ search: 'ad' } as never); });
      expect(screen.getByRole('button', { name: 'Hapus pencarian' })).toBeInTheDocument();
      act(() => { useAppStore.setState({ search: '' } as never); });
      r.unmount();
    }
  });
});

describe('v11.10.3 #3 — scroll Entri tidak menyebabkan render ulang berantai', () => {
  let content: HTMLDivElement;
  beforeEach(() => {
    content = document.createElement('div');
    content.id = 'content';
    document.body.appendChild(content);
    window.history.pushState({}, '', '/entry');
  });
  afterEach(() => { content.remove(); window.history.pushState({}, '', '/'); });

  it('event scroll pada #content TIDAK menulis ke store (dulu setEntryScrollTop tiap frame)', async () => {
    render(<EntryView />);
    let notified = 0;
    const unsub = useAppStore.subscribe(() => { notified++; });
    for (let i = 1; i <= 5; i++) {
      content.scrollTop = i * 120;
      content.dispatchEvent(new Event('scroll'));
      await act(async () => { await new Promise(r => requestAnimationFrame(() => r(null))); });
    }
    unsub();
    expect(notified).toBe(0);
    expect(useAppStore.getState().entryScrollTop).toBe(0);
  });

  it('perubahan store yang tidak dipakai Entri (mis. entryScrollTop) tidak merender ulang EntryView + kartu', () => {
    let renders = 0;
    render(<Profiler id="entry" onRender={() => { renders++; }}><EntryView /></Profiler>);
    const base = renders;
    act(() => { useAppStore.setState({ entryScrollTop: 480 } as never); });
    act(() => { useAppStore.setState({ entryScrollTop: 960 } as never); });
    expect(renders).toBe(base);
    // sebaliknya, perubahan yang relevan (pencarian) tetap merender ulang
    act(() => { useAppStore.setState({ search: 'ab' } as never); });
    expect(renders).toBeGreaterThan(base);
  });
});
