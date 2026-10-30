// components/features/settings/SettingsTenantSection.tsx
// Fitur Penagih — menu "Buat Akun Penagih" di sisi owner. Menyambungkan tiga
// fungsi yang sudah teruji terpisah: createTenantAccount() (hooks/useAuth.ts
// — bikin kredensial auth baru tanpa mengganti sesi owner), cloneMembersToUser()
// (lib/db.ts — snapshot member terpilih ke akun baru itu, tanpa histori
// transaksi), dan registerTenant() (lib/db.ts — catat entry di daftar
// penagih milik owner). Reusable: bisa dipakai berulang kali untuk penagih
// ke-2/3/dst, bukan proses sekali-pakai.
//
// REDESAIN T10 (D3, prototype T5): tampilan memakai primitive (Card, Input, ChecklistRow, Notice, Button). Logika zip
// UTUH: urutan createTenantAccount → cloneMembersToUser → registerTenant, kredensial tampil SEKALI, 3 skenario gagal
// (akun gagal / clone gagal / daftar gagal — dua terakhir kini juga tampil sebagai Notice di layar sukses), hapus dari
// daftar lewat Confirm (TIDAK menghapus akun login). PERBAIKAN ZONA KUSTOM: satu jalur daftar member lintas zona
// lewat allZoneKeys + getMembersForZone (tanpa percabangan zona).
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
import { Copy, Trash, UserCircle, UserPlus, UsersThree } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { useT } from '@/hooks/useT';
import { showToast } from '@/components/ui/Toast';
import { showConfirm } from '@/components/ui/Confirm';
import { createTenantAccount } from '@/hooks/useAuth';
import { cloneMembersToUser, registerTenant, removeTenantFromList, type MemberRef } from '@/lib/db';
import { getMembersForZone } from '@/lib/member';
import { zoneCssColor } from '@/lib/design-tokens';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChecklistHeader, ChecklistRow } from '@/components/ui/ChecklistRow';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Input } from '@/components/ui/Input';
import { Notice } from '@/components/ui/Notice';
import type { TenantInfo } from '@/types';
import { allZoneKeys } from './settings.logic';
import s from './settings.module.css';

type Step = 'form' | 'submitting' | 'success';

/** Stempel waktu pembuatan penagih (dipanggil hanya dari event handler, bukan saat render). */
const nowMs = () => Date.now();

export default function SettingsTenantSection() {
  const { appData, settings, uid } = useAppStore();
  const t = useT();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set()); // key = `${zone}__${name}`
  const [createdCreds, setCreatedCreds] = useState<{ email: string; pass: string; warn?: string } | null>(null);

  // Daftar member lintas SEMUA zona milik owner — SATU jalur (allZoneKeys + getMembersForZone), bukan dari zona aktif.
  const zones = allZoneKeys(settings);
  const memberList: { zone: string; name: string }[] = zones.flatMap(zone => getMembersForZone(zone, appData).map(name => ({ zone, name })));

  // Daftar penagih yang sudah dibuat — dari appData.tenants (real-time via listenDB), terbaru dulu.
  const tenantList: TenantInfo[] = Object.values(appData.tenants ?? {}).sort((a, b) => b.createdAt - a.createdAt);

  const memberKey = (zone: string, name: string) => `${zone}__${name}`;

  function toggleMember(zone: string, name: string) {
    const key = memberKey(zone, name);
    setSelected(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }
  function toggleAll() {
    setSelected(selected.size === memberList.length ? new Set() : new Set(memberList.map(m => memberKey(m.zone, m.name))));
  }
  function resetForm() { setEmail(''); setPass(''); setLabel(''); setSelected(new Set()); setCreatedCreds(null); setStep('form'); }

  async function handleSubmit() {
    if (!uid) return; // guard tipe: section ini hanya render setelah auth resolve

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) { showToast(t('settings.tenant.emailInvalid'), 'err'); return; }
    if (pass.length < 6) { showToast(t('settings.tenant.passwordTooShort'), 'err'); return; }
    if (selected.size === 0) { showToast(t('settings.tenant.noMemberSelected'), 'err'); return; }

    setStep('submitting');
    const authResult = await createTenantAccount(trimmedEmail, pass);
    if (authResult.error || !authResult.uid) {
      showToast(authResult.error ?? t('common.saveFailed'), 'err');
      setStep('form');
      return;
    }

    const selectedRefs: MemberRef[] = memberList.filter(m => selected.has(memberKey(m.zone, m.name))).map(m => ({ zone: m.zone, name: m.name }));
    let warn: string | undefined;
    try {
      await cloneMembersToUser(authResult.uid, appData, selectedRefs);
      // Catat ke daftar SETELAH clone sukses; bila registerTenant gagal, akun + member penagih TETAP valid.
      try {
        await registerTenant(uid, {
          uid: authResult.uid, email: trimmedEmail, label: label.trim() || undefined,
          memberCount: selectedRefs.length, createdAt: nowMs(),
        });
      } catch {
        warn = t('settings.tenant.registerFailedAccountCreated');
        showToast(warn, 'err');
      }
    } catch {
      // Akun auth SUDAH terbuat tapi clone gagal: beri tahu eksplisit akunnya ADA tapi kosong; TIDAK didaftarkan.
      warn = t('settings.tenant.cloneFailedAccountCreated');
      showToast(warn, 'err');
    }
    setCreatedCreds({ email: trimmedEmail, pass, warn });
    setStep('success');
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
    showConfirm('trash', t('settings.tenant.deleteConfirmTitle'), t('settings.tenant.deleteConfirmYes'), () => {
      removeTenantFromList(uid, tenant.uid).then(
        () => showToast(t('settings.tenant.deleted')),
        () => showToast(t('common.saveFailed'), 'err'),
      );
    }, {
      // Penegasan eksplisit: hapus dari daftar TIDAK menghapus akun login penagih (keterbatasan yang disepakati).
      description: t('settings.tenant.deleteConfirmDesc'),
      highlightColor: 'var(--c-belum)',
    });
  }

  // ── Layar sukses: tampil SEKALI, password tidak bisa dilihat lagi setelah ini ──
  if (step === 'success' && createdCreds) {
    return (
      <Card className={s.card}>
        <Notice tone="ok">{t('settings.tenant.successWarning')}</Notice>
        <div className={s.cred}>
          <div><span>{t('settings.tenant.emailLabel')}</span><b>{createdCreds.email}</b></div>
          <div><span>{t('settings.tenant.passwordLabel')}</span><b>{createdCreds.pass}</b></div>
        </div>
        {createdCreds.warn && <Notice tone="warn">{createdCreds.warn}</Notice>}
        <Button variant="primary" block onClick={copyCreds}><Copy aria-hidden="true" /> {t('settings.tenant.copyCreds')}</Button>
        <Button variant="secondary" block onClick={resetForm}><UserPlus aria-hidden="true" /> {t('settings.tenant.createAnother')}</Button>
      </Card>
    );
  }

  const submitting = step === 'submitting';
  const allSelected = memberList.length > 0 && selected.size === memberList.length;

  return (
    <>
      <Card className={s.card}>
        <Input label={t('settings.tenant.emailLabel')} type="email" autoComplete="off" disabled={submitting}
          placeholder={t('settings.tenant.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} />
        <Input label={t('settings.tenant.passwordLabel')} type="text" autoComplete="off" disabled={submitting} className={s.mono}
          placeholder={t('settings.tenant.passwordPlaceholder')} value={pass} onChange={e => setPass(e.target.value)} />
        <Input label={t('settings.tenant.labelLabel')} type="text" autoComplete="off" disabled={submitting}
          placeholder={t('settings.tenant.labelPlaceholder')} value={label} onChange={e => setLabel(e.target.value)} />

        <ChecklistHeader action={memberList.length > 0 ? (
          <button type="button" className="wp-lnk" disabled={submitting} onClick={toggleAll}>
            {allSelected ? t('settings.tenant.deselectAll') : t('settings.tenant.selectAll')}
          </button>
        ) : undefined}>
          {t('settings.tenant.selectMembers')} <Badge variant="free" size="xs">{selected.size}/{memberList.length}</Badge>
        </ChecklistHeader>

        {memberList.length === 0 ? (
          <p className={s.cap}>{t('settings.tenant.noMembers')}</p>
        ) : (
          <div className={s.tml}>
            {zones.map(zone => {
              const list = getMembersForZone(zone, appData);
              return (
                <div key={zone}>
                  <div className={s.tzh}>
                    <i className={s.dot} style={{ background: zoneCssColor(zone, settings.customZones ?? []) }} aria-hidden="true" />
                    <b>{zone}</b><span className={s.cap}>{list.length}</span>
                  </div>
                  {list.length === 0
                    ? <p className={s.cap} style={{ padding: 'var(--sp-2) var(--sp-h)' }}>{t('settings.tenant.noMembers')}</p>
                    : list.map(name => (
                      <ChecklistRow key={memberKey(zone, name)} checked={selected.has(memberKey(zone, name))} disabled={submitting} onToggle={() => toggleMember(zone, name)}>
                        {name}
                      </ChecklistRow>
                    ))}
                </div>
              );
            })}
          </div>
        )}

        <Button variant="primary" block loading={submitting} onClick={handleSubmit}>
          {submitting ? t('settings.tenant.creating') : <><UserPlus aria-hidden="true" /> {t('settings.tenant.createButton')}</>}
        </Button>
        <span className={s.capSm}>{t('settings.tenant.note')}</span>
      </Card>

      {tenantList.length > 0 && (
        <div>
          <span className={s.sectionLabel}><UsersThree aria-hidden="true" /> {t('settings.tenant.existingList')} ({tenantList.length})</span>
          <Card padding="none" className={s.list}>
            {tenantList.map(tenant => (
              <div key={tenant.uid} className={s.li}>
                <IconTile icon={UserCircle} tone="teal" size="sm" />
                <div className={s.liTx}>
                  <b>{tenant.label || tenant.email}</b>
                  {tenant.label && <small>{tenant.email}</small>}
                  <small className={s.mono}>UID: {tenant.uid}</small>
                  <small>{tenant.memberCount} {t('settings.tenant.membersUnit')} · {new Date(tenant.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                </div>
                <IconButton icon={Trash} tone="danger" size="sm" label={t('settings.tenant.deleteButton')} onClick={() => handleDeleteTenant(tenant)} />
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  );
}
