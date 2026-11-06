import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Conversation,
  PriceOffer,
  ShopSubscription,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import { In } from 'typeorm';

@Injectable()
export class ShopDashboardService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly ledger: LedgerService,
  ) {}

  async dashboard(shopId: number) {
    const shop = await this.postgresService.shops.findOne({
      where: { id: shopId },
      relations: { market: true, floor: true },
    });
    if (!shop) throw new NotFoundException();
    const q = <T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = [shopId],
    ) => this.postgresService.dataSource.query<T[]>(sql, params);

    const [
      statusRows,
      today,
      month,
      series,
      lowStock,
      openOffers,
      unread,
      productCount,
      balance,
      subscription,
    ] = await Promise.all([
      q<{ status: string; count: number }>(
        `SELECT so.status, count(*)::int AS count FROM shop_orders so JOIN orders o ON o.id = so.order_id
         WHERE so.shop_id = $1 AND o.status <> 'pending_payment' AND so.status IN ('placed','confirmed','ready_for_pickup')
         GROUP BY so.status`,
      ),
      q<{ orders: number }>(
        `SELECT count(*)::int AS orders FROM shop_orders so JOIN orders o ON o.id = so.order_id
         WHERE so.shop_id = $1 AND o.status <> 'pending_payment' AND so.created_at >= date_trunc('day', now())`,
      ),
      q<{ revenue: string; orders: number; commission: string }>(
        `SELECT COALESCE(sum(total), 0) AS revenue, count(*)::int AS orders, COALESCE(sum(commission_total), 0) AS commission
         FROM shop_orders WHERE shop_id = $1 AND status = 'completed' AND completed_at >= date_trunc('month', now())`,
      ),
      q<{ day: string; revenue: string; orders: number }>(
        `SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(sum(so.total), 0) AS revenue, count(so.id)::int AS orders
         FROM generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') d
         LEFT JOIN shop_orders so ON so.shop_id = $1 AND so.status = 'completed' AND date_trunc('day', so.completed_at) = d
         GROUP BY d ORDER BY d`,
      ),
      q(
        `SELECT v.id AS "variantId", p.id AS "productId", p.name_en AS "productName", v.attributes, v.stock_qty AS "stockQty",
                v.available_qty AS "availableQty", v.low_stock_threshold AS "threshold"
         FROM product_variants v JOIN products p ON p.id = v.product_id
         WHERE p.shop_id = $1 AND p.status = 'active' AND v.is_active AND v.available_qty <= v.low_stock_threshold
         ORDER BY v.available_qty ASC LIMIT 10`,
      ),
      this.postgresService.dataSource
        .getRepository(PriceOffer)
        .count({ where: { shopId, status: 'pending' } }),
      this.postgresService.dataSource
        .getRepository(Conversation)
        .sum('shopUnread', { shopId }),
      this.postgresService.dataSource.query<{ count: number }[]>(
        `SELECT count(*)::int AS count FROM products WHERE shop_id = $1 AND status = 'active'`,
        [shopId],
      ),
      this.ledger.balance(shopId),
      this.postgresService.dataSource.getRepository(ShopSubscription).findOne({
        where: { shopId, status: In(['trial', 'active', 'past_due']) },
        relations: { plan: true },
      }),
    ]);

    const byStatus = Object.fromEntries(
      statusRows.map((r) => [r.status, r.count]),
    );
    return {
      shop,
      ordersToday: today[0]?.orders ?? 0,
      pending: {
        placed: byStatus.placed ?? 0,
        confirmed: byStatus.confirmed ?? 0,
        readyForPickup: byStatus.ready_for_pickup ?? 0,
      },
      month: {
        revenue: Number(month[0]?.revenue ?? 0),
        orders: month[0]?.orders ?? 0,
        commission: Number(month[0]?.commission ?? 0),
      },
      series: series.map((s) => ({
        day: s.day,
        revenue: Number(s.revenue),
        orders: s.orders,
      })),
      lowStock,
      openOffers,
      unreadMessages: unread ?? 0,
      productCount: productCount[0]?.count ?? 0,
      balance,
      plan: subscription
        ? {
            code: subscription.plan.code,
            nameEn: subscription.plan.nameEn,
            status: subscription.status,
          }
        : null,
    };
  }
}
