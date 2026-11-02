'use client';
// ══════════════════════════════════════════
// hooks/useGreeting.ts — v11.11.0
// Sapaan Beranda (lihat lib/greeting.ts untuk kalimatnya dan lib/greetingSession.ts untuk aturan sesi): setiap app dibuka
// ulang atau kembali dari latar ≥ 2 menit = sapaan baru; dalam satu sesi tetap. Baris konteks dihitung dari data saat tampil
// (data tiba setelah sesi dimulai) dengan undian `roll` yang tetap.
// ══════════════════════════════════════════
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { clockOf, pickLine, slotOfTitle, titleText, type GreetLang, type GreetSlot, type GreetStats } from '@/lib/greeting';
import { commitGreetingLine, getGreetingSession, noteGreetingHidden, noteGreetingVisible } from '@/lib/greetingSession';

export { resetGreetingSession as __resetGreetingSession } from '@/lib/greetingSession';

export interface GreetingView { title: string; line: string | null; slot: GreetSlot }

/** @param stats ringkasan data Beranda; `null` selagi data belum siap (judul tampil, baris konteks menyusul) */
export function useGreeting(stats: GreetStats | null): GreetingView {
  const name = useAppStore(s => s.userName) ?? '';
  const lang = (useAppStore(s => s.settings.language) ?? 'id') as GreetLang;
  const [, bump] = useState(0);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') noteGreetingHidden();
      else if (noteGreetingVisible()) bump(n => n + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const s = getGreetingSession();
  const title = titleText(s.titleId, name, lang);

  let line: string | null = null;
  let lineId: string | null = null;
  if (stats) {
    const titleSlot = slotOfTitle(s.titleId);
    const picked = pickLine({
      ctx: { clock: clockOf(new Date(s.startedAt)), slot: titleSlot === 'any' ? s.slot : titleSlot, stats },
      tone: s.tone, lang, recent: s.recentLines, roll: s.roll,
    });
    line = picked?.text ?? null;
    lineId = picked?.id ?? null;
  }

  useEffect(() => { if (lineId) commitGreetingLine(lineId); }, [lineId]);

  return { title, line, slot: s.slot };
}
