import type { LocationFilterDto } from 'src/geo/dto/location-filter.dto';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Narrows a query to a division / district / area / sub-area.
 * `areaExpr` and `subAreaExpr` say where the row's place comes from, e.g. `m.area_id` for a market, or
 * `COALESCE(s.area_id, m.area_id)` for a shop (its own area, else its market's).
 */
export function applyLocationFilter(
  qb: SelectQueryBuilder<ObjectLiteral>,
  q: Pick<
    LocationFilterDto,
    'divisionId' | 'districtId' | 'areaId' | 'subAreaId'
  >,
  areaExpr: string,
  subAreaExpr: string,
): void {
  if (!q.divisionId && !q.districtId && !q.areaId && !q.subAreaId) return;
  qb.leftJoin('areas', 'loc_area', `loc_area.id = ${areaExpr}`).leftJoin(
    'districts',
    'loc_district',
    'loc_district.id = loc_area.district_id',
  );
  if (q.divisionId)
    qb.andWhere('loc_district.division_id = :divisionId', {
      divisionId: q.divisionId,
    });
  if (q.districtId)
    qb.andWhere('loc_area.district_id = :districtId', {
      districtId: q.districtId,
    });
  if (q.areaId) qb.andWhere('loc_area.id = :areaId', { areaId: q.areaId });
  if (q.subAreaId)
    qb.andWhere(`${subAreaExpr} = :subAreaId`, { subAreaId: q.subAreaId });
}

export const hasLocationFilter = (
  q: Pick<
    LocationFilterDto,
    'divisionId' | 'districtId' | 'areaId' | 'subAreaId'
  >,
) => !!(q.divisionId || q.districtId || q.areaId || q.subAreaId);
