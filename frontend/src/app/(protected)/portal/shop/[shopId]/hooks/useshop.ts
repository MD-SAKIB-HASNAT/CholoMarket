'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import type { Shop } from '@/utils/types';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export interface ShopDashboard {
  shop: Shop;
  ordersToday: number;
  pending: { placed: number; confirmed: number; readyForPickup: number };
  month: { revenue: number; orders: number; commission: number };
  series: { day: string; revenue: number; orders: number }[];
  lowStock: {
    variantId: number;
    productId: number;
    productName: string;
    attributes: Record<string, string>;
    stockQty: number;
    availableQty: number;
    threshold: number;
  }[];
  openOffers: number;
  unreadMessages: number;
  productCount: number;
  balance: number;
  plan: { code: string; nameEn: string; status: string } | null;
}

export function useShopId(): number {
  const params = useParams<{ shopId: string }>();
  return Number(params.shopId);
}

export function useShopDashboard(shopId: number, enabled = true) {
  return useQuery({
    queryKey: ['shop', shopId, 'dashboard'],
    queryFn: () => api<ShopDashboard>(PORTAL_ENDPOINTS.shop.dashboard(shopId)),
    enabled: enabled && Number.isFinite(shopId),
    refetchInterval: 30_000,
  });
}

/**
 * The signed-in user's say in this shop, mirroring the API's roles:
 *  - owner (and platform ops/super admin): everything, incl. team, payout accounts and courier accounts;
 *  - manager: products, offers, returns, imports, settings, finance and team (view);
 *  - staff: orders, stock counts, shipping, messages and viewing the lists.
 */
export function useShopRole(shopId: number) {
  const { user } = useAuth();
  const role = user?.shops.find(s => s.shopId === shopId)?.role ?? null;
  const platform = user?.platformRole === 'super_admin' || user?.platformRole === 'ops';
  const isOwner = role === 'owner' || platform;
  const canManage = isOwner || role === 'manager';
  return { role, isOwner, canManage, canViewCouriers: canManage };
}

/** Base path for links inside the shop portal. */
export const shopBase = (shopId: number) => `/portal/shop/${shopId}`;
