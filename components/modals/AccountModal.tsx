// ══════════════════════════════════════════
// components/modals/AccountModal.tsx — Akun (REDESAIN T10, D11)
// Dialog tengah (Sheet variant="dialog"): LOGIN SEBAGAI, lencana Email/Google, Hubungkan Google (loading, sukses,
// atau gagal), Ganti Akun (Confirm), Keluar. Logika zip utuh (v11.3): getLinkedProviders, doLinkGoogle (migrasi data bila
// UID baru), switchAccount, doLogout. Dibuka dari avatar header; satu instance dimiliki AppShell.
// ══════════════════════════════════════════
'use client';

import { useState, useMemo } from 'react';
import { GoogleLogo, SignOut, UserSwitch } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { doLogout, switchAccount, doLinkGoogle, getLinkedProviders } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { useT } from '@/hooks/useT';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Sheet } from '@/components/ui/Sheet';

interface Props { open: boolean; onClose: () => void; }

export default function AccountModal({ open, onClose }: Props) {
  const { userEmail, userName } = useAppStore();
  const t = useT();
  const [linking, setLinking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const providers = useMemo(() => open ? getLinkedProviders() : [], [open, refreshKey]);

  if (!open) return null;

  const isGoogleLinked = providers.includes('google.com');
  const isEmailLinked = providers.includes('password');

  async function handleLogout() { onClose(); await doLogout(); }

  function handleSwitch() {
    showConfirm('switch', t('account.switchConfirmQuestion'), t('account.switchConfirmYes'), async () => {
      onClose();
      await switchAccount();
    });
  }

  async function handleLinkGoogle() {
    setLinking(true);
    const res = await doLinkGoogle();
    setLinking(false);
    if (res.error) { showToast(res.error, 'err'); return; }
    showToast(t('account.googleLinkedToast'));
    setRefreshKey(k => k + 1);
  }

  return (
    <Sheet open onClose={onClose} variant="dialog" title={t('account.title')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-h)' }}>
        <div>
          <span className="wp-t-label">{t('account.loggedInAs')}</span>
          {userName && <b style={{ display: 'block', fontWeight: 'var(--fw-strong)' }}>{userName}</b>}
          <span className="wp-t-cap">{userEmail}</span>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {isEmailLinked && <Badge variant="neutral" size="xs">{t('account.badgeEmail')}</Badge>}
            {isGoogleLinked && <Badge variant="belum" size="xs">{t('account.badgeGoogle')}</Badge>}
          </div>
        </div>

        {isGoogleLinked
          ? <Notice tone="ok">{t('account.googleLinked')}</Notice>
          : <Button variant="secondary" block loading={linking} onClick={handleLinkGoogle}>
              <GoogleLogo aria-hidden="true" weight="bold" /> {linking ? t('account.linking') : t('account.linkGoogle')}
            </Button>}

        <Button variant="secondary" block onClick={handleSwitch}><UserSwitch aria-hidden="true" /> {t('account.switchAccount')}</Button>
        <Button variant="danger" block onClick={handleLogout}><SignOut aria-hidden="true" /> {t('account.logout')}</Button>
      </div>
    </Sheet>
  );
}
