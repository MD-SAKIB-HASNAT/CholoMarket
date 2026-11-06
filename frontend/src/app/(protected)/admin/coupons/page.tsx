'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate, formatTaka, humanize } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { toLocalInput, useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { useAdminMarkets, useShopOptions } from '@/app/(protected)/admin/utils/hooks';
import type { Coupon } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function CouponsPage() {
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const editable = can('coupons');
  const [creating, setCreating] = useState(false);
  const list = useCursorList<Coupon>(['admin', 'coupons'], ADMIN_ENDPOINTS.coupons.list, {
    limit: 20,
  });
  const toggle = useMutation({
    mutationFn: (c: Coupon) =>
      api(ADMIN_ENDPOINTS.coupons.byId(c.id), { method: 'PATCH', body: { isActive: !c.isActive } }),
    // The reply is only the first page of coupons, so reload the list as it is on screen.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
  const [now] = useState(() => Date.now());

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Platform, mall or shop-funded discount codes. Platform-funded discounts are paid back to shops through the ledger."
        actions={
          editable ? (
            <Button onClick={() => setCreating(true)}>
              <Plus /> New coupon
            </Button>
          ) : null
        }
      />
      <Panel>
        <QueryState
          isLoading={list.isPending}
          error={list.error}
          emptyIcon={Ticket}
          emptyTitle="No coupons"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Funded by</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Min order</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.length ? (
                list.items.map(c => {
                  const live =
                    c.isActive &&
                    new Date(c.startsAt).getTime() <= now &&
                    new Date(c.endsAt).getTime() > now;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-sm font-semibold">
                          {c.code}
                        </span>
                        {live ? <p className="mt-1 text-[11px] text-emerald-700">Live</p> : null}
                      </TableCell>
                      <TableCell>{humanize(c.fundedBy)}</TableCell>
                      <TableCell>
                        {c.shop ? c.shop.nameEn : c.market ? c.market.nameEn : 'Everywhere'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {c.discountType === 'percent'
                          ? `${c.discountValue}%`
                          : formatTaka(c.discountValue)}
                        {c.maxDiscount ? (
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            (max {formatTaka(c.maxDiscount)})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.minOrderTotal ? formatTaka(c.minOrderTotal) : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.usedCount}
                        {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                        <span className="block text-[11px] text-muted-foreground">
                          {c.perUserLimit}/customer
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={c.isActive}
                          disabled={!editable || toggle.isPending}
                          onCheckedChange={() => toggle.mutate(c)}
                          aria-label={c.isActive ? `Deactivate ${c.code}` : `Activate ${c.code}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <EmptyRow colSpan={8}>No coupons yet.</EmptyRow>
              )}
            </TableBody>
          </Table>
          <ListFoot
            shown={list.items.length}
            noun="coupon"
            hasMore={!!list.hasMore}
            loading={list.isLoadingMore}
            onLoad={list.loadMore}
          />
        </QueryState>
      </Panel>
      {creating ? <CouponDialog onClose={() => setCreating(false)} /> : null}
    </>
  );
}

function CouponDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const markets = useAdminMarkets();
  const shops = useShopOptions();
  const [f, setF] = useState(() => ({
    code: '',
    fundedBy: 'platform' as Coupon['fundedBy'],
    shopId: '',
    marketId: '',
    discountType: 'percent' as Coupon['discountType'],
    discountValue: '',
    maxDiscount: '',
    minOrderTotal: '',
    usageLimit: '',
    perUserLimit: '1',
    startsAt: toLocalInput(new Date()),
    endsAt: toLocalInput(new Date(Date.now() + 30 * 86_400_000)),
  }));
  const create = useMutation({
    mutationFn: () =>
      api<Coupon>(ADMIN_ENDPOINTS.coupons.list, {
        method: 'POST',
        body: {
          code: f.code.trim().toUpperCase(),
          fundedBy: f.fundedBy,
          ...(f.shopId && { shopId: Number(f.shopId) }),
          ...(f.marketId && { marketId: Number(f.marketId) }),
          discountType: f.discountType,
          discountValue: Number(f.discountValue),
          ...(f.maxDiscount && { maxDiscount: Number(f.maxDiscount) }),
          ...(f.minOrderTotal && { minOrderTotal: Number(f.minOrderTotal) }),
          ...(f.usageLimit && { usageLimit: Number(f.usageLimit) }),
          ...(f.perUserLimit && { perUserLimit: Number(f.perUserLimit) }),
          startsAt: new Date(f.startsAt).toISOString(),
          endsAt: new Date(f.endsAt).toISOString(),
        },
      }),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success(`Coupon ${c.code} created`);
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New coupon</DialogTitle>
          <DialogDescription>
            Restrict it to a mall or a shop, or leave both empty to use it everywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-3 overflow-y-auto sm:grid-cols-2">
          <Field label="Code" htmlFor="cp-code">
            <Input
              id="cp-code"
              className="font-mono uppercase"
              placeholder="EID10"
              value={f.code}
              onChange={e => setF({ ...f, code: e.target.value })}
            />
          </Field>
          <Field label="Funded by" htmlFor="cp-fund">
            <NativeSelect
              id="cp-fund"
              value={f.fundedBy}
              onChange={e => setF({ ...f, fundedBy: e.target.value as Coupon['fundedBy'] })}
            >
              <option value="platform">Platform (we pay shops back)</option>
              <option value="market">Market / mall</option>
              <option value="shop">Shop</option>
            </NativeSelect>
          </Field>
          <Field label="Only in market" htmlFor="cp-market">
            <NativeSelect
              id="cp-market"
              value={f.marketId}
              onChange={e => setF({ ...f, marketId: e.target.value })}
            >
              <option value="">Any market</option>
              {markets.data?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nameEn}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Only at shop" htmlFor="cp-shop">
            <NativeSelect
              id="cp-shop"
              value={f.shopId}
              onChange={e => setF({ ...f, shopId: e.target.value })}
            >
              <option value="">Any shop</option>
              {shops.data?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Discount type" htmlFor="cp-type">
            <NativeSelect
              id="cp-type"
              value={f.discountType}
              onChange={e => setF({ ...f, discountType: e.target.value as Coupon['discountType'] })}
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed taka off</option>
            </NativeSelect>
          </Field>
          <Field label={f.discountType === 'percent' ? 'Percent' : 'Amount (৳)'} htmlFor="cp-value">
            <Input
              id="cp-value"
              type="number"
              min={0}
              step="0.01"
              value={f.discountValue}
              onChange={e => setF({ ...f, discountValue: e.target.value })}
            />
          </Field>
          <Field label="Max discount (৳)" htmlFor="cp-max">
            <Input
              id="cp-max"
              type="number"
              min={0}
              value={f.maxDiscount}
              onChange={e => setF({ ...f, maxDiscount: e.target.value })}
            />
          </Field>
          <Field label="Minimum order (৳)" htmlFor="cp-min">
            <Input
              id="cp-min"
              type="number"
              min={0}
              value={f.minOrderTotal}
              onChange={e => setF({ ...f, minOrderTotal: e.target.value })}
            />
          </Field>
          <Field label="Total uses" htmlFor="cp-limit" hint="Empty = unlimited">
            <Input
              id="cp-limit"
              type="number"
              min={1}
              value={f.usageLimit}
              onChange={e => setF({ ...f, usageLimit: e.target.value })}
            />
          </Field>
          <Field label="Uses per customer" htmlFor="cp-per">
            <Input
              id="cp-per"
              type="number"
              min={1}
              value={f.perUserLimit}
              onChange={e => setF({ ...f, perUserLimit: e.target.value })}
            />
          </Field>
          <Field label="Starts" htmlFor="cp-start">
            <Input
              id="cp-start"
              type="datetime-local"
              value={f.startsAt}
              onChange={e => setF({ ...f, startsAt: e.target.value })}
            />
          </Field>
          <Field label="Ends" htmlFor="cp-end">
            <Input
              id="cp-end"
              type="datetime-local"
              value={f.endsAt}
              onChange={e => setF({ ...f, endsAt: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || f.code.trim().length < 3 || !f.discountValue}
          >
            <Check /> Create coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
