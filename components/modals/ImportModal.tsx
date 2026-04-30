// components/modals/ImportModal.tsx
// Import tidak pakai modal — trigger via file input tersembunyi
'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { importToDB } from '@/lib/db';
import { showToast } from '@/components/ui/Toast';
import type { AppData } from '@/types';

// Export fungsi trigger agar bisa dipanggil dari Header
let _triggerImport: (() => void) | null = null;
export function triggerImport() { _triggerImport?.(); }

export default function ImportInput() {
  const ref = useRef<HTMLInputElement>(null);
  const { uid, setAppData, setSyncStatus } = useAppStore();
  _triggerImport = () => ref.current?.click();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const raw     = ev.target?.result as string;
        const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
        const data    = JSON.parse(cleaned) as AppData;

        if (!data || typeof data !== 'object' || (!data.krsMembers && !data.payments)) {
          showToast('File tidak valid!','err'); return;
        }

        const imported: AppData = {
          krsMembers:     Array.isArray(data.krsMembers) ? data.krsMembers : [],
          slkMembers:     Array.isArray(data.slkMembers) ? data.slkMembers : [],
          payments:       (data.payments && typeof data.payments==='object') ? data.payments : {},
          memberInfo:     (data.memberInfo && typeof data.memberInfo==='object') ? data.memberInfo : {},
          activityLog:    [],
          freeMembers:    (data.freeMembers && typeof data.freeMembers==='object') ? data.freeMembers : {},
          deletedMembers: (data.deletedMembers && typeof data.deletedMembers==='object') ? data.deletedMembers : {},
          operasional:    (data.operasional && typeof data.operasional==='object') ? data.operasional : {},
        };

        setAppData(imported);
        showToast(`Import OK! ${imported.krsMembers.length} KRS, ${imported.slkMembers.length} SLK, ${Object.keys(imported.payments).length} data`, 'ok');

        if (uid) {
          setSyncStatus('loading');
          try {
            await importToDB(uid, imported);
            setSyncStatus('ok');
            showToast('Cloud sync selesai!', 'ok');
          } catch (err: any) {
            setSyncStatus('err');
            showToast('Sync gagal: '+err.message,'err');
          }
        }
      } catch (err: any) {
        showToast('Gagal baca file: '+err.message,'err');
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
