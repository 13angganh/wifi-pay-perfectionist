// components/modals/AccountModal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doLogout, switchAccount } from '@/hooks/useAuth';
import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

export default function AccountModal({ open, onClose }: Props) {
  const router = useRouter();
  const { userEmail, userName } = useAppStore();
  if (!open) return null;

  async function handleLogout() {
    onClose();
    await doLogout();
    router.replace('/login');
  }

  async function handleSwitch() {
    onClose();
    await switchAccount();
    router.replace('/login');
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Akun <button className="modal-close" aria-label="Tutup modal akun" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12, marginBottom:14 }}>
          <div style={{ fontSize:10, color:'var(--txt3)', letterSpacing:'.06em', marginBottom:4 }}>LOGIN SEBAGAI</div>
          {userName && <div style={{ fontSize:13, color:'var(--txt)', fontWeight:500 }}>{userName}</div>}
          <div style={{ fontSize:11, color:'var(--txt4)', marginTop:2 }}>{userEmail}</div>
        </div>
        <button className="lf-btn secondary" style={{ marginBottom:8 }} onClick={handleSwitch}>↔ Ganti Akun</button>
        <button className="lf-btn" style={{ background:'rgba(239,68,68,0.08)', color:'var(--c-belum)', border:'1px solid rgba(239,68,68,0.25)' }} onClick={handleLogout}>Keluar</button>
      </div>
    </div>
  );
}
