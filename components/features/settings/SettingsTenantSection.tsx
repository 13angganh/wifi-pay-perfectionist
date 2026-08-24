// components/features/settings/SettingsTenantSection.tsx
// Fitur Penagih — menu "Buat Akun Penagih" di sisi owner. Menyambungkan tiga
// fungsi yang sudah teruji terpisah: createTenantAccount() (hooks/useAuth.ts
// — bikin kredensial auth baru tanpa mengganti sesi owner), cloneMembersToUser()
// (lib/db.ts — snapshot member terpilih ke akun baru itu, tanpa histori
// transaksi), dan registerTenant() (lib/db.ts — catat entry di daftar
// penagih milik owner). Reusable: bisa dipakai berulang kali untuk penagih
// ke-2/3/dst, bukan proses sekali-pakai.
//
// v11.6+ (perluasan): tambah daftar penagih yang sudah dibuat (dibaca dari
// appData.tenants — otomatis ter-refresh real-time lewat listenDB di
// hooks/useAppData.ts, TIDAK perlu setAppData manual di sini) + tombol
// hapus entry dari daftar. PENTING: hapus dari daftar TIDAK PERNAH
// menghapus akun Firebase Auth penagih — murni hapus catatan di sisi
// owner. Ini keterbatasan yang didiskusikan & disepakati dengan user
// (Firebase client SDK tidak bisa hapus akun user lain / cek status akun
// user lain tanpa Admin SDK yang sengaja dihindari) — lihat komentar
// TenantInfo di types/index.ts untuk detail lengkap.
'use client';

import { useState } from 'react';
import { UserPlus, Check, Copy, AlertTriangle, Trash2, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { createTenantAccount } from '@/hooks/useAuth';
import { cloneMembersToUser, registerTenant, removeTenantFromList, type MemberRef } from '@/lib/db';
import type { TenantInfo } from '@/types';

type Step = 'form' | 'submitting' | 'success';

export default function SettingsTenantSection() {
  const { appData, settings, uid } = useAppStore();
  const t = useT();

  const [step, setStep]         = useState<Step>('form');
  const [email, setEmail]       = useState('');
  const [pass, setPass]         = useState('');
  const [label, setLabel]       = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set()); // key = `${zone}__${name}`
  const [createdCreds, setCreatedCreds] = useState<{ email: string; pass: string } | null>(null);

  // Daftar member lintas SEMUA zona milik owner (KRS, SLK, custom) — sumber
  // untuk checklist. Dibangun dari appData langsung, BUKAN dari zona yang
  // sedang aktif di layar — owner harus bisa pilih member dari zona manapun
  // dalam satu form yang sama, tidak terikat ke satu zona seperti fitur
  // batch-payment (yang sengaja tidak dipakai ulang di sini — konteksnya
  // beda, batch-payment itu untuk satu zona aktif, ini lintas zona).
  const customZoneKeys = (settings.customZones ?? []).map(z => z.key);
  const memberList: { zone: string; name: string }[] = [
    ...appData.krsMembers.map(name => ({ zone: 'KRS', name })),
    ...appData.slkMembers.map(name => ({ zone: 'SLK', name })),
    ...customZoneKeys.flatMap(zone => (appData.zoneMembers?.[zone] ?? []).map(name => ({ zone, name }))),
  ];

  // Daftar penagih yang sudah dibuat — dari appData.tenants, real-time via
  // listenDB (lihat hooks/useAppData.ts). Diurutkan terbaru dulu supaya
  // penagih yang baru saja dibuat langsung terlihat di atas tanpa scroll.
  const tenantList: TenantInfo[] = Object.values(appData.tenants ?? {})
    .sort((a, b) => b.createdAt - a.createdAt);

  function memberKey(zone: string, name: string): string {
    return `${zone}__${name}`;
  }

  function toggleMember(zone: string, name: string) {
    const key = memberKey(zone, name);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === memberList.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(memberList.map(m => memberKey(m.zone, m.name))));
    }
  }

  function resetForm() {
    setEmail(''); setPass(''); setLabel(''); setSelected(new Set());
    setCreatedCreds(null); setStep('form');
  }

  async function handleSubmit() {
    if (!uid) return; // owner harus login — secara praktis selalu true di titik ini (section ini hanya render setelah auth resolve), guard murni utk keamanan tipe

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showToast(t('settings.tenant.emailInvalid'), 'err'); return;
    }
    if (pass.length < 6) {
      showToast(t('settings.tenant.passwordTooShort'), 'err'); return;
    }
    if (selected.size === 0) {
      showToast(t('settings.tenant.noMemberSelected'), 'err'); return;
    }

    setStep('submitting');

    const authResult = await createTenantAccount(trimmedEmail, pass);
    if (authResult.error || !authResult.uid) {
      showToast(authResult.error ?? t('common.saveFailed'), 'err');
      setStep('form');
      return;
    }

    const selectedRefs: MemberRef[] = memberList
      .filter(m => selected.has(memberKey(m.zone, m.name)))
      .map(m => ({ zone: m.zone, name: m.name }));

    try {
      await cloneMembersToUser(authResult.uid, appData, selectedRefs);
      // Catat entry ke daftar SETELAH clone sukses — kalau registerTenant
      // sendiri gagal (mis. koneksi putus tepat di titik ini), akun +
      // member penagih TETAP valid, owner cuma tidak dapat catatannya di
      // daftar (bisa serahkan kredensial tetap, tapi tidak akan muncul di
      // list — sama seperti skenario cloneFailedAccountCreated di bawah,
      // ditangani dgn pesan berbeda supaya owner tahu mana yang gagal).
      const trimmedLabel = label.trim();
      try {
        await registerTenant(uid, {
          uid: authResult.uid,
          email: trimmedEmail,
          label: trimmedLabel || undefined,
          memberCount: selectedRefs.length,
          createdAt: Date.now(),
        });
      } catch {
        showToast(t('settings.tenant.registerFailedAccountCreated'), 'err');
      }
      setCreatedCreds({ email: trimmedEmail, pass });
      setStep('success');
    } catch {
      // Akun auth SUDAH terbuat di titik ini (createTenantAccount sukses)
      // tapi clone member gagal — bukan silent failure: beri tahu owner
      // eksplisit bahwa akunnya ADA tapi kosong, supaya tidak bingung
      // kenapa penagih login tapi tidak ada member sama sekali. Owner
      // tetap bisa serahkan kredensial (akun valid), lalu clone ulang
      // manual nanti kalau ada mekanisme "tambah member ke penagih yang
      // sudah ada" — belum dibangun di sesi ini, di luar cakupan.
      // TIDAK memanggil registerTenant di sini — kalau clone gagal total,
      // entry di daftar akan menyesatkan (menunjukkan memberCount padahal
      // clone-nya gagal); lebih baik tidak masuk daftar sama sekali
      // daripada masuk dengan data yang salah.
      showToast(t('settings.tenant.cloneFailedAccountCreated'), 'err');
      setCreatedCreds({ email: trimmedEmail, pass });
      setStep('success');
    }
  }

  function copyCreds() {
    if (!createdCreds) return;
    const text = `Email: ${createdCreds.email}\nPassword: ${createdCreds.pass}`;
    navigator.clipboard?.writeText(text).then(
      () => showToast(t('settings.tenant.copied')),
      () => showToast(t('common.saveFailed'), 'err'),
    );
  }

  function handleDeleteTenant(tenant: TenantInfo) {
    if (!uid) return;
    showConfirm(
      '',
      t('settings.tenant.deleteConfirmTitle'),
      t('settings.tenant.deleteConfirmYes'),
      () => {
        removeTenantFromList(uid, tenant.uid).then(
          () => showToast(t('settings.tenant.deleted')),
          () => showToast(t('common.saveFailed'), 'err'),
        );
      },
      {
        // Penegasan eksplisit di titik keputusan (bukan cuma di dokumentasi
        // kode) — supaya owner tidak salah kira tombol ini menghapus akun
        // Firebase penagih. Ini konsekuensi keterbatasan yang sudah
        // didiskusikan & disepakati, bukan sesuatu yang disembunyikan.
        description: t('settings.tenant.deleteConfirmDesc'),
        highlightColor: 'var(--c-belum)',
      },
    );
  }

  // ── Layar sukses: tampil SEKALI, password tidak bisa dilihat lagi setelah ini ──
  if (step === 'success' && createdCreds) {
    return (
      <div>
        <div style={{
          display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px',
          background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)',
          borderRadius:'var(--r-sm)', marginBottom:12,
        }}>
          <AlertTriangle size={14} color="var(--c-belum)" style={{ flexShrink:0, marginTop:1 }} />
          <div style={{ fontSize:11, color:'var(--txt2)', lineHeight:1.5 }}>
            {t('settings.tenant.successWarning')}
          </div>
        </div>

        <div style={{
          background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
          padding:'12px', marginBottom:12, fontFamily:"var(--font-mono),monospace", fontSize:13,
        }}>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>EMAIL</div>
            <div style={{ color:'var(--txt)' }}>{createdCreds.email}</div>
          </div>
          <div>
            <div style={{ fontSize:9, color:'var(--txt4)', marginBottom:2 }}>PASSWORD</div>
            <div style={{ color:'var(--txt)' }}>{createdCreds.pass}</div>
          </div>
        </div>

        <button onClick={copyCreds} style={{
          width:'100%', background:'var(--zc)', color:'#fff', border:'none',
          borderRadius:'var(--r-sm)', padding:'10px', fontSize:12, fontWeight:600,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          marginBottom:8,
        }}>
          <Copy size={13} /> {t('settings.tenant.copyCreds')}
        </button>

        <button onClick={resetForm} style={{
          width:'100%', background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt3)',
          borderRadius:'var(--r-sm)', padding:'9px', fontSize:12, cursor:'pointer',
        }}>
          {t('settings.tenant.createAnother')}
        </button>
      </div>
    );
  }

  // ── Form ──
  const submitting = step === 'submitting';
  const allSelected = memberList.length > 0 && selected.size === memberList.length;

  return (
    <div>
      {/* ── Daftar penagih yang sudah dibuat — teknis: uid tampil eksplisit ── */}
      {tenantList.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <Users size={12} color="var(--txt4)" />
            <span style={{ fontSize:10, color:'var(--txt3)' }}>
              {t('settings.tenant.existingList')} ({tenantList.length})
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {tenantList.map(tenant => (
              <div key={tenant.uid} style={{
                background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
                padding:'10px 12px',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:13, color:'var(--txt)', fontWeight:600, marginBottom:2, wordBreak:'break-word' }}>
                      {tenant.label || tenant.email}
                    </div>
                    {tenant.label && (
                      <div style={{ fontSize:11, color:'var(--txt3)', marginBottom:4, wordBreak:'break-word' }}>
                        {tenant.email}
                      </div>
                    )}
                    <div style={{ fontSize:9, color:'var(--txt4)', fontFamily:"var(--font-mono),monospace", wordBreak:'break-all', marginBottom:4 }}>
                      UID: {tenant.uid}
                    </div>
                    <div style={{ display:'flex', gap:10, fontSize:10, color:'var(--txt4)' }}>
                      <span>{tenant.memberCount} {t('settings.tenant.membersUnit')}</span>
                      <span>{new Date(tenant.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTenant(tenant)}
                    title={t('settings.tenant.deleteButton')}
                    style={{
                      background:'none', border:'none', color:'var(--txt4)', cursor:'pointer',
                      padding:4, flexShrink:0, display:'flex', alignItems:'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:10, color:'var(--txt3)', display:'block', marginBottom:4 }}>
          {t('settings.tenant.labelLabel')}
        </label>
        <input
          type="text" value={label} disabled={submitting}
          onChange={e => setLabel(e.target.value)}
          placeholder={t('settings.tenant.labelPlaceholder')}
          style={{
            width:'100%', background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt)',
            padding:'9px 10px', borderRadius:'var(--r-xs)', fontSize:13, outline:'none',
          }}
        />
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:10, color:'var(--txt3)', display:'block', marginBottom:4 }}>
          {t('settings.tenant.emailLabel')}
        </label>
        <input
          type="email" value={email} disabled={submitting}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('settings.tenant.emailPlaceholder')}
          style={{
            width:'100%', background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt)',
            padding:'9px 10px', borderRadius:'var(--r-xs)', fontSize:13, outline:'none',
          }}
        />
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:10, color:'var(--txt3)', display:'block', marginBottom:4 }}>
          {t('settings.tenant.passwordLabel')}
        </label>
        <input
          type="text" value={pass} disabled={submitting}
          onChange={e => setPass(e.target.value)}
          placeholder={t('settings.tenant.passwordPlaceholder')}
          style={{
            width:'100%', background:'var(--bg4)', border:'1px solid var(--border)', color:'var(--txt)',
            padding:'9px 10px', borderRadius:'var(--r-xs)', fontSize:13, outline:'none',
            fontFamily:"var(--font-mono),monospace",
          }}
        />
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <label style={{ fontSize:10, color:'var(--txt3)' }}>
          {t('settings.tenant.selectMembers')} ({selected.size}/{memberList.length})
        </label>
        {memberList.length > 0 && (
          <button onClick={toggleAll} disabled={submitting} style={{
            background:'none', border:'none', color:'var(--zc)', fontSize:11, cursor:'pointer', padding:0,
          }}>
            {allSelected ? t('settings.tenant.deselectAll') : t('settings.tenant.selectAll')}
          </button>
        )}
      </div>

      {memberList.length === 0 ? (
        <div style={{ fontSize:11, color:'var(--txt4)', padding:'12px', textAlign:'center' }}>
          {t('settings.tenant.noMembers')}
        </div>
      ) : (
        <div style={{
          maxHeight:240, overflowY:'auto', border:'1px solid var(--border)',
          borderRadius:'var(--r-sm)', marginBottom:14,
        }}>
          {memberList.map(({ zone, name }) => {
            const key = memberKey(zone, name);
            const isChecked = selected.has(key);
            return (
              <label key={key} onClick={() => !submitting && toggleMember(zone, name)} style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                borderBottom:'1px solid var(--border2)', cursor: submitting ? 'default' : 'pointer',
                background: isChecked ? 'rgba(139,92,246,0.06)' : 'transparent',
              }}>
                <div style={{
                  width:16, height:16, borderRadius:4, flexShrink:0,
                  border: `1.5px solid ${isChecked ? 'var(--zc)' : 'var(--border)'}`,
                  background: isChecked ? 'var(--zc)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {isChecked && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize:9, color:'var(--txt4)', fontFamily:"var(--font-mono),monospace", flexShrink:0 }}>{zone}</span>
                <span style={{ fontSize:12, color:'var(--txt)', flex:1 }}>{name}</span>
              </label>
            );
          })}
        </div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width:'100%', background: submitting ? 'var(--bg4)' : 'var(--zc)',
        color: submitting ? 'var(--txt4)' : '#fff', border:'none',
        borderRadius:'var(--r-sm)', padding:'10px', fontSize:12, fontWeight:600,
        cursor: submitting ? 'default' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        <UserPlus size={13} />
        {submitting ? t('settings.tenant.creating') : t('settings.tenant.createButton')}
      </button>

      <div style={{ fontSize:10, color:'var(--txt4)', marginTop:8, lineHeight:1.6, padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:'var(--r-xs)' }}>
        {t('settings.tenant.note')}
      </div>
    </div>
  );
}
