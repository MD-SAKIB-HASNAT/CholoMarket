'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, type Query } from '@/utils/api/api';
import type { Category } from '@/utils/types';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { AdminMarket, AdminShop, Plan } from './types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

/**
 * Every row of a cursor-paged list, for pickers that need the whole set (a dropdown of all markets):
 * pages are fetched back to back until the list ends. Tables should use useCursorList + a "Show more" button instead.
 */
export function useAllRows<T>(key: string[], path: string, query: Query = {}, enabled = true) {
  const list = useCursorList<T>(key, path, { ...query, limit: 50 }, { enabled });
  const { hasMore, isLoadingMore, loadMore } = list;
  useEffect(() => {
    if (enabled && hasMore && !isLoadingMore) loadMore();
  }, [enabled, hasMore, isLoadingMore, loadMore]);
  return {
    data: hasMore ? undefined : list.items,
    isLoading: enabled && (list.isPending || !!hasMore),
    error: list.error,
  };
}

export function useAdminMarkets() {
  return useAllRows<AdminMarket>(['admin', 'markets', 'all'], ADMIN_ENDPOINTS.markets.list);
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api<Category[]>(ADMIN_ENDPOINTS.categories.list),
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => api<Plan[]>(ADMIN_ENDPOINTS.plans.list),
    staleTime: 300_000,
  });
}

/** All shops, for pickers (commission/coupon scope). */
export function useShopOptions() {
  return useAllRows<AdminShop>(['admin', 'shops', 'options'], ADMIN_ENDPOINTS.shops.list);
}

/** Parents followed by their children, for grouped pickers. */
export function groupCategories(all: Category[] = []) {
  const parents = all.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  return parents.map(p => ({
    parent: p,
    children: all.filter(c => c.parentId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
