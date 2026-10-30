// ══════════════════════════════════════════
// components/features/dashboard/DashboardView.RecentActivity.tsx (REDESAIN T7)
// A12 Aktivitas Terbaru: 5 entri terakhir dari appData.activityLog (tanpa field DB baru),
// tautan "Lihat Semua" ke Log. File ini sebelumnya yatim (isinya kartu tunggakan/backup/WA yang
// kini ada di .Unpaid/.Tools); namanya dipakai ulang untuk fitur yang memang sesuai namanya.
// ══════════════════════════════════════════
'use client';

import { clsx } from 'clsx';
import { useState, type CSSProperties, type ElementType } from 'react';
import {
  ArrowCounterClockwise, ArrowsClockwise, CaretRight, FileText, Gift, Globe, Lock,
  Money, PencilSimple, SignIn, SignOut, Trash, UserPlus,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/Card';
import { IconTile, type TileTone } from '@/components/ui/IconTile';
import { useT } from '@/hooks/useT';
import type { ActivityLog } from '@/types';
import s from './dashboard.module.css';

const MAX_ITEMS = 5;
const rise = (i: number) => ({ ['--i' as string]: i }) as CSSProperties;

/** Ikon + warna per jenis aksi (aturan pencocokan sama dengan LogView di zip). */
export function getActivityMeta(action: string): { icon: ElementType; tone: TileTone } {
  const a = action || '';
  if (a.startsWith('[PAY]') || a.includes('Quick Pay') || a.includes('bayar') || a.includes('Bayar')) return { icon: Money, tone: 'lunas' };
  if (a.startsWith('[DEL]') || a.includes('Hapus')) return { icon: Trash, tone: 'belum' };
  if (a.startsWith('[EDIT]') || a.includes('Edit') || a.includes('Ubah')) return { icon: PencilSimple, tone: 'blue' };
  if (a.startsWith('[ADD]') || a.includes('Tambah')) return { icon: UserPlus, tone: 'blue' };
  if (a.startsWith('[RESTORE]') || a.startsWith('[UNDO]') || a.includes('Pulihkan') || a.includes('Batalkan')) return { icon: ArrowCounterClockwise, tone: 'orange' };
  if (a.startsWith('[IP]') || a.includes('Konversi IP')) return { icon: Globe, tone: 'purple' };
  if (a.startsWith('[FREE]') || a.includes('Gratis')) return { icon: Gift, tone: 'purple' };
  if (a.includes('Login') || a.includes('Masuk')) return { icon: SignIn, tone: 'teal' };
  if (a.includes('Logout') || a.includes('Keluar')) return { icon: SignOut, tone: 'slate' };
  if (a.includes('Kunci') || a.includes('Lock')) return { icon: Lock, tone: 'warn' };
  if (a.startsWith('[SYNC]') || a.includes('Sync')) return { icon: ArrowsClockwise, tone: 'blue' };
  return { icon: FileText, tone: 'soft' };
}

/** Buang penanda "[PAY] " di awal; teks aksi selebihnya persis seperti di Log. */
export function stripActionTag(action: string): string {
  return (action || '').replace(/^\[[A-Z_]+\]\s*/, '');
}

/** Nominal "Rp 100.000" dari detail aksi bayar (hanya bila ada di teks log; tidak dihitung ulang). */
export function extractAmount(action: string, detail?: string): string | null {
  if (!action.startsWith('[PAY]') || !detail) return null;
  const m = detail.match(/Rp\s?[\d.,]+/);
  return m ? m[0] : null;
}

/** "Hari ini, 10:24" / "Kemarin, 18:30" / tanggal lokal (format tanggal sama dengan Log). */
export function formatActivityTime(ts: number, now: Date, labels: { today: string; yesterday: string }): string {
  const d = new Date(ts);
  const hm = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return `${labels.today}, ${hm}`;
  if (diffDays === 1) return `${labels.yesterday}, ${hm}`;
  return `${d.toLocaleDateString()} ${hm}`;
}

export function RecentActivity({ logs, onSeeAll }: { logs: ActivityLog[]; onSeeAll: () => void }) {
  const t = useT();
  const [now] = useState(() => new Date());
  const items = [...(logs || [])].sort((a, b) => b.ts - a.ts).slice(0, MAX_ITEMS);
  const labels = { today: t('dashboard.today'), yesterday: t('dashboard.yesterday') };
  return (
    <Card padding="none" className={clsx(s.act, s.rise)} style={rise(11)}>
      <div className={s.actHead}>
        <b>{t('dashboard.recentActivity')}</b>
        <button type="button" className="wp-lnk" onClick={onSeeAll}>
          {t('dashboard.seeAll')} <CaretRight size={11} aria-hidden="true" />
        </button>
      </div>
      {items.length === 0 ? (
        <div className={s.actItem} style={{ justifyContent: 'center', color: 'var(--txt3)', fontSize: 'var(--fs-caption)' }}>
          {t('dashboard.noActivity')}
        </div>
      ) : (
        items.map(l => {
          const meta = getActivityMeta(l.action);
          const amount = extractAmount(l.action, l.detail);
          return (
            <div key={`${l.ts}-${l.action}`} className={s.actItem}>
              <IconTile icon={meta.icon} tone={meta.tone} />
              <div className={s.actTx}>
                <b>{stripActionTag(l.action)}</b>
                <span>{l.detail || l.user || ''}</span>
              </div>
              <div className={s.actEnd}>
                <time dateTime={new Date(l.ts).toISOString()}>{formatActivityTime(l.ts, now, labels)}</time>
                {amount && <b className="wp-num">{amount}</b>}
              </div>
            </div>
          );
        })
      )}
    </Card>
  );
}
