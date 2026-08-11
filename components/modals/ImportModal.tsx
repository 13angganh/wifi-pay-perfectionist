// components/modals/ImportModal.tsx
// Import tidak pakai modal — trigger via file input tersembunyi
// v11.5.13: dipasang di menu Pengaturan → Export Data, berdampingan dengan Export.
// Sebelum ini fungsi triggerImport() sudah ada tapi tidak pernah benar-benar dipanggil
// dari mana pun — fitur ini sempat sepenuhnya tidak bisa diakses dari UI.
'use client';

import { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { importToDB, normalizeImportedData } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { useT } from '@/hooks/useT';
import type { AppData } from '@/types';

// Export fungsi trigger agar bisa dipanggil dari luar (SettingsTarifSection.tsx)
let _triggerImport: (() => void) | null = null;
export function triggerImport() { _triggerImport?.(); }

export default function ImportInput() {
  const ref = useRef<HTMLInputElement>(null);
  const { uid, setAppData, setSyncStatus } = useAppStore();
  const t = useT();

  // Assign trigger ref outside render to avoid react-hooks/globals violation
  useEffect(() => {
    _triggerImport = () => ref.current?.click();
    return () => { _triggerImport = null; };
  }, []);

  async function commitImport(imported: AppData) {
    setAppData(imported);
    showToast(`${t('importModal.successPrefix')} ${imported.krsMembers.length} KRS, ${imported.slkMembers.length} SLK, ${Object.keys(imported.payments).length} data`, 'ok');

    if (uid) {
      setSyncStatus('loading');
      try {
        await importToDB(uid, imported);
        setSyncStatus('ok');
        showToast(t('importModal.cloudSyncDone'), 'ok');
      } catch (err) {
        setSyncStatus('err');
        showToast(t('importModal.syncFailed')+' '+((err as Error).message ?? String(err)),'err');
      }
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw     = ev.target?.result as string;
        const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
        const parsed  = JSON.parse(cleaned);
        const imported = normalizeImportedData(parsed);

        if (!imported) {
          showToast(t('importModal.invalidFile'),'err'); return;
        }

        // v11.5.13: konfirmasi eksplisit dengan RINGKASAN isi file SEBELUM menimpa data
        // apapun — import adalah operasi destruktif (mengganti SELURUH dataset), dan
        // fitur ini secara eksplisit dimaksudkan sebagai jaring pengaman preventif untuk
        // skenario data terhapus — jadi harus benar-benar aman terhadap salah pilih file.
        // Ringkasan (jumlah KRS/SLK/payments) memberi user info cukup untuk menilai
        // apakah file ini benar sebelum melanjutkan, bukan sekadar "yakin import?" polos.
        const summary = `${imported.krsMembers.length} KRS · ${imported.slkMembers.length} SLK · ${Object.keys(imported.payments).length} ${t('importModal.summaryPayments')}`;
        showConfirm(
          '⚠️',
          t('importModal.confirmTitle'),
          t('importModal.confirmYes'),
          () => { commitImport(imported); },
          { description: t('importModal.confirmDesc'), highlight: summary, highlightColor: 'var(--zc)' },
        );
      } catch (err) {
        showToast(t('importModal.readFailed')+' '+((err as Error).message ?? String(err)),'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <input
      ref={ref}
      type="file"
      accept=".json"
      style={{ display:'none' }}
      onChange={handleFile}
    />
  );
}
