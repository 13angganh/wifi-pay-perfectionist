// ══════════════════════════════════════════
// lib/navItems.ts — Nav items config data
// Dipecah dari Sidebar.tsx (task 1.15)
// ══════════════════════════════════════════

import type React from 'react';
import {
  LayoutDashboard, CreditCard, BarChart3, AlertCircle,
  TrendingUp, ScrollText, Users, Briefcase,
} from 'lucide-react';
import type { ViewName } from '@/types';

export interface NavItem {
  v:        ViewName;
  icon:     React.ReactNode;
  labelKey: string;
}

export const NAV_ITEMS: NavItem[] = [
  { v:'dashboard',   icon: <LayoutDashboard size={16} strokeWidth={1.5} />, labelKey:'nav.dashboard'   },
  { v:'entry',       icon: <CreditCard      size={16} strokeWidth={1.5} />, labelKey:'nav.entry'       },
  { v:'rekap',       icon: <BarChart3       size={16} strokeWidth={1.5} />, labelKey:'nav.rekap'       },
  { v:'tunggakan',   icon: <AlertCircle     size={16} strokeWidth={1.5} />, labelKey:'nav.tunggakan'   },
  { v:'grafik',      icon: <TrendingUp      size={16} strokeWidth={1.5} />, labelKey:'nav.grafik'      },
  { v:'log',         icon: <ScrollText      size={16} strokeWidth={1.5} />, labelKey:'nav.log'         },
  { v:'members',     icon: <Users           size={16} strokeWidth={1.5} />, labelKey:'nav.members'     },
  { v:'operasional', icon: <Briefcase       size={16} strokeWidth={1.5} />, labelKey:'nav.operasional' },
];
