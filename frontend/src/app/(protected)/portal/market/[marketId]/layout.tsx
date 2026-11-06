'use client';

import { Inbox, LayoutDashboard, ShieldAlert, Store } from 'lucide-react';
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
import { marketBase, useMarketDashboard, useMarketId, useMarketRole } from './hooks/usemarket';

export default function MarketPortalLayout({ children }: { children: ReactNode }) {
  const marketId = useMarketId();
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { role, allowed } = useMarketRole(marketId);
  const dashboard = useMarketDashboard(marketId, allowed);

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
          title="You don’t have access to this market"
          description="Ask the platform team to add you to the market’s management."
          action={<Button render={<Link href="/" />}>Back to shopping</Button>}
        />
      </div>
    );
  }

  const base = marketBase(marketId);
  const nav: NavItem[] = [
    { href: base, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `${base}/desk`, label: 'Pickup desk', icon: Inbox, badge: dashboard.data?.deskWaiting },
    { href: `${base}/shops`, label: 'Shops', icon: Store },
  ];
  const name =
    dashboard.data?.market.nameEn ??
    user.markets.find(m => m.marketId === marketId)?.name ??
    `Market #${marketId}`;

  const context = (
    <div className="space-y-2 rounded-xl border bg-background p-2.5">
      <div className="flex items-center gap-2">
        <Initials name={name} className="size-9 shrink-0 rounded-lg text-sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role ? humanize(role) : ''}</p>
        </div>
      </div>
      {user.markets.length > 1 ? (
        <NativeSelect
          aria-label="Switch market"
          value={marketId}
          onChange={e =>
            router.push(
              pathname.replace(`/portal/market/${marketId}`, `/portal/market/${e.target.value}`)
            )
          }
        >
          {user.markets.map(m => (
            <option key={m.marketId} value={m.marketId}>
              {m.name}
            </option>
          ))}
        </NativeSelect>
      ) : null}
    </div>
  );

  return (
    <DashboardShell title={name} context={context} nav={nav}>
      {children}
    </DashboardShell>
  );
}
