// components/modals/ExportModal.tsx
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getYears } from '@/lib/constants';
import { doJSONBackup, generateExcel } from '@/lib/export';
import { showToast } from '@/components/ui/Toast';
import { importToDB } from '@/lib/db';
import type { AppData } from '@/types';
import { DEFAULT_APP_DATA } from '@/lib/db';

interface Props { open: boolean; onClose: () => void; }

export default function ExportModal({ open, onClose }: Props) {
  const { appData, setAppData, uid, selYear, expFmt, setExpFmt, setSyncStatus } = useAppStore();
  const [zone, setZone] = useState('KRS');
  const [year, setYear] = useState(selYear);

  if (!open) return null;

  function doExport() {
    onClose();
    if (expFmt === 'json') {
      doJSONBackup(appData);
      showToast('Backup JSON berhasil!', 'ok');
    } else {
      const { blob, filename } = generateExcel(appData, zone, year, null);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a'); a.href = url; a.download = filename; a.click();
      showToast(`Excel ${zone} ${year} berhasil!`);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Export Data <button className="modal-close" aria-label="Tutup modal export" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>

        <div className="modal-row">
          <div className="modal-label">FORMAT</div>
          <div style={{ display:'flex', gap:8 }}>
            {(['json','excel'] as const).map(f => (
              <button key={f} className={`fmt-btn ${expFmt===f?'on':''}`} onClick={() => setExpFmt(f)}>
                {f==='json'?'JSON (Backup)':'Excel'}
              </button>
            ))}
          </div>
        </div>

        {expFmt === 'excel' && (
          <>
            <div className="modal-row">
              <div className="modal-label">TAHUN</div>
              <select className="modal-select" value={year} onChange={e => setYear(+e.target.value)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="modal-row">
              <div className="modal-label">ZONA</div>
              <select className="modal-select" value={zone} onChange={e => setZone(e.target.value)}>
                <option value="KRS">KRS</option>
                <option value="SLK">SLK</option>
              </select>
            </div>
          </>
        )}

        <button className="modal-action" onClick={doExport}>Download</button>
      </div>
    </div>
  );
}
