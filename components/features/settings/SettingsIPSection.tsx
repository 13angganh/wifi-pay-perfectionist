// components/features/settings/SettingsIPSection.tsx
// v11.5: dipindah dari menu Members (sebelumnya tombol "IP .13→.90" hardcoded di toolbar
// Members) ke Settings sebagai collapsible section, mengikuti pola section lain di
// Settings (lihat SettingsZoneSection.tsx). Sekarang fleksibel: bisa cari & ganti
// substring APAPUN di nilai IP (bukan hanya oktet ke-2), karena tidak semua kasus
// konversi adalah ".13" → ".90" — bisa beda router, beda subnet, dll.
//
// v11.5.1 FIX: sebelumnya pakai pola "t(key) OR fallback-string" dengan asumsi t() akan
// mengembalikan string kosong/falsy untuk key yang belum terdaftar di locale. Ternyata
// t() mengembalikan KEY ITU SENDIRI (lihat lib/i18n.ts: `locale[key] ?? key`), yang
// selalu truthy — sehingga fallback tidak pernah tercapai dan raw key seperti
// "settings.ip.zoneLabel" tampil apa adanya di UI. Semua key di bawah sekarang
// benar-benar terdaftar di lib/locales/id.ts dan en.ts.
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { persistPayment } from '@/lib/db';
import { getMembersForZone, convertMemberIPs } from '@/lib/member';
import { useT } from '@/hooks/useT';
import { Repeat } from 'lucide-react';

export default function SettingsIPSection() {
  const { appData, setAppData, uid, userEmail, setSyncStatus, settings } = useAppStore();
  const t = useT();

  // Zona yang tersedia (KRS, SLK, + custom zones)
  const customZones = settings.customZones ?? [];
  const allZoneKeys: string[] = ['KRS', 'SLK', ...customZones.map(z => z.key)];

  const [zone,   setZone]   = useState<string>('KRS');
  const [find,   setFind]   = useState('');
  const [replace,setReplace]= useState('');

  async function persist(newData: typeof appData, action: string, detail?: string) {
    setAppData(newData);
    if (!uid) return;
    setSyncStatus('loading');
    try {
      await persistPayment(uid, newData, { action, detail: detail || '' }, userEmail || '', () => ({
        globalLocked: useAppStore.getState().globalLocked,
        lockedEntries: useAppStore.getState().lockedEntries,
      }));
      setSyncStatus('ok');
    } catch { setSyncStatus('err'); }
  }

  // v11.5: konversi generik — cari substring `find` di IP, ganti dengan `replace`.
  // Tidak lagi dibatasi hanya oktet ke-2; bisa cari/ganti bagian IP manapun
  // (oktet pertama, kedua, ketiga, keempat, atau bahkan seluruh string IP/URL router).
  // Logic inti ada di lib/member.ts (convertMemberIPs) — pure function, unit-tested.
  async function doConvert() {
    const f = find.trim();
    if (!f) { showToast(t('settings.ip.findRequired'), 'err'); return; }

    const info = appData.memberInfo || {};
    const zoneMems = getMembersForZone(zone, appData);
    const { newInfo, count } = convertMemberIPs(info, zoneMems, zone, f, replace);

    if (count === 0) {
      showToast(`${t('settings.ip.noneFound')} ${zone}`, 'err');
      return;
    }

    await persist(
      { ...appData, memberInfo: newInfo },
      `[IP] Konversi "${f}"→"${replace}" zona ${zone}`,
      `${count} member diperbarui`
    );
    showToast(`${count} IP zona ${zone} ${t('settings.ip.converted')}`);
    setFind(''); setReplace('');
  }

  function handleConvertClick() {
    const f = find.trim();
    if (!f) { showToast(t('settings.ip.findRequired'), 'err'); return; }
    showConfirm(
      '🔄',
      `${t('settings.ip.confirmPrefix')} ${zone} ${t('settings.ip.confirmFrom')} "${f}" ${t('settings.ip.confirmTo')} "${replace}"?`,
      t('settings.ip.convertYes'),
      doConvert,
      { description: t('settings.ip.confirmNote') }
    );
  }

  const previewCount = (() => {
    const f = find.trim();
    if (!f) return 0;
    return getMembersForZone(zone, appData).filter(name => {
      const ip = String(appData.memberInfo?.[`${zone}__${name}`]?.ip || '');
      return ip.includes(f);
    }).length;
  })();

  return (
    <div>
      <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:10 }}>
        {t('settings.ip.zoneLabel').toUpperCase()}
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {allZoneKeys.map(z => (
          <button
            key={z}
            onClick={() => setZone(z)}
            style={{
              padding:'6px 14px', borderRadius:'var(--r-full)', border:'none', cursor:'pointer',
              fontSize:12, fontWeight: zone===z ? 700 : 500, minHeight:32,
              background: zone===z ? 'var(--zc)' : 'var(--bg3)',
              color: zone===z ? '#fff' : 'var(--txt3)',
              transition:'all var(--t-fast)',
            }}
          >
            {z}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', display:'block', marginBottom:5 }}>
            {t('settings.ip.findLabel').toUpperCase()}
          </label>
          <input
            value={find}
            onChange={e => setFind(e.target.value)}
            placeholder="contoh: 10.13 atau .13 atau 192.168.1"
            style={{
              width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
              padding:'9px 12px', borderRadius:'var(--r-sm)', fontSize:13,
              fontFamily:"var(--font-mono),monospace", outline:'none',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', display:'block', marginBottom:5 }}>
            {t('settings.ip.replaceLabel').toUpperCase()}
          </label>
          <input
            value={replace}
            onChange={e => setReplace(e.target.value)}
            placeholder="contoh: 10.90"
            style={{
              width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--txt)',
              padding:'9px 12px', borderRadius:'var(--r-sm)', fontSize:13,
              fontFamily:"var(--font-mono),monospace", outline:'none',
            }}
          />
        </div>
      </div>

      {find.trim() && (
        <div style={{
          fontSize:11, color: previewCount > 0 ? 'var(--zc)' : 'var(--txt4)',
          marginBottom:12, padding:'8px 10px', background:'rgba(255,255,255,0.02)',
          borderRadius:'var(--r-xs)',
        }}>
          {previewCount > 0
            ? `${previewCount} ${t('settings.ip.willBeChanged')} ${zone}`
            : `${t('settings.ip.noMatch')} ${zone}`}
        </div>
      )}

      <button
        onClick={handleConvertClick}
        disabled={!find.trim()}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          background: find.trim() ? 'var(--zc)' : 'var(--bg3)',
          color: find.trim() ? '#fff' : 'var(--txt4)',
          border:'none', borderRadius:'var(--r-sm)', padding:'10px',
          fontSize:13, fontWeight:600, cursor: find.trim() ? 'pointer' : 'not-allowed',
          transition:'all var(--t-fast)',
        }}
      >
        <Repeat size={14} strokeWidth={1.5} />
        {t('settings.ip.convertButton')}
      </button>

      <div style={{ fontSize:10, color:'var(--txt4)', marginTop:10, lineHeight:1.6, padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:'var(--r-xs)' }}>
        {t('settings.ip.note')}
      </div>
    </div>
  );
}
