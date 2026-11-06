'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  CircleCheck,
  Footprints,
  LayoutDashboard,
  LoaderCircle,
  Save,
  ShieldCheck,
  Store,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, Panel, StatCard } from '@/components/dashboard/DashboardShell';
import { Bn, StatusBadge, VerifiedBadge } from '@/components/shared/Bits';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { Initials } from '@/components/shared/Media';
import { api } from '@/utils/api/api';
import { formatDate, formatPhone, formatTaka, humanize } from '@/utils/helpers/format';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { groupCategories, useAdminCategories, usePlans } from '@/app/(protected)/admin/utils/hooks';
import type { AdminShopDetail, Verification } from '@/app/(protected)/admin/utils/types';
import { DefList, QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ReviewDialog, VerificationRow } from '@/app/(protected)/admin/components/Verification';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function AdminShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const key = ['admin', 'shop', id];
  const {
    data: shop,
    isLoading,
    error,
    dataUpdatedAt,
  } = useQuery({
    queryKey: key,
    queryFn: () => api<AdminShopDetail>(ADMIN_ENDPOINTS.shops.byId(id)),
  });
  const [reviewing, setReviewing] = useState<{
    v: Verification;
    decision: 'approved' | 'rejected';
  } | null>(null);
  const [visitOpen, setVisitOpen] = useState(false);

  const done = (msg: string) => (s: AdminShopDetail) => {
    qc.setQueryData(key, s);
    qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
    toast.success(msg);
  };

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<AdminShopDetail>(ADMIN_ENDPOINTS.shops.byId(id), { method: 'PATCH', body }),
    onSuccess: done('Shop updated'),
  });

  const owner = shop?.members.find(m => m.role === 'owner');

  return (
    <>
      <PageHeader
        title={shop?.nameEn ?? 'Shop'}
        description={
          shop ? (
            <span className="flex flex-wrap items-center gap-2">
              <Bn>{shop.nameBn}</Bn>
              <StatusBadge status={shop.status} />
              {shop.isVerified ? (
                <VerifiedBadge withText />
              ) : (
                <span className="text-xs">Not verified</span>
              )}
            </span>
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" render={<Link href="/admin/shops" />}>
              <ArrowLeft /> All shops
            </Button>
            {shop ? (
              <>
                <Button variant="outline" render={<Link href={`/portal/shop/${shop.id}`} />}>
                  <LayoutDashboard /> Shop portal
                </Button>
              </>
            ) : null}
          </>
        }
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={!shop}
        emptyIcon={Store}
        emptyTitle="Shop not found"
      >
        {shop ? (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Balance owed to shop"
                value={formatTaka(shop.balance)}
                icon={Wallet}
              />
              <StatCard
                label="Rating"
                value={shop.ratingCount ? `${shop.ratingAvg.toFixed(1)} ★` : '—'}
                hint={`${shop.ratingCount} reviews`}
              />
              <StatCard
                label="Plan"
                value={shop.subscription?.plan.nameEn ?? 'None'}
                hint={
                  shop.subscription ? `Since ${formatDate(shop.subscription.startsAt)}` : undefined
                }
              />
              <StatCard label="Joined" value={formatDate(shop.createdAt)} />
            </div>

            {can('shops') ? (
              <Panel title="Status">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-2 text-sm text-muted-foreground">Currently</span>
                  <StatusBadge status={shop.status} />
                  <span className="flex-1" />
                  {shop.status !== 'active' ? (
                    <Button
                      size="sm"
                      onClick={() => patch.mutate({ status: 'active' })}
                      disabled={patch.isPending}
                    >
                      <CircleCheck /> Activate
                    </Button>
                  ) : null}
                  {shop.status !== 'suspended' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Suspend ${shop.nameEn}? It disappears from the store.`))
                          patch.mutate({ status: 'suspended' });
                      }}
                      disabled={patch.isPending}
                    >
                      <Ban /> Suspend
                    </Button>
                  ) : null}
                  {shop.status !== 'closed' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Mark ${shop.nameEn} as closed?`))
                          patch.mutate({ status: 'closed' });
                      }}
                      disabled={patch.isPending}
                    >
                      Close shop
                    </Button>
                  ) : null}
                </div>
              </Panel>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <PlacementForm
                key={dataUpdatedAt}
                shop={shop}
                editable={can('shops')}
                saving={patch.isPending}
                onSave={b => patch.mutate(b)}
              />
              <div className="grid content-start gap-6">
                <Panel title="Owner & team">
                  {owner ? (
                    <div className="mb-3 flex items-center gap-3">
                      <Initials
                        name={owner.user.fullName ?? owner.user.phone}
                        className="size-10 rounded-full text-sm"
                      />
                      <div>
                        <p className="font-medium">{owner.user.fullName ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPhone(owner.user.phone)} · Owner
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <ul className="divide-y text-sm">
                    {shop.members
                      .filter(m => m.role !== 'owner')
                      .map(m => (
                        <li key={m.userId} className="flex items-center justify-between py-1.5">
                          <span>
                            {m.user.fullName ?? '—'}{' '}
                            <span className="text-muted-foreground">
                              · {formatPhone(m.user.phone)}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {humanize(m.role)}
                            {!m.isActive ? ' (removed)' : ''}
                          </span>
                        </li>
                      ))}
                  </ul>
                  {shop.members.length <= 1 ? (
                    <p className="text-xs text-muted-foreground">No staff added yet.</p>
                  ) : null}
                </Panel>
                <SubscriptionPanel
                  shop={shop}
                  editable={can('subscription')}
                  onSaved={done('Plan changed')}
                />
                <Panel title="Details">
                  <DefList
                    items={[
                      ['Market', shop.market?.nameEn ?? '—'],
                      ['Phone', formatPhone(shop.phone)],
                      ['Categories', shop.categories.map(c => c.category.nameEn).join(', ') || '—'],
                      ['Bargaining', shop.acceptsOffers ? 'Accepts offers' : 'Fixed prices'],
                      ['Cash at pickup', shop.acceptsCashOnPickup ? 'Yes' : 'No'],
                      ['Deposit', shop.depositPercent ? `${shop.depositPercent}%` : 'None'],
                      ['Hold time', `${shop.reservationHours} hours`],
                      ['Returns', `${shop.returnWindowDays} days`],
                    ]}
                  />
                </Panel>
              </div>
            </div>

            <Panel
              title="Verification"
              action={
                can('shops') ? (
                  <Button size="sm" variant="outline" onClick={() => setVisitOpen(true)}>
                    <Footprints /> Record physical visit
                  </Button>
                ) : null
              }
            >
              <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4" /> The verified badge needs an approved trade
                licence <b>and</b> a physical visit by our team.
              </p>
              {shop.verifications.length ? (
                <div className="grid gap-2">
                  {shop.verifications.map(v => (
                    <VerificationRow
                      key={v.id}
                      v={v}
                      canReview={can('shops')}
                      onReview={(vv, decision) => setReviewing({ v: vv, decision })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The shop hasn’t submitted any documents.
                </p>
              )}
            </Panel>
          </div>
        ) : null}
      </QueryState>
      {reviewing ? (
        <ReviewDialog
          verification={reviewing.v}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
        />
      ) : null}
      {visitOpen && shop ? (
        <VisitDialog
          shopId={shop.id}
          onClose={() => setVisitOpen(false)}
          onSaved={done('Visit recorded')}
        />
      ) : null}
    </>
  );
}

function PlacementForm({
  shop,
  editable,
  saving,
  onSave,
}: {
  shop: AdminShopDetail;
  editable: boolean;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const categories = useAdminCategories();
  const [f, setF] = useState({
    nameEn: shop.nameEn,
    nameBn: shop.nameBn ?? '',
    floorId: shop.floorId ? String(shop.floorId) : '',
    shopNumber: shop.shopNumber ?? '',
    walkOrder: shop.walkOrder != null ? String(shop.walkOrder) : '',
    mapX: shop.mapX != null ? String(shop.mapX) : '',
    mapY: shop.mapY != null ? String(shop.mapY) : '',
    primaryCategoryId: shop.primaryCategoryId ? String(shop.primaryCategoryId) : '',
  });
  const floors = [...(shop.market?.floors ?? [])].sort((a, b) => a.level - b.level);
  const num = (v: string) => (v === '' ? null : Number(v));

  return (
    <Panel title="Name & placement">
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave({
            nameEn: f.nameEn.trim(),
            nameBn: f.nameBn.trim() || null,
            floorId: num(f.floorId),
            shopNumber: f.shopNumber.trim() || null,
            walkOrder: num(f.walkOrder),
            mapX: num(f.mapX),
            mapY: num(f.mapY),
            ...(f.primaryCategoryId && { primaryCategoryId: Number(f.primaryCategoryId) }),
          });
        }}
      >
        <fieldset disabled={!editable} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (English)" htmlFor="p-en">
            <Input
              id="p-en"
              required
              value={f.nameEn}
              onChange={e => setF({ ...f, nameEn: e.target.value })}
            />
          </Field>
          <Field label="নাম (বাংলা)" htmlFor="p-bn">
            <Input
              id="p-bn"
              lang="bn"
              value={f.nameBn}
              onChange={e => setF({ ...f, nameBn: e.target.value })}
            />
          </Field>
          <Field label="Floor" htmlFor="p-floor">
            <NativeSelect
              id="p-floor"
              value={f.floorId}
              onChange={e => setF({ ...f, floorId: e.target.value })}
            >
              <option value="">—</option>
              {floors.map(fl => (
                <option key={fl.id} value={fl.id}>
                  {fl.nameEn}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Shop number" htmlFor="p-number">
            <Input
              id="p-number"
              value={f.shopNumber}
              onChange={e => setF({ ...f, shopNumber: e.target.value })}
            />
          </Field>
          <Field label="Walk-through order" htmlFor="p-walk">
            <Input
              id="p-walk"
              type="number"
              value={f.walkOrder}
              onChange={e => setF({ ...f, walkOrder: e.target.value })}
            />
          </Field>
          <Field label="Main category" htmlFor="p-cat">
            <NativeSelect
              id="p-cat"
              value={f.primaryCategoryId}
              onChange={e => setF({ ...f, primaryCategoryId: e.target.value })}
            >
              {groupCategories(categories.data).map(g => (
                <optgroup key={g.parent.id} label={g.parent.nameEn}>
                  <option value={g.parent.id}>{g.parent.nameEn} (all)</option>
                  {g.children.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Map pin X (%)" htmlFor="p-x" hint="Position on the floor map, 0–100.">
            <Input
              id="p-x"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={f.mapX}
              onChange={e => setF({ ...f, mapX: e.target.value })}
            />
          </Field>
          <Field label="Map pin Y (%)" htmlFor="p-y">
            <Input
              id="p-y"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={f.mapY}
              onChange={e => setF({ ...f, mapY: e.target.value })}
            />
          </Field>
          {editable ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Save />} Save
              </Button>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Panel>
  );
}

function SubscriptionPanel({
  shop,
  editable,
  onSaved,
}: {
  shop: AdminShopDetail;
  editable: boolean;
  onSaved: (s: AdminShopDetail) => void;
}) {
  const plans = usePlans();
  const [code, setCode] = useState(shop.subscription?.plan.code ?? 'free');
  const change = useMutation({
    mutationFn: () =>
      api<AdminShopDetail>(ADMIN_ENDPOINTS.shops.subscription(shop.id), {
        method: 'POST',
        body: { planCode: code },
      }),
    onSuccess: onSaved,
  });
  const selected = plans.data?.find(p => p.code === code);
  return (
    <Panel title="Subscription plan">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Plan" htmlFor="sub-plan" className="min-w-48 flex-1">
          <NativeSelect
            id="sub-plan"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={!editable}
          >
            {plans.data?.map(p => (
              <option key={p.code} value={p.code}>
                {p.nameEn} — {p.monthlyPrice ? `${formatTaka(p.monthlyPrice)}/month` : 'free'}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {editable ? (
          <Button
            onClick={() => change.mutate()}
            disabled={change.isPending || code === shop.subscription?.plan.code}
          >
            Change plan
          </Button>
        ) : null}
      </div>
      {selected ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Up to {selected.maxProducts ?? 'unlimited'} products · {selected.maxStaff ?? 'unlimited'}{' '}
          staff ·{' '}
          {selected.commissionDiscount
            ? `${selected.commissionDiscount} pt off commission`
            : 'standard commission'}
        </p>
      ) : null}
    </Panel>
  );
}

function VisitDialog({
  shopId,
  onClose,
  onSaved,
}: {
  shopId: number;
  onClose: () => void;
  onSaved: (s: AdminShopDetail) => void;
}) {
  const [notes, setNotes] = useState('');
  const save = useMutation({
    mutationFn: () =>
      api<AdminShopDetail>(ADMIN_ENDPOINTS.shops.visit(shopId), {
        method: 'POST',
        body: { ...(notes.trim() && { notes: notes.trim() }) },
      }),
    onSuccess: s => {
      onSaved(s);
      onClose();
    },
  });
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record physical visit</DialogTitle>
          <DialogDescription>
            Confirm someone from our team visited the shop in person and it matches its listing.
          </DialogDescription>
        </DialogHeader>
        <Field label="Notes" htmlFor="visit-notes">
          <Textarea
            id="visit-notes"
            rows={3}
            placeholder="Visited 23 Oct, photos taken, stock matches."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Footprints /> Record visit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
