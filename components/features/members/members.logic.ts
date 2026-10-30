// ══════════════════════════════════════════
// components/features/members/members.logic.ts — logika murni layar Member (REDESAIN T9)
//
// Fungsi murni (tanpa store/React) supaya bisa diuji unit. Isinya dipindahkan dari MembersView.tsx zip
// (urutan 6 mode, validasi nama, tambah/edit/hapus/pulihkan/hapus permanen) DENGAN SATU PERBAIKAN yang
// disetujui user (serah-terima T4 bagian 3 butir 2): daftar member dibaca lewat getMembersForZone dan
// ditulis lewat setMembersForZone, jadi zona kustom berlogika sama persis dengan KRS dan SLK.
//
// Perubahan yang DISETUJUI user (serah-terima T4):
//  • A20 status bulan acuan + filter status (memakai refStatus/statusCounts/filterByStatus milik Rekap)
//  • A21 pencarian juga lewat ID dan IP (zip: nama saja)
//  • A23 catatan opsional ikut tersimpan saat Tambah (zip: hanya lewat Edit)
//
// Perilaku zip yang DIPERTAHANKAN apa adanya: nama otomatis huruf besar, karakter terlarang `. # $ [ ] /`,
// duplikat = sama persis, rename memindahkan data bayar, tarif kosong = tidak disimpan, riwayat bayar tidak
// disentuh saat hapus (ikut ke Recycle Bin), memberInfo tidak dihapus saat hapus.
//
// REDESAIN T12 (D6, D11): "Terdaftar sejak" ikut form Tambah/Edit; periode member (Terdaftar sejak, Free, Nonaktif)
// ikut dimigrasikan saat rename (pindah kunci), ikut ke Recycle Bin saat hapus, dan dikembalikan saat dipulihkan.
// Ini sekaligus menutup celah lama "rename → status free hilang" dan "member baru mewarisi free milik nama yang dihapus".
// ══════════════════════════════════════════
import { getMembersForZone, setMembersForZone } from '@/lib/member';
import { hasInvalidFirebaseKeyChars } from '@/lib/firebase-key';
import {
  getMemberPeriods, renameMemberPeriods, setJoined, setMemberPeriods, takeMemberPeriods,
} from '@/lib/memberPeriods';
import type { AppData, DeletedMember, MemberInfo, YearMonth } from '@/types';

export type SortMode = 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc' | 'ip-asc' | 'ip-desc';

/** Urutan tampilan pilihan urut (zip: 6 mode). Label ada di MembersView (panah teks, bukan emoji). */
export const SORT_MODES: readonly SortMode[] = ['name-asc', 'name-desc', 'id-asc', 'id-desc', 'ip-asc', 'ip-desc'];

export const memberInfoOf = (data: AppData, zone: string, name: string): MemberInfo =>
  data.memberInfo?.[`${zone}__${name}`] || {};

/** Urut persis seperti zip (komparator tidak diubah, termasuk 'zzz' untuk ID/IP kosong di mode naik). */
export function sortMembers(names: readonly string[], getInfo: (n: string) => MemberInfo, mode: SortMode): string[] {
  const fns: Record<SortMode, (a: string, b: string) => number> = {
    'name-asc':  (a, b) => a.localeCompare(b),
    'name-desc': (a, b) => b.localeCompare(a),
    'id-asc':    (a, b) => String(getInfo(a).id || 'zzz').localeCompare(String(getInfo(b).id || 'zzz'), undefined, { numeric: true }),
    'id-desc':   (a, b) => String(getInfo(b).id || '').localeCompare(String(getInfo(a).id || ''), undefined, { numeric: true }),
    'ip-asc':    (a, b) => String(getInfo(a).ip || 'zzz').localeCompare(String(getInfo(b).ip || 'zzz'), undefined, { numeric: true }),
    'ip-desc':   (a, b) => String(getInfo(b).ip || '').localeCompare(String(getInfo(a).ip || ''), undefined, { numeric: true }),
  };
  return [...names].sort(fns[mode]);
}

/** A21: cocok bila query (tanpa spasi tepi, huruf kecil) ada di nama, ID, atau IP. Query kosong = cocok. */
export function matchesQuery(name: string, info: MemberInfo, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [name, info.id, info.ip].some(v => String(v ?? '').toLowerCase().includes(q));
}

/** Link router dari kolom IP: sudah berawalan http dipakai apa adanya, selain itu diberi http:// (zip). */
export const routerHref = (ip: string): string => (ip.startsWith('http') ? ip : 'http://' + ip);

// ── Form Tambah/Edit ───────────────────────────────────────
export interface MemberForm {
  name: string; id: string; ip: string; tarif: string; notes: string;
  /** REDESAIN T12 — "Terdaftar sejak": undefined = jangan ubah; null = sejak awal (hapus); objek = bulan/tahun terdaftar */
  joined?: YearMonth | null;
}
export const EMPTY_FORM: MemberForm = { name: '', id: '', ip: '', tarif: '', notes: '' };

export type MemberError = 'nameRequired' | 'nameInvalidChar' | 'nameDuplicate' | 'notFound';
export type BuildResult =
  | { ok: true; data: AppData; name: string }
  | { ok: false; error: MemberError };

const fail = (error: MemberError): BuildResult => ({ ok: false, error });

/** Tambah member ke `zone`. Urutan validasi sama dengan zip: wajib → karakter terlarang → duplikat. */
export function buildAddMember(appData: AppData, zone: string, form: MemberForm): BuildResult {
  const name = form.name.trim().toUpperCase();
  if (!name) return fail('nameRequired');
  if (hasInvalidFirebaseKeyChars(name)) return fail('nameInvalidChar');
  const list = [...getMembersForZone(zone, appData)];
  if (list.includes(name)) return fail('nameDuplicate');
  list.push(name); list.sort();
  const tarif = form.tarif.trim();
  const notes = form.notes.trim();
  const newInfo = {
    ...(appData.memberInfo || {}),
    [`${zone}__${name}`]: { id: form.id.trim(), ip: form.ip.trim(), ...(tarif ? { tarif: +tarif } : {}), ...(notes ? { notes } : {}) },
  };
  const created: AppData = { ...appData, ...setMembersForZone(appData, zone, list), memberInfo: newInfo };
  // T12: member BARU tidak boleh mewarisi periode sisa nama yang sama (free lama yang yatim) — kunci dibersihkan,
  // lalu diisi "Terdaftar sejak" bila dipilih. Tanpa pilihan & tanpa sisa = data tidak disentuh sama sekali.
  const periods = form.joined ? { joined: { y: form.joined.y, m: form.joined.m } } : undefined;
  return { ok: true, name, data: setMemberPeriods(created, zone, name, periods) };
}

/** Edit member `origName` di `zone`; nama baru memindahkan data bayar dan info (perilaku zip). */
export function buildEditMember(appData: AppData, zone: string, origName: string, form: MemberForm): BuildResult {
  const newName = form.name.trim().toUpperCase();
  if (!newName) return fail('nameRequired');
  if (hasInvalidFirebaseKeyChars(newName)) return fail('nameInvalidChar');
  const list = [...getMembersForZone(zone, appData)];
  const idx = list.indexOf(origName);
  if (idx === -1) return fail('notFound');
  if (newName !== origName && list.includes(newName)) return fail('nameDuplicate');

  const id = form.id.trim(), ip = form.ip.trim(), tarif = form.tarif.trim(), trimmedNotes = form.notes.trim();
  const newPayments = { ...appData.payments };
  const newMemberInfo: Record<string, MemberInfo> = { ...(appData.memberInfo || {}) };
  const oldKey = `${zone}__${origName}`;
  if (newName !== origName) {
    list[idx] = newName; list.sort();
    Object.keys(newPayments).filter(k => k.startsWith(`${oldKey}__`)).forEach(k => {
      newPayments[k.replace(`${oldKey}__`, `${zone}__${newName}__`)] = newPayments[k];
      delete newPayments[k];
    });
    const oldInfo = newMemberInfo[oldKey] || {};
    delete newMemberInfo[oldKey];
    // Catatan: seperti zip, pada rename tarif lama TIDAK dihapus bila kolom tarif dikosongkan (…oldInfo).
    newMemberInfo[`${zone}__${newName}`] = { ...oldInfo, id, ip, ...(tarif ? { tarif: +tarif } : {}), ...(trimmedNotes ? { notes: trimmedNotes } : {}) };
    if (!trimmedNotes) delete newMemberInfo[`${zone}__${newName}`].notes;
  } else {
    const existing = newMemberInfo[oldKey] || {};
    newMemberInfo[oldKey] = { ...existing, id, ip, ...(tarif ? { tarif: +tarif } : {}), ...(trimmedNotes ? { notes: trimmedNotes } : {}) };
    if (!tarif) delete newMemberInfo[oldKey].tarif;
    if (!trimmedNotes) delete newMemberInfo[oldKey].notes;
  }
  const edited: AppData = { ...appData, ...setMembersForZone(appData, zone, list), payments: newPayments, memberInfo: newMemberInfo };
  // T12: periode ikut pindah kunci saat rename; "Terdaftar sejak" hanya disentuh bila form membawanya (undefined = tidak diubah).
  let withPeriods = renameMemberPeriods(edited, zone, origName, newName);
  if (form.joined !== undefined) {
    const cur = getMemberPeriods(withPeriods, zone, newName);
    const joinedRes = setJoined(cur, form.joined);
    if (joinedRes.ok) withPeriods = setMemberPeriods(withPeriods, zone, newName, joinedRes.value);
  }
  return { ok: true, name: newName, data: withPeriods };
}

/** Hapus ke Recycle Bin: member keluar dari daftar zona, pembayarannya ikut dipindah ke deletedMembers. */
export function buildDeleteMember(appData: AppData, zone: string, name: string, now: number = Date.now()): AppData {
  const filtered = getMembersForZone(zone, appData).filter(m => m !== name);
  const mk = `${zone}__${name}`;
  const all = appData.payments || {};
  const mp: Record<string, number> = {};
  Object.keys(all).filter(k => k.startsWith(`${mk}__`)).forEach(k => { mp[k] = all[k]; });
  // T12 (D11): periode member ikut ke Recycle Bin (dan keluar dari data aktif, termasuk rekaman free lama).
  const { data: base, periods } = takeMemberPeriods(appData, zone, name);
  return {
    ...base,
    ...setMembersForZone(base, zone, filtered),
    payments: Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith(`${mk}__`))),
    deletedMembers: { ...(base.deletedMembers || {}), [mk]: { zone, name, deletedAt: now, payments: mp, ...(periods ? { periods } : {}) } },
  };
}

/** Pulihkan dari Recycle Bin (null bila kuncinya tidak ada). Zona diambil dari entri yang dihapus. */
export function buildRestoreMember(appData: AppData, key: string): { data: AppData; entry: DeletedMember } | null {
  const d = appData.deletedMembers?.[key];
  if (!d) return null;
  const list = [...getMembersForZone(d.zone, appData)];
  if (!list.includes(d.name)) { list.push(d.name); list.sort(); }
  const restored: AppData = {
    ...appData,
    ...setMembersForZone(appData, d.zone, list),
    payments: { ...(appData.payments || {}), ...(d.payments || {}) },
    deletedMembers: Object.fromEntries(Object.entries(appData.deletedMembers || {}).filter(([k]) => k !== key)),
  };
  // T12 (D11): periode yang ikut ke Recycle Bin dikembalikan (seperti pembayaran: yang dipulihkan menang atas yang kini ada).
  // Rekaman lama tanpa `periods` (dihapus sebelum T12) tidak mengubah apa pun — perilaku lama tetap.
  return { entry: d, data: d.periods ? setMemberPeriods(restored, d.zone, d.name, d.periods) : restored };
}

/** Hapus permanen satu entri Recycle Bin. */
export function buildPurgeMember(appData: AppData, key: string): AppData {
  return { ...appData, deletedMembers: Object.fromEntries(Object.entries(appData.deletedMembers || {}).filter(([k]) => k !== key)) };
}

/** Entri Recycle Bin milik `zone`, terbaru dulu (zip). */
export function deletedForZone(appData: AppData, zone: string): [string, DeletedMember][] {
  return Object.entries(appData.deletedMembers || {})
    .filter(([k]) => k.startsWith(`${zone}__`))
    .sort((a, b) => b[1].deletedAt - a[1].deletedAt);
}
