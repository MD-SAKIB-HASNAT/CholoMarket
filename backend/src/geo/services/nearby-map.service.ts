import { Injectable } from '@nestjs/common';
import { MapKind, NearbyMapQueryDto } from 'src/geo/dto/nearby-map.dto';
import { NearbyService } from 'src/geo/services/nearby.service';
import { PostgresService } from 'src/database/postgres/postgres.service';

const MAX_PINS = 60;
const ITEMS_PER_PIN = 6;

export interface MapItem {
  id: number;
  slug: string | null;
  nameEn: string;
  nameBn: string;
  price?: number;
}

export interface MapPin {
  marketId: number;
  slug: string;
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  imageUrl: string | null;
  /** Shops (or products) inside this mall that are on the platform. */
  count: number;
  items: MapItem[];
}

/** What is around a point on the map: malls as pins, each listing its shops or products. */
@Injectable()
export class NearbyMapService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly nearby: NearbyService,
  ) {}

  async pins(q: NearbyMapQueryDto) {
    const kind: MapKind = q.kind ?? 'markets';
    const centre = (await this.nearby.centre({
      nearby: true,
      lat: q.lat,
      lng: q.lng,
      radiusKm: q.radiusKm,
    }))!;

    const qb = this.postgresService.markets
      .createQueryBuilder('m')
      .select('m.id', 'marketId')
      .addSelect('m.slug', 'slug')
      .addSelect('m.name_en', 'nameEn')
      .addSelect('m.name_bn', 'nameBn')
      .addSelect('m.latitude::float', 'lat')
      .addSelect('m.longitude::float', 'lng')
      .addSelect('m.cover_url', 'imageUrl')
      .addSelect(
        this.nearby.distanceSql('m.latitude', 'm.longitude'),
        'distanceMeters',
      )
      .where("m.status = 'active'");
    this.nearby.restrict(qb, centre, 'm.latitude', 'm.longitude');
    const markets = await qb
      .orderBy('"distanceMeters"', 'ASC')
      .limit(MAX_PINS)
      .getRawMany<Omit<MapPin, 'count' | 'items'>>();

    const ids = markets.map((m) => m.marketId);
    const byMarket = ids.length
      ? await this.itemsByMarket(
          kind === 'products' ? 'products' : 'shops',
          ids,
        )
      : new Map<number, { count: number; items: MapItem[] }>();

    return {
      kind,
      centre: {
        lat: centre.lat,
        lng: centre.lng,
        radiusKm: centre.radius / 1000,
      },
      pins: markets.map((m) => ({
        ...m,
        count: byMarket.get(m.marketId)?.count ?? 0,
        items:
          kind === 'markets' ? [] : (byMarket.get(m.marketId)?.items ?? []),
      })),
    };
  }

  private async itemsByMarket(kind: 'shops' | 'products', marketIds: number[]) {
    const sql =
      kind === 'shops'
        ? `SELECT s.market_id AS "marketId", s.id, s.slug, s.name_en AS "nameEn", s.name_bn AS "nameBn", NULL::float AS price,
                  count(*) OVER (PARTITION BY s.market_id)::int AS total,
                  row_number() OVER (PARTITION BY s.market_id ORDER BY s.rating_avg DESC, s.id) AS rn
             FROM shops s
            WHERE s.market_id = ANY($1) AND s.status = 'active' AND s.deleted_at IS NULL`
        : `SELECT s.market_id AS "marketId", p.id, p.slug, p.name_en AS "nameEn", p.name_bn AS "nameBn", p.min_price::float AS price,
                  count(*) OVER (PARTITION BY s.market_id)::int AS total,
                  row_number() OVER (PARTITION BY s.market_id ORDER BY p.rating_count DESC, p.id DESC) AS rn
             FROM products p JOIN shops s ON s.id = p.shop_id
            WHERE s.market_id = ANY($1) AND s.status = 'active' AND s.deleted_at IS NULL
              AND p.status = 'active' AND p.deleted_at IS NULL`;
    const rows: (MapItem & { marketId: number; total: number; rn: string })[] =
      await this.postgresService.dataSource.query(
        `SELECT * FROM (${sql}) t WHERE rn <= ${ITEMS_PER_PIN}`,
        [marketIds],
      );
    const out = new Map<number, { count: number; items: MapItem[] }>();
    for (const r of rows) {
      const entry = out.get(r.marketId) ?? { count: r.total, items: [] };
      entry.items.push({
        id: r.id,
        slug: r.slug,
        nameEn: r.nameEn,
        nameBn: r.nameBn,
        ...(r.price != null && { price: r.price }),
      });
      out.set(r.marketId, entry);
    }
    return out;
  }
}
