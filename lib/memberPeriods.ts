// ══════════════════════════════════════════
// lib/memberPeriods.ts — REDESAIN T12: periode member
//   • Terdaftar sejak   (MemberPeriods.joined)
//   • Free multi-periode (MemberPeriods.free[])
//   • Nonaktif / Reaktivasi berulang (MemberPeriods.inactive[])
//
// Fungsi murni (tanpa store/React/Firebase) supaya bisa diuji unit. Satu sumber kebenaran baru:
// AppData.memberPeriods["ZONA__NAMA"]. Rekaman lama AppData.freeMembers hanya DIBACA (migrasi otomatis dan
// idempoten) dan tidak pernah ditulis lagi. Tidak ada percabangan zona: zona kustom = KRS/SLK lewat kunci
// `${zona}__${nama}` yang sama dengan memberInfo.
//
// Bulan 0–11, batas inklusif. Periode tanpa toY/toM = terbuka (tanpa akhir). JANGAN pernah menaruh nilai
// `undefined` pada data yang ditulis ke Firebase (set() menolaknya): semua pembangun di sini membuang kunci kosong.
// ══════════════════════════════════════════
import type { AppData, FreeMember, MemberPeriod, MemberPeriods, YearMonth } from '@/types';

export type PeriodKind = 'free' | 'inactive';

export const memberKey = (zone: string, name: string): string => `${zone}__${name}`;
export const ymIndex = (y: number, m: number): number => y * 12 + m;
export function ymFromIndex(i: number): YearMonth {
  return { y: Math.floor(i / 12), m: ((i % 12) + 12) % 12 };
}

// ── Pertanyaan dasar atas satu periode ──
const startIndex = (p: MemberPeriod): number => ymIndex(p.fromY, p.fromM);
function endIndex(p: MemberPeriod): number {
  return p.toY != null && p.toM != null ? ymIndex(p.toY, p.toM) : Infinity;
}
export const isOpenPeriod = (p: MemberPeriod): boolean => !(p.toY != null && p.toM != null);

export function periodContains(p: MemberPeriod, y: number, m: number): boolean {
  const i = ymIndex(y, m);
  return i >= startIndex(p) && i <= endIndex(p);
}

export function inAnyPeriod(list: readonly MemberPeriod[] | undefined, y: number, m: number): boolean {
  if (!list) return false;
  for (const p of list) if (periodContains(p, y, m)) return true;
  return false;
}

/** Bulan (y, m) lebih awal dari "Terdaftar sejak". Tanpa `joined` = sejak awal → selalu false. */
export function isBeforeJoined(mp: MemberPeriods | undefined, y: number, m: number): boolean {
  const j = mp?.joined;
  return !!j && ymIndex(y, m) < ymIndex(j.y, j.m);
}

export function periodsOverlap(a: MemberPeriod, b: MemberPeriod): boolean {
  return startIndex(a) <= endIndex(b) && startIndex(b) <= endIndex(a);
}

const cmp = (x: number, y: number): number => (x < y ? -1 : x > y ? 1 : 0);
/** Urut menurut awal, lalu akhir (periode terbuka paling akhir). Tidak mengubah daftar asli. */
export function sortPeriods(list: readonly MemberPeriod[]): MemberPeriod[] {
  return [...list].sort((a, b) => cmp(startIndex(a), startIndex(b)) || cmp(endIndex(a), endIndex(b)));
}

/** Bangun periode TANPA kunci undefined (aman untuk Firebase). Tanpa `to` = terbuka. */
export function makePeriod(fromY: number, fromM: number, to?: YearMonth | null): MemberPeriod {
  return to ? { fromY, fromM, toY: to.y, toM: to.m } : { fromY, fromM };
}
const normalizePeriod = (p: MemberPeriod): MemberPeriod =>
  makePeriod(p.fromY, p.fromM, p.toY != null && p.toM != null ? { y: p.toY, m: p.toM } : null);

// ── Validasi/sanitasi data mentah (Firebase, berkas impor) ──
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isMonth = (v: unknown): v is number => isInt(v) && v >= 0 && v <= 11;

export function isValidPeriod(p: MemberPeriod): boolean {
  if (!isInt(p.fromY) || !isMonth(p.fromM)) return false;
  if (p.toY == null && p.toM == null) return true;
  return isInt(p.toY) && isMonth(p.toM) && endIndex(p) >= startIndex(p);
}

function cleanYearMonth(v: unknown): YearMonth | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  return isInt(o.y) && isMonth(o.m) ? { y: o.y, m: o.m } : undefined;
}

function cleanPeriod(v: unknown): MemberPeriod | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if (!isInt(o.fromY) || !isMonth(o.fromM)) return undefined;
  const p: MemberPeriod = { fromY: o.fromY, fromM: o.fromM };
  if (o.toY != null || o.toM != null) {
    // Akhir cacat → seluruh periode dibuang (bukan diperlebar menjadi terbuka yang diam-diam menggratiskan/menonaktifkan selamanya).
    if (!isInt(o.toY) || !isMonth(o.toM)) return undefined;
    p.toY = o.toY; p.toM = o.toM;
  }
  return endIndex(p) >= startIndex(p) ? p : undefined;
}

/** RTDB mengembalikan array, atau objek berindeks numerik bila ada indeks yang bolong. */
function toArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>);
  return [];
}

function cleanPeriodList(v: unknown): MemberPeriod[] {
  return sortPeriods(toArray(v).map(cleanPeriod).filter((p): p is MemberPeriod => !!p));
}

/** Satu entri periode → bentuk bersih (terurut, tanpa undefined). Kosong sama sekali → undefined. */
export function cleanMemberPeriods(v: unknown): MemberPeriods | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const out: MemberPeriods = {};
  const joined = cleanYearMonth(o.joined);
  if (joined) out.joined = joined;
  const free = cleanPeriodList(o.free);
  if (free.length) out.free = free;
  const inactive = cleanPeriodList(o.inactive);
  if (inactive.length) out.inactive = inactive;
  return out.joined || out.free || out.inactive ? out : undefined;
}

export function sanitizeMemberPeriods(raw: unknown): Record<string, MemberPeriods> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, MemberPeriods> = {};
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    const mp = cleanMemberPeriods(v);
    if (mp) out[key] = mp;
  }
  return out;
}

// ── Migrasi dari rekaman free lama (satu periode) ──
/**
 * Rekaman lama → entri baru. Meniru isFree lama persis: `active` harus benar; akhir hanya berlaku bila KEDUA
 * toYear dan toMonth ada (selain itu terbuka). Rekaman cacat → undefined (tidak dianggap free, sama seperti lama).
 */
export function legacyFreeToPeriods(fm: unknown): MemberPeriods | undefined {
  if (!fm || typeof fm !== 'object') return undefined;
  const f = fm as Partial<FreeMember>;
  if (!f.active) return undefined;
  if (!isNum(f.fromYear) || !isNum(f.fromMonth)) return undefined;
  const cand: Record<string, unknown> = { fromY: f.fromYear, fromM: f.fromMonth };
  if (f.toYear != null && f.toMonth != null) { cand.toY = f.toYear; cand.toM = f.toMonth; }
  const p = cleanPeriod(cand);
  return p ? { free: [p] } : undefined;
}

/**
 * Migrasi OTOMATIS dan IDEMPOTEN: entri baru yang sudah ada TIDAK pernah ditimpa; rekaman lama hanya dipindahkan
 * untuk kunci yang belum punya entri baru. Dipakai saat load (listenDB), impor (normalizeImportedData), clone.
 */
export function migrateFreeMembers(memberPeriods: unknown, freeMembers: unknown): Record<string, MemberPeriods> {
  const out = sanitizeMemberPeriods(memberPeriods);
  if (!freeMembers || typeof freeMembers !== 'object' || Array.isArray(freeMembers)) return out;
  for (const [key, fm] of Object.entries(freeMembers as Record<string, unknown>)) {
    if (out[key]) continue;
    const mp = legacyFreeToPeriods(fm);
    if (mp) out[key] = mp;
  }
  return out;
}

// ── Akses ──
type PeriodSource = Pick<AppData, 'memberPeriods' | 'freeMembers'>;

/**
 * Periode efektif member. Entri baru (memberPeriods) selalu menang; bila belum ada, rekaman lama dibaca sebagai
 * cadangan agar data/fixture yang belum dimigrasi tetap benar. undefined = tidak punya periode apa pun.
 */
export function getMemberPeriods(data: PeriodSource, zone: string, name: string): MemberPeriods | undefined {
  const key = memberKey(zone, name);
  const own = data.memberPeriods?.[key];
  if (own) return own;
  const legacy = data.freeMembers?.[key];
  return legacy ? legacyFreeToPeriods(legacy) : undefined;
}

/**
 * Tulis (atau hapus bila kosong) entri periode satu member. Rekaman lama kunci itu DIKONSUMSI (dihapus) supaya
 * tidak bisa "hidup lagi" lewat migrasi pada load berikutnya. Mengembalikan AppData baru (tidak mengubah input).
 */
export function setMemberPeriods(data: AppData, zone: string, name: string, next: MemberPeriods | undefined): AppData {
  const key = memberKey(zone, name);
  const cleaned = next ? cleanMemberPeriods(next) : undefined;
  // Menghapus kunci yang memang tidak ada (baik di struktur baru maupun rekaman lama) = tidak ada yang berubah.
  if (!cleaned && !(data.memberPeriods && key in data.memberPeriods) && !(data.freeMembers && key in data.freeMembers)) return data;
  const memberPeriods = { ...(data.memberPeriods || {}) };
  if (cleaned) memberPeriods[key] = cleaned; else delete memberPeriods[key];
  const out: AppData = { ...data, memberPeriods };
  if (data.freeMembers && key in data.freeMembers) {
    const freeMembers = { ...data.freeMembers };
    delete freeMembers[key];
    out.freeMembers = freeMembers;
  }
  return out;
}

/** Rename member: entri periode pindah kunci (menutup celah lama "rename → status free hilang"). */
export function renameMemberPeriods(data: AppData, zone: string, oldName: string, newName: string): AppData {
  if (oldName === newName) return data;
  const cur = getMemberPeriods(data, zone, oldName);
  const cleared = setMemberPeriods(data, zone, oldName, undefined);
  return cur ? setMemberPeriods(cleared, zone, newName, cur) : cleared;
}

/** Hapus ke Recycle Bin: ambil periode efektif member dan buang kuncinya dari data aktif. */
export function takeMemberPeriods(data: AppData, zone: string, name: string): { data: AppData; periods: MemberPeriods | undefined } {
  const periods = getMemberPeriods(data, zone, name);
  return { data: setMemberPeriods(data, zone, name, undefined), periods: periods ? cleanMemberPeriods(periods) : undefined };
}

// ── Operasi atas satu entri (murni, tidak mengubah masukan) ──
export type PeriodError =
  | 'invalidRange'     // bulan/tahun tidak valid atau akhir sebelum awal
  | 'overlap'          // tumpang tindih dengan periode sejenis
  | 'beforeJoined'     // sebelum "Terdaftar sejak"
  | 'notFound'         // indeks tidak ada
  | 'noOpenInactive'   // tidak ada periode nonaktif terbuka untuk direaktivasi
  | 'alreadyInactive'  // bulan itu sudah berada di periode nonaktif terbuka
  | 'notAfterStart';   // bulan reaktivasi harus setelah bulan mulai nonaktif
export type PeriodResult = { ok: true; value: MemberPeriods } | { ok: false; error: PeriodError };

const okR = (value: MemberPeriods): PeriodResult => ({ ok: true, value });
const errR = (error: PeriodError): PeriodResult => ({ ok: false, error });

function withList(mp: MemberPeriods | undefined, kind: PeriodKind, list: readonly MemberPeriod[]): MemberPeriods {
  const next: MemberPeriods = { ...(mp || {}) };
  if (list.length) next[kind] = sortPeriods(list); else delete next[kind];
  return next;
}

export function addPeriod(mp: MemberPeriods | undefined, kind: PeriodKind, p: MemberPeriod): PeriodResult {
  if (!isValidPeriod(p)) return errR('invalidRange');
  const list = mp?.[kind] ?? [];
  if (list.some(q => periodsOverlap(q, p))) return errR('overlap');
  return okR(withList(mp, kind, [...list, normalizePeriod(p)]));
}

export function updatePeriod(mp: MemberPeriods | undefined, kind: PeriodKind, index: number, p: MemberPeriod): PeriodResult {
  const list = mp?.[kind] ?? [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return errR('notFound');
  if (!isValidPeriod(p)) return errR('invalidRange');
  if (list.some((q, i) => i !== index && periodsOverlap(q, p))) return errR('overlap');
  const next = list.slice();
  next[index] = normalizePeriod(p);
  return okR(withList(mp, kind, next));
}

export function removePeriod(mp: MemberPeriods | undefined, kind: PeriodKind, index: number): PeriodResult {
  const list = mp?.[kind] ?? [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return errR('notFound');
  return okR(withList(mp, kind, list.filter((_, i) => i !== index)));
}

/** "Terdaftar sejak": `null` = hapus (kembali "sejak awal"). */
export function setJoined(mp: MemberPeriods | undefined, joined: YearMonth | null): PeriodResult {
  const next: MemberPeriods = { ...(mp || {}) };
  if (joined === null) { delete next.joined; return okR(next); }
  if (!isInt(joined.y) || !isMonth(joined.m)) return errR('invalidRange');
  next.joined = { y: joined.y, m: joined.m };
  return okR(next);
}

/** Free dan Nonaktif boleh tumpang tindih, tetapi UI memberi peringatan (Nonaktif menang atas Free). */
export function crossOverlap(mp: MemberPeriods | undefined, kind: PeriodKind, p: MemberPeriod): boolean {
  const other = kind === 'free' ? mp?.inactive : mp?.free;
  return !!other && other.some(q => periodsOverlap(q, p));
}

/** Periode nonaktif terbuka (belum direaktivasi). Bila (tidak wajar) ada beberapa, yang paling akhir dimulai. */
export function findOpenInactiveIndex(mp: MemberPeriods | undefined): number {
  const list = mp?.inactive ?? [];
  let idx = -1;
  list.forEach((p, i) => {
    if (isOpenPeriod(p) && (idx === -1 || startIndex(p) > startIndex(list[idx]))) idx = i;
  });
  return idx;
}

/** "Nonaktifkan mulai {bulan}": membuka periode nonaktif baru yang tidak punya akhir. */
export function deactivateFrom(mp: MemberPeriods | undefined, y: number, m: number): PeriodResult {
  if (!isInt(y) || !isMonth(m)) return errR('invalidRange');
  if (isBeforeJoined(mp, y, m)) return errR('beforeJoined');
  const list = mp?.inactive ?? [];
  const covering = list.find(p => periodContains(p, y, m));
  if (covering) return errR(isOpenPeriod(covering) ? 'alreadyInactive' : 'overlap');
  const cand = makePeriod(y, m);
  if (list.some(q => periodsOverlap(q, cand))) return errR('overlap'); // ada periode nonaktif lain yang dimulai sesudahnya
  return okR(withList(mp, 'inactive', [...list, cand]));
}

/** "Aktifkan kembali mulai {bulan}": menutup periode nonaktif terbuka di bulan SEBELUMNYA. */
export function reactivateFrom(mp: MemberPeriods | undefined, y: number, m: number): PeriodResult {
  if (!isInt(y) || !isMonth(m)) return errR('invalidRange');
  const list = mp?.inactive ?? [];
  const idx = findOpenInactiveIndex(mp);
  if (idx === -1) return errR('noOpenInactive');
  const open = list[idx];
  const endI = ymIndex(y, m) - 1;
  if (endI < startIndex(open)) return errR('notAfterStart');
  const end = ymFromIndex(endI);
  const next = list.slice();
  next[idx] = makePeriod(open.fromY, open.fromM, end);
  return okR(withList(mp, 'inactive', next));
}

/** Tombol mana yang relevan pada bulan terpilih (Reaktivasi HANYA bila ada periode nonaktif terbuka). */
export function getPeriodActions(mp: MemberPeriods | undefined, y: number, m: number): { canDeactivate: boolean; canReactivate: boolean } {
  return { canDeactivate: deactivateFrom(mp, y, m).ok, canReactivate: reactivateFrom(mp, y, m).ok };
}
