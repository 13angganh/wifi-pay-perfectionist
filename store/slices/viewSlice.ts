// store/slices/viewSlice.ts
// Domain: navigasi, zone, entry state, lock, member tab

import type { StateCreator } from 'zustand';
import type { Zone, ViewName, FilterStatus } from '@/types';

function getLS(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}
function setLS(key: string, val: string) {
  if (typeof window !== 'undefined') localStorage.setItem(key, val);
}

export interface ViewSlice {
  // Zone & view
  activeZone:  Zone;
  currentView: ViewName;
  setZone:     (z: Zone) => void;
  setView:     (v: ViewName, opts?: { keepPeriod?: boolean }) => void;
  // v11.5: navigasi atomic ke view tertentu dengan periode (tahun/bulan) eksplisit.
  // Dipakai saat klik member tunggakan di dashboard agar langsung lompat ke bulan yang benar
  // tanpa race dengan reset period di setView biasa.
  setViewWithPeriod: (v: ViewName, year: number, month: number, zone?: Zone, targetMember?: string) => void;

  // Period selector (dashboard/rekap/entry global)
  selYear:     number;
  selMonth:    number;
  setSelYear:  (y: number) => void;
  setSelMonth: (m: number) => void;

  // Entry per-card state
  entryCardYear:  Record<string, number>;
  entryCardMonth: Record<string, number>;
  setEntryCard:   (name: string, year: number, month: number) => void;
  clearEntryCard: () => void;
  entryScrollTop:    number;
  setEntryScrollTop: (v: number) => void;

  // Search & filter
  search:       string;
  setSearch:    (s: string) => void;
  filterStatus: FilterStatus;
  setFilter:    (f: FilterStatus) => void;
  expandedCard: string | null;
  setExpandedCard: (n: string | null) => void;

  // Lock
  globalLocked:     boolean;
  lockedEntries:    Record<string, boolean>;
  membersLocked:    boolean;
  setGlobalLocked:  (v: boolean) => void;
  setLockedEntries: (v: Record<string, boolean>) => void;
  setMembersLocked: (v: boolean) => void;

  // Member tab
  memberTab:        'active' | 'deleted';
  setMemberTab:     (t: 'active' | 'deleted') => void;
  newMemberZone:    Zone;
  setNewMemberZone: (z: Zone) => void;

  // Rekap expanded
  rekapExpanded:    { name: string; month: number } | null;
  setRekapExpanded: (v: { name: string; month: number } | null) => void;

  // Operasional
  opsYear:     number;
  opsMonth:    number;
  setOpsYear:  (y: number) => void;
  setOpsMonth: (m: number) => void;

  // Riwayat modal
  riwayatYear: number;
  riwayatZone: Zone;
  riwayatName: string;
  setRiwayatYear: (y: number) => void;
  setRiwayatZone: (z: Zone) => void;
  setRiwayatName: (n: string) => void;

  // Log
  logSearch:    string;
  logType:      'all' | 'pay';
  setLogSearch: (s: string) => void;
  setLogType:   (t: 'all' | 'pay') => void;

  // Batch action (Entry)
  batchMode:        boolean;
  batchSelected:    string[];
  batchYear:        number;
  batchMonth:       number;
  setBatchMode:     (v: boolean) => void;
  setBatchSelected: (v: string[]) => void;
  setBatchPeriod:   (year: number, month: number) => void;
  toggleBatchMember: (name: string) => void;
  clearBatch:       () => void;
}

const now = new Date();

export const createViewSlice: StateCreator<ViewSlice> = (set) => ({
  // Zone & view
  activeZone:  'KRS',
  currentView: 'dashboard',
  setZone: (z) => set({
    activeZone: z, search: '', filterStatus: 'all',
    expandedCard: null, entryCardYear: {}, entryCardMonth: {},
  }),
  setView: (v, opts) => set(() => {
    const _n = new Date();
    const keepPeriod = opts?.keepPeriod === true;
    return {
      currentView: v,
      search: '', filterStatus: 'all',
      entryScrollTop: 0, rekapExpanded: null,
      // FIX 6 (v11.2): reset ke bulan/tahun saat ini setiap navigasi biasa.
      // v11.5: kecuali jika keepPeriod=true (dipanggil dari setViewWithPeriod / navigasi terprogram).
      ...(keepPeriod ? {} : { selYear: _n.getFullYear(), selMonth: _n.getMonth() }),
      // v11.5 FIX: keepPeriod=true berarti "navigasi ini murni sinkronisasi" (dipanggil oleh
      // AppShell's pathname-sync effect setelah router.push) — JANGAN hapus expandedCard /
      // entryCardYear / entryCardMonth yang baru saja di-set oleh setViewWithPeriod, atau
      // auto-expand kartu member dari dashboard "klik tunggakan" akan tertimpa balik ke null
      // tepat setelah berhasil di-set (race condition yang sama persis yang ingin dihindari).
      ...(keepPeriod
        ? {}
        : {
            expandedCard: null,
            ...(v !== 'entry' ? { entryCardYear: {}, entryCardMonth: {} } : {}),
          }),
    };
  }),
  // v11.5: set currentView + selYear + selMonth dalam satu operasi atomic — menghindari
  // race condition saat dashboard "klik tunggakan" perlu pindah ke Entry pada bulan tertentu.
  // targetMember opsional: jika diisi, kartu member tersebut otomatis ter-expand pada
  // bulan/tahun yang dituju (entryCardYear/Month per-member juga di-set agar konsisten
  // dengan logika default MemberCard yang membaca entryCardYear[name] bukan selYear global).
  setViewWithPeriod: (v, year, month, zone, targetMember) => set((s) => ({
    currentView: v, expandedCard: targetMember ?? null,
    search: '', filterStatus: 'all',
    entryScrollTop: 0, rekapExpanded: null,
    selYear: year, selMonth: month,
    ...(zone ? { activeZone: zone } : {}),
    entryCardYear:  targetMember ? { ...s.entryCardYear,  [targetMember]: year  } : (v !== 'entry' ? {} : s.entryCardYear),
    entryCardMonth: targetMember ? { ...s.entryCardMonth, [targetMember]: month } : (v !== 'entry' ? {} : s.entryCardMonth),
  })),

  // Period selector
  selYear:     now.getFullYear(),
  selMonth:    now.getMonth(),
  setSelYear:  (y) => set({ selYear: y }),
  setSelMonth: (m) => set({ selMonth: m }),

  // Entry per-card
  entryCardYear:  {},
  entryCardMonth: {},
  setEntryCard: (name, year, month) => set((s) => ({
    entryCardYear:  { ...s.entryCardYear,  [name]: year  },
    entryCardMonth: { ...s.entryCardMonth, [name]: month },
  })),
  clearEntryCard:    () => set({ entryCardYear: {}, entryCardMonth: {} }),
  entryScrollTop:    0,
  setEntryScrollTop: (v) => set({ entryScrollTop: v }),

  // Search & filter
  search:       '',
  setSearch:    (s) => set({ search: s }),
  filterStatus: 'all',
  setFilter:    (f) => set({ filterStatus: f }),
  expandedCard: null,
  setExpandedCard: (n) => set({ expandedCard: n }),

  // Lock
  globalLocked:  getLS('wp_global_locked', '0') === '1',
  lockedEntries: (() => { try { return JSON.parse(getLS('wp_locked_entries', '{}')); } catch { return {}; } })(),
  membersLocked: getLS('wp_members_locked', '0') === '1',
  setGlobalLocked: (v) => { setLS('wp_global_locked', v ? '1' : '0'); set({ globalLocked: v }); },
  setLockedEntries: (v) => { setLS('wp_locked_entries', JSON.stringify(v)); set({ lockedEntries: v }); },
  setMembersLocked: (v) => { setLS('wp_members_locked', v ? '1' : '0'); set({ membersLocked: v }); },

  // Member tab
  memberTab:        'active',
  setMemberTab:     (t) => set({ memberTab: t }),
  newMemberZone:    'KRS',
  setNewMemberZone: (z) => set({ newMemberZone: z }),

  // Rekap
  rekapExpanded:    null,
  setRekapExpanded: (v) => set({ rekapExpanded: v }),

  // Ops
  opsYear:     now.getFullYear(),
  opsMonth:    now.getMonth(),
  setOpsYear:  (y) => set({ opsYear: y }),
  setOpsMonth: (m) => set({ opsMonth: m }),

  // Riwayat
  riwayatYear: now.getFullYear(),
  riwayatZone: 'KRS',
  riwayatName: '',
  setRiwayatYear: (y) => set({ riwayatYear: y }),
  setRiwayatZone: (z) => set({ riwayatZone: z }),
  setRiwayatName: (n) => set({ riwayatName: n }),

  // Log
  logSearch:    '',
  logType:      'all',
  setLogSearch: (s) => set({ logSearch: s }),
  setLogType:   (t) => set({ logType: t }),

  // Batch action (Entry)
  batchMode:     false,
  batchSelected: [],
  batchYear:     now.getFullYear(),
  batchMonth:    now.getMonth(),
  setBatchMode:  (v) => set({ batchMode: v }),
  setBatchSelected: (v) => set({ batchSelected: v }),
  setBatchPeriod: (year, month) => set({ batchYear: year, batchMonth: month }),
  toggleBatchMember: (name) => set((s) => {
    const exists = s.batchSelected.includes(name);
    return { batchSelected: exists ? s.batchSelected.filter(n => n !== name) : [...s.batchSelected, name] };
  }),
  clearBatch: () => set({ batchMode: false, batchSelected: [], }),
});
