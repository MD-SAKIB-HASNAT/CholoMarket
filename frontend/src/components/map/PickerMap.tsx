'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';

export type LatLng = [number, number];

/** Dhaka, shown when nothing is chosen yet. */
export const DEFAULT_CENTRE: LatLng = [23.7806, 90.4163];

export const TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const pinIcon = (label = '', className = 'map-pin') =>
  L.divIcon({
    className: '',
    html: `<span class="${className}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: e => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Recentre({ to }: { to: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.setView(to, Math.max(map.getZoom(), 16));
    // only when the chosen place changes from outside the map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to?.[0], to?.[1]]);
  return null;
}

/** A map where one click chooses a place. */
export default function PickerMap({
  value,
  onPick,
}: {
  value: LatLng | null;
  onPick: (p: LatLng) => void;
}) {
  return (
    <MapContainer
      center={value ?? DEFAULT_CENTRE}
      zoom={value ? 16 : 12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer url={TILES.url} attribution={TILES.attribution} />
      <ClickToPick onPick={onPick} />
      <Recentre to={value} />
      {value ? <Marker position={value} icon={pinIcon()} /> : null}
    </MapContainer>
  );
}
