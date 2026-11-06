import { Injectable } from '@nestjs/common';
import { ShopVerification } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** Numbers for the admin team: the dashboard and what customers search for. */
@Injectable()
export class AdminInsightsService {
  constructor(private readonly postgresService: PostgresService) {}

  async dashboard() {
    const one = async <T>(sql: string) =>
      (await this.postgresService.dataSource.query<T[]>(sql))[0];
    const [
      counts,
      orders,
      series,
      pendingVerifications,
      zeroResults,
      topCategories,
    ] = await Promise.all([
      one<Record<string, number>>(`SELECT
          (SELECT count(*) FROM markets WHERE status = 'active')::int AS markets,
          (SELECT count(*) FROM shops WHERE status = 'active')::int AS shops,
          (SELECT count(*) FROM shops WHERE status = 'pending')::int AS "pendingShops",
          (SELECT count(*) FROM products WHERE status = 'active')::int AS products,
          (SELECT count(*) FROM users)::int AS users`),
      one<Record<string, string | number>>(`SELECT
          count(*) FILTER (WHERE o.created_at >= date_trunc('day', now()) AND o.status <> 'pending_payment')::int AS "ordersToday",
          count(*) FILTER (WHERE o.created_at >= date_trunc('month', now()) AND o.status <> 'pending_payment')::int AS "ordersMonth",
          COALESCE(sum(o.grand_total) FILTER (WHERE o.status IN ('completed','partially_completed') AND o.created_at >= date_trunc('month', now())), 0) AS "gmvMonth"
        FROM orders o`),
      this.postgresService.dataSource.query<
        { day: string; gmv: string; orders: number }[]
      >(`
        SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(sum(so.total), 0) AS gmv, count(so.id)::int AS orders
        FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d
        LEFT JOIN shop_orders so ON so.status = 'completed' AND date_trunc('day', so.completed_at) = d
        GROUP BY d ORDER BY d`),
      this.postgresService.dataSource
        .getRepository(ShopVerification)
        .count({ where: { status: 'pending' } }),
      this.postgresService.dataSource
        .query(`SELECT query, count(*)::int AS searches FROM search_queries
        WHERE results_count = 0 AND created_at > now() - interval '30 days'
        GROUP BY query ORDER BY searches DESC LIMIT 10`),
      this.postgresService.dataSource
        .query(`SELECT c.name_en AS "nameEn", COALESCE(sum(oi.line_total), 0)::float AS gmv
        FROM order_items oi JOIN shop_orders so ON so.id = oi.shop_order_id AND so.status = 'completed'
        JOIN categories c ON c.id = oi.category_id GROUP BY c.id ORDER BY gmv DESC LIMIT 6`),
    ]);
    const commission = await one<{ commission: string }>(
      `SELECT COALESCE(-sum(amount), 0) AS commission FROM shop_ledger_entries WHERE kind = 'commission' AND created_at >= date_trunc('month', now())`,
    );
    return {
      ...counts,
      ordersToday: Number(orders.ordersToday),
      ordersMonth: Number(orders.ordersMonth),
      gmvMonth: Number(orders.gmvMonth),
      commissionMonth: Number(commission.commission),
      pendingVerifications,
      series: series.map((s) => ({
        day: s.day,
        gmv: Number(s.gmv),
        orders: s.orders,
      })),
      zeroResultSearches: zeroResults,
      topCategories,
    };
  }

  /** The 25 most searched words of the last 30 days, and the 25 that found nothing. */
  async searchInsights() {
    const [top, zero] = await Promise.all([
      this.postgresService.dataSource
        .query(`SELECT lower(query) AS query, count(*)::int AS searches, round(avg(results_count))::int AS "avgResults"
        FROM search_queries WHERE created_at > now() - interval '30 days' GROUP BY lower(query) ORDER BY searches DESC LIMIT 25`),
      this.postgresService.dataSource
        .query(`SELECT lower(query) AS query, count(*)::int AS searches
        FROM search_queries WHERE results_count = 0 AND created_at > now() - interval '30 days'
        GROUP BY lower(query) ORDER BY searches DESC LIMIT 25`),
    ]);
    return { top, zero };
  }
}
