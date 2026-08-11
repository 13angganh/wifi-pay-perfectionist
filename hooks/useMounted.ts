// hooks/useMounted.ts — v11.5.11
// Deteksi "sudah mounted di client" tanpa memicu react-hooks/set-state-in-effect —
// pengganti idiomatik React 19 untuk pola lama useState(false) + useEffect(() =>
// setState(true), []), yang sekarang dianggap anti-pattern ("code smell") oleh linter
// resmi React karena memaksa render tambahan lewat setState sinkron di dalam effect.
//
// Dipakai untuk kasus hydration-mismatch: kapanpun sebuah nilai bisa berbeda antara
// server-render dan client (mis. settings.language yang di server selalu default 'id'
// karena localStorage tidak bisa diakses server-side — lihat settingsSlice.ts
// loadSettings()), tunda render konten yang bergantung nilai itu sampai `useMounted()`
// bernilai true, supaya tidak ada apapun yang sempat ter-render dengan nilai server
// yang salah sebelum nilai client yang benar diketahui.
//
// Implementasi pakai useSyncExternalStore (bukan useState+useEffect) sesuai rekomendasi
// resmi React untuk sinkronisasi state client-vs-server — subscribe kosong (no-op)
// karena nilai ini tidak pernah berubah lagi setelah mount pertama, getSnapshot selalu
// true (begitu fungsi ini dipanggil di client, berarti sudah di client), getServerSnapshot
// selalu false (hanya dipanggil saat server-render/hydration awal).
'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client snapshot: begitu dipanggil di client, selalu true
    () => false,  // server snapshot: dipakai untuk HTML hasil server-render
  );
}
