// components/ui/Confirm.tsx — Confirm modal
'use client';
import { useState } from 'react';

interface ConfirmState { open: boolean; icon: string; msg: string; yesLabel: string; cb: (() => void) | null; }

let _showConfirm: ((icon: string, msg: string, yesLabel: string, cb: () => void) => void) | null = null;
export function showConfirm(icon: string, msg: string, yesLabel: string, cb: () => void) { _showConfirm?.(icon, msg, yesLabel, cb); }

export default function Confirm() {
  const [state, setState] = useState<ConfirmState>({ open:false, icon:'', msg:'Yakin?', yesLabel:'Ya, Hapus', cb:null });
  _showConfirm = (icon, msg, yesLabel, cb) => setState({ open:true, icon, msg, yesLabel, cb });
  const close = () => setState(s => ({ ...s, open:false, cb:null }));
  const confirm = () => { const cb = state.cb; close(); cb?.(); };
  if (!state.open) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'#000b',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div className="confirm-box">
        <div className="confirm-icon">{state.icon}</div>
        <div className="confirm-msg" dangerouslySetInnerHTML={{ __html: state.msg }} />
        <div style={{ display:'flex',gap:8 }}>
          <button className="confirm-no" onClick={close}>Batal</button>
          <button className="confirm-yes" onClick={confirm}>{state.yesLabel}</button>
        </div>
      </div>
    </div>
  );
}
