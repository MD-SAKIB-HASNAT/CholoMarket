'use client';

import { LoaderCircle, MapPinned, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MapPicker } from '@/components/map/MapPicker';
import type { LatLng } from '@/components/map/PickerMap';
import { Field, ImageUploader, NativeSelect } from '@/components/shared/FormBits';
import { MARKET_KIND_LABEL, WEEKDAYS } from '@/utils/helpers/format';
import { toast } from 'sonner';
import type { Market } from '@/utils/types';
import { hhmm, marketLocationIds } from '@/app/(protected)/admin/utils/admin';
import { LocationSelects, type LocationValue } from './LocationPicker';
import type { AdminMarket } from '@/app/(protected)/admin/utils/types';

export interface MarketPayload {
  nameEn: string;
  nameBn: string;
  slug?: string;
  kind: string;
  description?: string;
  areaId: number;
  /** null clears the neighbourhood */
  subAreaId: number | null;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  coverUrl?: string;
  opensAt?: string;
  closesAt?: string;
  weeklyOffDay: number | null;
  isPartner: boolean;
  status: string;
}

export function MarketForm({
  initial,
  submitting,
  disabled,
  submitLabel,
  onSubmit,
}: {
  initial?: Market | AdminMarket;
  submitting: boolean;
  disabled?: boolean;
  submitLabel: string;
  onSubmit: (payload: MarketPayload) => void;
}) {
  const [f, setF] = useState({
    nameEn: initial?.nameEn ?? '',
    nameBn: initial?.nameBn ?? '',
    slug: initial?.slug ?? '',
    kind: initial?.kind ?? 'mall',
    description: initial?.description ?? '',
    addressLine: initial?.addressLine ?? '',
    latitude: initial?.latitude != null ? String(initial.latitude) : '',
    longitude: initial?.longitude != null ? String(initial.longitude) : '',
    logo: initial?.logoUrl ? [initial.logoUrl] : ([] as string[]),
    cover: initial?.coverUrl ? [initial.coverUrl] : ([] as string[]),
    opensAt: hhmm(initial?.opensAt),
    closesAt: hhmm(initial?.closesAt),
    weeklyOffDay: initial?.weeklyOffDay != null ? String(initial.weeklyOffDay) : '',
    isPartner: initial?.isPartner ?? false,
    status: initial?.status ?? 'active',
  });
  const [loc, setLoc] = useState<LocationValue>(() =>
    initial
      ? marketLocationIds(initial as AdminMarket)
      : { divisionId: '', districtId: '', areaId: '', subAreaId: '' }
  );
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF(prev => ({ ...prev, [k]: v }));

  const [mapOpen, setMapOpen] = useState(false);
  const chosen: LatLng | null =
    f.latitude && f.longitude ? [Number(f.latitude), Number(f.longitude)] : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      nameEn: f.nameEn.trim(),
      nameBn: f.nameBn.trim(),
      ...(f.slug.trim() && { slug: f.slug.trim() }),
      kind: f.kind,
      ...(f.description.trim() && { description: f.description.trim() }),
      areaId: Number(loc.areaId),
      subAreaId: loc.subAreaId ? Number(loc.subAreaId) : null,
      addressLine: f.addressLine.trim(),
      ...(f.latitude && { latitude: Number(f.latitude) }),
      ...(f.longitude && { longitude: Number(f.longitude) }),
      ...(f.logo[0] && { logoUrl: f.logo[0] }),
      ...(f.cover[0] && { coverUrl: f.cover[0] }),
      ...(f.opensAt && { opensAt: f.opensAt }),
      ...(f.closesAt && { closesAt: f.closesAt }),
      weeklyOffDay: f.weeklyOffDay === '' ? null : Number(f.weeklyOffDay),
      isPartner: f.isPartner,
      status: f.status,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English)" htmlFor="m-name-en">
          <Input
            id="m-name-en"
            required
            value={f.nameEn}
            onChange={e => set('nameEn', e.target.value)}
          />
        </Field>
        <Field label="নাম (বাংলা)" htmlFor="m-name-bn">
          <Input
            id="m-name-bn"
            lang="bn"
            required
            value={f.nameBn}
            onChange={e => set('nameBn', e.target.value)}
          />
        </Field>
        <Field
          label="URL slug"
          htmlFor="m-slug"
          hint="Leave empty to generate from the English name."
        >
          <Input
            id="m-slug"
            value={f.slug}
            onChange={e => set('slug', e.target.value)}
            placeholder="shapla-city-mall"
          />
        </Field>
        <Field label="Type" htmlFor="m-kind">
          <NativeSelect
            id="m-kind"
            value={f.kind}
            onChange={e => set('kind', e.target.value as Market['kind'])}
          >
            {Object.entries(MARKET_KIND_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Location</p>
          <LocationSelects
            value={loc}
            onChange={setLoc}
            required={3}
            idPrefix="m-loc"
            emptyText="No sub-area"
          />
        </div>
        <Field label="Address" htmlFor="m-address">
          <Input
            id="m-address"
            required
            value={f.addressLine}
            onChange={e => set('addressLine', e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Latitude" htmlFor="m-lat">
            <Input
              id="m-lat"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={f.latitude}
              onChange={e => set('latitude', e.target.value)}
            />
          </Field>
          <Field label="Longitude" htmlFor="m-lng">
            <Input
              id="m-lng"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={f.longitude}
              onChange={e => set('longitude', e.target.value)}
            />
          </Field>
          <Button type="button" variant="outline" onClick={() => setMapOpen(true)}>
            <MapPinned /> Location
          </Button>
          <MapPicker
            open={mapOpen}
            onOpenChange={setMapOpen}
            value={chosen}
            onSelect={(lat, lng) => {
              set('latitude', lat.toFixed(6));
              set('longitude', lng.toFixed(6));
              toast.success('Location set from the map');
            }}
          />
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Press <strong>Location</strong> and click the place on the map to fill these in. They
            drive the customers’ <strong>Nearby</strong> search: a market (and every shop in it)
            shows up when it is within the nearby radius set in Settings. Without coordinates it
            never appears under Nearby.
          </p>
        </div>
        <Field label="Opens at" htmlFor="m-open">
          <Input
            id="m-open"
            type="time"
            value={f.opensAt}
            onChange={e => set('opensAt', e.target.value)}
          />
        </Field>
        <Field label="Closes at" htmlFor="m-close">
          <Input
            id="m-close"
            type="time"
            value={f.closesAt}
            onChange={e => set('closesAt', e.target.value)}
          />
        </Field>
        <Field label="Weekly off day" htmlFor="m-off">
          <NativeSelect
            id="m-off"
            value={f.weeklyOffDay}
            onChange={e => set('weeklyOffDay', e.target.value)}
          >
            <option value="">Open every day</option>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="m-status">
          <NativeSelect
            id="m-status"
            value={f.status}
            onChange={e => set('status', e.target.value as Market['status'])}
          >
            <option value="draft">Draft (hidden)</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </NativeSelect>
        </Field>
        <Field label="Description" htmlFor="m-desc" className="sm:col-span-2">
          <Textarea
            id="m-desc"
            rows={3}
            value={f.description}
            onChange={e => set('description', e.target.value)}
          />
        </Field>
        <Field label="Logo">
          <ImageUploader value={f.logo} onChange={v => set('logo', v)} max={1} />
        </Field>
        <Field label="Cover photo">
          <ImageUploader value={f.cover} onChange={v => set('cover', v)} max={1} />
        </Field>
        <label className="flex items-center gap-3 sm:col-span-2">
          <Switch checked={f.isPartner} onCheckedChange={v => set('isPartner', v)} />
          <span className="text-sm">Official partnership with the mall’s management</span>
        </label>
      </fieldset>
      {!disabled ? (
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Save />} {submitLabel}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
