import { Injectable } from '@nestjs/common';
import type { SearchQueryDto } from 'src/catalog/dto/search.dto';
import { MarketsService } from 'src/catalog/services/markets.service';
import { ProductsService } from 'src/catalog/services/products.service';
import { ShopsService } from 'src/catalog/services/shops.service';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** How many hits of each kind the quick search returns; the full lists have their own cursor-paged endpoints. */
const SECTION_SIZE = {
  all: { markets: 4, shops: 6, products: 12 },
  one: 30,
} as const;

@Injectable()
export class SearchService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly markets: MarketsService,
    private readonly shops: ShopsService,
    private readonly products: ProductsService,
  ) {}

  async search(dto: SearchQueryDto, userId?: number) {
    const scope = dto.scope ?? 'all';
    const wants = (kind: string) => scope === 'all' || scope === kind;
    const size = (kind: keyof typeof SECTION_SIZE.all) =>
      scope === 'all' ? SECTION_SIZE.all[kind] : SECTION_SIZE.one;

    const [markets, shops, products] = await Promise.all([
      wants('market')
        ? this.markets.list({ q: dto.q, limit: size('markets') })
        : null,
      wants('shop')
        ? this.shops.list({
            q: dto.q,
            categoryId: dto.categoryId,
            limit: size('shops'),
          })
        : null,
      wants('product')
        ? this.products.list({
            q: dto.q,
            categoryId: dto.categoryId,
            limit: size('products'),
          })
        : null,
    ]);
    const resultsCount =
      (markets?.items.length ?? 0) +
      (shops?.items.length ?? 0) +
      (products?.items.length ?? 0);

    // Search analytics feed "smart Bangla search" and tell onboarding what to upload.
    void this.postgresService.searchQueries
      .insert({
        userId: userId ?? null,
        query: dto.q.trim().slice(0, 100),
        scope,
        marketId: null,
        resultsCount,
      })
      .catch(() => undefined);
    return { q: dto.q, markets, shops, products, resultsCount };
  }
}
