'use client';

import { Plus, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Bn, StatusBadge, VerifiedBadge } from '@/components/shared/Bits';
import { NativeSelect } from '@/components/shared/FormBits';
import { floorLabel, formatDate, formatPhone } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { useAdminMarkets } from '@/app/(protected)/admin/utils/hooks';
import type { AdminShop } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminShopsPage() {
  const router = useRouter();
  const { can } = useAdminRole();
  const markets = useAdminMarkets();
  const [status, setStatus] = useState('');
  const [marketId, setMarketId] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const list = useCursorList<AdminShop>(['admin', 'shops'], ADMIN_ENDPOINTS.shops.list, {
    status,
    marketId,
    q: search,
    limit: 20,
  });

  return (
    <>
      <PageHeader
        title="Shops"
        description="Every shop on the platform. Click a row to verify, place or change its plan."
        actions={
          can('shops') ? (
            <Button render={<Link href="/admin/shops/new" />}>
              <Plus /> Onboard shop
            </Button>
          ) : null
        }
      />
      <Panel>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem]">
          <form
            className="relative"
            onSubmit={e => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search name or shop number, press Enter"
              className="pl-8"
              aria-label="Search shops"
            />
          </form>
          <NativeSelect
            value={marketId}
            onChange={e => {
              setMarketId(e.target.value);
            }}
            aria-label="Market"
          >
            <option value="">All markets</option>
            {markets.data?.map(m => (
              <option key={m.id} value={m.id}>
                {m.nameEn}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={status}
            onChange={e => {
              setStatus(e.target.value);
            }}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </NativeSelect>
        </div>
        {list.isPending ? (
          <LoadingBlock />
        ) : list.error ? (
          <p className="py-8 text-center text-sm text-destructive">{list.error.message}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.length ? (
                  list.items.map(s => {
                    const owner = s.members.find(m => m.role === 'owner');
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/shops/${s.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/shops/${s.id}`}
                              className="font-medium hover:text-primary"
                              onClick={e => e.stopPropagation()}
                            >
                              {s.nameEn}
                            </Link>
                            {s.isVerified ? <VerifiedBadge className="size-3.5" /> : null}
                          </div>
                          <Bn className="block text-xs">{s.nameBn}</Bn>
                        </TableCell>
                        <TableCell>{s.market?.nameEn ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {s.floor ? floorLabel(s.floor.level) : '—'}
                          {s.shopNumber ? ` · ${s.shopNumber}` : ''}
                        </TableCell>
                        <TableCell>{s.primaryCategory?.nameEn ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {owner ? (
                            <>
                              <p>{owner.user.fullName ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPhone(owner.user.phone)}
                              </p>
                            </>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(s.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <EmptyRow colSpan={7}>
                    <Store className="mx-auto mb-2 size-5" /> No shops match these filters.
                  </EmptyRow>
                )}
              </TableBody>
            </Table>
            <ListFoot
              shown={list.items.length}
              noun="shop"
              hasMore={!!list.hasMore}
              loading={list.isLoadingMore}
              onLoad={list.loadMore}
            />
          </>
        )}
      </Panel>
    </>
  );
}
