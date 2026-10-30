// components/modals/RiwayatModal.tsx — REDESAIN T8 (prototype T3 keputusan 8): bottom sheet pada primitive Sheet.
// Perilaku zip dipertahankan: state dari store (riwayatZone/Name/Year), tab tahun + prev/next, ringkasan tahun,
// statistik lintas tahun (total bulan, total bayar, mulai), 12 baris bulan; ketuk baris = buka kartu member itu
// di Entry (setZone → setView → setEntryCard → setExpandedCard → /entry). Dipakai MemberCard, MembersView,
// RekapView, TunggakanView (satu komponen, tanpa duplikasi).
// REDESAIN T12: bulan Belum terdaftar / Nonaktif tanpa pembayaran tampil netral dan tidak masuk penyebut "x/n bulan lunas".
'use client';

import { useRouter } from 'next/navigation';
import { CalendarBlank, CaretLeft, CaretRight, Medal, TrendUp, Wallet } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { MONTHS, getYears, MONTHS_EN } from '@/lib/constants';
import { getPay, isFree, isLunas, rp, getMonthStatus, isNotApplicable } from '@/lib/helpers';
import { useT } from '@/hooks/useT';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip, FilterChips } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import RiwayatMonthRow from './RiwayatModal.MonthRow';
import s from './riwayat.module.css';

interface Props { open: boolean; onClose: () => void; }

export default function RiwayatModal({ open, onClose }: Props) {
  const router = useRouter();
  const {
    appData, settings, riwayatZone, riwayatName, riwayatYear,
    setRiwayatYear, setView, setZone, setEntryCard, setExpandedCard,
  } = useAppStore();

  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS;
  const t = useT();

  if (!riwayatName) return null;

  const info    = appData.memberInfo?.[riwayatZone + '__' + riwayatName] || {};
  const years   = getYears();
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  let lunas = 0; let totalVal = 0; let tracked = 0;
  for (const mi of MONTHS.keys()) {
    if (!isNotApplicable(getMonthStatus(appData, riwayatZone, riwayatName, riwayatYear, mi))) tracked++;
    if (isLunas(appData, riwayatZone, riwayatName, riwayatYear, mi)) {
      lunas++;
      const v = getPay(appData, riwayatZone, riwayatName, riwayatYear, mi);
      if (v !== null && v > 0) totalVal += v;
    }
  }

  // Statistik lintas tahun
  let statLunas = 0; let statNominal = 0; let statFirst = '';
  for (const yr of years) {
    for (let mi = 0; mi < 12; mi++) {
      const sv  = getPay(appData, riwayatZone, riwayatName, yr, mi);
      const sfr = isFree(appData, riwayatZone, riwayatName, yr, mi);
      if (sv !== null || sfr) {
        statLunas++;
        if (sv && sv > 0) statNominal += sv;
        if (!statFirst) statFirst = `${MONTH_NAMES[mi]} ${yr}`;
      }
    }
  }

  function openInEntry(mi: number) {
    setZone(riwayatZone);
    setView('entry');
    setEntryCard(riwayatName, riwayatYear, mi);
    setExpandedCard(riwayatName);
    router.push('/entry');
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      leading={<IconTile icon={CalendarBlank} size="sm" />}
      title={<>{riwayatName} <span className="wp-t-cap">({riwayatZone})</span></>}
    >
      <FilterChips ariaLabel={t('common.year')}>
        {years.map(y => (
          <FilterChip key={y} active={y === riwayatYear} onClick={() => setRiwayatYear(y)}>{y}</FilterChip>
        ))}
      </FilterChips>

      <div className={s.yrNav}>
        <IconButton icon={CaretLeft} label={t('riwayat.prevYear')} disabled={riwayatYear <= minYear}
          onClick={() => riwayatYear > minYear && setRiwayatYear(riwayatYear - 1)} />
        <b className={`wp-num ${s.yrTx}`}>{riwayatYear}</b>
        <IconButton icon={CaretRight} label={t('riwayat.nextYear')} disabled={riwayatYear >= maxYear}
          onClick={() => riwayatYear < maxYear && setRiwayatYear(riwayatYear + 1)} />
      </div>

      <Card variant="flat" padding="none" className={s.sum}>
        <span className={`wp-t-cap ${s.sumTx}`}>{lunas}/{tracked} {t('riwayat.monthsPaid')}</span>
        <b className={`wp-num ${s.sumVal}`}>{rp(totalVal)}</b>
      </Card>

      <div className={s.stt}>
        <div>
          <div className={`wp-t-micro ${s.stl}`}><Medal size={10} aria-hidden="true" /> {t('riwayat.statTotal')}</div>
          <b className={`wp-num ${s.stv}`} style={{ color: 'var(--c-lunas)' }}>{statLunas} {t('riwayat.monthAbbr')}</b>
        </div>
        <div>
          <div className={`wp-t-micro ${s.stl}`}><Wallet size={10} aria-hidden="true" /> {t('riwayat.statBayar')}</div>
          <b className={`wp-num ${s.stv} ${s.stSm}`} style={{ color: 'var(--zc)' }}>{rp(statNominal)}</b>
        </div>
        <div>
          <div className={`wp-t-micro ${s.stl}`}><TrendUp size={10} aria-hidden="true" /> {t('riwayat.statMulai')}</div>
          <b className={`wp-num ${s.stv} ${s.stSm}`}>{statFirst || '—'}</b>
        </div>
      </div>

      <div className={s.rows}>
        {MONTH_NAMES.length === 0 ? (
          <EmptyState icon={CalendarBlank} title={t('common.noData')} description={`${t('riwayat.noHistory')} ${riwayatYear}`} size="md" />
        ) : MONTH_NAMES.map((displayName, mi) => (
          <RiwayatMonthRow
            key={mi}
            displayName={`${displayName} ${riwayatYear}`}
            tgl={(info[`date_${riwayatYear}_${mi}`] as string) || ''}
            value={getPay(appData, riwayatZone, riwayatName, riwayatYear, mi)}
            isFree={isFree(appData, riwayatZone, riwayatName, riwayatYear, mi)}
            na={(s => (isNotApplicable(s) ? s : null))(getMonthStatus(appData, riwayatZone, riwayatName, riwayatYear, mi))}
            onClick={() => openInEntry(mi)}
          />
        ))}
      </div>
    </Sheet>
  );
}
