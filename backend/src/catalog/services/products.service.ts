import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ProductQueryDto,
  ProductSort,
} from 'src/catalog/dto/products.dto';
import { applyNameSearch } from 'src/catalog/helpers/name-search';
import { productOrder } from 'src/catalog/helpers/product-sort';
import { CategoriesService } from 'src/catalog/services/categories.service';
import {
  ProductCardsService,
  type ProductCard,
} from 'src/catalog/services/product-cards.service';
import {
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import { Product } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { NearbyService } from 'src/geo/services/nearby.service';
import { IsNull, type SelectQueryBuilder } from 'typeorm';

/** Where a product is: its shop's pin, else the market's. */
const PRODUCT_LAT = 'COALESCE(s.latitude, m.latitude)';
const PRODUCT_LNG = 'COALESCE(s.longitude, m.longitude)';

@Injectable()
export class ProductsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly cards: ProductCardsService,
    private readonly categories: CategoriesService,
    private readonly nearby: NearbyService,
  ) {}

  /** Active products of active shops. Cursor-paged; `nearby=true` keeps products from shops in the admin's radius. */
  async list(
    q: ProductQueryDto,
  ): Promise<CursorPage<ProductCard> & { radiusMeters?: number }> {
    const centre = await this.nearby.centre(q);
    const sort = this.chooseSort(q, !!centre);

    const qb = this.postgresService.products
      .createQueryBuilder('p')
      .innerJoin('p.shop', 's')
      .where("p.status = 'active'")
      .andWhere("s.status = 'active'")
      .andWhere('p.deleted_at IS NULL');
    await this.applyFilters(qb, q);
    if (centre) {
      qb.leftJoin('markets', 'm', 'm.id = s.market_id');
      this.nearby.restrict(qb, centre, PRODUCT_LAT, PRODUCT_LNG);
    }

    const order = productOrder(
      sort,
      centre ? this.nearby.sortKey(PRODUCT_LAT, PRODUCT_LNG) : undefined,
    );
    const page = await keysetIds(qb, {
      idExpr: 'p.id',
      keys: order.keys,
      tieDir: order.tieDir,
      page: q,
    });

    const items = await this.cards.load(page.ids);
    if (centre) {
      const distances = new Map(
        page.rows.map((r) => [Number(r.id), Number(r.k0)]),
      );
      for (const item of items) item.distanceMeters = distances.get(item.id);
    }
    return {
      ...toCursorPage(items, page),
      ...(centre && { radiusMeters: centre.radius }),
    };
  }

  async byId(id: number, userId?: number) {
    const product = await this.postgresService.products.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        shop: { market: true, floor: true },
        category: { parent: true },
        brand: true,
        sizeChart: true,
        images: true,
        variants: true,
      },
    });
    if (
      !product ||
      product.status !== 'active' ||
      product.shop.status !== 'active'
    )
      throw new NotFoundException('Product not found');

    product.images.sort((a, b) => a.sortOrder - b.sortOrder);
    const variants = product.variants
      .filter((v) => v.isActive)
      .sort((a, b) => a.price - b.price)
      // Never expose the shop's hidden bargaining floor.
      .map(({ minOfferPrice: _hidden, ...v }) => v);
    const [similar, inWishlist] = await Promise.all([
      this.list({ categoryId: product.categoryId, limit: 8, sort: 'rating' }),
      userId
        ? this.postgresService.wishlistItems.exists({
            where: { userId, productId: id },
          })
        : Promise.resolve(false),
    ]);
    return {
      ...product,
      variants,
      inWishlist,
      canMakeOffer: product.isNegotiable && product.shop.acceptsOffers,
      related: similar.items.filter((r) => r.id !== id).slice(0, 6),
    };
  }

  /** The requested sort, or the natural one: relevance for a search, nearest for nearby, else newest. */
  private chooseSort(q: ProductQueryDto, isNearby: boolean): ProductSort {
    if (q.sort === 'nearest' && !isNearby)
      throw new BadRequestException('Sorting by distance needs Nearby.');
    if (q.sort === 'relevance' && !q.q) return isNearby ? 'nearest' : 'newest';
    return q.sort ?? (q.q ? 'relevance' : isNearby ? 'nearest' : 'newest');
  }

  private async applyFilters(
    qb: SelectQueryBuilder<Product>,
    q: ProductQueryDto,
  ): Promise<void> {
    if (q.shopId) qb.andWhere('p.shop_id = :shopId', { shopId: q.shopId });
    if (q.marketId)
      qb.andWhere('s.market_id = :marketId', { marketId: q.marketId });
    if (q.categoryId) {
      const ids = await this.categories.withDescendants(q.categoryId);
      qb.andWhere('p.category_id IN (:...categoryIds)', { categoryIds: ids });
    }
    if (q.brandId) qb.andWhere('p.brand_id = :brandId', { brandId: q.brandId });
    if (q.minPrice !== undefined)
      qb.andWhere('p.min_price >= :minPrice', { minPrice: q.minPrice });
    if (q.maxPrice !== undefined)
      qb.andWhere('p.min_price <= :maxPrice', { maxPrice: q.maxPrice });
    if (q.negotiable) qb.andWhere('p.is_negotiable = true');
    if (q.onSale) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active AND v.compare_at_price > v.price)',
      );
    }
    if (q.inStock) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active AND v.available_qty > 0)',
      );
    }
    applyNameSearch(qb, 'p', q.q, true);
  }
}
