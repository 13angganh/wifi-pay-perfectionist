// components/modals/ExportModal.tsx
// v11.3: tambah Share via Web Share API di samping Download
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getYears } from '@/lib/constants';
import { doJSONBackup, doJSONShare, isShareSupported, generateExcel } from '@/lib/export';
import { showToast } from '@/components/ui/Toast';
import { useT } from '@/hooks/useT';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

export default function ExportModal({ open, onClose }: Props) {
  const t = useT();
  const { appData, selYear, expFmt, setExpFmt } = useAppStore();
  const [zone,     setZone]     = useState('KRS');
  const [year,     setYear]     = useState(selYear);
  const [sharing,  setSharing]  = useState(false);

  const shareAvail = isShareSupported();

  function doDownload() {
    onClose();
    if (expFmt === 'json') {
      doJSONBackup(appData);
      showToast(t('exportModal.jsonSuccess'), 'ok');
    } else {
      const { blob, filename } = generateExcel(appData, zone, year, null);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a'); a.href = url; a.download = filename; a.click();
      showToast(`Excel ${zone} ${year} ${t('exportModal.excelSuccess')}`);
    }
  }

  async function doShare() {
    if (expFmt !== 'json') { doDownload(); return; }
    setSharing(true);
    const ok = await doJSONShare(appData);
    setSharing(false);
    if (ok) {
      onClose();
      showToast(t('exportModal.shareSuccess'), 'ok');
    } else {
      showToast(t('exportModal.shareCancelled'), 'err');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-bg" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="modal" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}>

            <div className="modal-title">
              {t('exportModal.title')}
              <button className="modal-close" aria-label={t('exportModal.closeAria')} onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Format selector */}
            <div className="modal-row">
              <div className="modal-label">{t('exportModal.formatLabel')}</div>
              <div style={{ display:'flex', gap:8 }}>
                {(['json','excel'] as const).map(f => (
                  <button key={f} className={`fmt-btn ${expFmt===f?'on':''}`} onClick={() => setExpFmt(f)}>
                    {f==='json' ? t('exportModal.jsonBackup') : 'Excel'}
                  </button>
                ))}
              </div>
            </div>

            {/* Excel options */}
            {expFmt === 'excel' && (
              <>
                <div className="modal-row">
                  <div className="modal-label">{t('exportModal.yearLabel')}</div>
                  <select className="modal-select" value={year} onChange={e => setYear(+e.target.value)}>
                    {getYears().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="modal-row">
                  <div className="modal-label">{t('exportModal.zoneLabel')}</div>
                  <select className="modal-select" value={zone} onChange={e => setZone(e.target.value)}>
                    <option value="KRS">KRS</option>
                    <option value="SLK">SLK</option>
                  </select>
                </div>
              </>
            )}

            {/* Share info — hanya tampil saat JSON dan share tersedia */}
            {expFmt === 'json' && shareAvail && (
              <div style={{
                fontSize:11, color:'var(--txt3)', padding:'8px 12px',
                background:'var(--bg3)', borderRadius:'var(--r-sm)',
                marginBottom:12, lineHeight:1.6,
              }}>
                💡 <strong>{t('exportModal.shareInfoBold')}</strong> {t('exportModal.shareInfoRest')}
              </div>
            )}

            {/* Action buttons */}
            {expFmt === 'json' && shareAvail ? (
              /* JSON + Share tersedia: dua tombol */
              <div style={{ display:'flex', gap:8 }}>
                <button
                  className="modal-action"
                  onClick={doDownload}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                >
                  <Download size={14} />
                  {t('exportModal.download')}
                </button>
                <button
                  className="modal-action"
                  onClick={doShare}
                  disabled={sharing}
                  style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    background:'var(--bg3)', color:'var(--txt)', border:'1px solid var(--border)',
                    opacity: sharing ? 0.6 : 1,
                  }}
                >
                  <Share2 size={14} />
                  {sharing ? t('exportModal.sharing') : t('exportModal.share')}
                </button>
              </div>
            ) : (
              /* Excel atau Share tidak tersedia: satu tombol Download */
              <button
                className="modal-action"
                onClick={doDownload}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <Download size={14} />
                {t('exportModal.download')}
              </button>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
