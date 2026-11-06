'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/utils/api/api';
import { useAuth } from '@/utils/context/AuthContext';
import type { Market } from '@/utils/types';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export interface MarketDashboard {
  market: Market;
  shops: Record<string, number>;
  ordersToday: number;
  monthOrders: number;
  monthGmv: number;
  deskWaiting: number;
  topShops: {
    id: number;
    nameEn: string;
    shopNumber: string | null;
    orders: number;
    revenue: number;
  }[];
}

export function useMarketId(): number {
  const params = useParams<{ marketId: string }>();
  return Number(params.marketId);
}

export function useMarketDashboard(marketId: number, enabled = true) {
  return useQuery({
    queryKey: ['market', marketId, 'dashboard'],
    queryFn: () => api<MarketDashboard>(PORTAL_ENDPOINTS.market.dashboard(marketId)),
    enabled: enabled && Number.isFinite(marketId),
    refetchInterval: 30_000,
  });
}

/** The viewer's role here: market role, or the platform role for staff overrides. */
export function useMarketRole(marketId: number) {
  const { user } = useAuth();
  const member = user?.markets.find(m => m.marketId === marketId);
  const platform =
    user?.platformRole === 'super_admin' || user?.platformRole === 'ops' ? user.platformRole : null;
  return {
    role: member?.role ?? platform,
    isAdmin: member?.role === 'admin' || !!platform,
    allowed: !!member || !!platform,
  };
}

export const marketBase = (marketId: number) => `/portal/market/${marketId}`;
