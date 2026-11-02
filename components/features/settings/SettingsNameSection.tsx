// ══════════════════════════════════════════
// components/features/settings/SettingsNameSection.tsx — Akun Saya: Nama Tampilan (v11.11.0)
// Nama yang tampil di sapaan Beranda, avatar, dan menu akun. Disimpan di profil Firebase Auth (ikut akun di semua
// perangkat). TIDAK diturunkan dari awalan email: kosong = tanpa nama (avatar ikon, sapaan tanpa nama).
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { FloppyDisk, IdentificationBadge, Trash } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { doUpdateDisplayName } from '@/hooks/useAuth';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { DISPLAY_NAME_MAX, normalizeDisplayName } from '@/lib/displayName';
import { previewTitle, type GreetLang } from '@/lib/greeting';
import s from './settings.module.css';

export default function SettingsNameSection() {
  const t = useT();
  const userName = useAppStore(st => st.userName) ?? '';
  const lang = (useAppStore(st => st.settings.language) ?? 'id') as GreetLang;
  // draf = null berarti "ikut nama tersimpan" (tanpa efek penyinkron)
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? userName;
  const [busy, setBusy] = useState<'save' | 'clear' | null>(null);

  const clean = normalizeDisplayName(value);
  const unchanged = clean === userName;

  async function run(next: string, kind: 'save' | 'clear') {
    setBusy(kind);
    const res = await doUpdateDisplayName(next);
    setBusy(null);
    setDraft(null);
    if (res.error) { showToast(res.error, 'err'); return; }
    showToast(t(kind === 'clear' ? 'nameSection.cleared' : 'nameSection.saved'));
  }

  return (
    <Card className={s.card}>
      <div className={s.chd}>
        <IconTile icon={IdentificationBadge} tone="blue" />
        <div>
          <b>{t('settings.nameSectionTitle')}</b>
          <div className={s.cap}>{t('nameSection.currentLabel')} <b>{userName || t('nameSection.notSet')}</b></div>
        </div>
      </div>
      <Input
        label={t('nameSection.inputLabel')}
        type="text" autoComplete="nickname" placeholder={t('nameSection.placeholder')}
        maxLength={DISPLAY_NAME_MAX}
        value={value}
        hint={t('nameSection.hint')}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !unchanged && !busy && run(clean, clean ? 'save' : 'clear')}
      />
      <span className={s.capSm} data-testid="name-preview">{t('nameSection.preview')}: <b>{previewTitle(clean, lang)}</b></span>
      <Button variant="primary" block loading={busy === 'save'} disabled={unchanged || !clean || busy !== null} onClick={() => run(clean, 'save')}>
        {busy === 'save' ? t('common.saving') : <><FloppyDisk aria-hidden="true" /> {t('nameSection.save')}</>}
      </Button>
      {userName && (
        <Button variant="secondary" block loading={busy === 'clear'} disabled={busy !== null} onClick={() => run('', 'clear')}>
          {busy === 'clear' ? t('common.saving') : <><Trash aria-hidden="true" /> {t('nameSection.clear')}</>}
        </Button>
      )}
    </Card>
  );
}
