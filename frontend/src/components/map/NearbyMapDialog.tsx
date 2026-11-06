'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { LocateFixed, Minus, Plus } from 'lucide-react';
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
import type { LatLng } from '@/components/map/PickerMap';
import { api } from '@/utils/api/api';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';
import { cn } from '@/utils/helpers/cn';
import { formatDistance } from '@/utils/helpers/format';
import type { MapKind, NearbyMapResult } from '@/utils/types';

const NearbyMapCanvas = dynamic(() => import('@/components/map/NearbyMapCanvas'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm">Loading map…</div>,
});

const KINDS: { value: MapKind; label: string }[] = [
  { value: 'markets', label: 'Markets' },
  { value: 'shops', label: 'Shops' },
  { value: 'products', label: 'Products' },
];

const STEP = 0.1;
const round = (n: number) => Math.round(n * 10) / 10;

export interface NearbyChoice {
  lat: number;
  lng: number;
  radiusKm: number;
}

/**
 * Filter by drawing on a map: a circle around the chosen place that can be made bigger or smaller
 * (never beyond the admin's maximum). The malls inside it appear as pins; tap a pin to open its
 * shops, products or page. "Show in the list" applies the same circle to the website's lists.
 */
function NearbyMapDialogInner({
  open,
  onOpenChange,
  initial,
  maxKm,
  kind: initialKind,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: { centre: LatLng | null; radiusKm: number };
  maxKm: number;
  kind: MapKind;
  onApply: (choice: NearbyChoice) => void;
}) {
  const [centre, setCentre] = useState<LatLng | null>(initial.centre);
  const [radiusKm, setRadiusKm] = useState(initial.radiusKm);
  const [kind, setKind] = useState<MapKind>(initialKind);
  const [locating, setLocating] = useState(false);
  const minKm = Math.min(0.1, maxKm);

  const pins = useQuery({
    queryKey: ['nearby-map', centre?.[0].toFixed(4), centre?.[1].toFixed(4), radiusKm, kind],
    queryFn: () =>
      api<NearbyMapResult>(STORE_ENDPOINTS.nearby.map, {
        token: null,
        query: { lat: centre![0], lng: centre![1], radiusKm, kind },
      }),
    enabled: open && !!centre,
    placeholderData: previous => previous,
  });

  const setRadius = (km: number) => setRadiusKm(round(Math.min(maxKm, Math.max(minKm, km))));

  function findMe() {
    if (!navigator.geolocation) return toast.error('This browser cannot share a location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setCentre([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location. Tap the map to choose a place instead.');
      },
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 5 * 60_000 }
    );
  }

  const found = pins.data?.pins ?? [];
  const noun = kind === 'markets' ? 'market' : kind === 'shops' ? 'shop' : 'product';
  const total = kind === 'markets' ? found.length : found.reduce((sum, pin) => sum + pin.count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Find on the map</DialogTitle>
          <DialogDescription>
            Tap the map to move the circle. Make it bigger or smaller below, up to {maxKm} km.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="What to show">
          {KINDS.map(k => (
            <button
              key={k.value}
              type="button"
              role="tab"
              aria-selected={kind === k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                'h-8 rounded-full border px-3.5 text-sm font-medium transition-colors',
                kind === k.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:border-primary hover:text-primary'
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="h-[48vh] min-h-72 overflow-hidden rounded-lg border">
          <NearbyMapCanvas
            centre={centre}
            radiusKm={radiusKm}
            pins={found}
            kind={kind}
            onMove={setCentre}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Distance: {radiusKm} km</span>
              <span className="text-xs text-muted-foreground">max {maxKm} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Smaller circle"
                onClick={() => setRadius(radiusKm - STEP)}
              >
                <Minus />
              </Button>
              <input
                type="range"
                min={minKm}
                max={maxKm}
                step={STEP}
                value={radiusKm}
                onChange={e => setRadius(Number(e.target.value))}
                aria-label="Distance in kilometres"
                className="h-2 flex-1 cursor-pointer accent-primary"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Bigger circle"
                onClick={() => setRadius(radiusKm + STEP)}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={findMe} disabled={locating}>
            <LocateFixed /> Use my location
          </Button>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {!centre
            ? 'Tap the map or use your location to start.'
            : pins.isFetching && !pins.data
              ? 'Looking…'
              : found.length
                ? `${total} ${noun}${total === 1 ? '' : 's'} in ${found.length} mall${found.length === 1 ? '' : 's'} within ${formatDistance(radiusKm * 1000)}. Tap a pin to see them.`
                : `Nothing within ${formatDistance(radiusKm * 1000)} of this spot. Try a bigger circle or move it.`}
        </p>

        <DialogFooter>
          <Button
            type="button"
            disabled={!centre}
            onClick={() => {
              if (!centre) return;
              onApply({ lat: centre[0], lng: centre[1], radiusKm });
              onOpenChange(false);
            }}
          >
            Show in the list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while open, so every opening starts from the current choice. */
export function NearbyMapDialog(props: Parameters<typeof NearbyMapDialogInner>[0]) {
  return props.open ? <NearbyMapDialogInner {...props} /> : null;
}
