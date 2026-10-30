// ══════════════════════════════════════════
// components/modals/GlobalSearch.tsx — pencarian member lintas zona (REDESAIN T11)
// Logika zip UTUH: cari fuzzy di semua zona aktif (getAllActiveZones + getMembersForZone), status pembayaran periode
// terpilih, ketuk hasil = ke Entry (zona + kartu member terbuka). Tampilan: primitive Sheet + token (tanpa lucide /
// framer-motion / warna literal). Lencana zona lewat zoneCssColor: zona kustom = KRS/SLK (dulu jatuh ke gaya SLK).
// REDESAIN T12: member Belum terdaftar / Nonaktif pada periode terpilih (tanpa pembayaran) tampil dengan label itu,
// bukan "Belum" (tidak terhitung).
// ══════════════════════════════════════════
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Gift, MagnifyingGlass, Prohibit, XCircle, X } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { getPay, isFree, rp, fuzzyMatch, getAllActiveZones, getMembersForZone, getMonthStatus, isNotApplicable } from '@/lib/helpers';
import { zoneCssColor } from '@/lib/design-tokens';
import { useT } from '@/hooks/useT';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import s from './globalSearch.module.css';

interface Props { open: boolean; onClose: () => void; }

type Row = {
  z: string; name: string;
  paid: boolean; free: boolean; val: number | null;
  na: 'nonaktif' | 'belumTerdaftar' | null;
  id?: string; ip?: string; tarif?: number;
};

export default function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter();
  const { appData, selYear, selMonth, setView, setZone, setExpandedCard, settings } = useAppStore();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    setQ(''); // eslint-disable-line react-hooks/set-state-in-effect
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const customZones = settings.customZones ?? [];
  const results: Row[] = [];

  for (const z of getAllActiveZones(settings)) { // zona kustom ikut dicari
    for (const name of getMembersForZone(z, appData)) {
      if (!q.trim() || fuzzyMatch(name, q)) {
        const info = appData.memberInfo?.[z + '__' + name] || {};
        const val = getPay(appData, z, name, selYear, selMonth);
        const mStatus = getMonthStatus(appData, z, name, selYear, selMonth);
        results.push({
          z, name, paid: val !== null, free: isFree(appData, z, name, selYear, selMonth), val,
          na: isNotApplicable(mStatus) ? mStatus : null,
          id: info.id as string, ip: info.ip as string, tarif: info.tarif as number,
        });
      }
    }
  }

  function gotoMember(z: string, name: string) {
    setZone(z);
    setView('entry');
    setExpandedCard(name);
    router.push('/entry');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} variant="dialog" wide title={t('globalsearch.title')}>
      <div className={s.field}>
        <div className="wp-field">
          <div className="wp-inpw">
            <span className="wp-inpw__ico" aria-hidden="true"><MagnifyingGlass /></span>
            <input
              ref={inputRef}
              className="wp-inp"
              type="text"
              autoComplete="off"
              placeholder={t('globalsearch.placeholder')}
              aria-label={t('header.searchMember')}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {q && (
              <span className="wp-inpw__end" style={{ pointerEvents: 'auto' }}>
                <button
                  type="button"
                  className={s.clear}
                  aria-label={t('entry.clearSearch')}
                  onClick={() => { setQ(''); inputRef.current?.focus(); }}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {!q.trim() ? (
        <EmptyState icon={MagnifyingGlass} title={t('globalsearch.hint')} size="sm" />
      ) : results.length === 0 ? (
        <EmptyState icon={XCircle} title={t('common.noResult')} description={`${t('globalsearch.notFound')} "${q}"`} size="sm" />
      ) : (
        <ul className={s.list} aria-label={t('globalsearch.title')}>
          {results.map(r => {
            const status = r.na ? 'na' : r.free ? 'free' : r.paid ? 'paid' : 'unpaid';
            return (
              <li key={`${r.z}__${r.name}`}>
                <button type="button" className={s.item} data-status={status} onClick={() => gotoMember(r.z, r.name)}>
                  <Badge variant="zone" size="xs" color={zoneCssColor(r.z, customZones)}>{r.z}</Badge>
                  <span className={s.main}>
                    <span className={s.name}>{r.name}</span>
                    {r.id && <span className={s.sub}>{r.id}{r.ip ? ' · ' + r.ip : ''}</span>}
                  </span>
                  <span className={s.end}>
                    <span className={s.st} data-status={status}>
                      {r.na ? (
                        <><Prohibit aria-hidden="true" /> {t(`status.${r.na}`)}</>
                      ) : r.free ? (
                        <><Gift weight="fill" aria-hidden="true" /> {t('status.free')}</>
                      ) : r.paid && r.val === 0 ? (
                        <><CheckCircle weight="fill" aria-hidden="true" /> {t('rekap.accumulation')}</>
                      ) : r.paid ? (
                        <><CheckCircle weight="fill" aria-hidden="true" /> {r.val?.toLocaleString('id-ID')}</>
                      ) : (
                        <><XCircle weight="fill" aria-hidden="true" /> {t('status.belum')}</>
                      )}
                    </span>
                    {r.tarif ? <span className={s.tarif}>{t('members.tarifShort')}: {rp(r.tarif)}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
