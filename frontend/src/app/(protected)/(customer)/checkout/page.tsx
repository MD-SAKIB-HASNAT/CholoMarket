'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Check,
  Home,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  Store,
  Ticket,
  Truck,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/shared/FormBits';
import { useCart } from '@/components/site/Header';
import { api } from '@/utils/api/api';
import { useRequireAuth } from '@/utils/context/AuthContext';
import { formatPhone, formatTaka, plural } from '@/utils/helpers/format';
import type {
  DeliveryAddress,
  DeliveryZone,
  Market,
  PublicConfig,
  SavedAddress,
} from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

type Method = 'bkash' | 'nagad' | 'cash';
interface Choice {
  fulfillmentType: 'delivery' | 'shop_pickup' | 'desk_pickup';
  pickupPointId?: number;
}

const DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Savar',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  'Bogura',
  "Cox's Bazar",
  'Jashore',
];

/** Dhaka city gets the inside-Dhaka charge; everywhere else is outside Dhaka. */
const zoneFor = (district: string): DeliveryZone =>
  district.trim().toLowerCase() === 'dhaka' ? 'inside_dhaka' : 'outside_dhaka';

const EMPTY_ADDRESS: DeliveryAddress = {
  recipientName: '',
  phone: '',
  district: 'Dhaka',
  areaName: '',
  addressLine: '',
  landmark: '',
  zone: 'inside_dhaka',
};

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  title,
  text,
  extra,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Truck;
  title: string;
  text?: string | null;
  extra?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex items-start gap-2.5 rounded-md border p-3 pr-8 text-left text-sm transition-colors',
        selected ? 'border-primary bg-accent ring-1 ring-primary' : 'hover:border-foreground/30'
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {text ? <span className="block text-xs text-muted-foreground">{text}</span> : null}
        {extra ? <span className="mt-1 block text-xs font-medium text-ink">{extra}</span> : null}
      </span>
      {selected ? <Check className="absolute top-2.5 right-2.5 size-4 text-primary" /> : null}
    </button>
  );
}

export default function CheckoutPage() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const cart = useCart();
  const config = useQuery({
    queryKey: ['config'],
    queryFn: () => api<PublicConfig>(STORE_ENDPOINTS.platform.config, { token: null }),
  });
  const saved = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api<SavedAddress[]>(STORE_ENDPOINTS.addresses.mine),
    enabled: !!user,
  });

  // null = not edited yet, fall back to the account's details.
  const [nameInput, setName] = useState<string | null>(null);
  const [phoneInput, setPhone] = useState<string | null>(null);
  const name = nameInput ?? user?.fullName ?? '';
  const phone = phoneInput ?? user?.phone.replace(/^\+88/, '') ?? '';
  const [method, setMethod] = useState<Method>('cash');
  const [depositMethod, setDepositMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [coupon, setCoupon] = useState('');
  const [note, setNote] = useState('');
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [addressId, setAddressId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<DeliveryAddress>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);

  const groups = useMemo(() => cart.data?.groups ?? [], [cart.data]);
  // Default: home delivery wherever the shop delivers, otherwise the shop counter.
  const choiceFor = (shopId: number, offersDelivery?: boolean): Choice =>
    choices[shopId] ?? { fulfillmentType: offersDelivery === false ? 'shop_pickup' : 'delivery' };

  // Pickup desks of every market in the cart.
  const marketSlugs = useMemo(
    () => [...new Set(groups.map(g => g.shop.market?.slug).filter(Boolean))] as string[],
    [groups]
  );
  const markets = useQueries({
    queries: marketSlugs.map(slug => ({
      queryKey: ['market', slug],
      queryFn: () => api<Market>(STORE_ENDPOINTS.markets.bySlug(slug), { token: null }),
    })),
  });
  const desksFor = (marketId?: number) =>
    markets.map(m => m.data).find(m => m?.id === marketId)?.pickupPoints ?? [];

  const isDelivery = (g: (typeof groups)[number]) =>
    choiceFor(g.shop.id, g.shop.offersDelivery).fulfillmentType === 'delivery';
  const deliveryCount = groups.filter(isDelivery).length;
  const anyDelivery = deliveryCount > 0;
  const anyPickup = deliveryCount < groups.length;

  // Address: a saved one (default first) or a new one typed here.
  const savedAddresses = saved.data ?? [];
  const useNew = addressId === 'new' || (addressId === null && !savedAddresses.length);
  const chosenSaved = useNew
    ? undefined
    : typeof addressId === 'number'
      ? savedAddresses.find(a => a.id === addressId)
      : (savedAddresses.find(a => a.isDefault) ?? savedAddresses[0]);
  const zone: DeliveryZone = useNew
    ? zoneFor(draft.district)
    : (chosenSaved?.zone ?? 'inside_dhaka');

  const feeInside = Number(config.data?.deliveryFeeInsideDhaka ?? 70);
  const feeOutside = Number(config.data?.deliveryFeeOutsideDhaka ?? 130);
  const feePerParcel = zone === 'inside_dhaka' ? feeInside : feeOutside;
  const deliveryTotal = deliveryCount * feePerParcel;
  const serviceFee = Number(config.data?.pickupFee ?? 0);
  const subtotal = cart.data?.subtotal ?? 0;
  const grandTotal = subtotal + deliveryTotal + serviceFee;
  // Mirrors the API: with cash, a shop may ask for a share of (items + delivery) up front.
  const deposit =
    method === 'cash'
      ? groups.reduce(
          (s, g) =>
            s + ((g.subtotal + (isDelivery(g) ? feePerParcel : 0)) * g.shop.depositPercent) / 100,
          0
        )
      : 0;
  const payNow = method === 'cash' ? deposit + serviceFee : grandTotal;
  const payLater = Math.max(0, grandTotal - payNow);
  const cashBlocked = method === 'cash' ? groups.filter(g => !g.shop.acceptsCashOnPickup) : [];
  const cashTitle =
    anyDelivery && anyPickup
      ? 'Cash on delivery / pickup'
      : anyDelivery
        ? 'Cash on delivery'
        : 'Cash at pickup';

  const addressReady =
    !anyDelivery ||
    (useNew
      ? draft.recipientName.trim().length > 1 &&
        draft.phone.replace(/\D/g, '').length >= 11 &&
        draft.areaName.trim().length > 1 &&
        draft.addressLine.trim().length > 4
      : !!chosenSaved);

  const place = useMutation({
    mutationFn: () =>
      api<{ orderNo: string; status: string; payment: { id: number } | null }>(
        STORE_ENDPOINTS.orders.checkout,
        {
          method: 'POST',
          body: {
            contactName: name,
            contactPhone: phone,
            paymentMethod: method,
            depositMethod: method === 'cash' ? depositMethod : undefined,
            couponCode: coupon.trim() || undefined,
            note: note.trim() || undefined,
            shops: groups.map(g => ({
              shopId: g.shop.id,
              ...choiceFor(g.shop.id, g.shop.offersDelivery),
            })),
            ...(anyDelivery
              ? useNew
                ? {
                    address: {
                      ...draft,
                      landmark: draft.landmark?.trim() || undefined,
                      zone: zoneFor(draft.district),
                    },
                    saveAddress,
                  }
                : { addressId: chosenSaved?.id }
              : {}),
          },
        }
      ),
    onSuccess: res => {
      void qc.invalidateQueries({ queryKey: ['cart'] });
      void qc.invalidateQueries({ queryKey: ['addresses'] });
      router.push(res.payment ? `/pay/${res.payment.id}` : `/orders/${res.orderNo}?placed=1`);
    },
  });

  // Nothing to check out (e.g. cart emptied in another tab): back to the cart.
  useEffect(() => {
    if (cart.data && !cart.data.groups.length && !place.isPending && !place.isSuccess)
      router.replace('/cart');
  }, [cart.data, place.isPending, place.isSuccess, router]);

  if (!user || cart.isPending) {
    return (
      <div className="container-page grid gap-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }
  if (!groups.length) return null;

  const setField = (k: keyof DeliveryAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [k]: e.target.value });
  let step = 1;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-md border bg-card p-5">
            <h2 className="mb-1 font-semibold">{step++}. How do you want to get it?</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Each shop sends its own parcel. Get it delivered to your door, or collect it at the
              mall.
            </p>
            <div className="space-y-4">
              {groups.map(g => {
                const desks = desksFor(g.shop.market?.id);
                const choice = choiceFor(g.shop.id, g.shop.offersDelivery);
                const set = (c: Choice) => setChoices({ ...choices, [g.shop.id]: c });
                return (
                  <div key={g.shop.id} className="rounded-md border p-4">
                    <p className="font-medium">{g.shop.nameEn}</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {plural(
                        g.items.reduce((n, i) => n + i.quantity, 0),
                        'item'
                      )}{' '}
                      · {formatTaka(g.subtotal)}
                      {g.shop.market ? ` · ${g.shop.market.nameEn}` : ''}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.shop.offersDelivery !== false ? (
                        <OptionCard
                          selected={choice.fulfillmentType === 'delivery'}
                          onClick={() => set({ fulfillmentType: 'delivery' })}
                          icon={Truck}
                          title="Home delivery"
                          text="By Steadfast courier · 1–2 days in Dhaka, 2–4 days outside"
                          extra={`${formatTaka(feeInside)} inside Dhaka · ${formatTaka(feeOutside)} outside`}
                        />
                      ) : null}
                      <OptionCard
                        selected={choice.fulfillmentType === 'shop_pickup'}
                        onClick={() => set({ fulfillmentType: 'shop_pickup' })}
                        icon={Store}
                        title="Pick up at the shop"
                        text={
                          [g.shop.market?.nameEn, g.shop.shopNumber && `shop ${g.shop.shopNumber}`]
                            .filter(Boolean)
                            .join(', ') || 'At the counter'
                        }
                        extra="Free · ready the same day"
                      />
                      {desks.map(d => (
                        <OptionCard
                          key={d.id}
                          selected={choice.pickupPointId === d.id}
                          onClick={() =>
                            set({ fulfillmentType: 'desk_pickup', pickupPointId: d.id })
                          }
                          icon={PackageCheck}
                          title={d.nameEn}
                          text={d.instructions}
                          extra="Free · several shops, one stop"
                        />
                      ))}
                    </div>
                    {g.shop.offersDelivery === false ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        This shop doesn’t deliver yet — collect it at the mall.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {anyDelivery ? (
            <section className="rounded-md border bg-card p-5">
              <h2 className="mb-4 font-semibold">{step++}. Where should we deliver?</h2>
              {savedAddresses.length ? (
                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map(a => (
                    <OptionCard
                      key={a.id}
                      selected={chosenSaved?.id === a.id}
                      onClick={() => setAddressId(a.id)}
                      icon={Home}
                      title={`${a.recipientName}${a.label ? ` · ${a.label}` : ''}`}
                      text={`${a.addressLine}, ${a.areaName}, ${a.district}`}
                      extra={
                        a.zone === 'inside_dhaka'
                          ? `Inside Dhaka · ${formatTaka(feeInside)}`
                          : `Outside Dhaka · ${formatTaka(feeOutside)}`
                      }
                    />
                  ))}
                  <OptionCard
                    selected={useNew}
                    onClick={() => setAddressId('new')}
                    icon={Plus}
                    title="Deliver somewhere else"
                    text="Add a new address"
                  />
                </div>
              ) : null}
              {useNew ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Receiver’s name" htmlFor="a-name">
                    <Input
                      id="a-name"
                      value={draft.recipientName}
                      onChange={setField('recipientName')}
                      autoComplete="name"
                      placeholder={name}
                    />
                  </Field>
                  <Field
                    label="Receiver’s mobile"
                    htmlFor="a-phone"
                    hint="The rider calls this number before coming."
                  >
                    <Input
                      id="a-phone"
                      value={draft.phone}
                      onChange={setField('phone')}
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                  <Field
                    label="District / city"
                    htmlFor="a-district"
                    hint={
                      zoneFor(draft.district) === 'inside_dhaka'
                        ? `Inside Dhaka · ${formatTaka(feeInside)} per parcel`
                        : `Outside Dhaka · ${formatTaka(feeOutside)} per parcel`
                    }
                  >
                    <Input
                      id="a-district"
                      value={draft.district}
                      onChange={setField('district')}
                      list="districts"
                    />
                    <datalist id="districts">
                      {DISTRICTS.map(d => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Area / thana" htmlFor="a-area">
                    <Input
                      id="a-area"
                      value={draft.areaName}
                      onChange={setField('areaName')}
                      placeholder="e.g. Mirpur 10"
                    />
                  </Field>
                  <Field label="House, road, flat" htmlFor="a-line" className="sm:col-span-2">
                    <Input
                      id="a-line"
                      value={draft.addressLine}
                      onChange={setField('addressLine')}
                      placeholder="House 12, Road 3, Block C"
                      autoComplete="street-address"
                    />
                  </Field>
                  <Field label="Landmark (optional)" htmlFor="a-landmark">
                    <Input
                      id="a-landmark"
                      value={draft.landmark ?? ''}
                      onChange={setField('landmark')}
                      placeholder="e.g. Opposite the mosque"
                    />
                  </Field>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm">
                    <Checkbox checked={saveAddress} onCheckedChange={v => setSaveAddress(!!v)} />{' '}
                    Save this address for next time
                  </label>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-md border bg-card p-5">
            <h2 className="mb-4 font-semibold">{step++}. How will you pay?</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <OptionCard
                selected={method === 'cash'}
                onClick={() => setMethod('cash')}
                icon={Banknote}
                title={cashTitle}
                text={
                  anyDelivery
                    ? 'Pay the rider when the parcel arrives'
                    : 'Pay when you collect — see it first'
                }
              />
              <OptionCard
                selected={method === 'bkash'}
                onClick={() => setMethod('bkash')}
                icon={Wallet}
                title="bKash"
                text="Pay now from your bKash wallet"
              />
              <OptionCard
                selected={method === 'nagad'}
                onClick={() => setMethod('nagad')}
                icon={Wallet}
                title="Nagad"
                text="Pay now from your Nagad wallet"
              />
            </div>
            {method === 'cash' && deposit > 0 ? (
              <div className="mt-4 space-y-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  Some shops ask for a small advance: <strong>{formatTaka(payNow)}</strong> now, the
                  rest in cash {anyDelivery ? 'on delivery' : 'at pickup'}.
                </p>
                <div className="flex gap-2">
                  {(['bkash', 'nagad'] as const).map(d => (
                    <Button
                      key={d}
                      size="sm"
                      variant={depositMethod === d ? 'default' : 'outline'}
                      onClick={() => setDepositMethod(d)}
                    >
                      Advance by {d === 'bkash' ? 'bKash' : 'Nagad'}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {cashBlocked.length ? (
              <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-900">
                {cashBlocked.map(g => g.shop.nameEn).join(', ')} only accept bKash or Nagad.
              </p>
            ) : null}
          </section>

          <section className="rounded-md border bg-card p-5">
            <h2 className="mb-4 font-semibold">{step++}. Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field
                label="Mobile number"
                htmlFor="phone"
                hint="Order updates come to this number."
              >
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Coupon code" htmlFor="coupon" hint="Try EID10 or SHAPLA200">
                <div className="relative">
                  <Ticket className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="coupon"
                    className="pl-8 uppercase"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Note for the shops" htmlFor="note">
                <Input
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Please gift-wrap it"
                />
              </Field>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-md border bg-card p-5 lg:sticky lg:top-36">
          <h2 className="font-semibold">Order summary</h2>
          {groups.map(g => (
            <div key={g.shop.id} className="flex justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                {isDelivery(g) ? (
                  <Truck className="size-3.5 shrink-0" />
                ) : (
                  <Store className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{g.shop.nameEn}</span>
              </span>
              <span className="tabular-nums">{formatTaka(g.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 text-sm">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatTaka(subtotal)}</span>
          </div>
          {anyDelivery ? (
            <div className="flex justify-between text-sm">
              <span>Delivery ({plural(deliveryCount, 'parcel')})</span>
              <span className="tabular-nums">{formatTaka(deliveryTotal)}</span>
            </div>
          ) : null}
          {serviceFee ? (
            <div className="flex justify-between text-sm">
              <span>Service fee</span>
              <span className="tabular-nums">{formatTaka(serviceFee)}</span>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Coupon discounts are applied when you place the order.
          </p>
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatTaka(grandTotal)}</span>
          </div>
          <div className="space-y-1 rounded-md bg-surface p-3 text-sm">
            <div className="flex justify-between">
              <span>Pay now</span>
              <span className="font-medium tabular-nums">{formatTaka(payNow)}</span>
            </div>
            {payLater > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {anyDelivery && !anyPickup
                    ? 'Cash on delivery'
                    : anyDelivery
                      ? 'On delivery / at pickup'
                      : 'At pickup'}
                </span>
                <span className="tabular-nums">{formatTaka(payLater)}</span>
              </div>
            ) : null}
          </div>
          <Button
            size="lg"
            className="h-11 w-full"
            disabled={
              place.isPending ||
              !name.trim() ||
              phone.length < 11 ||
              cashBlocked.length > 0 ||
              !addressReady
            }
            onClick={() => place.mutate()}
          >
            {place.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {payNow > 0 ? `Continue to pay ${formatTaka(payNow)}` : 'Place order'}
          </Button>
          {!addressReady ? (
            <p className="text-center text-xs text-deal">Add the delivery address to continue.</p>
          ) : null}
          {anyDelivery && addressReady ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {useNew
                ? `${draft.addressLine}, ${draft.areaName}, ${draft.district}`
                : `${chosenSaved?.addressLine}, ${chosenSaved?.areaName}, ${chosenSaved?.district}`}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Contact: {formatPhone(phone ? `+88${phone.replace(/^\+?88/, '')}` : null)}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
