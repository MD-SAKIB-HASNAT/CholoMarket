import { createElement } from 'react';
import {
  Baby,
  Cable,
  CookingPot,
  Crown,
  Droplet,
  Flower,
  Footprints,
  Gem,
  Headphones,
  Lamp,
  Laptop,
  Package,
  Palette,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  Store,
  Watch,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

/** Category.icon stores a Lucide icon name; this maps the ones we seed to components. */
const ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  sparkles: Sparkles,
  baby: Baby,
  footprints: Footprints,
  smartphone: Smartphone,
  headphones: Headphones,
  laptop: Laptop,
  cable: Cable,
  droplet: Droplet,
  palette: Palette,
  flower: Flower,
  gem: Gem,
  crown: Crown,
  watch: Watch,
  'shopping-bag': ShoppingBag,
  sofa: Sofa,
  'cooking-pot': CookingPot,
  lamp: Lamp,
  store: Store,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Package;
}

export function CategoryIcon({
  name,
  ...props
}: { name: string | null | undefined } & Omit<LucideProps, 'name'>) {
  return createElement(iconFor(name), props);
}
