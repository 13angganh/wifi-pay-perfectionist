// ══════════════════════════════════════════
// components/features/rekap/RekapView.Table.tsx
// Dipecah dari RekapView.tsx (task 1.15)
// Tabel rekap per baris member
// ══════════════════════════════════════════
'use client';
import { useAppStore } from '@/store/useAppStore';
import { getPay, isFree } from '@/lib/helpers';
import { MONTHS, MONTHS_EN } from '@/lib/constants';

interface Props {
  members:     string[];
  onCellClick: (name: string, month: number) => void;
}

export default function RekapTable({ members, onCellClick }: Props) {
  const { appData, activeZone, selYear, globalLocked, lockedEntries, rekapExpanded, settings } = useAppStore();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  return (
    <div className="rekap-wrap">
      <table className="rtable">
        <thead>
          <tr>
            <th className="stk" style={{ left:0, width:24, minWidth:24, padding:'9px 4px 9px 8px' }}>#</th>
            <th className="stk" style={{ left:24, minWidth:100, textAlign:'left' }}>NAMA</th>
            {MONTH_NAMES.map(m => <th key={m}>{m.slice(0,3)}</th>)}
            <th>TOT</th>
          </tr>
        </thead>
        <tbody>
          {members.map((name, ni) => {
            const locked = globalLocked || (lockedEntries[activeZone+'__'+name] === true);
            let rowTotal = 0;
            return (
              <tr key={name}>
                <td className="stk" style={{ left:0, width:24, minWidth:24, padding:'7px 4px 7px 8px', fontSize:9, color:'var(--txt5)' }}>{ni+1}</td>
                <td className="stk" style={{ left:24, maxWidth:120 }}>{name}</td>
                {MONTHS.map((_, mi) => {
                  const free = isFree(appData, activeZone, name, selYear, mi);
                  const v    = getPay(appData, activeZone, name, selYear, mi);
                  rowTotal  += v || 0;
                  const active = rekapExpanded?.name === name && rekapExpanded?.month === mi;
                  return (
                    <td key={mi}
                      className={`${v !== null ? 'cv' : ''} ${free ? 'cz' : ''} ${active ? 'rekap-exp-cell' : ''}`}
                      onClick={() => !locked && onCellClick(name, mi)}
                      style={{ cursor: locked ? 'default' : 'pointer' }}
                    >
                      {free ? '✦' : v !== null ? (v > 0 ? v : '—') : ''}
                    </td>
                  );
                })}
                <td style={{ fontWeight:700, color:'var(--txt2)' }}>{rowTotal > 0 ? rowTotal : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
