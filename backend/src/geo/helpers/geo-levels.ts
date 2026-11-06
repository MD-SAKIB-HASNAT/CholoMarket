import type { SortKey } from 'src/common/pagination';
import {
  Area,
  District,
  Division,
  SubArea,
} from 'src/database/postgres/entities';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/** The four levels, top to bottom. */
export const GEO_LEVELS = [
  'divisions',
  'districts',
  'areas',
  'sub-areas',
] as const;
export type GeoLevel = (typeof GEO_LEVELS)[number];

export const LABEL: Record<GeoLevel, string> = {
  divisions: 'division',
  districts: 'district',
  areas: 'area',
  'sub-areas': 'sub-area',
};
export const PARENT_LABEL: Partial<Record<GeoLevel, string>> = {
  districts: 'division',
  areas: 'district',
  'sub-areas': 'area',
};

export const ENTITY = {
  divisions: Division,
  districts: District,
  areas: Area,
  'sub-areas': SubArea,
} as const;
export const PARENT_ENTITY = {
  districts: Division,
  areas: District,
  'sub-areas': Area,
} as const;

/** Column that points to the parent, per level. */
export const PARENT_COLUMN: Partial<
  Record<GeoLevel, 'divisionId' | 'districtId' | 'areaId'>
> = {
  districts: 'divisionId',
  areas: 'districtId',
  'sub-areas': 'areaId',
};

type Builder = (
  qb: SelectQueryBuilder<ObjectLiteral>,
) => SelectQueryBuilder<ObjectLiteral>;

interface LevelQuery {
  /** The columns of an admin row; every level returns the same shape. */
  select: string;
  /** FROM and joins (row alias is always `x`). */
  from: Builder;
  /** Sort order within the parent chain; names are never NULL. */
  keys: SortKey[];
  /** Where each ancestor filter applies. */
  filters: Partial<Record<'divisionId' | 'districtId' | 'areaId', string>>;
}

const text = (expr: string): SortKey => ({ expr, dir: 'ASC', type: 'text' });

/**
 * How each level is listed for the admin screens. Row shape:
 * id, nameEn, nameBn, isActive, parentId, parentName, parentPath, childCount, marketCount
 * (+ divisionId / districtId / areaId for the cascading pickers, kind / isServiceable on areas).
 */
export const LEVEL_QUERY: Record<GeoLevel, LevelQuery> = {
  divisions: {
    select: `x.id, x.name_en AS "nameEn", x.name_bn AS "nameBn", x.is_active AS "isActive",
      NULL::int AS "parentId", NULL::text AS "parentName", ''::text AS "parentPath",
      (SELECT count(*) FROM districts c WHERE c.division_id = x.id)::int AS "childCount",
      (SELECT count(*) FROM markets m JOIN areas a ON a.id = m.area_id JOIN districts d ON d.id = a.district_id WHERE d.division_id = x.id)::int AS "marketCount"`,
    from: (qb) => qb.from('divisions', 'x'),
    keys: [text('x.name_en')],
    filters: {},
  },
  districts: {
    select: `x.id, x.name_en AS "nameEn", x.name_bn AS "nameBn", x.is_active AS "isActive",
      x.division_id AS "parentId", dv.name_en AS "parentName", dv.name_en AS "parentPath", x.division_id AS "divisionId",
      (SELECT count(*) FROM areas c WHERE c.district_id = x.id)::int AS "childCount",
      (SELECT count(*) FROM markets m JOIN areas a ON a.id = m.area_id WHERE a.district_id = x.id)::int AS "marketCount"`,
    from: (qb) =>
      qb
        .from('districts', 'x')
        .innerJoin('divisions', 'dv', 'dv.id = x.division_id'),
    keys: [text('dv.name_en'), text('x.name_en')],
    filters: { divisionId: 'x.division_id' },
  },
  areas: {
    select: `x.id, x.name_en AS "nameEn", x.name_bn AS "nameBn", x.is_active AS "isActive", x.kind, x.is_serviceable AS "isServiceable",
      x.district_id AS "parentId", d.name_en AS "parentName", dv.name_en || ' › ' || d.name_en AS "parentPath",
      d.division_id AS "divisionId", x.district_id AS "districtId",
      (SELECT count(*) FROM sub_areas c WHERE c.area_id = x.id)::int AS "childCount",
      (SELECT count(*) FROM markets m WHERE m.area_id = x.id)::int AS "marketCount"`,
    from: (qb) =>
      qb
        .from('areas', 'x')
        .innerJoin('districts', 'd', 'd.id = x.district_id')
        .innerJoin('divisions', 'dv', 'dv.id = d.division_id'),
    keys: [text('dv.name_en'), text('d.name_en'), text('x.name_en')],
    filters: { divisionId: 'd.division_id', districtId: 'x.district_id' },
  },
  'sub-areas': {
    select: `x.id, x.name_en AS "nameEn", x.name_bn AS "nameBn", x.is_active AS "isActive",
      x.area_id AS "parentId", a.name_en AS "parentName", dv.name_en || ' › ' || d.name_en || ' › ' || a.name_en AS "parentPath",
      d.division_id AS "divisionId", a.district_id AS "districtId", x.area_id AS "areaId",
      0::int AS "childCount",
      (SELECT count(*) FROM markets m WHERE m.sub_area_id = x.id)::int AS "marketCount"`,
    from: (qb) =>
      qb
        .from('sub_areas', 'x')
        .innerJoin('areas', 'a', 'a.id = x.area_id')
        .innerJoin('districts', 'd', 'd.id = a.district_id')
        .innerJoin('divisions', 'dv', 'dv.id = d.division_id'),
    keys: [
      text('dv.name_en'),
      text('d.name_en'),
      text('a.name_en'),
      text('x.name_en'),
    ],
    filters: {
      divisionId: 'd.division_id',
      districtId: 'a.district_id',
      areaId: 'x.area_id',
    },
  },
};
