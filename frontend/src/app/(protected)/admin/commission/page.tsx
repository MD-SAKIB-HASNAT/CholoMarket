'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Info, Percent, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { formatDate } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { toLocalInput, useAdminRole } from '@/app/(protected)/admin/utils/admin';
import {
  groupCategories,
  useAdminCategories,
  useAdminMarkets,
  useShopOptions,
} from '@/app/(protected)/admin/utils/hooks';
import type { CommissionRule } from '@/app/(protected)/admin/utils/types';
import { EmptyRow, ListFoot, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

type Scope = 'global' | 'category' | 'market' | 'shop';

function scopeOf(r: CommissionRule): { scope: Scope; label: string } {
  if (r.shop) return { scope: 'shop', label: `Shop · ${r.shop.nameEn}` };
  if (r.market) return { scope: 'market', label: `Market · ${r.market.nameEn}` };
  if (r.category) return { scope: 'category', label: `Category · ${r.category.nameEn}` };
  return { scope: 'global', label: 'Global (all sales)' };
}

const isActive = (r: CommissionRule, now = Date.now()) =>
  new Date(r.validFrom).getTime() <= now && (!r.validTo || new Date(r.validTo).getTime() > now);

export default function CommissionPage() {
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const editable = can('commission');
  const list = useCursorList<CommissionRule>(
    ['admin', 'commission'],
    ADMIN_ENDPOINTS.commission.rules,
    {
      limit: 20,
    }
  );
  const end = useMutation({
    mutationFn: (id: number) => api(ADMIN_ENDPOINTS.commission.endRule(id), { method: 'POST' }),
    // The reply is only the first page of rules, so reload the list as it is on screen.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'commission'] });
      toast.success('Rule ended');
    },
  });

  const [now] = useState(() => Date.now());
  return (
    <>
      <PageHeader
        title="Commission"
        description="What the platform earns on each sale, by category, market or individual shop."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid content-start gap-6 xl:col-span-2">
          <Panel>
            <div className="flex gap-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1.5 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    The most specific active rule wins:
                  </span>{' '}
                  shop → market → category → parent category → global.
                </p>
                <p>The shop’s subscription plan discount (e.g. Pro −2 pt) is then subtracted.</p>
                <p>
                  The rate is snapshotted on every order line, so changing rules never rewrites past
                  orders. Rules are never edited — end one and add another.
                </p>
                <p>A zero-commission launch period is simply a global 0% rule with an end date.</p>
              </div>
            </div>
          </Panel>
          <Panel title="Rules">
            <QueryState
              isLoading={list.isPending}
              error={list.error}
              emptyIcon={Percent}
              emptyTitle="No rules"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applies to</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Valid</TableHead>
                    <TableHead>Note</TableHead>
                    {editable ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.items.length ? (
                    list.items.map(r => {
                      const active = isActive(r, now);
                      const future = new Date(r.validFrom).getTime() > now;
                      return (
                        <TableRow key={r.id} className={active ? '' : 'text-muted-foreground'}>
                          <TableCell>
                            <p className="font-medium">{scopeOf(r).label}</p>
                            {active ? (
                              <Badge className="mt-1 bg-emerald-600 text-white">Active now</Badge>
                            ) : future ? (
                              <Badge variant="secondary" className="mt-1">
                                Scheduled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="mt-1">
                                Ended
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-base font-semibold tabular-nums">
                            {r.rate}%
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatDate(r.validFrom)} →{' '}
                            {r.validTo ? formatDate(r.validTo) : 'no end'}
                          </TableCell>
                          <TableCell className="max-w-xs whitespace-normal text-xs">
                            {r.note ?? '—'}
                          </TableCell>
                          {editable ? (
                            <TableCell>
                              {active || future ? (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  disabled={end.isPending}
                                  onClick={() => {
                                    if (confirm(`End "${scopeOf(r).label}" at ${r.rate}% now?`))
                                      end.mutate(r.id);
                                  }}
                                >
                                  End now
                                </Button>
                              ) : null}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })
                  ) : (
                    <EmptyRow colSpan={5}>
                      No commission rules — every sale is commission-free.
                    </EmptyRow>
                  )}
                </TableBody>
              </Table>
              <ListFoot
                shown={list.items.length}
                noun="rule"
                hasMore={!!list.hasMore}
                loading={list.isLoadingMore}
                onLoad={list.loadMore}
              />
            </QueryState>
          </Panel>
        </div>
        {editable ? <NewRule /> : null}
      </div>
    </>
  );
}

function NewRule() {
  const qc = useQueryClient();
  const categories = useAdminCategories();
  const markets = useAdminMarkets();
  const shops = useShopOptions();
  const [f, setF] = useState({
    scope: 'category' as Scope,
    targetId: '',
    rate: '',
    validFrom: toLocalInput(new Date()),
    validTo: '',
    note: '',
  });
  const create = useMutation({
    mutationFn: () =>
      api<CommissionRule>(ADMIN_ENDPOINTS.commission.rules, {
        method: 'POST',
        body: {
          ...(f.scope === 'category' && { categoryId: Number(f.targetId) }),
          ...(f.scope === 'market' && { marketId: Number(f.targetId) }),
          ...(f.scope === 'shop' && { shopId: Number(f.targetId) }),
          rate: Number(f.rate),
          validFrom: new Date(f.validFrom).toISOString(),
          ...(f.validTo && { validTo: new Date(f.validTo).toISOString() }),
          ...(f.note.trim() && { note: f.note.trim() }),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'commission'] });
      setF(p => ({ ...p, rate: '', note: '', validTo: '' }));
      toast.success('Rule added');
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <Panel title="Add a rule" className="h-fit">
      <form onSubmit={submit} className="grid gap-3">
        <Field label="Applies to" htmlFor="r-scope">
          <NativeSelect
            id="r-scope"
            value={f.scope}
            onChange={e => setF({ ...f, scope: e.target.value as Scope, targetId: '' })}
          >
            <option value="global">All sales (global default)</option>
            <option value="category">A category</option>
            <option value="market">A market</option>
            <option value="shop">A single shop</option>
          </NativeSelect>
        </Field>
        {f.scope === 'category' ? (
          <Field label="Category" htmlFor="r-target">
            <NativeSelect
              id="r-target"
              required
              value={f.targetId}
              onChange={e => setF({ ...f, targetId: e.target.value })}
            >
              <option value="">Choose…</option>
              {groupCategories(categories.data).map(g => (
                <optgroup key={g.parent.id} label={g.parent.nameEn}>
                  <option value={g.parent.id}>{g.parent.nameEn} (whole category)</option>
                  {g.children.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        {f.scope === 'market' ? (
          <Field label="Market" htmlFor="r-target">
            <NativeSelect
              id="r-target"
              required
              value={f.targetId}
              onChange={e => setF({ ...f, targetId: e.target.value })}
            >
              <option value="">Choose…</option>
              {markets.data?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nameEn}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        {f.scope === 'shop' ? (
          <Field label="Shop" htmlFor="r-target">
            <NativeSelect
              id="r-target"
              required
              value={f.targetId}
              onChange={e => setF({ ...f, targetId: e.target.value })}
            >
              <option value="">Choose…</option>
              {shops.data?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameEn}
                  {s.market ? ` — ${s.market.nameEn}` : ''}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <Field label="Rate (%)" htmlFor="r-rate">
          <Input
            id="r-rate"
            type="number"
            required
            min={0}
            max={100}
            step="0.01"
            value={f.rate}
            onChange={e => setF({ ...f, rate: e.target.value })}
          />
        </Field>
        <Field label="Valid from" htmlFor="r-from">
          <Input
            id="r-from"
            type="datetime-local"
            required
            value={f.validFrom}
            onChange={e => setF({ ...f, validFrom: e.target.value })}
          />
        </Field>
        <Field label="Valid until" htmlFor="r-to" hint="Leave empty for no end date.">
          <Input
            id="r-to"
            type="datetime-local"
            value={f.validTo}
            onChange={e => setF({ ...f, validTo: e.target.value })}
          />
        </Field>
        <Field label="Note" htmlFor="r-note">
          <Input
            id="r-note"
            placeholder="e.g. Eid campaign"
            value={f.note}
            onChange={e => setF({ ...f, note: e.target.value })}
          />
        </Field>
        <Button type="submit" disabled={create.isPending}>
          <Plus /> Add rule
        </Button>
      </form>
    </Panel>
  );
}
