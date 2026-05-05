// ══════════════════════════════════════════
// lib/onboardingSteps.ts — Onboarding hint step data
// Dipecah dari OnboardingHint.tsx (task 1.15)
// ══════════════════════════════════════════

import type React from 'react';

export interface HintItem {
  key:   string;
  icon:  React.ReactNode;
  title: string;
  desc:  string;
}

export const ONBOARDING_HINTS: HintItem[] = [
  {
    key:  'hint_sidebar',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </div>
    ),
    title: 'Navigasi via Sidebar',
    desc:  'Ketuk ikon menu di kiri atas untuk membuka semua fitur aplikasi.',
  },
  {
    key:  'hint_zone',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M10.15 17a6 6 0 0 1 3.73 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
      </div>
    ),
    title: 'Ganti Zona WiFi',
    desc:  'Ketuk tombol KRS atau SLK di header untuk berpindah zona data WiFi.',
  },
  {
    key:  'hint_entry',
    icon: (
      <div style={{ width:48, height:48, borderRadius:14, background:'var(--zcdim)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--zc-krs)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      </div>
    ),
    title: 'Catat Pembayaran',
    desc:  'Buka menu Entry untuk mencatat pembayaran WiFi member per bulan.',
  },
];

export const ONBOARDING_STORAGE_KEY = 'wifipay_onboarding_done';
