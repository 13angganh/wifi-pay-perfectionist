// components/layout/BottomNav.tsx
'use client';

import { useAppStore } from '@/store/useAppStore';
import type { ViewName } from '@/types';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  AlertCircle,
  TrendingUp,
  ScrollText,
  Users,
  Briefcase,
} from 'lucide-react';
import type React from 'react';

const NAV_ITEMS: { v: ViewName; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { v:'dashboard',   icon: LayoutDashboard, label:'Home'    },
  { v:'entry',       icon: CreditCard,      label:'Entry'   },
  { v:'rekap',       icon: BarChart3,       label:'Rekap'   },
  { v:'tunggakan',   icon: AlertCircle,     label:'Tunggak' },
  { v:'grafik',      icon: TrendingUp,      label:'Grafik'  },
  { v:'log',         icon: ScrollText,      label:'Log'     },
  { v:'members',     icon: Users,           label:'Member'  },
  { v:'operasional', icon: Briefcase,       label:'Ops'     },
];

interface BottomNavProps {
  onNavigate: (v: ViewName) => void;
}

export default function BottomNav({ onNavigate }: BottomNavProps) {
  const { currentView } = useAppStore();

  return (
    <div id="bnav">
      {NAV_ITEMS.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          className={`nb ${currentView === v ? 'on' : ''}`}
          data-v={v}
          onClick={() => onNavigate(v)}
        >
          <span className="ni">
            <Icon size={18} strokeWidth={1.5} />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
