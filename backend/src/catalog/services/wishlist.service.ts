import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductCardsService,
  type ProductCard,
} from 'src/catalog/services/product-cards.service';
import {
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import { PostgresService } from 'src/database/postgres/postgres.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly cards: ProductCardsService,
  ) {}

  /** Saved products, most recently saved first. */
  async list(
    userId: number,
    q: CursorQueryDto,
  ): Promise<CursorPage<ProductCard>> {
    const qb = this.postgresService.wishlistItems
      .createQueryBuilder('w')
      .where('w.user_id = :userId', { userId });
    const page = await keysetIds(qb, {
      idExpr: 'w.product_id',
      keys: [{ expr: 'w.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    return toCursorPage(await this.cards.load(page.ids), page);
  }

  async add(userId: number, productId: number) {
    if (
      !(await this.postgresService.products.exists({
        where: { id: productId },
      }))
    )
      throw new NotFoundException('Product not found');
    await this.postgresService.wishlistItems.upsert({ userId, productId }, [
      'userId',
      'productId',
    ]);
    return { inWishlist: true };
  }

  async remove(userId: number, productId: number) {
    await this.postgresService.wishlistItems.delete({ userId, productId });
    return { inWishlist: false };
  }
}
