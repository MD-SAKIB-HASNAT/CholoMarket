import type { Me } from '@/utils/types';

/**
 * Admin, shop and mall accounts work from their panel only; the customer site is not for them.
 * Returns the panel to send them to, or null for a customer.
 */
export function panelHomeFor(user: Me | null | undefined): string | null {
  if (!user) return null;
  if (user.platformRole) return '/admin';
  const shop = user.shops.find(s => s.status !== 'closed') ?? user.shops[0];
  if (shop) return `/portal/shop/${shop.shopId}`;
  if (user.markets[0]) return `/portal/market/${user.markets[0].marketId}`;
  return null;
}
