// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.RecentActivity.tsx
// Dipecah dari DashboardView.tsx (task 1.15)
// Top tunggakan + operasional + backup + WA summary cards
// ══════════════════════════════════════════
'use client';

import { AlertTriangle, CheckCircle2, ChevronRight, Wallet, Database, Share2 } from 'lucide-react';
import { rp } from '@/lib/helpers';
import { doJSONBackup } from '@/lib/export.json';
import { doWASummary } from '@/lib/export.wa';
import { showToast } from '@/components/ui/Toast';
import { useT } from '@/hooks/useT';
import type { AppData } from '@/types';

interface ArrearItem { z: string; name: string; count: number; oldest: string; }

interface Props {
  top5:        ArrearItem[];
  totalTunggak: number;
  bulanLbl:    string;
  totalOps:    number;
  backupLbl:   string;
  appData:     AppData;
  dy:          number;
  dm:          number;
  onNavTunggakan: () => void;
  onNavOperasional: () => void;
}

export default function DashboardRecentActivity(p: Props) {
  const t = useT();

  const card = {
    background: 'var(--bg2)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--r-md)',
    padding: 16,
    marginBottom: 10,
    boxShadow: 'var(--shadow-sm)',
  } as const;

  return (
    <>
      {/* Top tunggakan */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--txt)', marginBottom:10 }}>
          <AlertTriangle size={14} style={{ color:'var(--c-belum)' }} /> {t('dashboard.topArrears')}
        </div>
        {p.top5.length === 0 ? (
          <div style={{ textAlign:'center', padding:'16px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <CheckCircle2 size={24} style={{ color:'var(--c-lunas)' }} />
            <span style={{ color:'var(--c-lunas)', fontSize:12 }}>{t('dashboard.allPaid')}</span>
          </div>
        ) : (
          p.top5.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < p.top5.length - 1 ? '1px solid var(--border2)' : 'none' }}>
              <div>
                <span style={{ fontSize:13, color:'var(--txt)', fontFamily:"var(--font-mono),monospace" }}>{item.name}</span>
                <span style={{ fontSize:9, color:'var(--txt4)', marginLeft:6 }}>{item.z}</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, color:'var(--c-belum)', fontWeight:700 }}>{item.count} {t('common.months')}</div>
                <div style={{ fontSize:9, color:'var(--txt4)' }}>{t('common.since')} {item.oldest}</div>
              </div>
            </div>
          ))
        )}
        {p.totalTunggak > 5 && (
          <div
            style={{ fontSize:10, color:'var(--txt3)', textAlign:'center', marginTop:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
            onClick={p.onNavTunggakan}
            role="button"
          >
            +{p.totalTunggak - 5} {t('common.more')}
            <ChevronRight size={12} />
          </div>
        )}
      </div>

      {/* Operasional */}
      <div style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={p.onNavOperasional} role="button" aria-label={t('nav.operasional')}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Wallet size={14} style={{ color:'var(--txt3)' }} /> {t('nav.operasional')} {p.bulanLbl}
          </div>
          <div style={{ fontSize:11, color: p.totalOps > 0 ? 'var(--c-belum)' : 'var(--txt4)', marginTop:3 }}>
            {p.totalOps > 0 ? rp(p.totalOps) : t('common.noData')}
          </div>
        </div>
        <ChevronRight size={16} style={{ color:'var(--txt4)', flexShrink:0 }} />
      </div>

      {/* Backup */}
      <div style={{ ...card, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Database size={14} style={{ color:'var(--txt3)' }} /> {t('dashboard.lastBackup')}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)', marginTop:2 }}>{p.backupLbl}</div>
        </div>
        <button
          style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt2)', padding:'8px 14px', borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:11, transition:'all var(--t-fast)', minHeight:40 }}
          onClick={e => { e.stopPropagation(); doJSONBackup(p.appData); showToast('Backup JSON berhasil!'); }}
        >
          {t('dashboard.backupNow')}
        </button>
      </div>

      {/* WA Summary */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--txt)', display:'flex', alignItems:'center', gap:6 }}>
            <Share2 size={14} style={{ color:'var(--txt3)' }} /> {t('dashboard.waSummary')}
          </div>
          <div style={{ fontSize:10, color:'var(--txt4)' }}>{p.bulanLbl}</div>
        </div>
        <button
          style={{ width:'100%', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', color:'var(--c-lunas)', padding:12, borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all var(--t-fast)', minHeight:44, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          onClick={() => doWASummary(p.appData, p.dy, p.dm)}
        >
          <Share2 size={15} />
          {t('dashboard.sendWA')} {p.bulanLbl}
        </button>
        <div style={{ fontSize:9, color:'var(--txt4)', marginTop:6, textAlign:'center' }}>
          {t('dashboard.periodNote')}
        </div>
      </div>
    </>
  );
}
