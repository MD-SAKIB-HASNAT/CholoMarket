'use client';

import {
  FileSpreadsheet,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShieldAlert,
  Star,
  Truck,
  Undo2,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DashboardShell, LoadingBlock, type NavItem } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { Initials } from '@/components/shared/Media';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { humanize } from '@/utils/helpers/format';
import { shopBase, useShopDashboard, useShopId, useShopRole } from './hooks/useshop';

export default function ShopPortalLayout({ children }: { children: ReactNode }) {
  const shopId = useShopId();
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();

  const membership = user?.shops.find(s => s.shopId === shopId);
  const isPlatform = user?.platformRole === 'super_admin' || user?.platformRole === 'ops';
  const allowed = !!membership || isPlatform;
  const dashboard = useShopDashboard(shopId, allowed);
  const { canManage } = useShopRole(shopId);

  if (loading || !user) {
    return (
      <div className="p-6">
        <LoadingBlock rows={6} />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldAlert}
          title="You don’t have access to this shop"
          description="Ask the shop owner to add you to the team, or log in with the shop’s phone number."
          action={<Button render={<Link href="/" />}>Back to shopping</Button>}
        />
      </div>
    );
  }

  const base = shopBase(shopId);
  const d = dashboard.data;
  const waiting = d ? d.pending.placed + d.pending.confirmed : 0;
  // Staff get the day-to-day tools; the rest is for managers and the owner (the API refuses staff there).
  const all: (NavItem & { managersOnly?: boolean })[] = [
    { href: base, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `${base}/orders`, label: 'Orders', icon: Receipt, badge: waiting },
    { href: `${base}/deliveries`, label: 'Deliveries', icon: Truck },
    { href: `${base}/products`, label: 'Products', icon: Package },
    { href: `${base}/offers`, label: 'Offers', icon: Handshake, badge: d?.openOffers },
    { href: `${base}/messages`, label: 'Messages', icon: MessageCircle, badge: d?.unreadMessages },
    { href: `${base}/returns`, label: 'Returns', icon: Undo2 },
    { href: `${base}/reviews`, label: 'Reviews', icon: Star },
    { href: `${base}/imports`, label: 'Bulk import', icon: FileSpreadsheet, managersOnly: true },
    { href: `${base}/finance`, label: 'Finance', icon: Wallet, managersOnly: true },
    { href: `${base}/settings`, label: 'Settings', icon: Settings, managersOnly: true },
    { href: `${base}/team`, label: 'Team', icon: Users, managersOnly: true },
  ];
  const nav: NavItem[] = all.filter(n => canManage || !n.managersOnly);

  const shopName = d?.shop.nameEn ?? membership?.name ?? `Shop #${shopId}`;
  const role = membership?.role ?? user.platformRole ?? '';

  const context = (
    <div className="space-y-2 rounded-xl border bg-background p-2.5">
      <div className="flex items-center gap-2">
        <Initials name={shopName} className="size-9 shrink-0 rounded-lg text-sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{shopName}</p>
          <p className="text-xs text-muted-foreground">{humanize(role)}</p>
        </div>
      </div>
      {user.shops.length > 1 ? (
        <NativeSelect
          aria-label="Switch shop"
          value={shopId}
          onChange={e => {
            const next = Number(e.target.value);
            router.push(pathname.replace(`/portal/shop/${shopId}`, `/portal/shop/${next}`));
          }}
        >
          {user.shops.map(s => (
            <option key={s.shopId} value={s.shopId}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      ) : null}
    </div>
  );

  return (
    <DashboardShell title={shopName} context={context} nav={nav}>
      {children}
    </DashboardShell>
  );
}
