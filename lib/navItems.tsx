// ══════════════════════════════════════════
// lib/navItems.tsx — Nav items config data
// REDESAIN T6: ikon Phosphor (reguler = tidak aktif, fill = aktif); daftar bottom nav (4 tab
// + "Lainnya") dan isi sheet Lainnya diturunkan dari SATU sumber ini — tidak ada daftar ganda.
// ══════════════════════════════════════════

import {
  House, CreditCard, ChartBar, WarningCircle,
  TrendUp, Scroll, UsersThree, Briefcase, Gear,
} from '@phosphor-icons/react';
import type { AnyIcon } from '@/components/ui/icons';
import type { ViewName } from '@/types';

export interface NavItem {
  v:        ViewName;
  Icon:     AnyIcon;
  labelKey: string;
}

/** 8 menu utama (urutan = urutan Sidebar). */
export const NAV_ITEMS: NavItem[] = [
  { v:'dashboard',   Icon: House,         labelKey:'nav.dashboard'   },
  { v:'entry',       Icon: CreditCard,    labelKey:'nav.entry'       },
  { v:'rekap',       Icon: ChartBar,      labelKey:'nav.rekap'       },
  { v:'tunggakan',   Icon: WarningCircle, labelKey:'nav.tunggakan'   },
  { v:'grafik',      Icon: TrendUp,       labelKey:'nav.grafik'      },
  { v:'log',         Icon: Scroll,        labelKey:'nav.log'         },
  { v:'members',     Icon: UsersThree,    labelKey:'nav.members'     },
  { v:'operasional', Icon: Briefcase,     labelKey:'nav.operasional' },
];

export const SETTINGS_ITEM: NavItem = { v:'settings', Icon: Gear, labelKey:'nav.settings' };

/** Bottom navigation: 4 tab pertama + tombol "Lainnya". */
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.slice(0, 4);

/** Isi sheet "Lainnya": sisa menu + Pengaturan. */
export const MORE_NAV_ITEMS: NavItem[] = [...NAV_ITEMS.slice(4), SETTINGS_ITEM];
