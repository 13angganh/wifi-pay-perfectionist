// components/ui/icons.ts — tipe ikon bersama untuk primitive UI (REDESAIN T6)
// Ikon resmi = Phosphor (@phosphor-icons/react). Selama masa transisi (sampai T10/T11)
// layar yang belum dimigrasi masih mengoper ikon Lucide ke EmptyState; tipe ElementType
// menerima keduanya tanpa percabangan di pemanggil.
import type { ElementType } from 'react';

export type AnyIcon = ElementType;
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
