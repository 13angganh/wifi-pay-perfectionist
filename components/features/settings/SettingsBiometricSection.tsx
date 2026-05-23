// components/features/settings/SettingsBiometricSection.tsx
// Sidik jari & Face ID via WebAuthn platform authenticator
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import {
  isBiometricAvailable,
  registerBiometric,
  verifyBiometric,
  clearBiometricCred,
  hasBiometricCred,
} from '@/lib/biometric';
import { Fingerprint, ScanFace, Check, AlertCircle, Loader2 } from 'lucide-react';
import type React from 'react';

export default function SettingsBiometricSection() {
  const { settings, updateSettings, setPinUnlocked } = useAppStore();

  const [supported,   setSupported]   = useState<boolean | null>(null); // null = loading
  const [credExists,  setCredExists]   = useState(false);
  const [busy,        setBusy]         = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(ok => {
      setSupported(ok);
      if (ok) setCredExists(hasBiometricCred());
    });
  }, []);

  // Biometrik hanya berguna jika PIN juga aktif (PIN = master lock)
  const pinActive = settings.pinEnabled;

  async function handleEnable() {
    if (!pinActive) {
      showToast('Aktifkan PIN dulu sebelum menggunakan biometrik', 'err');
      return;
    }
    setBusy(true);
    try {
      const ok = await registerBiometric();
      if (ok) {
        updateSettings({ biometricEnabled: true });
        setCredExists(true);
        showToast('Biometrik berhasil diaktifkan');
      } else {
        showToast('Gagal mendaftarkan biometrik', 'err');
      }
    } catch {
      showToast('Biometrik tidak didukung atau dibatalkan', 'err');
    } finally {
      setBusy(false);
    }
  }

  function handleDisable() {
    showConfirm('🔒', 'Nonaktifkan biometrik?', 'Nonaktifkan', () => {
      updateSettings({ biometricEnabled: false });
      clearBiometricCred();
      setCredExists(false);
      showToast('Biometrik dinonaktifkan');
    });
  }

  async function handleTest() {
    setBusy(true);
    try {
      const ok = await verifyBiometric();
      if (ok) {
        setPinUnlocked(true);
        showToast('Verifikasi berhasil ✓');
      } else {
        showToast('Verifikasi gagal', 'err');
      }
    } catch {
      showToast('Biometrik dibatalkan', 'err');
    } finally {
      setBusy(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'var(--r-md)', padding:16, marginBottom:10, boxShadow:'var(--shadow-md)',
  };
  const btnStyle = (danger=false, secondary=false): React.CSSProperties => ({
    width:'100%', padding:'10px 14px', borderRadius:'var(--r-sm)', cursor:'pointer',
    fontSize:13, fontWeight:600, marginTop:8, transition:'all var(--t-fast)',
    border: danger ? '1px solid rgba(239,68,68,0.3)' : secondary ? '1px solid var(--border)' : 'none',
    background: danger ? 'rgba(239,68,68,0.1)' : secondary ? 'var(--bg3)' : 'var(--zc)',
    color: danger ? 'var(--c-belum)' : secondary ? 'var(--txt2)' : '#fff',
    boxShadow: (!danger && !secondary) ? 'var(--shadow-z)' : undefined,
    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
    opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto',
  });

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
        <div style={{ color:'var(--zc)', marginTop:2, display:'flex', gap:4 }}>
          <Fingerprint size={16} strokeWidth={1.5} />
          <ScanFace size={16} strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontFamily:"var(--font-sans),sans-serif", fontWeight:700, fontSize:13, color:'var(--txt)' }}>
            Sidik Jari &amp; Face ID
          </div>
          <div style={{ fontSize:11, color:'var(--txt3)', marginTop:2 }}>
            Buka kunci app dengan biometrik tanpa PIN
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <span style={{
            fontSize:11, fontWeight:700,
            color: settings.biometricEnabled ? 'var(--c-lunas)' : 'var(--txt4)',
            display:'flex', alignItems:'center', gap:4,
          }}>
            {settings.biometricEnabled ? <Check size={12} /> : null}
            {settings.biometricEnabled ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {supported === null && (
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--txt4)', fontSize:12, padding:'8px 0' }}>
          <Loader2 size={14} className="spin" /> Memeriksa perangkat...
        </div>
      )}

      {/* Tidak didukung */}
      {supported === false && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)',
          borderRadius:'var(--r-sm)', padding:'10px 12px',
          fontSize:11, color:'var(--c-belum)',
        }}>
          <AlertCircle size={14} />
          Perangkat ini tidak mendukung sidik jari / Face ID, atau izin belum diberikan.
        </div>
      )}

      {/* Didukung */}
      {supported === true && (
        <>
          {!pinActive && (
            <div style={{
              background:'rgba(201,149,42,0.08)', border:'1px solid rgba(201,149,42,0.25)',
              borderRadius:'var(--r-sm)', padding:'9px 12px',
              fontSize:11, color:'var(--zc)', marginBottom:10,
            }}>
              ⚠️ Aktifkan PIN terlebih dahulu untuk menggunakan biometrik.
            </div>
          )}

          {!settings.biometricEnabled ? (
            <button
              style={btnStyle(false, false)}
              onClick={handleEnable}
              disabled={!pinActive || busy}
            >
              {busy ? <Loader2 size={14} className="spin" /> : <Fingerprint size={14} />}
              Aktifkan Biometrik
            </button>
          ) : (
            <>
              <button style={btnStyle(false, true)} onClick={handleTest} disabled={busy}>
                {busy ? <Loader2 size={14} className="spin" /> : <ScanFace size={14} />}
                Uji Biometrik
              </button>
              {!credExists && (
                <button style={btnStyle(false, false)} onClick={handleEnable} disabled={busy}>
                  <Fingerprint size={14} />
                  Daftarkan Ulang
                </button>
              )}
              <button style={btnStyle(true)} onClick={handleDisable} disabled={busy}>
                Nonaktifkan Biometrik
              </button>
            </>
          )}

          <div style={{ fontSize:10, color:'var(--txt5)', marginTop:10, lineHeight:1.6 }}>
            Data biometrik <strong>tidak dikirim ke server</strong> — verifikasi terjadi langsung di perangkat Anda via API browser standar (WebAuthn).
          </div>
        </>
      )}
    </div>
  );
}
