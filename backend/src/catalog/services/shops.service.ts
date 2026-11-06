import { Injectable, NotFoundException } from '@nestjs/common';
import type { ShopQueryDto } from 'src/catalog/dto/shops.dto';
import { applyNameSearch } from 'src/catalog/helpers/name-search';
import { CategoriesService } from 'src/catalog/services/categories.service';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type SortKey,
} from 'src/common/pagination';
import { Shop } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { applyLocationFilter } from 'src/geo/helpers/location-filter';
import { NearbyService } from 'src/geo/services/nearby.service';
import { In } from 'typeorm';

export type ShopListItem = Shop & { distanceMeters?: number };

/** Where a shop is: its own pin if it has one, else its market's. */
const SHOP_LAT = 'COALESCE(s.latitude, m.latitude)';
const SHOP_LNG = 'COALESCE(s.longitude, m.longitude)';

@Injectable()
export class ShopsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly nearby: NearbyService,
    private readonly categories: CategoriesService,
  ) {}

  /** Active shops: verified and best rated first, or nearest first with `nearby=true`. */
  async list(
    q: ShopQueryDto,
  ): Promise<CursorPage<ShopListItem> & { radiusMeters?: number }> {
    const qb = this.postgresService.shops
      .createQueryBuilder('s')
      .leftJoin('s.market', 'm')
      .where("s.status = 'active'");
    if (q.marketId)
      qb.andWhere('s.market_id = :marketId', { marketId: q.marketId });
    if (q.verified) qb.andWhere('s.is_verified = true');
    if (q.categoryId) {
      const ids = await this.categories.withDescendants(q.categoryId);
      qb.andWhere(
        'EXISTS (SELECT 1 FROM shop_categories sc WHERE sc.shop_id = s.id AND sc.category_id IN (:...ids))',
        { ids },
      );
    }
    applyNameSearch(qb, 's', q.q);
    applyLocationFilter(
      qb,
      q,
      'COALESCE(s.area_id, m.area_id)',
      'm.sub_area_id',
    );

    const centre = await this.nearby.centre(q);
    const keys: SortKey[] = [];
    if (centre) {
      this.nearby.restrict(qb, centre, SHOP_LAT, SHOP_LNG);
      keys.push(this.nearby.sortKey(SHOP_LAT, SHOP_LNG));
    } else {
      keys.push(
        { expr: 's.is_verified', dir: 'DESC', type: 'boolean' },
        { expr: 's.rating_avg', dir: 'DESC', type: 'numeric' },
        { expr: 's.name_en', dir: 'ASC', type: 'text' },
      );
    }

    const page = await keysetIds(qb, { idExpr: 's.id', keys, page: q });
    const found = await this.postgresService.shops.find({
      where: { id: In(page.ids) },
      relations: { market: true, floor: true, primaryCategory: true },
    });
    const distances = new Map(
      page.rows.map((r) => [Number(r.id), Number(r.k0)]),
    );
    const items = inOrder(page.ids, found).map((s) => ({
      ...s,
      ...(centre && { distanceMeters: distances.get(s.id) }),
    }));
    return {
      ...toCursorPage(items, page),
      ...(centre && { radiusMeters: centre.radius }),
    };
  }

  async bySlug(slugOrId: string, userId?: number) {
    const where = /^\d+$/.test(slugOrId)
      ? { id: Number(slugOrId) }
      : { slug: slugOrId };
    const shop = await this.postgresService.shops.findOne({
      where,
      relations: {
        market: { area: { district: { division: true } }, subArea: true },
        floor: true,
        primaryCategory: true,
        categories: { category: true },
      },
    });
    if (!shop || shop.status !== 'active')
      throw new NotFoundException('Shop not found');
    const [hours, productCount, followerCount, isFollowing] = await Promise.all(
      [
        this.postgresService.shopHours.find({
          where: { shopId: shop.id },
          order: { weekday: 'ASC' },
        }),
        this.postgresService.products.count({
          where: { shopId: shop.id, status: 'active' },
        }),
        this.postgresService.shopFollows.count({ where: { shopId: shop.id } }),
        userId
          ? this.postgresService.shopFollows.exists({
              where: { shopId: shop.id, userId },
            })
          : Promise.resolve(false),
      ],
    );
    return {
      ...shop,
      categories: shop.categories.map((c) => c.category),
      hours,
      productCount,
      followerCount,
      isFollowing,
    };
  }
}
