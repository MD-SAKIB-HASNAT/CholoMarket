import { Injectable } from '@nestjs/common';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import {
  Market,
  MarketMember,
  Shop,
  ShopOrder,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

export type DeskOrderFilter = 'active' | 'completed' | 'all';

/** What the mall management and pickup-desk screens read. */
@Injectable()
export class MarketPortalService {
  constructor(private readonly postgresService: PostgresService) {}

  async dashboard(marketId: number) {
    const market = await this.postgresService.dataSource
      .getRepository(Market)
      .findOneOrFail({
        where: { id: marketId },
        relations: { floors: true, pickupPoints: true },
      });
    const [shops, orders, desk, top] = await Promise.all([
      this.postgresService.dataSource.query<
        { status: string; count: number }[]
      >(
        `SELECT status, count(*)::int AS count FROM shops WHERE market_id = $1 AND deleted_at IS NULL GROUP BY status`,
        [marketId],
      ),
      this.postgresService.dataSource.query<
        { today: number; month_orders: number; month_gmv: string }[]
      >(
        `SELECT count(*) FILTER (WHERE so.created_at >= date_trunc('day', now()))::int AS today,
                count(*) FILTER (WHERE so.status = 'completed' AND so.completed_at >= date_trunc('month', now()))::int AS month_orders,
                COALESCE(sum(so.total) FILTER (WHERE so.status = 'completed' AND so.completed_at >= date_trunc('month', now())), 0) AS month_gmv
         FROM shop_orders so JOIN shops s ON s.id = so.shop_id JOIN orders o ON o.id = so.order_id
         WHERE s.market_id = $1 AND o.status <> 'pending_payment'`,
        [marketId],
      ),
      this.postgresService.dataSource.query<{ waiting: number }[]>(
        `SELECT count(*)::int AS waiting FROM shop_orders so JOIN pickup_points pp ON pp.id = so.pickup_point_id
         JOIN orders o ON o.id = so.order_id
         WHERE pp.market_id = $1 AND so.status IN ('placed','confirmed','ready_for_pickup') AND o.status <> 'pending_payment'`,
        [marketId],
      ),
      this.postgresService.dataSource.query(
        `SELECT s.id, s.name_en AS "nameEn", s.shop_number AS "shopNumber", count(so.id)::int AS orders, COALESCE(sum(so.total), 0)::float AS revenue
         FROM shops s LEFT JOIN shop_orders so ON so.shop_id = s.id AND so.status = 'completed' AND so.completed_at >= date_trunc('month', now())
         WHERE s.market_id = $1 AND s.status = 'active' GROUP BY s.id ORDER BY revenue DESC LIMIT 5`,
        [marketId],
      ),
    ]);
    return {
      market,
      shops: Object.fromEntries(shops.map((r) => [r.status, r.count])),
      ordersToday: orders[0]?.today ?? 0,
      monthOrders: orders[0]?.month_orders ?? 0,
      monthGmv: Number(orders[0]?.month_gmv ?? 0),
      deskWaiting: desk[0]?.waiting ?? 0,
      topShops: top,
    };
  }

  /** The market's shops in walking order: by floor, then position on the floor. */
  async shops(marketId: number, q: CursorQueryDto) {
    const qb = this.postgresService.dataSource
      .getRepository(Shop)
      .createQueryBuilder('s')
      .leftJoin('s.floor', 'f')
      .where('s.market_id = :marketId', { marketId });
    const page = await keysetIds(qb, {
      idExpr: 's.id',
      keys: [
        { expr: 'COALESCE(f.level, 999)', dir: 'ASC', type: 'int' },
        { expr: 'COALESCE(s.walk_order, 999999)', dir: 'ASC', type: 'int' },
      ],
      page: q,
    });
    const found = await this.postgresService.dataSource
      .getRepository(Shop)
      .find({
        where: { id: In(page.ids) },
        relations: { floor: true, primaryCategory: true },
      });
    return toCursorPage(inOrder(page.ids, found), page);
  }

  /** Orders the customer chose to collect at this market's pickup desk, newest first. */
  async deskOrders(
    marketId: number,
    q: CursorQueryDto & { status?: DeskOrderFilter },
  ) {
    const orders = this.postgresService.dataSource.getRepository(ShopOrder);
    const qb = orders
      .createQueryBuilder('so')
      .innerJoin('so.order', 'o')
      .innerJoin('so.pickupPoint', 'pp')
      .where('pp.market_id = :marketId', { marketId })
      .andWhere("o.status <> 'pending_payment'");
    if ((q.status ?? 'active') === 'active')
      qb.andWhere("so.status IN ('placed','confirmed','ready_for_pickup')");
    else if (q.status === 'completed') qb.andWhere("so.status = 'completed'");
    const page = await keysetIds(qb, {
      idExpr: 'so.id',
      keys: [{ expr: 'so.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const found = await orders.find({
      where: { id: In(page.ids) },
      relations: { order: true, shop: true, pickupPoint: true, items: true },
    });
    return toCursorPage(
      inOrder(page.ids, found).map(({ pickupCode: _code, ...so }) => so),
      page,
    );
  }

  async updateProfile(
    marketId: number,
    changes: Partial<
      Pick<
        Market,
        'description' | 'logoUrl' | 'coverUrl' | 'opensAt' | 'closesAt'
      >
    >,
  ) {
    await this.postgresService.dataSource
      .getRepository(Market)
      .update(marketId, changes);
    return this.postgresService.dataSource
      .getRepository(Market)
      .findOneByOrFail({ id: marketId });
  }

  /** The market's team, earliest members first. */
  async members(marketId: number, q: CursorQueryDto) {
    const repo = this.postgresService.dataSource.getRepository(MarketMember);
    const qb = repo
      .createQueryBuilder('mm')
      .where('mm.market_id = :marketId', { marketId });
    const page = await keysetIds(qb, {
      idExpr: 'mm.user_id',
      keys: [{ expr: 'mm.created_at', dir: 'ASC', type: 'timestamptz' }],
      page: q,
    });
    const found = await repo.find({
      where: { marketId, userId: In(page.ids) },
      relations: { user: true },
    });
    return toCursorPage(
      page.ids.flatMap((id) => found.filter((m) => m.userId === id)),
      page,
    );
  }
}
