import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessService } from 'src/auth';
import { money } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
  type SortKey,
} from 'src/common/pagination';
import { shipmentsFor } from 'src/courier/helpers/present';
import type { ShopOrderStatus } from 'src/database/enums';
import {
  InventoryMovement,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductVariant,
  Refund,
  ReturnItem,
  ReturnRequest,
  Shop,
  ShopOrderEvent,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type {
  CreateReturnDto,
  CreateReviewDto,
} from 'src/orders/dto/orders.dto';
import { LedgerService } from 'src/orders/services/ledger.service';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import {
  In,
  type FindOptionsRelations,
  type SelectQueryBuilder,
} from 'typeorm';

/** Newest first; the id breaks ties (every list below uses it with `tieDir: 'DESC'`). */
const newest = (alias: string): SortKey[] => [
  { expr: `${alias}.created_at`, dir: 'DESC', type: 'timestamptz' },
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly workflow: OrderWorkflowService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly access: AccessService,
  ) {}

  // ------------------------------------------------------------ customer

  async listForCustomer(
    userId: number,
    q: CursorQueryDto,
  ): Promise<CursorPage<Order>> {
    const qb = this.postgresService.orders
      .createQueryBuilder('o')
      .where('o.customer_id = :userId', { userId });
    const page = await keysetIds(qb, {
      idExpr: 'o.id',
      keys: newest('o'),
      tieDir: 'DESC',
      page: q,
    });
    const orders = await this.postgresService.orders.find({
      where: { id: In(page.ids) },
      relations: { shopOrders: { shop: true, items: true } },
    });
    return toCursorPage(inOrder(page.ids, orders), page);
  }

  async detailForCustomer(userId: number, orderNo: string) {
    const order = await this.postgresService.orders.findOne({
      where: { orderNo, customerId: userId },
      relations: {
        shopOrders: {
          shop: { market: true, floor: true },
          items: true,
          pickupPoint: { floor: true },
          events: true,
        },
        coupon: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    const [payments, refunds, reviews, returns] = await Promise.all([
      this.postgresService.dataSource
        .getRepository(Payment)
        .find({ where: { orderId: order.id }, order: { createdAt: 'ASC' } }),
      this.postgresService.dataSource
        .getRepository(Refund)
        .createQueryBuilder('r')
        .innerJoin('r.payment', 'p')
        .where('p.order_id = :id', { id: order.id })
        .getMany(),
      this.postgresService.reviews.find({
        where: { userId, shopOrderId: In(order.shopOrders.map((s) => s.id)) },
      }),
      this.postgresService.returnRequests.find({
        where: {
          customerId: userId,
          shopOrderId: In(order.shopOrders.map((s) => s.id)),
        },
        relations: { items: true },
      }),
    ]);
    order.shopOrders.sort((a, b) => a.subOrderNo.localeCompare(b.subOrderNo));
    for (const so of order.shopOrders)
      so.events.sort((a, b) => +a.createdAt - +b.createdAt);
    const shipments = await shipmentsFor(
      this.postgresService.dataSource,
      order.shopOrders.map((s) => s.id),
    );
    const shopOrders = order.shopOrders.map((so) => ({
      ...so,
      shipment: shipments.get(so.id) ?? null,
    }));
    return { ...order, shopOrders, payments, refunds, reviews, returns };
  }

  // ------------------------------------------------------------ shop side

  async listForShop(
    shopId: number,
    q: CursorQueryDto & { status?: ShopOrderStatus | 'active' },
  ) {
    const qb = this.postgresService.shopOrders
      .createQueryBuilder('so')
      .innerJoin('so.order', 'o')
      .where('so.shop_id = :shopId', { shopId })
      .andWhere("o.status <> 'pending_payment'");
    if (q.status === 'active')
      qb.andWhere(
        "so.status IN ('placed', 'confirmed', 'ready_for_pickup', 'shipped')",
      );
    else if (q.status) qb.andWhere('so.status = :status', { status: q.status });
    const page = await keysetIds(qb, {
      idExpr: 'so.id',
      keys: newest('so'),
      tieDir: 'DESC',
      page: q,
    });

    const found = await this.postgresService.shopOrders.find({
      where: { id: In(page.ids) },
      relations: { order: true, items: true, pickupPoint: true },
    });
    const orders = inOrder(page.ids, found);
    const shipments = await shipmentsFor(
      this.postgresService.dataSource,
      page.ids,
    );
    // The pickup code is the customer's proof of purchase; never send it to the shop.
    return toCursorPage(
      orders.map(({ pickupCode: _code, ...so }) => ({
        ...so,
        shipment: shipments.get(so.id) ?? null,
      })),
      page,
    );
  }

  async shopOrderDetail(shopId: number, shopOrderId: number) {
    const so = await this.postgresService.shopOrders.findOne({
      where: { id: shopOrderId, shopId },
      relations: {
        order: { customer: true },
        items: true,
        pickupPoint: true,
        events: { actor: true },
      },
    });
    if (!so) throw new NotFoundException();
    so.events.sort((a, b) => +a.createdAt - +b.createdAt);
    const { pickupCode: _code, ...rest } = so;
    const shipment =
      (await shipmentsFor(this.postgresService.dataSource, [so.id])).get(
        so.id,
      ) ?? null;
    return {
      ...rest,
      shipment,
      customer: {
        id: so.order.customer.id,
        fullName: so.order.contactName,
        phone: so.order.contactPhone,
        noShowCount: so.order.customer.noShowCount,
      },
    };
  }

  // ------------------------------------------------------------ reviews

  async createReview(userId: number, dto: CreateReviewDto) {
    const so = await this.postgresService.shopOrders.findOne({
      where: { id: dto.shopOrderId },
      relations: { order: true, items: true },
    });
    if (!so || so.order.customerId !== userId)
      throw new NotFoundException('Order not found');
    if (so.status !== 'completed')
      throw new BadRequestException(
        'You can review after collecting your order.',
      );
    if (dto.productId && !so.items.some((i) => i.productId === dto.productId)) {
      throw new BadRequestException('That product is not part of this order.');
    }
    // Mirrors the UQ_reviews_one_per_target index: one review per (shop order, product or shop).
    const duplicate = await this.postgresService.reviews
      .createQueryBuilder('r')
      .where('r.shop_order_id = :so AND coalesce(r.product_id, 0) = :p', {
        so: so.id,
        p: dto.productId ?? 0,
      })
      .getExists();
    if (duplicate)
      throw new BadRequestException('You have already reviewed this.');
    const review = await this.postgresService.reviews.save({
      userId,
      shopId: so.shopId,
      productId: dto.productId ?? null,
      shopOrderId: so.id,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    await this.refreshRatings(so.shopId, dto.productId);
    return review;
  }

  async refreshRatings(shopId: number, productId?: number | null) {
    await this.postgresService.dataSource.query(
      `UPDATE shops SET rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM reviews WHERE shop_id = $1 AND product_id IS NULL AND status = 'published'), 0),
              rating_count = (SELECT count(*) FROM reviews WHERE shop_id = $1 AND product_id IS NULL AND status = 'published') WHERE id = $1`,
      [shopId],
    );
    if (productId) {
      await this.postgresService.dataSource.query(
        `UPDATE products SET rating_avg = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND status = 'published'), 0),
                rating_count = (SELECT count(*) FROM reviews WHERE product_id = $1 AND status = 'published') WHERE id = $1`,
        [productId],
      );
    }
  }

  async listReviews(
    filter: { shopId?: number; productId?: number },
    q: CursorQueryDto,
  ) {
    if (!filter.shopId && !filter.productId)
      throw new BadRequestException('Pass shopId or productId.');
    const qb = this.postgresService.reviews
      .createQueryBuilder('r')
      .where("r.status = 'published'");
    if (filter.shopId)
      qb.andWhere('r.shop_id = :shopId', { shopId: filter.shopId });
    if (filter.productId)
      qb.andWhere('r.product_id = :productId', { productId: filter.productId });
    const page = await keysetIds(qb, {
      idExpr: 'r.id',
      keys: newest('r'),
      tieDir: 'DESC',
      page: q,
    });

    const found = await this.postgresService.reviews.find({
      where: { id: In(page.ids) },
      relations: { user: true, product: true },
    });
    return toCursorPage(
      inOrder(page.ids, found).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        shopReply: r.shopReply,
        createdAt: r.createdAt,
        productId: r.productId,
        productName: r.product?.nameEn ?? null,
        author: r.user.fullName ? r.user.fullName.split(' ')[0] : 'Customer',
      })),
      page,
    );
  }

  async replyToReview(shopId: number, reviewId: number, reply: string) {
    const review = await this.postgresService.reviews.findOne({
      where: { id: reviewId, shopId },
    });
    if (!review) throw new NotFoundException();
    review.shopReply = reply;
    review.shopRepliedAt = new Date();
    return this.postgresService.reviews.save(review);
  }

  // ------------------------------------------------------------ returns

  async createReturn(userId: number, dto: CreateReturnDto) {
    const so = await this.postgresService.shopOrders.findOne({
      where: { id: dto.shopOrderId },
      relations: { order: true, items: true, shop: true },
    });
    if (!so || so.order.customerId !== userId)
      throw new NotFoundException('Order not found');
    if (so.status !== 'completed' || !so.completedAt)
      throw new BadRequestException('Only collected orders can be returned.');
    const deadline = new Date(
      so.completedAt.getTime() + so.shop.returnWindowDays * 86_400_000,
    );
    if (new Date() > deadline && dto.reason !== 'warranty_claim') {
      throw new BadRequestException(
        `The return window (${so.shop.returnWindowDays} days) has passed.`,
      );
    }
    if (
      await this.postgresService.returnRequests.exists({
        where: {
          shopOrderId: so.id,
          status: In(['requested', 'approved', 'item_received']),
        },
      })
    ) {
      throw new BadRequestException(
        'There is already an open return for this order.',
      );
    }
    for (const line of dto.items) {
      const item = so.items.find((i) => i.id === line.orderItemId);
      if (!item || line.quantity > item.quantity - item.returnedQty)
        throw new BadRequestException('Invalid return quantity.');
    }
    const request = await this.postgresService.dataSource.transaction(
      async (m) => {
        const r = await m.save(ReturnRequest, {
          shopOrderId: so.id,
          customerId: userId,
          reason: dto.reason,
          details: dto.details ?? null,
          photoUrls: dto.photoUrls ?? [],
        });
        await m.insert(
          ReturnItem,
          dto.items.map((i) => ({
            returnRequestId: r.id,
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        );
        return r;
      },
    );
    this.notifications.notify({
      userIds: await this.access.shopMemberIds(so.shopId),
      kind: 'return_requested',
      title: 'Return requested',
      body: `${so.subOrderNo}: ${dto.reason.replace(/_/g, ' ')}`,
      data: { href: `/portal/shop/${so.shopId}/returns` },
    });
    return request;
  }

  async customerReturns(
    userId: number,
    q: CursorQueryDto,
  ): Promise<CursorPage<ReturnRequest>> {
    const qb = this.postgresService.returnRequests
      .createQueryBuilder('r')
      .where('r.customer_id = :userId', { userId });
    return this.returnsPage(qb, q, {
      shopOrder: { shop: true },
      items: { orderItem: true },
    });
  }

  async shopReturns(
    shopId: number,
    q: CursorQueryDto,
  ): Promise<CursorPage<ReturnRequest>> {
    const qb = this.postgresService.returnRequests
      .createQueryBuilder('r')
      .innerJoin('r.shopOrder', 'so')
      .where('so.shop_id = :shopId', { shopId });
    return this.returnsPage(qb, q, {
      shopOrder: true,
      customer: true,
      items: { orderItem: true },
    });
  }

  /** One page of returns, newest first, loaded with the relations the caller's screen needs. */
  private async returnsPage(
    qb: SelectQueryBuilder<ReturnRequest>,
    q: CursorQueryDto,
    relations: FindOptionsRelations<ReturnRequest>,
  ) {
    const page = await keysetIds(qb, {
      idExpr: 'r.id',
      keys: newest('r'),
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.returnRequests.find({
      where: { id: In(page.ids) },
      relations,
    });
    return toCursorPage(inOrder(page.ids, found), page);
  }

  /**
   * approve -> item_received -> resolved (refund: money back + restock),
   * or reject. Refunds come out of the shop's ledger balance.
   */
  async respondToReturn(
    shopId: number,
    returnId: number,
    userId: number,
    action: 'approve' | 'reject' | 'receive' | 'resolve',
    resolution?: 'refund' | 'exchange' | 'store_credit' | 'repair',
    note?: string,
  ) {
    const result = await this.postgresService.dataSource.transaction(
      async (m) => {
        const r = await m.findOne(ReturnRequest, {
          where: { id: returnId },
          relations: { shopOrder: { order: true }, items: { orderItem: true } },
        });
        if (!r || r.shopOrder.shopId !== shopId) throw new NotFoundException();
        const allowed: Record<typeof action, string[]> = {
          approve: ['requested'],
          reject: ['requested', 'approved'],
          receive: ['approved'],
          resolve: ['approved', 'item_received'],
        };
        if (!allowed[action].includes(r.status))
          throw new BadRequestException(
            `Cannot ${action} a return that is ${r.status}.`,
          );
        r.reviewedBy = userId;
        r.reviewedAt = new Date();
        r.shopNote = note ?? r.shopNote;
        if (action === 'approve') {
          r.status = 'approved';
          r.resolution = resolution ?? 'refund';
        } else if (action === 'reject') r.status = 'rejected';
        else if (action === 'receive') r.status = 'item_received';
        else {
          r.status = 'resolved';
          r.resolution = resolution ?? r.resolution ?? 'refund';
          let amount = 0;
          for (const ri of r.items) {
            const oi = ri.orderItem;
            oi.returnedQty += ri.quantity;
            oi.status =
              oi.returnedQty >= oi.quantity ? 'returned' : 'partially_returned';
            await m.save(OrderItem, oi);
            await m
              .createQueryBuilder()
              .update(ProductVariant)
              .set({
                stockQty: () => `stock_qty + ${ri.quantity}`,
                stockUpdatedAt: () => 'now()',
              })
              .where('id = :id', { id: oi.variantId })
              .execute();
            await m.insert(InventoryMovement, {
              variantId: oi.variantId,
              stockChange: ri.quantity,
              reason: 'return',
              orderItemId: oi.id,
              createdBy: userId,
            });
            amount += oi.unitPrice * ri.quantity;
          }
          if (r.resolution === 'refund' && amount > 0) {
            const order = r.shopOrder.order;
            const payment =
              (await m.findOne(Payment, {
                where: {
                  orderId: order.id,
                  status: 'succeeded',
                  method: In(['bkash', 'nagad']),
                },
              })) ??
              (await m.findOne(Payment, {
                where: { orderId: order.id, status: 'succeeded' },
              }));
            if (payment) {
              const refund = await this.workflow.refund(
                m,
                order,
                payment,
                money(amount),
                r.shopOrderId,
                `Return #${r.id}`,
                userId,
              );
              refund.returnRequestId = r.id;
              await m.save(refund);
              await m.save(order);
              await this.ledger.add(m, {
                shopId,
                kind: 'refund',
                amount: -amount,
                shopOrderId: r.shopOrderId,
                refundId: refund.id,
                description: `Return #${r.id}`,
              });
            }
          }
        }
        await m.save(ReturnRequest, r);
        return r;
      },
    );
    this.notifications.notify({
      userIds: [result.customerId],
      kind: `return_${result.status}`,
      title: `Return ${result.status.replace(/_/g, ' ')}`,
      body: note ?? undefined,
      data: { href: '/orders' },
    });
    return result;
  }

  async shopProductIds(shopId: number) {
    const rows = await this.postgresService.dataSource
      .getRepository(Product)
      .find({ where: { shopId }, select: { id: true } });
    return rows.map((r) => r.id);
  }

  shopEvents(shopOrderId: number) {
    return this.postgresService.dataSource
      .getRepository(ShopOrderEvent)
      .find({ where: { shopOrderId }, order: { createdAt: 'ASC' } });
  }

  shopById(id: number) {
    return this.postgresService.dataSource
      .getRepository(Shop)
      .findOne({ where: { id } });
  }
}
