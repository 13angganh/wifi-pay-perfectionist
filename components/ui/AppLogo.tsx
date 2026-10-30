// components/ui/AppLogo.tsx — logo aplikasi (aset asli /icon-512.png dari zip)
// Satu-satunya tempat logo dirender (Header, Sidebar, Login, Splash, PWA banner).
'use client';

import Image from 'next/image';
import { clsx } from 'clsx';
import { APP_NAME } from '@/lib/constants';

export function AppLogo({ size = 'm', priority, className }: { size?: 's' | 'm' | 'l' | 'xl'; priority?: boolean; className?: string }) {
  return (
    <span className={clsx('wp-logo', `wp-logo--${size}`, className)}>
      <Image src="/icon-512.png" alt={APP_NAME} width={512} height={512} priority={priority} />
    </span>
  );
}

export default AppLogo;
