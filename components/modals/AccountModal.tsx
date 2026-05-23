// components/modals/AccountModal.tsx
// v11.3: Link Google + migrasi data jika login Google dengan UID baru
'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { doLogout, switchAccount, doLinkGoogle, getLinkedProviders } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';

interface Props { open: boolean; onClose: () => void; }

export default function AccountModal({ open, onClose }: Props) {
  const { userEmail, userName } = useAppStore();
  const [linking,    setLinking]    = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const providers = useMemo(() => open ? getLinkedProviders() : [], [open, refreshKey]);

  if (!open) return null;

  const isGoogleLinked = providers.includes('google.com');
  const isEmailLinked  = providers.includes('password');

  async function handleLogout() {
    onClose();
    await doLogout();
  }

  async function handleSwitch() {
    showConfirm('↔', 'Ganti akun? Kamu akan keluar dari akun ini.', 'Ganti Akun', async () => {
      onClose();
      await switchAccount();
    });
  }

  async function handleLinkGoogle() {
    setLinking(true);
    const res = await doLinkGoogle();
    setLinking(false);
    if (res.error) {
      showToast(res.error, 'err');
    } else {
      showToast('Google berhasil dihubungkan ✓');
      setRefreshKey(k => k + 1);
    }
  }

  const btnRow: React.CSSProperties = {
    width:'100%', padding:'10px 14px', borderRadius:'var(--r-sm)',
    cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:8,
    fontFamily:"var(--font-sans),sans-serif", transition:'all var(--t-fast)',
    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
    border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--txt2)',
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Akun
          <button className="modal-close" aria-label="Tutup" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Info akun */}
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12, marginBottom:14 }}>
          <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4 }}>LOGIN SEBAGAI</div>
          {userName && <div style={{ fontSize:13, color:'var(--txt)', fontWeight:600 }}>{userName}</div>}
          <div style={{ fontSize:11, color:'var(--txt4)', marginTop:2 }}>{userEmail}</div>

          {/* Provider badges */}
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            {isEmailLinked && (
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.05em', padding:'2px 8px',
                borderRadius:100, background:'rgba(59,130,246,0.12)', color:'#60a5fa',
                border:'1px solid rgba(59,130,246,0.25)' }}>
                ✉ EMAIL
              </span>
            )}
            {isGoogleLinked && (
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.05em', padding:'2px 8px',
                borderRadius:100, background:'rgba(234,67,53,0.1)', color:'#f87171',
                border:'1px solid rgba(234,67,53,0.25)' }}>
                G GOOGLE
              </span>
            )}
          </div>
        </div>

        {/* Hubungkan Google */}
        {!isGoogleLinked && (
          <button
            style={{ ...btnRow, opacity: linking ? 0.6 : 1, pointerEvents: linking ? 'none' : 'auto' }}
            onClick={handleLinkGoogle}
            disabled={linking}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            </svg>
            {linking ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
          </button>
        )}

        {isGoogleLinked && (
          <div style={{ fontSize:11, color:'var(--c-lunas)', textAlign:'center', marginBottom:12,
            padding:'8px 12px', background:'rgba(34,197,94,0.07)', borderRadius:'var(--r-sm)',
            border:'1px solid rgba(34,197,94,0.2)' }}>
            ✓ Google sudah terhubung — bisa login via Google atau Email
          </div>
        )}

        <button style={btnRow} onClick={handleSwitch}>↔ Ganti Akun</button>
        <button
          style={{ ...btnRow, background:'rgba(239,68,68,0.08)', color:'var(--c-belum)',
            border:'1px solid rgba(239,68,68,0.25)', marginBottom:0 }}
          onClick={handleLogout}
        >
          Keluar
        </button>
      </div>
    </div>
  );
}
