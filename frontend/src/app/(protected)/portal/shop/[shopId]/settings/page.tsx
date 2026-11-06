'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Copy,
  FlaskConical,
  KeyRound,
  LoaderCircle,
  PlugZap,
  Save,
  Star,
  Trash2,
  Truck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { Field, ImageUploader, NativeSelect } from '@/components/shared/FormBits';
import { Badge } from '@/components/ui/badge';
import { api, API_URL } from '@/utils/api/api';
import { formatDate, formatTaka, humanize, timeAgo, WEEKDAYS } from '@/utils/helpers/format';
import type { Category, Shop } from '@/utils/types';
import {
  useCourierAccounts,
  type CourierAccount,
} from '@/app/(protected)/portal/shop/[shopId]/components/Delivery';
import { useShopId, useShopRole } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

type Hours = {
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};
type Settings = Shop & { categoryIds: number[]; hours: Hours[] };

interface Verification {
  id: number;
  kind: string;
  documentNumber: string | null;
  documentUrl: string | null;
  status: string;
  expiresOn: string | null;
  notes: string | null;
  createdAt: string;
}

const localPhone = (p: string | null) => (p ? p.replace(/^\+88/, '') : '');

function ShopSettingsPage() {
  const shopId = useShopId();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['shop', shopId, 'settings'],
    queryFn: () => api<Settings>(PORTAL_ENDPOINTS.shop.settings(shopId)),
  });

  // Content loads after navigation, so jump to #delivery / #verification once it's there.
  const loaded = !!data;
  useEffect(() => {
    if (loaded && window.location.hash)
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [loaded]);

  if (isLoading) return <LoadingBlock rows={6} />;
  if (isError || !data)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load settings"
        description={error?.message}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop settings"
        description="What customers see on your shop page, and how you take orders."
      />
      <ProfileForm key={data.id} shopId={shopId} settings={data} />
      <DeliverySection shopId={shopId} offersDelivery={data.offersDelivery} />
      <HoursForm shopId={shopId} hours={data.hours} />
      <VerificationSection shopId={shopId} verified={data.isVerified} />
    </div>
  );
}

function ProfileForm({ shopId, settings }: { shopId: number; settings: Settings }) {
  const qc = useQueryClient();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>(PORTAL_ENDPOINTS.shared.categories, { token: null }),
  });
  const [f, setF] = useState({
    nameEn: settings.nameEn,
    nameBn: settings.nameBn ?? '',
    description: settings.description ?? '',
    phone: localPhone(settings.phone),
    whatsapp: localPhone(settings.whatsapp),
    logo: settings.logoUrl ? [settings.logoUrl] : [],
    cover: settings.coverUrl ? [settings.coverUrl] : [],
    categoryIds: settings.categoryIds,
    acceptsOffers: settings.acceptsOffers,
    acceptsCashOnPickup: settings.acceptsCashOnPickup,
    depositPercent: String(settings.depositPercent ?? 0),
    reservationHours: String(settings.reservationHours),
    returnWindowDays: String(settings.returnWindowDays),
    returnPolicy: settings.returnPolicy ?? '',
    warrantyPolicy: settings.warrantyPolicy ?? '',
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(s => ({ ...s, [k]: v }));

  const save = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.settings(shopId), {
        method: 'PATCH',
        body: {
          nameEn: f.nameEn.trim(),
          nameBn: f.nameBn.trim() || null,
          description: f.description.trim() || null,
          phone: f.phone.trim() || null,
          whatsapp: f.whatsapp.trim() || null,
          logoUrl: f.logo[0] ?? null,
          coverUrl: f.cover[0] ?? null,
          categoryIds: f.categoryIds,
          acceptsOffers: f.acceptsOffers,
          acceptsCashOnPickup: f.acceptsCashOnPickup,
          depositPercent: Number(f.depositPercent) || 0,
          reservationHours: Number(f.reservationHours) || 24,
          returnWindowDays: Number(f.returnWindowDays) || 0,
          returnPolicy: f.returnPolicy.trim() || null,
          warrantyPolicy: f.warrantyPolicy.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  const toggleCategory = (id: number, on: boolean) =>
    set(
      'categoryIds',
      on ? [...new Set([...f.categoryIds, id])] : f.categoryIds.filter(c => c !== id)
    );

  return (
    <form onSubmit={submit} className="space-y-6">
      <Panel title="Profile">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop name (English)" htmlFor="nameEn">
              <Input
                id="nameEn"
                value={f.nameEn}
                onChange={e => set('nameEn', e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </Field>
            <Field label="দোকানের নাম (বাংলা)" htmlFor="nameBn">
              <Input
                id="nameBn"
                lang="bn"
                value={f.nameBn}
                onChange={e => set('nameBn', e.target.value)}
                maxLength={100}
              />
            </Field>
          </div>
          <Field label="About the shop" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={f.description}
              onChange={e => set('description', e.target.value)}
              maxLength={2000}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone">
              <Input
                id="phone"
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                value={f.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="whatsapp">
              <Input
                id="whatsapp"
                inputMode="tel"
                placeholder="01XXXXXXXXX"
                value={f.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo">
              <ImageUploader value={f.logo} onChange={v => set('logo', v)} max={1} />
            </Field>
            <Field label="Cover photo">
              <ImageUploader value={f.cover} onChange={v => set('cover', v)} max={1} />
            </Field>
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">What you sell</legend>
            {(categories.data ?? []).map(root => (
              <div key={root.id} className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{root.nameEn}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {(root.children?.length ? root.children : [root]).map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={f.categoryIds.includes(c.id)}
                        onCheckedChange={on => toggleCategory(c.id, !!on)}
                      />
                      {c.nameEn}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        </div>
      </Panel>

      <Panel title="Ordering policies">
        <div className="grid gap-4">
          <ToggleRow
            label="Accept price offers"
            hint="Customers can bargain on products where you allow it."
            checked={f.acceptsOffers}
            onChange={v => set('acceptsOffers', v)}
          />
          <ToggleRow
            label="Accept cash at pickup"
            hint="Turn off to require bKash or Nagad for every order."
            checked={f.acceptsCashOnPickup}
            onChange={v => set('acceptsCashOnPickup', v)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Deposit for cash orders (%)"
              htmlFor="deposit"
              hint="Paid online up front. 0 = none."
            >
              <Input
                id="deposit"
                inputMode="decimal"
                value={f.depositPercent}
                onChange={e => set('depositPercent', e.target.value)}
              />
            </Field>
            <Field label="Hold items for" htmlFor="hold">
              <NativeSelect
                id="hold"
                value={f.reservationHours}
                onChange={e => set('reservationHours', e.target.value)}
              >
                {[6, 12, 24, 48, 72].map(h => (
                  <option key={h} value={h}>
                    {h} hours
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Return window (days)" htmlFor="returnDays">
              <Input
                id="returnDays"
                inputMode="numeric"
                value={f.returnWindowDays}
                onChange={e => set('returnWindowDays', e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
          <Field label="Return policy" htmlFor="returnPolicy">
            <Textarea
              id="returnPolicy"
              rows={2}
              value={f.returnPolicy}
              onChange={e => set('returnPolicy', e.target.value)}
              maxLength={2000}
            />
          </Field>
          <Field label="Warranty policy" htmlFor="warrantyPolicy">
            <Textarea
              id="warrantyPolicy"
              rows={2}
              value={f.warrantyPolicy}
              onChange={e => set('warrantyPolicy', e.target.value)}
              maxLength={2000}
            />
          </Field>
        </div>
      </Panel>
      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <LoaderCircle className="animate-spin" /> : <Save />} Save settings
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={v => onChange(v)} />
    </label>
  );
}

const WEBHOOK_URL = `${API_URL}/webhooks/steadfast`;

function DeliverySection({ shopId, offersDelivery }: { shopId: number; offersDelivery: boolean }) {
  const qc = useQueryClient();
  const { isOwner, canViewCouriers } = useShopRole(shopId);
  const accounts = useCourierAccounts(shopId, canViewCouriers);
  const [balances, setBalances] = useState<Record<number, string>>({});

  const toggle = useMutation({
    mutationFn: (on: boolean) =>
      api(PORTAL_ENDPOINTS.shop.settings(shopId), {
        method: 'PATCH',
        body: { offersDelivery: on },
      }),
    onSuccess: (_d, on) => {
      toast.success(
        on ? 'Home delivery is on — customers can order to their door' : 'Home delivery is off'
      );
      qc.invalidateQueries({ queryKey: ['shop', shopId] });
    },
    onError: e => toast.error(e.message),
  });
  const refetchAccounts = () => qc.invalidateQueries({ queryKey: ['shop', shopId, 'couriers'] });
  const makeDefault = useMutation({
    mutationFn: (a: CourierAccount) =>
      api(PORTAL_ENDPOINTS.shop.courier(shopId, a.id), {
        method: 'PATCH',
        body: { provider: a.provider, mode: a.mode, label: a.label, isDefault: true },
      }),
    onSuccess: () => {
      toast.success('Default courier account changed');
      refetchAccounts();
    },
    onError: e => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: (a: CourierAccount) =>
      api<{ ok: boolean; balance: number | string; mode: string }>(
        PORTAL_ENDPOINTS.shop.courierTest(shopId, a.id),
        { method: 'POST' }
      ),
    onSuccess: (r, a) => {
      const text = `Connected · balance ${formatTaka(Number(r.balance) || 0)}`;
      setBalances(b => ({ ...b, [a.id]: text }));
      toast.success(text);
      refetchAccounts();
    },
    onError: e => {
      toast.error(e.message);
      refetchAccounts();
    },
  });
  const remove = useMutation({
    mutationFn: (a: CourierAccount) =>
      api<CourierAccount[]>(PORTAL_ENDPOINTS.shop.courier(shopId, a.id), { method: 'DELETE' }),
    onSuccess: list => {
      toast.success('Courier account removed');
      qc.setQueryData(['shop', shopId, 'couriers'], list);
    },
    onError: e => toast.error(e.message),
  });

  const checked = toggle.isPending ? !!toggle.variables : offersDelivery;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      toast.success('Webhook URL copied');
    } catch {
      toast.error('Could not copy — select the text instead');
    }
  };

  return (
    <section id="delivery" className="scroll-mt-20">
      <Panel title="Delivery">
        <div className="grid gap-5">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">
                We deliver (home delivery &amp; cash on delivery)
              </span>
              <span className="block text-xs text-muted-foreground">
                Customers can choose delivery to their door. We send parcels with Steadfast and the
                rider collects cash.
                {!isOwner ? ' Only the shop owner can change this.' : ''}
              </span>
            </span>
            <Switch
              checked={checked}
              disabled={!isOwner || toggle.isPending}
              onCheckedChange={v => toggle.mutate(v)}
            />
          </label>

          {canViewCouriers ? (
            <div className="grid gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Truck className="size-4" /> Courier accounts
              </h3>
              {accounts.isLoading ? (
                <LoadingBlock rows={1} />
              ) : accounts.data?.length ? (
                <ul className="divide-y rounded-lg border">
                  {accounts.data.map(a => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {a.label}
                          <Badge
                            variant="outline"
                            className={
                              a.mode === 'mock'
                                ? 'border-violet-200 bg-violet-50 text-violet-800'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }
                          >
                            {a.mode === 'mock' ? 'Test mode' : 'Live'}
                          </Badge>
                          {a.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Steadfast
                          {a.keyHint
                            ? ` · key ••••${a.keyHint}`
                            : a.mode === 'mock'
                              ? ' · simulated courier, no keys needed'
                              : ''}
                          {balances[a.id] ? (
                            <span className="text-emerald-700"> · {balances[a.id]}</span>
                          ) : a.lastError ? (
                            <span className="text-destructive">
                              {' '}
                              · Last check failed: {a.lastError}
                            </span>
                          ) : a.lastCheckedAt ? (
                            <span> · checked {timeAgo(a.lastCheckedAt)}</span>
                          ) : null}
                        </p>
                      </div>
                      {isOwner ? (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={test.isPending}
                            onClick={() => test.mutate(a)}
                          >
                            {test.isPending && test.variables?.id === a.id ? (
                              <LoaderCircle className="animate-spin" />
                            ) : (
                              <PlugZap />
                            )}{' '}
                            Test connection
                          </Button>
                          {!a.isDefault ? (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={makeDefault.isPending}
                              onClick={() => makeDefault.mutate(a)}
                            >
                              <Star /> Make default
                            </Button>
                          ) : null}
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove “${a.label}”? Parcels already booked keep updating.`
                                )
                              )
                                remove.mutate(a);
                            }}
                          >
                            <Trash2 /> Remove
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No courier connected yet.{' '}
                  {isOwner
                    ? 'Connect Steadfast below to start sending parcels.'
                    : 'Ask the shop owner to connect Steadfast.'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Courier accounts are managed by the shop owner. You can still send orders with the
              default account.
            </p>
          )}

          {isOwner ? <ConnectSteadfast shopId={shopId} onSaved={refetchAccounts} /> : null}

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">Live status updates (webhook)</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              In your Steadfast merchant panel, add this webhook URL so parcels update the moment
              the rider does. The Bearer token is set by the platform admin — ask support for it.
              Without it we still check Steadfast every few minutes.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2 py-1.5 font-mono text-xs">
                {WEBHOOK_URL}
              </code>
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy /> Copy
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function ConnectSteadfast({ shopId, onSaved }: { shopId: number; onSaved: () => void }) {
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const live = mode === 'live';

  const save = useMutation({
    mutationFn: () =>
      api<CourierAccount>(PORTAL_ENDPOINTS.shop.couriers(shopId), {
        method: 'POST',
        body: {
          provider: 'steadfast',
          mode,
          ...(label.trim() && { label: label.trim() }),
          ...(live && { apiKey: apiKey.trim(), secretKey: secretKey.trim() }),
        },
      }),
    onSuccess: a => {
      toast.success(`${a.label} connected`);
      setLabel('');
      setApiKey('');
      setSecretKey('');
      onSaved();
    },
    onError: e => toast.error(e.message),
  });

  return (
    <form
      className="grid gap-4 rounded-lg border p-4"
      onSubmit={e => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <p className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="size-4" /> Connect Steadfast
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Find your API key and secret key in the <strong>Steadfast merchant panel → API</strong>.
          Not ready yet? Start in test mode — parcels are simulated so you can try the whole flow.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mode" htmlFor="sf-mode">
          <NativeSelect
            id="sf-mode"
            value={mode}
            onChange={e => setMode(e.target.value as 'mock' | 'live')}
          >
            <option value="mock">Test mode — simulated courier</option>
            <option value="live">Live — real Steadfast account</option>
          </NativeSelect>
        </Field>
        <Field label="Label" htmlFor="sf-label" hint="Optional, e.g. “Main branch”.">
          <Input
            id="sf-label"
            value={label}
            maxLength={60}
            onChange={e => setLabel(e.target.value)}
            placeholder={live ? 'Steadfast' : 'Steadfast (test mode)'}
          />
        </Field>
      </div>
      {live ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="API key" htmlFor="sf-key">
            <Input
              id="sf-key"
              type="password"
              autoComplete="off"
              required
              value={apiKey}
              maxLength={200}
              onChange={e => setApiKey(e.target.value)}
            />
          </Field>
          <Field label="Secret key" htmlFor="sf-secret">
            <Input
              id="sf-secret"
              type="password"
              autoComplete="off"
              required
              value={secretKey}
              maxLength={200}
              onChange={e => setSecretKey(e.target.value)}
            />
          </Field>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-violet-800">
          <FlaskConical className="size-3.5" /> No keys needed in test mode. On each order you can
          play the courier: picked up, delivered or returned.
        </p>
      )}
      <div>
        <Button
          type="submit"
          disabled={save.isPending || (live && (!apiKey.trim() || !secretKey.trim()))}
        >
          {save.isPending ? <LoaderCircle className="animate-spin" /> : <PlugZap />} Connect
          Steadfast
        </Button>
      </div>
    </form>
  );
}

function HoursForm({ shopId, hours }: { shopId: number; hours: Hours[] }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState(() =>
    WEEKDAYS.map((_, weekday) => {
      const h = hours.find(x => x.weekday === weekday);
      return {
        weekday,
        opensAt: h?.opensAt?.slice(0, 5) ?? '10:00',
        closesAt: h?.closesAt?.slice(0, 5) ?? '21:00',
        isClosed: h?.isClosed ?? false,
      };
    })
  );
  const update = (weekday: number, patch: Partial<(typeof rows)[number]>) =>
    setRows(rs => rs.map(r => (r.weekday === weekday ? { ...r, ...patch } : r)));

  const save = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.hours(shopId), {
        method: 'PUT',
        body: {
          hours: rows.map(r => ({
            weekday: r.weekday,
            isClosed: r.isClosed,
            ...(!r.isClosed && { opensAt: r.opensAt, closesAt: r.closesAt }),
          })),
        },
      }),
    onSuccess: () => {
      toast.success('Opening hours saved');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'settings'] });
    },
  });

  return (
    <Panel
      title="Opening hours"
      action={
        <Button size="sm" variant="outline" disabled={save.isPending} onClick={() => save.mutate()}>
          Save hours
        </Button>
      }
    >
      <div className="grid gap-2">
        {rows.map(r => (
          <div key={r.weekday} className="flex flex-wrap items-center gap-3 text-sm">
            <span className="w-24 font-medium">{WEEKDAYS[r.weekday]}</span>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                size="sm"
                checked={!r.isClosed}
                onCheckedChange={open => update(r.weekday, { isClosed: !open })}
              />
              {r.isClosed ? 'Closed' : 'Open'}
            </label>
            {!r.isClosed ? (
              <>
                <Input
                  type="time"
                  className="w-28"
                  value={r.opensAt}
                  aria-label={`${WEEKDAYS[r.weekday]} opens`}
                  onChange={e => update(r.weekday, { opensAt: e.target.value })}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="w-28"
                  value={r.closesAt}
                  aria-label={`${WEEKDAYS[r.weekday]} closes`}
                  onChange={e => update(r.weekday, { closesAt: e.target.value })}
                />
              </>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function VerificationSection({ shopId, verified }: { shopId: number; verified: boolean }) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['shop', shopId, 'verifications'],
    queryFn: () => api<Verification[]>(PORTAL_ENDPOINTS.shop.verifications(shopId)),
  });
  const [kind, setKind] = useState('trade_license');
  const [documentNumber, setDocumentNumber] = useState('');
  const [doc, setDoc] = useState<string[]>([]);
  const [expiresOn, setExpiresOn] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      api(PORTAL_ENDPOINTS.shop.verifications(shopId), {
        method: 'POST',
        body: {
          kind,
          ...(documentNumber.trim() && { documentNumber: documentNumber.trim() }),
          ...(doc[0] && { documentUrl: doc[0] }),
          ...(expiresOn && { expiresOn }),
        },
      }),
    onSuccess: () => {
      toast.success('Submitted — our team will review it');
      setDocumentNumber('');
      setDoc([]);
      setExpiresOn('');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'verifications'] });
    },
  });

  return (
    <section id="verification" className="scroll-mt-20">
      <Panel title="Verification">
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
          <BadgeCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            {verified
              ? 'Your shop is verified. Customers see the blue badge on every product.'
              : 'To get the blue verified badge we need an approved trade licence and a short visit from our team.'}
          </p>
        </div>
        {list.data?.length ? (
          <ul className="mb-4 divide-y rounded-lg border">
            {list.data.map(v => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 font-medium">{humanize(v.kind)}</span>
                {v.documentNumber ? (
                  <span className="text-xs text-muted-foreground">{v.documentNumber}</span>
                ) : null}
                <span className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</span>
                <StatusBadge status={v.status} />
                {v.notes ? <p className="w-full text-xs text-muted-foreground">{v.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <form
          className="grid gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (!documentNumber.trim() && !doc.length)
              return toast.error('Add the document number or a photo');
            submit.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Document" htmlFor="kind">
              <NativeSelect id="kind" value={kind} onChange={e => setKind(e.target.value)}>
                <option value="trade_license">Trade licence</option>
                <option value="owner_nid">Owner NID</option>
                <option value="tin">TIN certificate</option>
                <option value="bin_vat">BIN / VAT</option>
              </NativeSelect>
            </Field>
            <Field label="Document number" htmlFor="docNo">
              <Input
                id="docNo"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                maxLength={60}
              />
            </Field>
            <Field label="Expires on" htmlFor="expires">
              <Input
                id="expires"
                type="date"
                value={expiresOn}
                onChange={e => setExpiresOn(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Photo of the document">
            <ImageUploader value={doc} onChange={setDoc} max={1} />
          </Field>
          <div>
            <Button type="submit" variant="outline" disabled={submit.isPending}>
              Submit for review
            </Button>
          </div>
        </form>
      </Panel>
    </section>
  );
}

export default function ShopSettingsPagePage() {
  return (
    <ManagerOnly>
      <ShopSettingsPage />
    </ManagerOnly>
  );
}
