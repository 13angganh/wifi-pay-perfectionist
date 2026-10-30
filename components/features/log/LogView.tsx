// ══════════════════════════════════════════
// components/features/log/LogView.tsx — layar Log Aktivitas (REDESAIN T10, prototype T5, D4 + A27/A28/A29)
//
// Logika zip yang DIPERTAHANKAN: pencarian substring di aksi + detail (textMatch), filter "Hanya Bayar" (aturan zip,
// log.logic.ts), filter Tahun + Bulan + Reset, batas 150 baris, teks auto-hapus 30 hari, ikon per aksi (dipakai ulang
// dari Dashboard T7, satu sumber aturan), loading/kosong/tidak ada hasil, Log TIDAK dikunci kunci global (D15).
// Yang BERUBAH (disetujui): daftar dikelompokkan per hari, awalan [PAY] dsb. disembunyikan di tampilan (data dan
// pencarian tetap memakai teks asli), A27 tab Data + Sistem, A28 Detail Aktivitas, A29 Statistik, kata "dari"
// lewat i18n (di zip tertulis langsung), state error.
// ══════════════════════════════════════════
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowCounterClockwise, ChartBar, MagnifyingGlass, Scroll, Warning, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { MONTHS, MONTHS_EN, getYears } from '@/lib/constants';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Segmented';
import { Select } from '@/components/ui/Select';
import { SkeletonList } from '@/components/ui/Skeleton';
import { extractAmount, getActivityMeta, stripActionTag } from '@/components/features/dashboard/DashboardView.RecentActivity';
import type { ActivityLog } from '@/types';
import LogDetailSheet from './LogView.Detail';
import LogStatsSheet from './LogView.Stats';
import { LOG_DETAIL_EVENT, takePendingLogDetail } from './logDetailBridge';
import {
  LOG_LIMIT, countByKind, filterLogs, findLogByTs, formatClock, groupByDay, isFilterActive,
  type LogFilterType,
} from './log.logic';
import l from './log.module.css';

export default function LogView() {
  const { appData, syncStatus, logSearch, setLogSearch, logType, setLogType } = useAppStore();
  const [logYear, setLogYear] = useState('');
  const [logMonth, setLogMonth] = useState('');
  const [detail, setDetail] = useState<ActivityLog | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const t = useT();
  const lang = useAppStore(s => s.settings).language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;

  const logs = useMemo(() => appData.activityLog || [], [appData.activityLog]);
  const filter = { type: logType as LogFilterType, query: logSearch, year: logYear, month: logMonth };
  const filtered = filterLogs(logs, filter);
  const base = filterLogs(logs, filter, true);      // tanpa jenis → jumlah per tab + bahan Statistik
  const counts = countByKind(base);
  const active = isFilterActive(filter);
  const shown = filtered.slice(0, LOG_LIMIT);
  const groups = groupByDay(shown, new Date(), { today: t('dashboard.today'), yesterday: t('dashboard.yesterday') });

  // Pusat Notifikasi → Detail Log (permintaan tertunda saat layar dibuka + event saat sudah terbuka)
  useEffect(() => {
    const open = () => {
      const ts = takePendingLogDetail();
      if (ts === null) return;
      const found = findLogByTs(useAppStore.getState().appData.activityLog || [], ts);
      if (found) setDetail(found); else showToast(t('log.notFound'), 'warn');
    };
    open();
    window.addEventListener(LOG_DETAIL_EVENT, open);
    return () => window.removeEventListener(LOG_DETAIL_EVENT, open);
  }, [t]);

  function reset() { setLogSearch(''); setLogYear(''); setLogMonth(''); setLogType('all'); }

  const loading = syncStatus === 'loading' && logs.length === 0;
  const failed = syncStatus === 'err' && logs.length === 0;

  return (
    <div className={l.root}>
      <div className="wp-pbar">
        <Select size="sm" aria-label={t('log.yearAria')} value={logYear} onChange={e => setLogYear(e.target.value)}>
          <option value="">{t('log.allYears')}</option>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select size="sm" aria-label={t('log.monthAria')} value={logMonth} onChange={e => setLogMonth(e.target.value)}>
          <option value="">{t('log.allMonths')}</option>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <IconButton icon={ArrowCounterClockwise} label={t('log.resetAria')} onClick={reset} />
      </div>

      <Segmented
        ariaLabel={t('log.typeAria')}
        value={logType as LogFilterType}
        onChange={v => setLogType(v)}
        options={[
          { value: 'all', label: t('common.all'), count: base.length },
          { value: 'pay', label: t('log.payOnly'), count: counts.pay },
          { value: 'data', label: t('log.typeData'), count: counts.data },
          { value: 'sys', label: t('log.typeSystem'), count: counts.sys },
        ]}
      />

      <div className={l.search}>
        <div className={l.searchFld}>
          <Input
            aria-label={t('log.searchPlaceholder')}
            placeholder={t('log.searchPlaceholder')}
            autoComplete="off"
            leftIcon={<MagnifyingGlass aria-hidden="true" />}
            rightIcon={logSearch ? (
              <button type="button" className={l.clr} onClick={() => setLogSearch('')} aria-label={t('log.searchClear')}><X aria-hidden="true" /></button>
            ) : undefined}
            value={logSearch}
            onChange={e => setLogSearch(e.target.value)}
          />
        </div>
        <IconButton icon={ChartBar} label={t('log.stats')} onClick={() => setStatsOpen(true)} />
      </div>

      {loading ? (
        <SkeletonList count={6} />
      ) : failed ? (
        <EmptyState icon={Warning} title={t('log.loadErrorTitle')} description={t('log.loadErrorDesc')} size="md"
          action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>{t('common.retry')}</Button>} />
      ) : (
        <>
          <div className={l.count}>
            {filtered.length} {t('log.countOf')} {logs.length} {t('log.autoDelete')}
          </div>
          <div id="log-items" className={l.groups}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={Scroll}
                title={active ? t('common.noResult') : t('log.empty')}
                description={active ? t('log.noResultsDesc') : t('log.emptyDesc')}
                size="md"
                action={active ? <Button variant="secondary" size="sm" onClick={reset}>{t('action.reset')}</Button> : undefined}
              />
            ) : groups.map(g => (
              <section key={g.key} className={l.group} aria-label={g.label}>
                <h3 className={l.day}>{g.label}</h3>
                <Card padding="none" className={l.card}>
                  {g.items.map((x, i) => {
                    const meta = getActivityMeta(x.action);
                    const amount = extractAmount(x.action, x.detail);
                    return (
                      <button key={`${x.ts}-${i}`} type="button" className={l.item} onClick={() => setDetail(x)}
                        aria-label={`${t('log.openDetail')}: ${stripActionTag(x.action)}`}>
                        <IconTile icon={meta.icon} tone={meta.tone} size="sm" />
                        <span className={l.tx}>
                          <b className={l.act}>{stripActionTag(x.action) || '—'}</b>
                          {x.detail && <small className={l.det}>{x.detail}</small>}
                        </span>
                        <span className={l.end}>
                          {amount && <em className={`wp-num ${l.amt}`}>{amount}</em>}
                          <small>{formatClock(x.ts)}</small>
                          <small className={l.who}>{x.user || '—'}</small>
                        </span>
                      </button>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>
        </>
      )}

      {detail && <LogDetailSheet key={detail.ts} log={detail} onClose={() => setDetail(null)} />}
      {statsOpen && (
        <LogStatsSheet
          logs={base}
          year={logYear}
          month={logMonth}
          lang={lang}
          onClose={() => setStatsOpen(false)}
          onOpen={x => { setStatsOpen(false); setDetail(x); }}
        />
      )}
    </div>
  );
}
