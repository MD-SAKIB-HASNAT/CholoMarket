'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import {
  groupCategories,
  useAdminCategories,
  useAdminMarkets,
} from '@/app/(protected)/admin/utils/hooks';
import type { AdminMarket, AdminShopDetail } from '@/app/(protected)/admin/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

export default function OnboardShopPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useAdminRole();
  const markets = useAdminMarkets();
  const categories = useAdminCategories();
  const [f, setF] = useState({
    marketId: '',
    floorId: '',
    shopNumber: '',
    walkOrder: '',
    nameEn: '',
    nameBn: '',
    description: '',
    primaryCategoryId: '',
    categoryIds: [] as number[],
    phone: '',
    ownerPhone: '',
    ownerName: '',
    status: 'active',
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  const market = useQuery({
    queryKey: ['admin', 'market', f.marketId],
    queryFn: () => api<AdminMarket>(ADMIN_ENDPOINTS.markets.byId(f.marketId)),
    enabled: !!f.marketId,
  });

  const onboard = useMutation({
    mutationFn: () =>
      api<AdminShopDetail>(ADMIN_ENDPOINTS.shops.list, {
        method: 'POST',
        body: {
          marketId: Number(f.marketId),
          ...(f.floorId && { floorId: Number(f.floorId) }),
          ...(f.shopNumber.trim() && { shopNumber: f.shopNumber.trim() }),
          ...(f.walkOrder && { walkOrder: Number(f.walkOrder) }),
          nameEn: f.nameEn.trim(),
          ...(f.nameBn.trim() && { nameBn: f.nameBn.trim() }),
          ...(f.description.trim() && { description: f.description.trim() }),
          primaryCategoryId: Number(f.primaryCategoryId),
          categoryIds: f.categoryIds,
          ...(f.phone.trim() && { phone: f.phone.trim() }),
          ownerPhone: f.ownerPhone.trim(),
          ...(f.ownerName.trim() && { ownerName: f.ownerName.trim() }),
          status: f.status,
        },
      }),
    onSuccess: shop => {
      qc.invalidateQueries({ queryKey: ['admin', 'shops'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(`${shop.nameEn} is on the platform. The owner got an SMS.`);
      router.push(`/admin/shops/${shop.id}`);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    onboard.mutate();
  }

  const grouped = groupCategories(categories.data);
  const floors = [...(market.data?.floors ?? [])].sort((a, b) => a.level - b.level);

  return (
    <>
      <PageHeader
        title="Onboard a shop"
        description="Sign a shop up on the spot. The owner’s account is created from their mobile number if they’re new."
        actions={
          <Button variant="outline" render={<Link href="/admin/shops" />}>
            <ArrowLeft /> All shops
          </Button>
        }
      />
      <form onSubmit={submit}>
        <fieldset disabled={!can('shops')} className="grid gap-6 lg:grid-cols-3">
          <div className="grid content-start gap-6 lg:col-span-2">
            <Panel title="Where is it?">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Market" htmlFor="s-market">
                  <NativeSelect
                    id="s-market"
                    required
                    value={f.marketId}
                    onChange={e => setF(p => ({ ...p, marketId: e.target.value, floorId: '' }))}
                  >
                    <option value="">Choose market</option>
                    {markets.data?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nameEn}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Floor" htmlFor="s-floor">
                  <NativeSelect
                    id="s-floor"
                    value={f.floorId}
                    onChange={e => set('floorId', e.target.value)}
                    disabled={!f.marketId}
                  >
                    <option value="">{market.isLoading ? 'Loading…' : '—'}</option>
                    {floors.map(fl => (
                      <option key={fl.id} value={fl.id}>
                        {fl.nameEn}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Shop number" htmlFor="s-number">
                  <Input
                    id="s-number"
                    placeholder="L2-21"
                    value={f.shopNumber}
                    onChange={e => set('shopNumber', e.target.value)}
                  />
                </Field>
                <Field
                  label="Walk-through order"
                  htmlFor="s-walk"
                  hint="Position when customers walk the floor."
                >
                  <Input
                    id="s-walk"
                    type="number"
                    min={0}
                    value={f.walkOrder}
                    onChange={e => set('walkOrder', e.target.value)}
                  />
                </Field>
              </div>
            </Panel>
            <Panel title="About the shop">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name (English)" htmlFor="s-en">
                  <Input
                    id="s-en"
                    required
                    value={f.nameEn}
                    onChange={e => set('nameEn', e.target.value)}
                  />
                </Field>
                <Field label="নাম (বাংলা)" htmlFor="s-bn">
                  <Input
                    id="s-bn"
                    lang="bn"
                    value={f.nameBn}
                    onChange={e => set('nameBn', e.target.value)}
                  />
                </Field>
                <Field label="Description" htmlFor="s-desc" className="sm:col-span-2">
                  <Textarea
                    id="s-desc"
                    rows={3}
                    value={f.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </Field>
                <Field label="Main category" htmlFor="s-cat">
                  <NativeSelect
                    id="s-cat"
                    required
                    value={f.primaryCategoryId}
                    onChange={e => set('primaryCategoryId', e.target.value)}
                  >
                    <option value="">Choose category</option>
                    {grouped.map(g => (
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
                <Field label="Shop phone" htmlFor="s-phone" hint="Defaults to the owner’s number.">
                  <Input
                    id="s-phone"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    value={f.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Also sells</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {grouped.map(g => (
                    <div key={g.parent.id} className="rounded-lg border p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                        <CategoryIcon
                          name={g.parent.icon}
                          className="size-4 text-muted-foreground"
                        />{' '}
                        {g.parent.nameEn}
                      </p>
                      <div className="grid gap-1.5">
                        {g.children.map(c => {
                          const checked = f.categoryIds.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={v =>
                                  set(
                                    'categoryIds',
                                    v
                                      ? [...f.categoryIds, c.id]
                                      : f.categoryIds.filter(x => x !== c.id)
                                  )
                                }
                              />
                              {c.nameEn}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
          <div className="grid content-start gap-6">
            <Panel title="Owner">
              <div className="grid gap-4">
                <Field
                  label="Owner’s mobile"
                  htmlFor="s-owner"
                  hint="They log in with this number via OTP."
                >
                  <Input
                    id="s-owner"
                    required
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    value={f.ownerPhone}
                    onChange={e => set('ownerPhone', e.target.value)}
                  />
                </Field>
                <Field label="Owner’s name" htmlFor="s-owner-name">
                  <Input
                    id="s-owner-name"
                    value={f.ownerName}
                    onChange={e => set('ownerName', e.target.value)}
                  />
                </Field>
                <Field label="Start as" htmlFor="s-status">
                  <NativeSelect
                    id="s-status"
                    value={f.status}
                    onChange={e => set('status', e.target.value)}
                  >
                    <option value="active">Active (visible now)</option>
                    <option value="pending">Pending (hidden until approved)</option>
                  </NativeSelect>
                </Field>
              </div>
            </Panel>
            <Button type="submit" size="lg" disabled={onboard.isPending}>
              {onboard.isPending ? <LoaderCircle className="animate-spin" /> : <Store />} Onboard
              shop
            </Button>
            <p className="text-xs text-muted-foreground">
              The shop starts on the Free plan. Record the physical visit and approve the trade
              licence to give it the verified badge.
            </p>
          </div>
        </fieldset>
      </form>
    </>
  );
}
