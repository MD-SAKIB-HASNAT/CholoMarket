import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminOrderQueryDto } from 'src/admin/dto/admin-orders.dto';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import { Order, ShopOrder } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** The pickup code stays with the customer and the shop; the admin team never sees it. */
export type AdminOrderRow = Omit<ShopOrder, 'pickupCode'>;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly postgresService: PostgresService) {}

  /** Shop orders, newest first; filter by status or search by order number / phone. */
  async list(q: AdminOrderQueryDto): Promise<CursorPage<AdminOrderRow>> {
    const repo = this.postgresService.dataSource.getRepository(ShopOrder);
    const filter = repo.createQueryBuilder('so').innerJoin('so.order', 'o');
    if (q.status) filter.andWhere('so.status = :status', { status: q.status });
    if (q.q)
      filter.andWhere('(o.order_no ILIKE :q OR o.contact_phone ILIKE :q)', {
        q: `%${q.q}%`,
      });
    const page = await keysetIds(filter, {
      idExpr: 'so.id',
      keys: [{ expr: 'so.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });

    const rows = await repo
      .createQueryBuilder('so')
      .innerJoinAndSelect('so.order', 'o')
      .innerJoinAndSelect('so.shop', 's')
      .leftJoinAndSelect('s.market', 'm')
      .where('so.id IN (:...ids)', { ids: page.ids.length ? page.ids : [0] })
      .getMany();
    return toCursorPage(
      inOrder(page.ids, rows).map(({ pickupCode: _hidden, ...so }) => so),
      page,
    );
  }

  async detail(orderNo: string): Promise<Order> {
    const order = await this.postgresService.dataSource
      .getRepository(Order)
      .findOne({
        where: { orderNo },
        relations: {
          customer: true,
          shopOrders: { shop: true, items: true, events: { actor: true } },
        },
      });
    if (!order) throw new NotFoundException();
    return order;
  }
}
