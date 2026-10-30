// ══════════════════════════════════════════
// components/ui/OnboardingHint.tsx — panduan awal (REDESAIN T10, D13)
// Logika zip UTUH: tiga langkah, tampil sekali (localStorage `wifipay_onboarding_done`), `forceShow`, lewati/lanjut/
// selesai. Tampilan: Sheet primitive + IconTile + titik langkah; teks lewat i18n. PERBAIKAN ZONA KUSTOM: teks langkah
// zona tidak menyebut KRS/SLK tertanam ("tab zona di header"); ikon Phosphor menggantikan SVG inline.
// ══════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { CreditCard, List, MapTrifold } from '@phosphor-icons/react';
import { useT } from '@/hooks/useT';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Sheet } from '@/components/ui/Sheet';
import type { AnyIcon } from '@/components/ui/icons';

const STORAGE_KEY = 'wifipay_onboarding_done';

const STEPS: { key: string; icon: AnyIcon; title: string; desc: string }[] = [
  { key: 'hint_nav',   icon: List,       title: 'onboarding.nav.title',   desc: 'onboarding.nav.desc' },
  { key: 'hint_zone',  icon: MapTrifold, title: 'onboarding.zone.title',  desc: 'onboarding.zone.desc' },
  { key: 'hint_entry', icon: CreditCard, title: 'onboarding.entry.title', desc: 'onboarding.entry.desc' },
];

interface Props {
  /** Tampilkan panduan. Default: cek localStorage. */
  forceShow?: boolean;
}

export default function OnboardingHint({ forceShow }: Props) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (forceShow) { setVisible(true); return; }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* mode privat — lewati */ }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [forceShow]);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* mode privat — lewati */ }
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  }

  if (!visible) return null;
  const hint = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Sheet open onClose={dismiss} title={t('onboarding.title')} leading={<IconTile icon={hint.icon} tone="accent" size="sm" />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-h)' }}>
        <b className="wp-t-head">{t(hint.title)}</b>
        <p className="wp-t-body" style={{ margin: 0 }}>{t(hint.desc)}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-h)' }}>
          <div style={{ display: 'flex', gap: 5 }} role="img" aria-label={`${step + 1}/${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <i key={s.key} style={{ width: i === step ? 16 : 5, height: 5, borderRadius: 'var(--r-full)', background: i === step ? 'var(--accent)' : 'var(--border)', transition: 'width var(--t-base)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {!last && <Button variant="ghost" size="sm" onClick={dismiss}>{t('onboarding.skip')}</Button>}
            <Button variant="primary" size="sm" onClick={next}>{last ? t('onboarding.done') : t('onboarding.next')}</Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
