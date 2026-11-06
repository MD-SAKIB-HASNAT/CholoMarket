import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  DirectoryQueryDto,
  MarketQueryDto,
} from 'src/catalog/dto/markets.dto';
import { applyNameSearch } from 'src/catalog/helpers/name-search';
import { CategoriesService } from 'src/catalog/services/categories.service';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type SortKey,
} from 'src/common/pagination';
import { Market } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { applyLocationFilter } from 'src/geo/helpers/location-filter';
import { NearbyService } from 'src/geo/services/nearby.service';
import { In } from 'typeorm';

export type MarketListItem = Market & {
  shopCount: number;
  distanceMeters?: number;
};

@Injectable()
export class MarketsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly nearby: NearbyService,
    private readonly categoryTree: CategoriesService,
  ) {}

  /** Active markets: partners first then A–Z, or nearest first with `nearby=true`. */
  async list(
    q: MarketQueryDto,
  ): Promise<CursorPage<MarketListItem> & { radiusMeters?: number }> {
    const qb = this.postgresService.markets
      .createQueryBuilder('m')
      .where("m.status = 'active'");
    if (q.kind) qb.andWhere('m.kind = :kind', { kind: q.kind });
    applyNameSearch(qb, 'm', q.q);
    applyLocationFilter(qb, q, 'm.area_id', 'm.sub_area_id');

    const centre = await this.nearby.centre(q);
    const keys: SortKey[] = [];
    if (centre) {
      this.nearby.restrict(qb, centre, 'm.latitude', 'm.longitude');
      keys.push(this.nearby.sortKey('m.latitude', 'm.longitude'));
    } else {
      keys.push(
        { expr: 'm.is_partner', dir: 'DESC', type: 'boolean' },
        { expr: 'm.name_en', dir: 'ASC', type: 'text' },
      );
    }

    const page = await keysetIds(qb, { idExpr: 'm.id', keys, page: q });
    const found = await this.postgresService.markets.find({
      where: { id: In(page.ids) },
      relations: { area: true, subArea: true },
    });
    const counts = await this.shopCounts(page.ids);
    const distances = new Map(
      page.rows.map((r) => [Number(r.id), Number(r.k0)]),
    );
    const items = inOrder(page.ids, found).map((m) => ({
      ...m,
      shopCount: counts.get(m.id) ?? 0,
      ...(centre && { distanceMeters: distances.get(m.id) }),
    }));
    return {
      ...toCursorPage(items, page),
      ...(centre && { radiusMeters: centre.radius }),
    };
  }

  async bySlug(slugOrId: string) {
    const where = /^\d+$/.test(slugOrId)
      ? { id: Number(slugOrId) }
      : { slug: slugOrId };
    const market = await this.postgresService.markets.findOne({
      where,
      relations: {
        area: { district: { division: true } },
        subArea: true,
        floors: true,
        pickupPoints: { floor: true },
      },
      order: { floors: { level: 'ASC' } },
    });
    if (!market || market.status === 'draft')
      throw new NotFoundException('Market not found');
    const counts = await this.shopCounts([market.id]);
    const categories = await this.postgresService.categories
      .createQueryBuilder('c')
      .innerJoin('shop_categories', 'sc', 'sc.category_id = c.id')
      .innerJoin('shops', 's', "s.id = sc.shop_id AND s.status = 'active'")
      .where('s.market_id = :id', { id: market.id })
      .select(['c.id', 'c.slug', 'c.nameEn', 'c.nameBn', 'c.icon'])
      .addSelect('count(DISTINCT s.id)::int', 'shop_count')
      .groupBy('c.id')
      .orderBy('shop_count', 'DESC')
      .getRawAndEntities();
    return {
      ...market,
      pickupPoints: market.pickupPoints.filter((p) => p.isActive),
      shopCount: counts.get(market.id) ?? 0,
      categories: categories.entities.map((c, i) => ({
        ...c,
        shopCount: categories.raw[i].shop_count as number,
      })),
    };
  }

  /** Mall walk-through: a market's active shops grouped by floor, in walking order (one mall's shops, so not paged). */
  async directory(slugOrId: string, q: DirectoryQueryDto) {
    const market = await this.bySlug(slugOrId);
    const qb = this.postgresService.shops
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.floor', 'f')
      .leftJoinAndSelect('s.primaryCategory', 'pc')
      .where('s.market_id = :id', { id: market.id })
      .andWhere("s.status = 'active'");
    if (q.floorId) qb.andWhere('s.floor_id = :floorId', { floorId: q.floorId });
    if (q.categoryId) {
      const ids = await this.categoryTree.withDescendants(q.categoryId);
      qb.andWhere(
        'EXISTS (SELECT 1 FROM shop_categories sc WHERE sc.shop_id = s.id AND sc.category_id IN (:...ids))',
        { ids },
      );
    }
    const shops = await qb
      .orderBy('f.level', 'ASC', 'NULLS LAST')
      .addOrderBy('s.walk_order', 'ASC', 'NULLS LAST')
      .addOrderBy('s.name_en')
      .getMany();
    const floors = market.floors.map((f) => ({
      id: f.id,
      level: f.level,
      nameEn: f.nameEn,
      nameBn: f.nameBn,
      mapImageUrl: f.mapImageUrl,
      shops: shops.filter((s) => s.floorId === f.id),
    }));
    const unplaced = shops.filter((s) => !s.floorId);
    if (unplaced.length) {
      floors.push({
        id: 0,
        level: 999,
        nameEn: 'Other shops',
        nameBn: 'অন্যান্য দোকান',
        mapImageUrl: null,
        shops: unplaced,
      });
    }
    return {
      market: {
        id: market.id,
        slug: market.slug,
        nameEn: market.nameEn,
        nameBn: market.nameBn,
      },
      floors,
    };
  }

  private async shopCounts(marketIds: number[]) {
    if (!marketIds.length) return new Map<number, number>();
    const rows = await this.postgresService.shops
      .createQueryBuilder('s')
      .select('s.market_id', 'marketId')
      .addSelect('count(*)::int', 'count')
      .where('s.market_id IN (:...ids)', { ids: marketIds })
      .andWhere("s.status = 'active'")
      .groupBy('s.market_id')
      .getRawMany<{ marketId: number; count: number }>();
    return new Map(rows.map((r) => [r.marketId, r.count]));
  }
}
