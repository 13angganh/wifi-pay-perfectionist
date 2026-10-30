// ══════════════════════════════════════════
// components/modals/ImportModal.tsx — Import Data (REDESAIN T10, D10)
// Import tidak memakai modal: pemicu = input file tersembunyi + Confirm berisi RINGKASAN isi file sebelum menimpa
// data (operasi destruktif). Logika zip utuh: BOM dibuang, normalizeImportedData, Confirm → setAppData → toast
// sukses → importToDB (status sinkron loading → selesai/gagal).
// PERBAIKAN ZONA KUSTOM: ringkasan per zona (termasuk zoneMembers), member zona kustom ikut ditulis (lib/db.ts), dan
// zona kustom yang belum terdaftar di Pengaturan otomatis didaftarkan supaya tampil di header.
// ══════════════════════════════════════════
'use client';

import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { importToDB, normalizeImportedData, extractImportedCustomZones, zonesToRegister } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { useT } from '@/hooks/useT';
import { importSummary } from '@/components/features/settings/settings.logic';
import type { AppData, CustomZone } from '@/types';

// Pemicu dipanggil dari luar (halaman Export & Import di Pengaturan)
let _triggerImport: (() => void) | null = null;
export function triggerImport() { _triggerImport?.(); }

export default function ImportInput() {
  const ref = useRef<HTMLInputElement>(null);
  const { uid, setAppData, setSyncStatus } = useAppStore();
  const t = useT();

  // Assign trigger di effect (bukan saat render) agar tidak melanggar react-hooks/globals
  useEffect(() => {
    _triggerImport = () => ref.current?.click();
    return () => { _triggerImport = null; };
  }, []);

  async function commitImport(imported: AppData, fileZones: CustomZone[]) {
    setAppData(imported);
    // Zona kustom di file yang belum terdaftar → daftarkan (warna dari file atau palet cadangan)
    const { settings, updateSettings } = useAppStore.getState();
    const current = settings.customZones ?? [];
    const add = zonesToRegister(current, imported.zoneMembers, fileZones);
    if (add.length) updateSettings({ ...settings, customZones: [...current, ...add] });
    showToast(`${t('importModal.successPrefix')} ${importSummary(imported, t('importModal.summaryPayments'), ', ')}`, 'ok');

    if (uid) {
      setSyncStatus('loading');
      try {
        await importToDB(uid, imported);
        setSyncStatus('ok');
        showToast(t('importModal.cloudSyncDone'), 'ok');
      } catch (err) {
        setSyncStatus('err');
        showToast(t('importModal.syncFailed') + ' ' + ((err as Error).message ?? String(err)), 'err');
      }
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
        const parsed = JSON.parse(cleaned);
        const imported = normalizeImportedData(parsed);
        if (!imported) { showToast(t('importModal.invalidFile'), 'err'); return; }

        // v11.5.13 (dipertahankan): konfirmasi eksplisit dengan RINGKASAN isi file SEBELUM menimpa data apa pun.
        const summary = importSummary(imported, t('importModal.summaryPayments'));
        const fileZones = extractImportedCustomZones(parsed);
        showConfirm(
          'warning',
          t('importModal.confirmTitle'),
          t('importModal.confirmYes'),
          () => { commitImport(imported, fileZones); },
          { description: t('importModal.confirmDesc'), highlight: summary, highlightColor: 'var(--zc)' },
        );
      } catch (err) {
        showToast(t('importModal.readFailed') + ' ' + ((err as Error).message ?? String(err)), 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return <input ref={ref} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} aria-label={t('settings.importData')} />;
}
