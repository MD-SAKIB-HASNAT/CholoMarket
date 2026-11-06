import { Injectable } from '@nestjs/common';
import { Product } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

/** The slim product shown in grids: first photo, price range, stock flag, shop and category. */
export interface ProductCard {
  id: number;
  slug: string;
  nameEn: string;
  nameBn: string | null;
  minPrice: number | null;
  compareAtPrice: number | null;
  isNegotiable: boolean;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  inStock: boolean;
  category: { id: number; slug: string; nameEn: string; icon: string | null };
  shop: {
    id: number;
    slug: string;
    nameEn: string;
    isVerified: boolean;
    market: { id: number; slug: string; nameEn: string } | null;
  };
  /** Only on "nearby" results. */
  distanceMeters?: number;
}

@Injectable()
export class ProductCardsService {
  constructor(private readonly postgresService: PostgresService) {}

  /** Cards for the given product ids, in the same order (ids that no longer exist are skipped). */
  async load(ids: number[]): Promise<ProductCard[]> {
    if (!ids.length) return [];
    const found = await this.postgresService.products.find({
      where: { id: In(ids) },
      relations: {
        shop: { market: true },
        images: true,
        variants: true,
        category: true,
      },
    });
    const byId = new Map(found.map((p) => [p.id, p]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [this.toCard(product)] : [];
    });
  }

  private toCard(p: Product): ProductCard {
    const variants = p.variants.filter((v) => v.isActive);
    const photo = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    const wasPrice = Math.max(0, ...variants.map((v) => v.compareAtPrice ?? 0));
    return {
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameBn: p.nameBn,
      minPrice: p.minPrice,
      compareAtPrice: wasPrice > (p.minPrice ?? 0) ? wasPrice : null,
      isNegotiable: p.isNegotiable,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      imageUrl: photo?.url ?? null,
      inStock: variants.some((v) => v.availableQty > 0),
      category: {
        id: p.category.id,
        slug: p.category.slug,
        nameEn: p.category.nameEn,
        icon: p.category.icon,
      },
      shop: {
        id: p.shop.id,
        slug: p.shop.slug,
        nameEn: p.shop.nameEn,
        isVerified: p.shop.isVerified,
        market: p.shop.market
          ? {
              id: p.shop.market.id,
              slug: p.shop.market.slug,
              nameEn: p.shop.market.nameEn,
            }
          : null,
      },
    };
  }
}
