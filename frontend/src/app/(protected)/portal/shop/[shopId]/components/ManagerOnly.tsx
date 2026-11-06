'use client';

import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/Bits';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';

/**
 * Wraps a screen that only the shop's owner and managers (or platform staff) may use, matching the API's
 * roles, so a staff member who opens the link sees a clear message instead of a 403. Nothing inside is
 * rendered (or fetched) for other roles.
 */
export function ManagerOnly({ children }: { children: ReactNode }) {
  const { canManage } = useShopRole(useShopId());
  if (canManage) return children;
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Managers only"
      description="Ask the shop owner or a manager to do this."
    />
  );
}
