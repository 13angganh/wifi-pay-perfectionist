// components/features/settings/SettingsTarifSection.tsx — Fase 3: dipecah dari SettingsView
// Berisi: Export Data, Share WA, Quick Pay amounts
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { useT } from '@/hooks/useT';
import { MONTHS_EN, MONTHS_ID, getYears } from '@/lib/constants';
import { doJSONBackup, doWASummary, generatePDF, generateExcel } from '@/lib/export';
import {
  Download, FileText, Table2, Share2, MessageCircle, ChevronDown, ChevronUp, Check, Zap,
} from 'lucide-react';

export default function SettingsTarifSection() {
  const { settings, updateSettings, appData } = useAppStore();
  const t = useT();
  const lang = settings.language ?? 'id';
  const MONTH_NAMES = lang === 'en' ? MONTHS_EN : MONTHS_ID;

  const [newAmounts, setNewAmounts] = useState(settings.quickAmounts.join(', '));
  const [expOpen,  setExpOpen]  = useState(false);
  const [expZone,  setExpZone]  = useState<'KRS'|'SLK'|'ALL'>('KRS');
  const [expType,  setExpType]  = useState<'monthly'|'yearly'>('monthly');
  const [expYear,  setExpYear]  = useState(new Date().getFullYear());
  const [expMonth, setExpMonth] = useState(new Date().getMonth());
  const [waOpen,   setWaOpen]   = useState(false);
  const [waYear,   setWaYear]   = useState(new Date().getFullYear());
  const [waMonth,  setWaMonth]  = useState(new Date().getMonth());
  const [sfOpen,   setSfOpen]   = useState(false);
  const [sfZone,   setSfZone]   = useState<'KRS'|'SLK'|'ALL'>('KRS');
  const [sfType,   setSfType]   = useState<'monthly'|'yearly'>('monthly');
  const [sfYear,   setSfYear]   = useState(new Date().getFullYear());
  const [sfMonth,  setSfMonth]  = useState(new Date().getMonth());
  const [sfFmt,    setSfFmt]    = useState<'pdf'|'excel'>('pdf');

  function saveAmounts() {
    const parsed = newAmounts.split(/[,\s]+/).map(s => +s.trim()).filter(n => n > 0 && !isNaN(n));
    if (parsed.length < 2) { showToast(t('settings.quickPay.minError'), 'err'); return; }
    if (parsed.length > 8) { showToast(t('settings.quickPay.maxError'), 'err'); return; }
    updateSettings({ quickAmounts: parsed }); showToast(t('settings.quickPay.saved'));
  }

  async function handleDownloadPDF() {
    try {
      showToast(t('settings.export.makingPDF'), 'info');
      const month = expType === 'yearly' ? null : expMonth;
      const { blob, filename } = await generatePDF(appData, expZone, expYear, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('settings.export.pdfDone'));
    } catch { showToast(t('settings.export.pdfError'), 'err'); }
  }
  function handleDownloadExcel() {
    try {
      showToast(t('settings.export.makingExcel'), 'info');
      const month = expType === 'yearly' ? null : expMonth;
      const { blob, filename } = generateExcel(appData, expZone, expYear, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('settings.export.excelDone'));
    } catch { showToast(t('settings.export.excelError'), 'err'); }
  }
  function handleWASummary() { doWASummary(appData, waYear, waMonth); }
  async function handleShareFile() {
    try {
      showToast(t('settings.export.makingFile'), 'info');
      const month = sfType === 'yearly' ? null : sfMonth;
      if (sfFmt === 'pdf') {
        const { blob, filename } = await generatePDF(appData, sfZone, sfYear, month);
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast(t('settings.export.fileDownloaded'));
        }
      } else {
        const { blob, filename } = generateExcel(appData, sfZone, sfYear, month);
        const file = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast(t('settings.export.fileDownloaded'));
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') showToast(t('settings.export.fileError'), 'err');
    }
  }

  const selStyle: React.CSSProperties = {
    background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
    padding:'7px 10px', borderRadius:'var(--r-sm)', fontSize:12, flex:1,
  };
  const cardStyle: React.CSSProperties = {
    background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
    padding:16, marginBottom:10, boxShadow:'var(--shadow-xs)',
  };

  function ToggleChip({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
    return (
      <button onClick={onClick} style={{
        flex:1, padding:'8px', borderRadius:'var(--r-sm)',
        border:`1px solid ${active ? 'var(--zc)' : 'var(--border)'}`,
        background: active ? 'var(--zcdim)' : 'var(--bg3)',
        color: active ? 'var(--zc)' : 'var(--txt2)',
        cursor:'pointer', fontSize:12, fontWeight: active ? 600 : 400,
        transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
      }}>
        {active && <Check size={11} />}
        {label}
      </button>
    );
  }

  function ExportSelectors({ zone, setZone, type, setType, year, setYear, month, setMonth, showAll }: {
    zone:'KRS'|'SLK'|'ALL'; setZone:(z:'KRS'|'SLK'|'ALL')=>void;
    type:'monthly'|'yearly'; setType:(t:'monthly'|'yearly')=>void;
    year:number; setYear:(y:number)=>void;
    month:number; setMonth:(m:number)=>void;
    showAll?: boolean;
  }) {
    return (
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
        <select style={{ ...selStyle, flex:'none', minWidth:70 }} value={zone} onChange={e => setZone(e.target.value as Zone)}>
          <option value="KRS">KRS</option>
          <option value="SLK">SLK</option>
          {showAll && <option value="ALL">ALL</option>}
        </select>
        <select style={{ ...selStyle, flex:'none', minWidth:90 }} value={type} onChange={e => setType(e.target.value as 'perBulan' | 'pertahun')}>
          <option value="monthly">{t('settings.export.monthly')}</option>
          <option value="yearly">{t('settings.export.yearly')}</option>
        </select>
        {type === 'monthly' && (
          <select style={{ ...selStyle, flex:'none', minWidth:80 }} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        )}
        <select style={{ ...selStyle, flex:'none', minWidth:68 }} value={year} onChange={e => setYear(+e.target.value)}>
          {getYears().map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    );
  }

  return (
    <>
      {/* Export Data */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Download size={16} strokeWidth={1.5} /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.export')}</div>
        </div>

        <button
          onClick={() => { doJSONBackup(appData); showToast(t('settings.jsonBackupDone')); }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--txt2)', cursor:'pointer', fontSize:12, marginBottom:6, transition:'all var(--t-fast)' }}
        >
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Download size={13} /> {t('settings.jsonBackup')}
          </span>
          <span style={{ fontSize:10, color:'var(--txt4)' }}>{t('settings.jsonBackupDesc')}</span>
        </button>

        <button
          onClick={() => setExpOpen(v => !v)}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', borderRadius:'var(--r-sm)', border:`1px solid ${expOpen ? 'var(--zc)' : 'var(--border)'}`, background: expOpen ? 'var(--zcdim)' : 'var(--bg3)', color: expOpen ? 'var(--zc)' : 'var(--txt2)', cursor:'pointer', fontSize:12, marginBottom:6, transition:'all var(--t-fast)' }}
        >
          <span style={{ display:'flex', alignItems:'center', gap:8 }}><FileText size={13} /> PDF / Excel</span>
          {expOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {expOpen && (
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:12, marginBottom:6 }}>
            <ExportSelectors zone={expZone} setZone={setExpZone} type={expType} setType={setExpType} year={expYear} setYear={setExpYear} month={expMonth} setMonth={setExpMonth} showAll />
            <div style={{ display:'flex', gap:6, marginTop:10 }}>
              <button onClick={handleDownloadPDF} style={{ flex:1, padding:'9px', borderRadius:'var(--r-sm)', border:'none', background:'var(--zc)', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', boxShadow:'var(--shadow-z)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <FileText size={12} /> PDF
              </button>
              <button onClick={handleDownloadExcel} style={{ flex:1, padding:'9px', borderRadius:'var(--r-sm)', border:'none', background:'#1d6f42', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <Table2 size={12} /> Excel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share & WA */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Share2 size={16} strokeWidth={1.5} /></div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('dashboard.waSummary')}</div>
        </div>

        <button onClick={() => setWaOpen(v => !v)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', borderRadius:'var(--r-sm)', border:`1px solid ${waOpen ? 'var(--zc)' : 'var(--border)'}`, background: waOpen ? 'var(--zcdim)' : 'var(--bg3)', color: waOpen ? 'var(--zc)' : 'var(--txt2)', cursor:'pointer', fontSize:12, marginBottom:6, transition:'all var(--t-fast)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}><MessageCircle size={13} /> {t('dashboard.sendWA')}</span>
          {waOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {waOpen && (
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:12, marginBottom:6 }}>
            <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:8 }}>{t('settings.waPeriod')}</div>
            <div style={{ display:'flex', gap:6 }}>
              <select style={selStyle} value={waYear} onChange={e => setWaYear(+e.target.value)}>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select style={selStyle} value={waMonth} onChange={e => setWaMonth(+e.target.value)}>
                {MONTH_NAMES.map((m,i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <button onClick={handleWASummary} style={{ width:'100%', marginTop:10, padding:'9px', borderRadius:'var(--r-sm)', border:'none', background:'#25D366', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <MessageCircle size={13} /> {t('settings.sendToWA')}
            </button>
          </div>
        )}

        <button onClick={() => setSfOpen(v => !v)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 12px', borderRadius:'var(--r-sm)', border:`1px solid ${sfOpen ? 'var(--zc)' : 'var(--border)'}`, background: sfOpen ? 'var(--zcdim)' : 'var(--bg3)', color: sfOpen ? 'var(--zc)' : 'var(--txt2)', cursor:'pointer', fontSize:12, marginBottom:6, transition:'all var(--t-fast)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:8 }}><Share2 size={13} /> {t('settings.sharePdfExcel')}</span>
          {sfOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {sfOpen && (
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:12, marginBottom:6 }}>
            <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:8 }}>{t('settings.format')}</div>
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              <ToggleChip label="PDF" active={sfFmt==='pdf'} onClick={() => setSfFmt('pdf')} />
              <ToggleChip label="Excel" active={sfFmt==='excel'} onClick={() => setSfFmt('excel')} />
            </div>
            <ExportSelectors zone={sfZone} setZone={setSfZone} type={sfType} setType={setSfType} year={sfYear} setYear={setSfYear} month={sfMonth} setMonth={setSfMonth} showAll={sfFmt==='pdf'} />
            <button onClick={handleShareFile} style={{ width:'100%', marginTop:10, padding:'9px', borderRadius:'var(--r-sm)', border:'none', background:'var(--zc)', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', boxShadow:'var(--shadow-z)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Share2 size={13} /> {t('settings.generateShare')}
            </button>
          </div>
        )}
      </div>

      {/* Quick Pay amounts */}
      <div style={cardStyle}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
          <div style={{ color:'var(--zc)', marginTop:2 }}><Zap size={16} strokeWidth={1.5} /></div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>{t('settings.quickPay')}</div>
            <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>{t('settings.quickPayDesc')}</div>
          </div>
        </div>
        <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:8 }}>{t('settings.quickPayLabel')}</div>
        <input
          className="lf-input"
          style={{ marginBottom:0, textAlign:'left', letterSpacing:'normal', fontFamily:"'DM Mono',monospace" }}
          value={newAmounts}
          onChange={e => setNewAmounts(e.target.value)}
          placeholder="50, 80, 90, 100, 150, 200"
        />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
          {settings.quickAmounts.map(a => (
            <span key={a} style={{ background:'var(--bg3)', border:'1px solid var(--zc)', color:'var(--zc)', padding:'3px 10px', borderRadius:'var(--r-xs)', fontSize:11, fontFamily:"'DM Mono',monospace" }}>{a}</span>
          ))}
        </div>
        <button onClick={saveAmounts} style={{
          width:'100%', padding:'10px 14px', borderRadius:'var(--r-sm)', cursor:'pointer',
          fontSize:13, fontWeight:600, marginTop:8, border:'none',
          background:'var(--zc)', color:'#fff', boxShadow:'var(--shadow-z)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <Check size={13} /> {t('settings.quickPaySave')}
        </button>
        <div style={{ fontSize:10, color:'var(--txt4)', marginTop:8, lineHeight:1.6, padding:'8px', background:'var(--bg3)', borderRadius:'var(--r-xs)' }}>
          {t('settings.quickPayNote')}
        </div>
      </div>
    </>
  );
}
