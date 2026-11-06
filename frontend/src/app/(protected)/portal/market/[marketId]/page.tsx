'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock,
  Inbox,
  Layers,
  MapPin,
  Pencil,
  Receipt,
  Store,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlock, PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { EmptyState } from '@/components/shared/Bits';
import { Field, ImageUploader } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import {
  floorLabel,
  formatTaka,
  formatTime,
  MARKET_KIND_LABEL,
  WEEKDAYS,
} from '@/utils/helpers/format';
import type { Market } from '@/utils/types';
import { marketBase, useMarketDashboard, useMarketId, useMarketRole } from './hooks/usemarket';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

export default function MarketDashboardPage() {
  const marketId = useMarketId();
  const { isAdmin } = useMarketRole(marketId);
  const { data, isLoading, isError, error } = useMarketDashboard(marketId);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load the dashboard"
        description={error?.message}
      />
    );

  const { market } = data;
  const activeShops = data.shops.active ?? 0;
  const otherShops = Object.entries(data.shops).filter(([s]) => s !== 'active');
  const maxRevenue = Math.max(1, ...data.topShops.map(s => s.revenue));

  return (
    <div className="space-y-6">
      <PageHeader
        title={market.nameEn}
        description={`${MARKET_KIND_LABEL[market.kind]} · ${market.addressLine}`}
        actions={
          <>
            {isAdmin ? (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Edit profile
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders today" value={data.ordersToday} icon={Receipt} />
        <StatCard
          label="Waiting at pickup desk"
          value={data.deskWaiting}
          icon={Inbox}
          tone={data.deskWaiting ? 'warning' : 'default'}
        />
        <StatCard
          label="Completed this month"
          value={data.monthOrders}
          hint={`GMV ${formatTaka(data.monthGmv)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Active shops"
          value={activeShops}
          hint={
            otherShops.length
              ? otherShops.map(([s, n]) => `${n} ${s}`).join(' · ')
              : 'All shops are live'
          }
          icon={Store}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Top shops this month" className="lg:col-span-2">
          {data.topShops.some(s => s.orders > 0) ? (
            <ul className="space-y-3">
              {data.topShops.map(s => (
                <li key={s.id}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate">
                      {s.nameEn}
                      {s.shopNumber ? (
                        <span className="text-muted-foreground"> · {s.shopNumber}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatTaka(s.revenue)}{' '}
                      <span className="text-xs text-muted-foreground">({s.orders})</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(s.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No completed orders this month yet.
            </p>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Market info">
            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>{market.addressLine}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {market.opensAt
                    ? `${formatTime(market.opensAt)} – ${formatTime(market.closesAt)}`
                    : 'Hours not set'}
                  {market.weeklyOffDay !== null ? ` · closed ${WEEKDAYS[market.weeklyOffDay]}` : ''}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {(market.floors ?? [])
                    .slice()
                    .sort((a, b) => a.level - b.level)
                    .map(f => `${floorLabel(f.level)} ${f.nameEn}`)
                    .join(' · ') || 'No floors'}
                </span>
              </div>
            </dl>
          </Panel>
          <Panel
            title="Pickup desks"
            action={
              <Button
                variant="link"
                size="sm"
                render={<Link href={`${marketBase(marketId)}/desk`} />}
              >
                Open desk
              </Button>
            }
          >
            {market.pickupPoints?.length ? (
              <ul className="space-y-2 text-sm">
                {market.pickupPoints.map(p => (
                  <li key={p.id}>
                    <p className="font-medium">
                      {p.nameEn}{' '}
                      {!p.isActive ? (
                        <span className="text-xs text-muted-foreground">(inactive)</span>
                      ) : null}
                    </p>
                    {p.instructions ? (
                      <p className="text-xs text-muted-foreground">{p.instructions}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pickup desk yet. Ask the platform team to set one up.
              </p>
            )}
          </Panel>
        </div>
      </div>
      {isAdmin ? (
        <ProfileDialog
          marketId={marketId}
          market={market}
          open={editing}
          onOpenChange={setEditing}
        />
      ) : null}
    </div>
  );
}

function ProfileDialog({
  marketId,
  market,
  open,
  onOpenChange,
}: {
  marketId: number;
  market: Market;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [description, setDescription] = useState(market.description ?? '');
  const [opensAt, setOpensAt] = useState(market.opensAt?.slice(0, 5) ?? '10:00');
  const [closesAt, setClosesAt] = useState(market.closesAt?.slice(0, 5) ?? '21:00');
  const [logo, setLogo] = useState<string[]>(market.logoUrl ? [market.logoUrl] : []);
  const [cover, setCover] = useState<string[]>(market.coverUrl ? [market.coverUrl] : []);

  const save = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.market.profile(marketId), {
        method: 'PATCH',
        body: {
          description: description.trim(),
          opensAt,
          closesAt,
          ...(logo[0] && { logoUrl: logo[0] }),
          ...(cover[0] && { coverUrl: cover[0] }),
        },
      }),
    onSuccess: () => {
      toast.success('Market profile updated');
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ['market', marketId] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit market profile</DialogTitle>
          </DialogHeader>
          <Field label="Description" htmlFor="desc">
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2000}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opens" htmlFor="opens">
              <Input
                id="opens"
                type="time"
                value={opensAt}
                onChange={e => setOpensAt(e.target.value)}
              />
            </Field>
            <Field label="Closes" htmlFor="closes">
              <Input
                id="closes"
                type="time"
                value={closesAt}
                onChange={e => setClosesAt(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Logo">
              <ImageUploader value={logo} onChange={setLogo} max={1} />
            </Field>
            <Field label="Cover">
              <ImageUploader value={cover} onChange={setCover} max={1} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
