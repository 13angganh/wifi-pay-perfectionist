// ══════════════════════════════════════════
// components/features/settings/SettingsTarifSection.tsx — Export & Import, Ringkasan WA + Share, Quick Pay (REDESAIN T10, D10)
// Seksi: 'export' | 'wa' | 'quickpay'. Logika zip utuh: JSON Backup (doJSONBackup), PDF/Excel (generatePDF/generateExcel),
// Import (ImportInput + triggerImport), Ringkasan WA (doWASummary), Share PDF/Excel (Web Share API, cadangan unduh),
// Quick Pay 2–8 nominal. PERBAIKAN ZONA KUSTOM: pilihan zona = zona aktif + ALL (zoneChoices), tipe `zone: string`;
// Share Excel tanpa ALL (perilaku zip). File yatim .Form/.List dihapus (ExportSelectors kini PeriodPicker di sini).
// ══════════════════════════════════════════
'use client';

import { useState } from 'react';
import { ChatCircleDots, Check, DownloadSimple, FileArrowDown, FilePdf, FileXls, Lightning, ShareNetwork, UploadSimple } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { MONTHS_EN, MONTHS, getYears } from '@/lib/constants';
import { doJSONBackup, doWASummary, generatePDF, generateExcel } from '@/lib/export';
import ImportInput, { triggerImport } from '@/components/modals/ImportModal';
import { ActionCard, ActionGrid } from '@/components/ui/ActionCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/Chip';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import { Segmented } from '@/components/ui/Segmented';
import { Select } from '@/components/ui/Select';
import { zoneChoices } from './settings.logic';
import s from './settings.module.css';

type PeriodType = 'monthly' | 'yearly';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface PickerProps {
  zones: string[]; zone: string; setZone: (z: string) => void;
  type: PeriodType; setType: (t: PeriodType) => void;
  year: number; setYear: (y: number) => void;
  month: number; setMonth: (m: number) => void;
  monthNames: string[];
}

/** Pilih zona + jenis periode + bulan + tahun (zip: ExportSelectors). Komponen tingkat atas. */
function PeriodPicker({ zones, zone, setZone, type, setType, year, setYear, month, setMonth, monthNames }: PickerProps) {
  const t = useT();
  return (
    <div className={s.row2}>
      <Select aria-label={t('common.zone')} value={zone} onChange={e => setZone(e.target.value)}>
        {zones.map(z => <option key={z} value={z}>{z}</option>)}
      </Select>
      <Select aria-label={t('settings.periodType')} value={type} onChange={e => setType(e.target.value as PeriodType)}>
        <option value="monthly">{t('share.monthly')}</option>
        <option value="yearly">{t('share.yearly')}</option>
      </Select>
      {type === 'monthly' && (
        <Select aria-label={t('common.month')} value={month} onChange={e => setMonth(+e.target.value)}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
      )}
      <Select aria-label={t('common.year')} value={year} onChange={e => setYear(+e.target.value)}>
        {getYears().map(y => <option key={y} value={y}>{y}</option>)}
      </Select>
    </div>
  );
}

export default function SettingsTarifSection({ section }: { section: 'export' | 'wa' | 'quickpay' }) {
  const { settings, updateSettings, appData } = useAppStore();
  const t = useT();
  const MONTH_NAMES = (settings.language ?? 'id') === 'en' ? MONTHS_EN : MONTHS;
  const zonesPlain = zoneChoices(settings, false);   // zona aktif
  const zonesAll = zoneChoices(settings, true);      // zona aktif + ALL
  const now = new Date();

  const [newAmounts, setNewAmounts] = useState(settings.quickAmounts.join(', '));
  const [expOpen, setExpOpen] = useState(false);
  const [expZone, setExpZone] = useState<string>(zonesAll[0]);
  const [expType, setExpType] = useState<PeriodType>('monthly');
  const [expYear, setExpYear] = useState(now.getFullYear());
  const [expMonth, setExpMonth] = useState(now.getMonth());
  const [waYear, setWaYear] = useState(now.getFullYear());
  const [waMonth, setWaMonth] = useState(now.getMonth());
  const [sfZone, setSfZone] = useState<string>(zonesAll[0]);
  const [sfType, setSfType] = useState<PeriodType>('monthly');
  const [sfYear, setSfYear] = useState(now.getFullYear());
  const [sfMonth, setSfMonth] = useState(now.getMonth());
  const [sfFmt, setSfFmt] = useState<'pdf' | 'excel'>('pdf');

  function saveAmounts() {
    const parsed = newAmounts.split(/[,\s]+/).map(x => +x.trim()).filter(n => n > 0 && !isNaN(n));
    if (parsed.length < 2) { showToast(t('settings.quickPay.minError'), 'err'); return; }
    if (parsed.length > 8) { showToast(t('settings.quickPay.maxError'), 'err'); return; }
    updateSettings({ quickAmounts: parsed }); showToast(t('settings.quickPay.saved'));
  }

  async function handleDownloadPDF() {
    try {
      showToast(t('settings.export.makingPDF'), 'info');
      const { blob, filename } = await generatePDF(appData, expZone, expYear, expType === 'yearly' ? null : expMonth, zonesPlain);
      saveBlob(blob, filename);
      showToast(t('settings.export.pdfDone'));
    } catch { showToast(t('settings.export.pdfError'), 'err'); }
  }
  function handleDownloadExcel() {
    try {
      showToast(t('settings.export.makingExcel'), 'info');
      const { blob, filename } = generateExcel(appData, expZone, expYear, expType === 'yearly' ? null : expMonth, zonesPlain);
      saveBlob(blob, filename);
      showToast(t('settings.export.excelDone'));
    } catch { showToast(t('settings.export.excelError'), 'err'); }
  }
  async function handleShareFile() {
    try {
      showToast(t('settings.export.makingFile'), 'info');
      const month = sfType === 'yearly' ? null : sfMonth;
      const isPdf = sfFmt === 'pdf';
      const { blob, filename } = isPdf
        ? await generatePDF(appData, sfZone, sfYear, month, zonesPlain)
        : generateExcel(appData, sfZone, sfYear, month, zonesPlain);
      const file = new File([blob], filename, { type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        saveBlob(blob, filename);
        showToast(t('settings.export.fileDownloaded'));
      }
    } catch (e: unknown) {
      const name = e && typeof e === 'object' && 'name' in e ? (e as { name: string }).name : '';
      if (name !== 'AbortError') showToast(t('settings.export.fileError'), 'err');
    }
  }
  // Share Excel tanpa ALL (perilaku zip): pindah ke zona pertama bila ALL terpilih saat berganti format.
  function changeFmt(v: 'pdf' | 'excel') {
    setSfFmt(v);
    if (v === 'excel' && sfZone === 'ALL') setSfZone(zonesPlain[0]);
  }

  if (section === 'quickpay') {
    return (
      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={Lightning} tone="orange" />
          <div><b>{t('settings.quickPay')}</b><div className={s.cap}>{t('settings.quickPayDesc')}</div></div>
        </div>
        <Input label={t('settings.quickPayLabel')} className={s.mono} autoComplete="off" placeholder="50, 80, 90, 100, 150, 200"
          value={newAmounts} onChange={e => setNewAmounts(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveAmounts()} />
        <div className={s.chips} aria-label={t('settings.quickPay')}>
          {settings.quickAmounts.map(a => <FilterChip key={a} active aria-pressed="true" tabIndex={-1}>{a}</FilterChip>)}
        </div>
        <Button variant="primary" block onClick={saveAmounts}><Check aria-hidden="true" /> {t('settings.quickPaySave')}</Button>
        <span className={s.capSm}>{t('settings.quickPayNote')}</span>
      </Card>
    );
  }

  if (section === 'export') {
    return (
      <>
        <ActionGrid>
          <ActionCard icon={DownloadSimple} tone="blue" title={t('settings.jsonBackup')} description={t('settings.jsonBackupDesc')}
            onClick={() => { doJSONBackup(appData); showToast(t('settings.jsonBackupDone')); }} />
          <ActionCard icon={UploadSimple} tone="orange" title={t('settings.importData')} description={t('settings.importDataDesc')} onClick={triggerImport} />
        </ActionGrid>
        <ImportInput />
        <Button variant={expOpen ? 'primary' : 'secondary'} block aria-expanded={expOpen} onClick={() => setExpOpen(v => !v)}>
          <FileArrowDown aria-hidden="true" /> {t('settings.pdfExcel')}
        </Button>
        {expOpen && (
          <div className={s.panel}>
            <PeriodPicker monthNames={MONTH_NAMES} zones={zonesAll} zone={expZone} setZone={setExpZone} type={expType} setType={setExpType}
              year={expYear} setYear={setExpYear} month={expMonth} setMonth={setExpMonth} />
            <div className={s.rowBtns}>
              <Button variant="primary" onClick={handleDownloadPDF}><FilePdf aria-hidden="true" /> PDF</Button>
              <Button variant="success" onClick={handleDownloadExcel}><FileXls aria-hidden="true" /> Excel</Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // section === 'wa' — Ringkasan WA + Share PDF/Excel
  return (
    <>
      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={ChatCircleDots} tone="lunas" />
          <div><b>{t('dashboard.sendWA')}</b><div className={s.cap}>{t('settings.waPeriod')}</div></div>
        </div>
        <div className={s.row2}>
          <Select aria-label={t('common.year')} value={waYear} onChange={e => setWaYear(+e.target.value)}>
            {getYears().map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select aria-label={t('common.month')} value={waMonth} onChange={e => setWaMonth(+e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
        </div>
        <Button variant="success" block onClick={() => doWASummary(appData, waYear, waMonth, zonesPlain)}>
          <ChatCircleDots aria-hidden="true" /> {t('settings.sendToWA')}
        </Button>
      </Card>

      <Card className={s.card}>
        <div className={s.chd}>
          <IconTile icon={ShareNetwork} tone="blue" />
          <div><b>{t('settings.sharePdfExcel')}</b><div className={s.cap}>{t('settings.format')}</div></div>
        </div>
        <Segmented<'pdf' | 'excel'> ariaLabel={t('settings.format')} value={sfFmt} onChange={changeFmt}
          options={[{ value: 'pdf', label: 'PDF' }, { value: 'excel', label: 'Excel' }]} />
        <PeriodPicker monthNames={MONTH_NAMES} zones={sfFmt === 'pdf' ? zonesAll : zonesPlain} zone={sfZone} setZone={setSfZone}
          type={sfType} setType={setSfType} year={sfYear} setYear={setSfYear} month={sfMonth} setMonth={setSfMonth} />
        <Button variant="primary" block onClick={handleShareFile}><ShareNetwork aria-hidden="true" /> {t('settings.generateShare')}</Button>
        <Notice tone="info">{t('settings.shareNote')}</Notice>
      </Card>
    </>
  );
}
