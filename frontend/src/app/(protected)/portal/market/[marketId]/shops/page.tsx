'use client';

import { AlertTriangle, Search, Store } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingBlock, PageHeader } from '@/components/dashboard/DashboardShell';
import { EmptyState, Rating, StatusBadge, VerifiedBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { floorLabel, formatPhone } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import type { Shop } from '@/utils/types';
import { useMarketId } from '@/app/(protected)/portal/market/[marketId]/hooks/usemarket';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export default function MarketShopsPage() {
  const marketId = useMarketId();
  const [q, setQ] = useState('');
  const list = useCursorList<Shop>(
    ['market', marketId, 'shops'],
    PORTAL_ENDPOINTS.market.shops(marketId),
    { limit: 50 }
  );

  // The search narrows the shops loaded so far; "Show more" brings in the rest.
  const needle = q.trim().toLowerCase();
  const shops = list.items.filter(
    s =>
      !needle ||
      `${s.nameEn} ${s.nameBn ?? ''} ${s.shopNumber ?? ''}`.toLowerCase().includes(needle)
  );

  return (
    <div>
      <PageHeader title="Shops" description="Every shop in this market, by floor." />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name or shop number"
          className="pl-8"
          aria-label="Search shops"
        />
      </div>
      {list.isPending ? (
        <LoadingBlock />
      ) : list.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Could not load shops"
          description={list.error?.message}
        />
      ) : !shops.length && !list.hasMore ? (
        <EmptyState icon={Store} title="No shops found" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      {s.nameEn}
                      {s.isVerified ? <VerifiedBadge className="size-3.5" /> : null}
                    </div>
                    {s.nameBn ? (
                      <p lang="bn" className="text-xs text-muted-foreground">
                        {s.nameBn}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s.floor ? floorLabel(s.floor.level) : '—'}
                    {s.shopNumber ? (
                      <span className="text-muted-foreground"> · {s.shopNumber}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.primaryCategory?.nameEn ?? '—'}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap lg:table-cell">
                    {formatPhone(s.phone)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Rating value={s.ratingAvg} count={s.ratingCount} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <LoadMore
        hasMore={!!list.hasMore}
        loading={list.isLoadingMore}
        onLoad={list.loadMore}
        label="Show more shops"
      />
    </div>
  );
}
