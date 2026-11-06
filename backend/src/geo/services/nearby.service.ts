import { BadRequestException, Injectable } from '@nestjs/common';
import type { SortKey } from 'src/common/pagination';
import type { NearbyQueryDto } from 'src/geo/dto/location-filter.dto';
import { SettingsService } from 'src/platform/services/settings.service';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

const METERS_PER_DEGREE = 111_320;

/** Where the customer is and how far "nearby" reaches (the admin's `nearby_max_km` setting, or less if the customer asked for less). */
export interface NearbyCentre {
  lat: number;
  lng: number;
  radius: number;
}

/**
 * "Nearby" for any list whose rows have a position (a market, a shop's market, a product's shop):
 *   const centre = await nearby.centre(q);                       // null unless ?nearby=true
 *   if (centre) nearby.restrict(qb, centre, 'm.latitude', 'm.longitude');
 *   keys = [nearby.sortKey('m.latitude', 'm.longitude')];        // nearest first
 * The distance is computed in SQL (haversine, whole metres), so it also drives the cursor.
 */
@Injectable()
export class NearbyService {
  constructor(private readonly settings: SettingsService) {}

  /** null when the request is not a nearby search; throws when it is but has no position. */
  async centre(q: NearbyQueryDto): Promise<NearbyCentre | null> {
    if (!q.nearby) return null;
    if (q.lat === undefined || q.lng === undefined)
      throw new BadRequestException(
        'Allow location access to see what is nearby.',
      );
    const maxMeters = Math.max(
      1,
      Math.round(Number(await this.settings.get('nearby_max_km')) * 1000),
    );
    const wanted = q.radiusKm ? Math.round(q.radiusKm * 1000) : maxMeters;
    return { lat: q.lat, lng: q.lng, radius: Math.min(wanted, maxMeters) };
  }

  /** Whole metres from the customer to (latExpr, lngExpr). Needs the params added by `restrict`. */
  distanceSql(latExpr: string, lngExpr: string): string {
    return `ROUND(6371000 * ACOS(LEAST(1, COS(RADIANS(:nearLat)) * COS(RADIANS(${latExpr})) * COS(RADIANS(${lngExpr}) - RADIANS(:nearLng)) + SIN(RADIANS(:nearLat)) * SIN(RADIANS(${latExpr})))))::int`;
  }

  /** Sort key "nearest first". */
  sortKey(latExpr: string, lngExpr: string): SortKey {
    return {
      expr: this.distanceSql(latExpr, lngExpr),
      dir: 'ASC',
      type: 'int',
    };
  }

  /** Keeps only rows with a position inside the radius. A cheap bounding box runs first so indexes can help. */
  restrict(
    qb: SelectQueryBuilder<ObjectLiteral>,
    centre: NearbyCentre,
    latExpr: string,
    lngExpr: string,
  ): void {
    const dLat = centre.radius / METERS_PER_DEGREE;
    const dLng =
      centre.radius /
      (METERS_PER_DEGREE *
        Math.max(0.01, Math.cos((centre.lat * Math.PI) / 180)));
    qb.andWhere(
      `${latExpr} BETWEEN :nearMinLat AND :nearMaxLat AND ${lngExpr} BETWEEN :nearMinLng AND :nearMaxLng`,
      {
        nearLat: centre.lat,
        nearLng: centre.lng,
        nearMinLat: centre.lat - dLat,
        nearMaxLat: centre.lat + dLat,
        nearMinLng: centre.lng - dLng,
        nearMaxLng: centre.lng + dLng,
      },
    ).andWhere(`${this.distanceSql(latExpr, lngExpr)} <= :nearRadius`, {
      nearRadius: centre.radius,
    });
  }
}
