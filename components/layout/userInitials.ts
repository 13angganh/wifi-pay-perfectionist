// components/layout/userInitials.ts — inisial avatar (dipakai Header + Sidebar; satu sumber)
export function getInitials(name: string | null, email: string | null): string {
  const n = name || email?.split('@')[0] || '?';
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
