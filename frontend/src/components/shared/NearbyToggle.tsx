'use client';

import { useQuery } from '@tanstack/react-query';
import { LoaderCircle, MapPinned, Navigation } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { NearbyMapDialog, type NearbyChoice } from '@/components/map/NearbyMapDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/utils/api/api';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';
import { cn } from '@/utils/helpers/cn';
import type { MapKind, PublicConfig } from '@/utils/types';

/** URL params of a "nearby" search; lists read these and pass them to the API. */
export const NEARBY_PARAMS = ['nearby', 'lat', 'lng', 'radius'] as const;

const STEP = 0.1;

/** Says why the browser could not give a position, so people know what to fix. */
function locationErrorMessage(err: GeolocationPositionError): string {
  if (!window.isSecureContext)
    return 'Location only works on a secure page (https or localhost). Open the site as http://localhost:3100.';
  if (err.code === err.PERMISSION_DENIED)
    return 'Location is blocked for this site. Click the lock icon in the address bar, allow Location, then try again. Also check that Windows Settings → Privacy → Location is on.';
  if (err.code === err.TIMEOUT) return 'Finding your location took too long. Please try again.';
  return 'Your device could not work out its location. Check that location services are on, then try again.';
}

/**
 * "Nearby" button for the markets, shops and products lists. It opens a small popup: a distance
 * slider in km (up to the admin's maximum), "Use my location", and "Choose on the map" for a circle
 * you can move and resize. The choice goes into the page address (?nearby=1&lat=…&lng=…&radius=km),
 * so the list, the link and the back button all agree.
 */
export function NearbyToggle({
  className,
  kind = 'markets',
}: {
  className?: string;
  kind?: MapKind;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const active = params.get('nearby') === '1' && !!params.get('lat') && !!params.get('lng');

  const config = useQuery({
    queryKey: ['config'],
    queryFn: () => api<PublicConfig>(STORE_ENDPOINTS.platform.config, { token: null }),
    staleTime: 5 * 60_000,
  });
  const maxKm = config.data?.nearbyMaxKm ?? 0.5;
  const minKm = Math.min(0.1, maxKm);
  const clamp = (km: number) => Math.round(Math.min(maxKm, Math.max(minKm, km)) * 10) / 10;

  const fromUrl = Number(params.get('radius'));
  const [wanted, setWanted] = useState<number | null>(null);
  const radiusKm = clamp(wanted ?? (fromUrl > 0 ? fromUrl : maxKm));

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}${next.size ? `?${next}` : ''}`);
  };

  const apply = (choice: NearbyChoice) => {
    setWanted(choice.radiusKm);
    go({
      nearby: '1',
      lat: choice.lat.toFixed(5),
      lng: choice.lng.toFixed(5),
      radius: String(clamp(choice.radiusKm)),
    });
    setOpen(false);
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator))
      return toast.error('This browser can’t share your location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        apply({ lat: pos.coords.latitude, lng: pos.coords.longitude, radiusKm });
      },
      err => {
        setLocating(false);
        toast.error(locationErrorMessage(err));
      },
      // Network/Wi-Fi location is plenty for "within a few hundred metres" and works on desktops;
      // high-accuracy GPS often times out there.
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 5 * 60_000 }
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-pressed={active}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-card hover:border-primary hover:text-primary',
          className
        )}
      >
        <Navigation className="size-4" />
        Nearby{active ? ` · ${radiusKm} km` : ''}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nearby</DialogTitle>
            <DialogDescription>
              See what is close to you. Choose how far to look, up to {maxKm} km.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="nearby-range" className="font-medium">
                Distance: {radiusKm} km
              </label>
              <span className="text-xs text-muted-foreground">max {maxKm} km</span>
            </div>
            <input
              id="nearby-range"
              type="range"
              min={minKm}
              max={maxKm}
              step={STEP}
              value={radiusKm}
              onChange={e => setWanted(clamp(Number(e.target.value)))}
              className="h-2 w-full cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{minKm} km</span>
              <span>{maxKm} km</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button type="button" onClick={useMyLocation} disabled={locating}>
              {locating ? <LoaderCircle className="animate-spin" /> : <Navigation />} Use my
              location
            </Button>
            {active ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  go({ nearby: null, lat: null, lng: null, radius: null });
                  setOpen(false);
                }}
              >
                Turn Nearby off
              </Button>
            ) : null}
          </div>

          <div className="border-t pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false);
                setMapOpen(true);
              }}
            >
              <MapPinned /> Choose on the map
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Draw a circle on the map and see the markets, shops and products inside it.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <NearbyMapDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        initial={{ centre: active && lat && lng ? [lat, lng] : null, radiusKm }}
        maxKm={maxKm}
        kind={kind}
        onApply={apply}
      />
    </>
  );
}
