import { Injectable, NotFoundException } from '@nestjs/common';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import { Shop } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

@Injectable()
export class ShopFollowsService {
  constructor(private readonly postgresService: PostgresService) {}

  async follow(userId: number, shopId: number) {
    if (!(await this.postgresService.shops.exists({ where: { id: shopId } })))
      throw new NotFoundException('Shop not found');
    await this.postgresService.shopFollows.upsert({ userId, shopId }, [
      'userId',
      'shopId',
    ]);
    return { isFollowing: true };
  }

  async unfollow(userId: number, shopId: number) {
    await this.postgresService.shopFollows.delete({ userId, shopId });
    return { isFollowing: false };
  }

  /** The shops a customer follows, most recently followed first. */
  async listFor(userId: number, q: CursorQueryDto): Promise<CursorPage<Shop>> {
    const qb = this.postgresService.shopFollows
      .createQueryBuilder('f')
      .where('f.user_id = :userId', { userId });
    const page = await keysetIds(qb, {
      idExpr: 'f.shop_id',
      keys: [{ expr: 'f.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const shops = await this.postgresService.shops.find({
      where: { id: In(page.ids) },
      relations: { market: true },
    });
    return toCursorPage(inOrder(page.ids, shops), page);
  }
}
