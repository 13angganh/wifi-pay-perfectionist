// components/features/settings/SettingsEmailSection.tsx
// Ganti email akun dari dalam app via Firebase verifyBeforeUpdateEmail
'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { doUpdateEmail, doResetPassword } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function SettingsEmailSection() {
  const { userEmail } = useAppStore();
  const [newEmail,  setNewEmail]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [resetSent,  setResetSent]  = useState(false);
  const [resetLoad,  setResetLoad]  = useState(false);
  const [sent,      setSent]      = useState(false);

  async function handleUpdate() {
    if (!newEmail.trim()) { showToast('Masukkan email baru', 'err'); return; }
    if (newEmail.trim() === userEmail) { showToast('Email sama dengan yang sekarang', 'err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { showToast('Format email tidak valid', 'err'); return; }

    setLoading(true);
    const res = await doUpdateEmail(newEmail.trim());
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'err');
    } else {
      setSent(true);
      setNewEmail('');
      showToast('Email verifikasi terkirim — cek inbox ' + newEmail.trim());
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <Mail size={16} strokeWidth={1.5} style={{ color:'var(--zc)', flexShrink:0 }} />
        <div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>
            Ubah Email Akun
          </div>
          <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
            Saat ini: <span style={{ color:'var(--txt2)', fontWeight:500 }}>{userEmail}</span>
          </div>
        </div>
      </div>

      {sent ? (
        /* Sukses */
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
          background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)',
          borderRadius:'var(--r-sm)', fontSize:12, color:'var(--c-lunas)',
        }}>
          <CheckCircle2 size={14} />
          <span>Email verifikasi terkirim. Cek inbox dan klik link untuk konfirmasi perubahan.</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.07em', marginBottom:6 }}>
            EMAIL BARU
          </div>
          <input
            type="email"
            inputMode="email"
            placeholder="email@gmail.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            style={{
              width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
              color:'var(--txt)', padding:'10px 14px', borderRadius:'var(--r-sm)',
              fontSize:13, outline:'none', marginBottom:10, boxSizing:'border-box',
              transition:'border .2s', fontFamily:"var(--font-mono),monospace",
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor='var(--zc)'}
            onBlur={e  => (e.target as HTMLInputElement).style.borderColor='var(--border)'}
          />
          <div style={{ fontSize:10, color:'var(--txt4)', marginBottom:10, lineHeight:1.6 }}>
            Firebase akan kirim email verifikasi ke alamat baru. Email lama tetap aktif sampai kamu klik link konfirmasi di inbox.
          </div>
          <button
            onClick={handleUpdate}
            disabled={loading || !newEmail.trim()}
            style={{
              width:'100%', padding:'10px 14px', borderRadius:'var(--r-sm)',
              background: (!newEmail.trim() || loading) ? 'var(--bg3)' : 'var(--zc)',
              color: (!newEmail.trim() || loading) ? 'var(--txt4)' : '#fff',
              border:'none', cursor: (!newEmail.trim() || loading) ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:600, fontFamily:"var(--font-sans),sans-serif",
              transition:'all var(--t-fast)', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Mengirim...' : 'Kirim Email Verifikasi'}
          </button>
        </>
      )}
      {/* Reset password */}
      <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
        <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:8 }}>
          Lupa password? Kirim link reset ke email aktif.
        </div>
        {resetSent ? (
          <div style={{ fontSize:11, color:'var(--c-lunas)', padding:'8px 12px', background:'rgba(34,197,94,0.07)', borderRadius:'var(--r-sm)', border:'1px solid rgba(34,197,94,0.2)' }}>
            ✓ Link reset terkirim ke {userEmail}
          </div>
        ) : (
          <button
            onClick={async () => {
              if (!userEmail) return;
              setResetLoad(true);
              await doResetPassword(userEmail);
              setResetLoad(false);
              setResetSent(true);
              setTimeout(() => setResetSent(false), 8000);
            }}
            disabled={resetLoad}
            style={{
              width:'100%', padding:'9px 14px', borderRadius:'var(--r-sm)',
              background:'var(--bg3)', border:'1px solid var(--border)',
              color:'var(--txt2)', cursor: resetLoad ? 'not-allowed' : 'pointer',
              fontSize:12, fontWeight:600, fontFamily:"var(--font-sans),sans-serif",
              transition:'all var(--t-fast)', opacity: resetLoad ? 0.6 : 1,
            }}
          >
            {resetLoad ? 'Mengirim...' : '🔑 Kirim Link Reset Password'}
          </button>
        )}
      </div>
    </div>
  );
}
