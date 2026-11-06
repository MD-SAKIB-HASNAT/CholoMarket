'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api/api';
import type { GeoOption, MapKind, PublicConfig } from '@/utils/types';
import { cn } from '@/utils/helpers/cn';
import { NativeSelect } from '@/components/shared/FormBits';
import { NEARBY_PARAMS, NearbyToggle } from '@/components/shared/NearbyToggle';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

const LEVELS = ['divisionId', 'districtId', 'areaId', 'subAreaId'] as const;
type Level = (typeof LEVELS)[number];

const geo = (path: string, query?: Record<string, string>) =>
  api<GeoOption[]>(
    `${STORE_ENDPOINTS.geo.level(path)}${query ? `?${new URLSearchParams(query)}` : ''}`,
    { token: null }
  );

const PICKER: Record<Level, { path: string; parent?: Level }> = {
  divisionId: { path: 'divisions' },
  districtId: { path: 'districts', parent: 'divisionId' },
  areaId: { path: 'areas', parent: 'districtId' },
  subAreaId: { path: 'sub-areas', parent: 'areaId' },
};

/** The choices for one level, narrowed by the level above it (nothing until that one is chosen). */
function usePlaceOptions(level: Level, parentValue: string | null) {
  const { path, parent } = PICKER[level];
  return useQuery({
    queryKey: ['geo', level, parentValue ?? ''],
    queryFn: () => geo(path, parent && parentValue ? { [parent]: parentValue } : undefined),
    enabled: !parent || !!parentValue,
    staleTime: 30 * 60_000,
  }).data;
}

/**
 * Place filters for the markets and shops lists: "Nearby" plus Division → District → Area → Sub-area.
 * Everything lives in the page address, so lists stay shareable and server-rendered.
 */
export function LocationFilter({
  className,
  kind = 'markets',
}: {
  className?: string;
  kind?: MapKind;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = (level: Level) => params.get(level) ?? '';
  const nearby = params.get('nearby') === '1' && !!params.get('lat') && !!params.get('lng');
  const maxKm = useQuery({
    queryKey: ['config'],
    queryFn: () => api<PublicConfig>(STORE_ENDPOINTS.platform.config, { token: null }),
    staleTime: 5 * 60_000,
  }).data?.nearbyMaxKm;
  const radiusKm = params.get('radius') ?? maxKm;

  const lists: Record<Level, GeoOption[] | undefined> = {
    divisionId: usePlaceOptions('divisionId', null),
    districtId: usePlaceOptions('districtId', value('divisionId')),
    areaId: usePlaceOptions('areaId', value('districtId')),
    subAreaId: usePlaceOptions('subAreaId', value('areaId')),
  };
  const labels: Record<Level, string> = {
    divisionId: 'Division',
    districtId: 'District',
    areaId: 'Area',
    subAreaId: 'Sub-area',
  };

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}${next.size ? `?${next}` : ''}`);
  };

  /** Choosing a level clears everything below it. */
  const choose = (level: Level, id: string) => {
    const patch: Record<string, string | null> = { [level]: id || null };
    for (const lower of LEVELS.slice(LEVELS.indexOf(level) + 1)) patch[lower] = null;
    go(patch);
  };

  const filtered = nearby || LEVELS.some(value);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <NearbyToggle kind={kind} />
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
        <MapPin className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
        {LEVELS.map((level, i) => (
          <NativeSelect
            key={level}
            aria-label={labels[level]}
            value={value(level)}
            disabled={(i > 0 && !value(LEVELS[i - 1])) || !lists[level]}
            onChange={e => choose(level, e.target.value)}
            className={cn(
              'h-9 w-auto min-w-36 max-w-52 bg-card',
              value(level) && 'border-primary text-ink'
            )}
          >
            <option value="">{labels[level]}</option>
            {lists[level]?.map(o => (
              <option key={o.id} value={o.id}>
                {o.nameEn}
              </option>
            ))}
          </NativeSelect>
        ))}
        {filtered ? (
          <button
            type="button"
            onClick={() =>
              go(Object.fromEntries([...NEARBY_PARAMS, ...LEVELS].map(k => [k, null])))
            }
            className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" /> Clear
          </button>
        ) : null}
      </div>
      {nearby ? (
        <p className="text-xs text-muted-foreground">
          Showing places within {radiusKm ? `${radiusKm} km` : 'walking distance'} of the spot you
          chose, nearest first.
        </p>
      ) : null}
    </div>
  );
}
