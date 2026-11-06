import type { Query } from '@/utils/api/api';

type SearchParams = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);

/** "Nearby" for any list: ?nearby=1&lat=&lng= becomes the API's nearby=true with the position. */
export function nearbyQuery(sp: SearchParams): Query {
  const lat = str(sp.lat);
  const lng = str(sp.lng);
  const radiusKm = str(sp.radius);
  return str(sp.nearby) === '1' && lat && lng
    ? { nearby: 'true', lat, lng, ...(radiusKm && { radiusKm }) }
    : {};
}

/** The location filters of /markets and /shops: division → district → area → sub-area, or "nearby" with the customer's position. */
export function locationQuery(sp: SearchParams): Query {
  return {
    divisionId: str(sp.divisionId),
    districtId: str(sp.districtId),
    areaId: str(sp.areaId),
    subAreaId: str(sp.subAreaId),
    ...nearbyQuery(sp),
  };
}

export const hasLocationFilter = (sp: SearchParams) =>
  !!(
    str(sp.divisionId) ||
    str(sp.districtId) ||
    str(sp.areaId) ||
    str(sp.subAreaId) ||
    str(sp.nearby)
  );
