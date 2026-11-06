'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { DEFAULT_CENTRE, TILES, pinIcon, type LatLng } from '@/components/map/PickerMap';
import { formatDistance } from '@/utils/helpers/format';
import type { MapKind, NearbyMapPin } from '@/utils/types';

function ClickToMove({ onMove }: { onMove: (p: LatLng) => void }) {
  useMapEvents({ click: e => onMove([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/** Zooms so the whole circle is in view whenever its size (or the place it is drawn around) changes. */
function FitCircle({ centre, radiusKm }: { centre: LatLng; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(L.latLng(centre).toBounds(radiusKm * 2000), { padding: [24, 24] });
    // keep the view steady when only the pins change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm, centre[0], centre[1]]);
  return null;
}

const ITEM_HREF: Record<
  Exclude<MapKind, 'markets'>,
  (item: { id: number; slug: string | null }) => string
> = {
  shops: item => `/shops/${item.slug}`,
  products: item => `/products/${item.id}`,
};

/** The Nearby map: a circle of the chosen radius, with a pin for every mall inside it. */
export default function NearbyMapCanvas({
  centre,
  radiusKm,
  pins,
  kind,
  onMove,
}: {
  centre: LatLng | null;
  radiusKm: number;
  pins: NearbyMapPin[];
  kind: MapKind;
  onMove: (p: LatLng) => void;
}) {
  const middle = centre ?? DEFAULT_CENTRE;
  return (
    <MapContainer center={middle} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer url={TILES.url} attribution={TILES.attribution} />
      <ClickToMove onMove={onMove} />
      {centre ? (
        <>
          <FitCircle centre={centre} radiusKm={radiusKm} />
          <Circle
            center={centre}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#891f2f', weight: 2, fillColor: '#891f2f', fillOpacity: 0.1 }}
          />
          <Marker position={centre} icon={pinIcon('', 'map-pin-me')} interactive={false} />
        </>
      ) : null}
      {pins.map(pin => (
        <Marker
          key={pin.marketId}
          position={[pin.lat, pin.lng]}
          icon={pinIcon(String(kind === 'markets' ? '' : pin.count))}
        >
          <Popup>
            <div className="min-w-44 space-y-1.5 text-sm">
              <Link
                href={`/markets/${pin.slug}`}
                className="block font-semibold text-primary hover:underline"
              >
                {pin.nameEn}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistance(pin.distanceMeters)} away
                {kind !== 'markets' ? ` · ${pin.count} ${kind}` : ''}
              </p>
              {kind !== 'markets' ? (
                <ul className="space-y-1 border-t pt-1.5">
                  {pin.items.map(item => (
                    <li key={item.id}>
                      <Link
                        href={ITEM_HREF[kind](item)}
                        className="hover:text-primary hover:underline"
                      >
                        {item.nameEn}
                      </Link>
                      {item.price !== undefined ? (
                        <span className="text-xs text-muted-foreground"> · ৳{item.price}</span>
                      ) : null}
                    </li>
                  ))}
                  {pin.count > pin.items.length ? (
                    <li className="text-xs text-muted-foreground">
                      +{pin.count - pin.items.length} more in{' '}
                      <Link href={`/markets/${pin.slug}`} className="underline">
                        the mall page
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
