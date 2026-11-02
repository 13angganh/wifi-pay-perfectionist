// components/layout/userInitials.ts — inisial avatar (dipakai Header + Sidebar; satu sumber)
// v11.11.0: murni dari NAMA TAMPILAN. Tanpa nama → '' (pemanggil menampilkan ikon pengguna); tidak lagi jatuh ke awalan email.
export function getInitials(name: string | null): string {
  const n = (name ?? '').trim();
  if (!n) return '';
  const parts = n.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
