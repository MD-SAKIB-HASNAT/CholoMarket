'use client';

import dynamic from 'next/dynamic';
import { LocateFixed } from 'lucide-react';
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

const PickerMap = dynamic(() => import('@/components/map/PickerMap'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm">Loading map…</div>,
});

/**
 * "Choose location" popup: click anywhere on the map and the pin (and the latitude and longitude)
 * jump there. Nothing is saved until "Use this location".
 */
function MapPickerInner({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: LatLng | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  const [picked, setPicked] = useState<LatLng | null>(value);
  const [locating, setLocating] = useState(false);

  function findMe() {
    if (!navigator.geolocation) return toast.error('This browser cannot share a location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        setPicked([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location. Click the map instead.');
      },
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 5 * 60_000 }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose the location</DialogTitle>
          <DialogDescription>
            Click the place on the map. Zoom in for a precise spot, such as the building entrance.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[55vh] min-h-72 overflow-hidden rounded-lg border">
          <PickerMap value={picked} onPick={setPicked} />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {picked
            ? `Latitude ${picked[0].toFixed(6)} · Longitude ${picked[1].toFixed(6)}`
            : 'Nothing chosen yet.'}
        </p>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={findMe} disabled={locating}>
            <LocateFixed /> Use my current location
          </Button>
          <Button
            type="button"
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              onSelect(Number(picked[0].toFixed(6)), Number(picked[1].toFixed(6)));
              onOpenChange(false);
            }}
          >
            Use this location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Mounted only while open, so every opening starts from the saved place. */
export function MapPicker(props: Parameters<typeof MapPickerInner>[0]) {
  return props.open ? <MapPickerInner {...props} /> : null;
}
