// ══════════════════════════════════════════
// components/features/log/logDetailBridge.ts — jembatan "buka Detail Log" dari Pusat Notifikasi (REDESAIN T10, D12)
// Tanpa menyentuh store: permintaan disimpan di variabel modul + event window. LogView mengambil permintaan yang
// tertunda saat dipasang (navigasi dari layar lain) dan mendengarkan event saat sudah terbuka.
// ══════════════════════════════════════════
export const LOG_DETAIL_EVENT = 'wp:open-log-detail';
let pendingTs: number | null = null;

export function requestLogDetail(ts: number): void {
  pendingTs = ts;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LOG_DETAIL_EVENT, { detail: ts }));
}

/** Ambil dan kosongkan permintaan yang tertunda (dipanggil LogView saat dipasang / saat event datang). */
export function takePendingLogDetail(): number | null {
  const v = pendingTs;
  pendingTs = null;
  return v;
}
