// ══════════════════════════════════════════
// components/features/rekap/RekapView.FilterBar.tsx
// Dipecah dari RekapView.tsx (task 1.15)
// Search box + controls atas tabel rekap
// ══════════════════════════════════════════
'use client';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { getYears } from '@/lib/constants';

export default function RekapFilterBar() {
  const { search, setSearch, selYear, setSelYear } = useAppStore();
  const t = useT();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
      <div className="ctrl-row">
        <select className="cs" value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="search-wrap">
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt4)' }} />
        <input
          className="search-box"
          style={{ paddingLeft:30 }}
          placeholder={t('common.searchMember')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')} aria-label="Hapus pencarian">
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
