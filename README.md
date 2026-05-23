# WiFi Pay Next — Update v11.2

> Patch perbaikan dan peningkatan dari v11.1. Fokus pada 4 area: grafik gelap, zona dinamis, area klik IP, dan sistem bahasa.

---

## File yang Berubah

| File | Perubahan |
|------|-----------|
| `components/views/GrafikView.tsx` | Fix warna axis/tick chart gelap |
| `components/views/MembersView.tsx` | Fix area klik IP + support zona custom |
| `components/views/SettingsView.tsx` | Tambah zona baru + hapus zona custom |
| `components/layout/Header.tsx` | Zona switch dinamis + label bahasa |
| `components/layout/Sidebar.tsx` | Label navigasi terjemahan |
| `hooks/useT.ts` | **BARU** — hook translator reactive |
| `types/index.ts` | `Zone` string, `CustomZone`, `zoneMembers`, `customZones` di settings |
| `lib/locales/id.ts` | Tambah key: `sync.error`, `header.lock`, `header.unlock` |
| `lib/locales/en.ts` | Tambah key: `sync.error`, `header.lock`, `header.unlock` |

---

## Detail Perbaikan

### 1. Grafik Mode Gelap — Axis & Label Tidak Terbaca

**Root cause:** `tickColor` di chart bulanan, KRS vs SLK, dan perbandingan tahunan menggunakan `'var(--txt3)'`. Chart.js tidak bisa membaca CSS variables — hanya bisa menerima nilai warna literal (hex/rgba).

**Fix:** Semua `tickColor` dan `legendColor` di `GrafikView.tsx` diganti ke hex literal:
- Dark mode: `'#6B7494'` (sama dengan nilai aktual `--txt3`)
- Light mode: `'#6B7280'`
- Legend KRS vs SLK: `'#A1A8C1'` (lebih terang agar terbaca)

Sekarang label bulan, label rupiah, dan legend chart semua terbaca jelas di dark mode maupun light mode.

---

### 2. Tambah Zona Baru (Manajemen Zona Dinamis)

Fitur baru di menu **Pengaturan → Manajemen Zona**: pengguna sekarang bisa menambah zona WiFi baru selain KRS dan SLK.

**Cara pakai:**
1. Buka Pengaturan → Manajemen Zona
2. Klik tombol **"Tambah Zona Baru"** (ungu di bawah daftar zona)
3. Isi nama zona (maks 6 huruf, otomatis kapital) dan pilih warna
4. Klik **Tambah Zona**

**Zona custom:**
- Tampil di header zone switch bersama KRS dan SLK
- Tampil di tabs zona di menu Member
- Ditandai badge `Custom` di daftar zona
- Bisa diedit nama, disembunyikan, atau dihapus
- Data member zona custom disimpan di `appData.zoneMembers[zoneKey]`
- Warna zona custom muncul di header saat zona tersebut aktif

**Perubahan teknis:**
- `types/index.ts`: `Zone` berubah dari `'KRS' | 'SLK'` ke `string` (backward compatible)
- `types/index.ts`: tambah interface `CustomZone { key, name, color }`
- `types/index.ts`: tambah `zoneMembers?: Record<string, string[]>` di `AppData`
- `types/index.ts`: tambah `customZones: CustomZone[]` di `AppSettings`
- Header zona switch sekarang render dinamis dari `['KRS','SLK', ...customZones]` dengan filter `hiddenZones`

---

### 3. Area Klik IP — Tidak Sengaja Terpencet

**Root cause:** Elemen `<a>` (link IP) menggunakan `flex:1` sehingga area klika-nya memenuhi seluruh lebar baris, termasuk ruang kosong di sebelah kanan IP.

**Fix di `MembersView.tsx`:**
- `<a>` IP: hapus `flex:1`, ganti ke `flexShrink:0` + `maxWidth:160px` + `display:block`
- Tambah `<span style={{ flex:1 }} />` sebagai spacer terpisah di antara IP dan tombol aksi
- Sekarang area klik IP **hanya selebar teks IP itu sendiri** — ruang kosong di kanan tidak ikut ter-klik

---

### 4. Bahasa / Language — English Tidak Berfungsi

**Root cause:** Sistem i18n (`lib/i18n.ts`, `lib/locales/`) sudah ada sejak v11.1, tapi tidak ada komponen yang memanggilnya. Bahasa disimpan di settings tapi UI tetap render string Indonesia hardcoded.

**Fix:** Buat hook baru `hooks/useT.ts`:

```typescript
// hooks/useT.ts
export function useT() {
  const lang = useAppStore(s => s.settings.language) ?? 'id';
  return createTranslator(lang);
}
```

Hook ini reactive — saat bahasa diubah di Pengaturan, komponen yang pakai `useT()` langsung re-render dengan bahasa baru tanpa reload.

**Komponen yang sudah menggunakan `useT()`:**
- `Sidebar.tsx` — semua label navigasi (Dashboard, Entry, Rekap, Tunggakan, Grafik, Log, Member, Operasional, Pengaturan, Ganti Akun, Keluar)
- `Header.tsx` — sync pill (Tersimpan / Saved, Menyimpan / Saving, Gagal sync / Sync failed, Offline), tombol KUNCI/BUKA (LOCK/OPEN)

**Catatan:** View-view lain (DashboardView, EntryView, dll) masih menggunakan teks Indonesia hardcoded. Integrasi `useT()` ke seluruh view adalah pekerjaan lanjutan yang bisa dilakukan bertahap.

---

## Cara Update dari v11.1

Karena ini patch minor, **tidak perlu backup Firebase** — tidak ada perubahan struktur data yang breaking. Cukup replace file-file berikut:

```
hooks/useT.ts                          ← FILE BARU, tambahkan
types/index.ts                         ← replace
lib/locales/id.ts                      ← replace
lib/locales/en.ts                      ← replace
components/layout/Header.tsx           ← replace
components/layout/Sidebar.tsx          ← replace
components/views/GrafikView.tsx        ← replace
components/views/MembersView.tsx       ← replace
components/views/SettingsView.tsx      ← replace
```

File lain tidak berubah.

---

## Changelog

```
v11.2 Next — Fase 2: UI Primitives (Apr 2026)
✅ Baru: components/ui/Button.tsx — CVA variants (primary, secondary, ghost, danger, icon)
✅ Baru: components/ui/Input.tsx — CVA variants dengan label, error, icon support
✅ Baru: components/ui/Badge.tsx — CVA variants (lunas, belum, free, zone, neutral)
✅ Baru: components/ui/Card.tsx — CVA variants + CardHeader/Title/Body/Footer
✅ Baru: components/ui/Select.tsx — Styled select dengan Lucide chevron
✅ Baru: components/ui/Skeleton.tsx — Skeleton loading (base + SkeletonList/Card/Stat)
✅ Baru: components/ui/EmptyState.tsx — Reusable empty state component
✅ Baru: lib/helpers.ts — getAllActiveZones() + getMembersForZone()
✅ Fix: PAGE_ICON_MAP menggantikan PAGE_ICONS (Lucide vs emoji)
✅ Fix: BottomNav sekarang gunakan Lucide icons (bukan emoji)
✅ Fix: persistPayment() dipakai di semua views (RekapView, EntryView, OperasionalView, MembersView)
✅ Fix: Semua emoji di UI (.tsx) diganti plain text / dihapus

v11.2 Next — Patch Perbaikan (Apr 2026)
✅ Fix: grafik dark mode — axis X/Y dan label terbaca (hex literal, bukan CSS var)
✅ Fix: area klik IP member tidak lagi melebar ke kanan
✅ Fitur: tambah zona WiFi baru dari Pengaturan → Manajemen Zona
✅ Fitur: hapus zona custom dari Pengaturan → Manajemen Zona
✅ Fitur: zona custom tampil di header zone switch dan tabs Member
✅ Fix: bahasa English sekarang berfungsi (hook useT reactive)
✅ Label navigasi Sidebar terjemah saat ganti bahasa
✅ Sync pill dan tombol lock/unlock di Header terjemah
✅ Versi diupdate ke v11.2 Next di seluruh tampilan
```

---

*WiFi Pay Next v11.2 · [@13angganh](https://github.com/13angganh)*

---

## Technical Debt — Dark Mode Implementation

**Status:** Terdokumentasi, tidak direfactor (task 3.05 — Fase 3)

### Perbedaan implementasi vs spec

| | Spec (`prompt-personal.md`) | Implementasi app |
|---|---|---|
| Default | `:root` = light | `:root` = dark |
| Dark override | `.dark` class | (sudah default) |
| Light override | — | `body.light` class |
| Gold override | — | `body.gold` class |

### Alasan tidak direfactor

App sudah berjalan dengan implementasi ini. Refactor ke spec memerlukan:
- Invert semua nilai token di `:root`
- Rename semua `body.light` → `body:not(.dark)` atau sejenisnya
- Risiko regresi visual tinggi di seluruh halaman

**Keputusan:** Pertahankan implementasi yang ada. Catat di sini agar developer berikutnya tidak bingung.
