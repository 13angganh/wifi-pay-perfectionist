// components/layout/LoadingScreen.tsx
// REDESAIN T6: Splash/Loading — logo asli (AppLogo), nama, versi, progres + teks.
// v11.10.2: tagline dihapus (permintaan user); batang progres kini meluncur SATU arah (tidak bolak-balik).
'use client';

import AppLogo from '@/components/ui/AppLogo';
import { APP_NAME, APP_VERSION_FULL } from '@/lib/constants';
import { useT } from '@/hooks/useT';

export default function LoadingScreen() {
  const t = useT();
  return (
    <div className="splash" role="status" aria-live="polite" aria-label={t('splash.loading')}>
      <AppLogo size="xl" priority className="splash__logo" />
      <div className="splash__name">{APP_NAME}</div>
      <div className="splash__ver">{APP_VERSION_FULL}</div>
      <div className="wp-prog" aria-hidden="true"><i /></div>
      <div className="splash__txt">{t('splash.loading')}</div>
    </div>
  );
}
