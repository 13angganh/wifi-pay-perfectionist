// Peta kunci ikon Operasional → ikon Phosphor + warna. Dipakai daftar item dan sheet pemilih ikon.
import { Lightning, WifiHigh, Wrench, UsersThree, Receipt, DotsThree, Motorcycle, House, HardDrives, HandCoins, ShoppingCart } from '@phosphor-icons/react';
import type { TileTone } from '@/components/ui/IconTile';
import type { OpsIconKey } from './operasional.logic';

export const ICONS: Record<OpsIconKey, { icon: typeof Lightning; tone: TileTone }> = {
  electric:    { icon: Lightning, tone: 'warn' },
  internet:    { icon: WifiHigh, tone: 'blue' },
  maintenance: { icon: Wrench, tone: 'purple' },
  device:      { icon: HardDrives, tone: 'blue' },
  salary:      { icon: UsersThree, tone: 'teal' },
  collector:   { icon: HandCoins, tone: 'teal' },
  transport:   { icon: Motorcycle, tone: 'warn' },
  rent:        { icon: House, tone: 'purple' },
  shopping:    { icon: ShoppingCart, tone: 'soft' },
  receipt:     { icon: Receipt, tone: 'soft' },
  other:       { icon: DotsThree, tone: 'slate' },
};
