// components/ui/Confirm.tsx — Fase 2: refactor total
// - Hapus module-level _showConfirm (anti-pattern, race condition)
// - Hapus dangerouslySetInnerHTML (XSS risk)
// - State pindah ke Zustand uiSlice
// - Props terstruktur: title, description, highlight (semua plain string)
'use client';

import { useAppStore } from '@/store/useAppStore';

// ── Helper imperatif — bisa dipanggil dari mana saja tanpa React context ──
// Mengambil state langsung dari Zustand store (aman, tidak pakai module variable)
export function showConfirm(
  icon: string,
  title: string,
  yesLabel: string,
  cb: () => void,
  options?: {
    description?: string;
    highlight?:   string;
    highlightColor?: string;
  }
) {
  useAppStore.getState().showConfirmDialog({
    icon,
    title,
    yesLabel,
    cb,
    description:     options?.description,
    highlight:       options?.highlight,
    highlightColor:  options?.highlightColor,
  });
}

// ── Komponen modal — ditempatkan di AppShell ──
export default function Confirm() {
  const { confirmDialog, closeConfirmDialog } = useAppStore();
  const { open, icon, title, description, highlight, highlightColor, yesLabel, cb } = confirmDialog;

  if (!open) return null;

  function handleConfirm() {
    const saved = cb;
    closeConfirmDialog();
    saved?.();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={closeConfirmDialog}
    >
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        {icon && <div className="confirm-icon">{icon}</div>}

        {/* title — plain text, aman dari XSS */}
        <div className="confirm-msg">{title}</div>

        {/* description — plain text opsional */}
        {description && (
          <div style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', marginTop: 4, lineHeight: 1.5 }}>
            {description}
          </div>
        )}

        {/* highlight — teks penting (nama member, dll) */}
        {highlight && (
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: highlightColor || 'var(--txt)',
            textAlign: 'center',
            marginTop: 6,
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--r-xs)',
            wordBreak: 'break-all',
          }}>
            {highlight}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="confirm-no"  onClick={closeConfirmDialog}>Batal</button>
          <button className="confirm-yes" onClick={handleConfirm}>{yesLabel}</button>
        </div>
      </div>
    </div>
  );
}
