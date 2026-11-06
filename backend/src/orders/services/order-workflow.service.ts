import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessService } from 'src/auth';
import { money } from 'src/common/helper/util';
import {
  OPEN_SHOP_ORDER_STATUSES,
  type ShopOrderStatus,
} from 'src/database/enums';
import {
  Coupon,
  Order,
  OrderItem,
  Payment,
  Refund,
  Shop,
  ShopOrder,
  ShopOrderEvent,
  User,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { InventoryService } from 'src/orders/services/inventory.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { In, LessThan, type EntityManager } from 'typeorm';

export type Action =
  | 'confirm'
  | 'ready'
  | 'complete'
  | 'reject'
  | 'cancel'
  | 'expire'
  | 'ship'
  | 'deliver'
  | 'return';

const PICKUP_ONLY: Action[] = ['ready', 'complete'];
const DELIVERY_ONLY: Action[] = ['ship', 'deliver', 'return'];

const FROM: Record<Action, ShopOrderStatus[]> = {
  confirm: ['placed'],
  ready: ['placed', 'confirmed'],
  complete: ['confirmed', 'ready_for_pickup'],
  reject: ['placed', 'confirmed'],
  cancel: ['placed', 'confirmed'],
  expire: OPEN_SHOP_ORDER_STATUSES,
  ship: ['placed', 'confirmed'],
  deliver: ['shipped'],
  return: ['shipped'],
};
const TO: Record<Action, ShopOrderStatus> = {
  confirm: 'confirmed',
  ready: 'ready_for_pickup',
  complete: 'completed',
  reject: 'rejected',
  cancel: 'cancelled',
  expire: 'expired',
  ship: 'shipped',
  deliver: 'completed',
  return: 'returned',
};
const TERMINAL: ShopOrderStatus[] = [
  'completed',
  'rejected',
  'cancelled',
  'expired',
  'returned',
];

export interface ActionOptions {
  actorId: number | null;
  reason?: string;
  pickupCode?: string;
  /** Courier that collected cash on delivery, e.g. 'steadfast'. */
  courier?: string;
}

/**
 * The shop-order state machine. Shops, market pickup desks, customers and the
 * expiry job all go through `apply`, so stock, payments, refunds and the ledger
 * stay consistent whichever path an order takes.
 */
@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly inventory: InventoryService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly access: AccessService,
  ) {}

  async apply(shopOrderId: number, action: Action, opts: ActionOptions) {
    const outcome = await this.postgresService.dataSource.transaction(
      async (m) => {
        const so = await m
          .createQueryBuilder(ShopOrder, 'so')
          .setLock('pessimistic_write')
          .where('so.id = :id', { id: shopOrderId })
          .getOne();
        if (!so) throw new NotFoundException('Order not found');
        const order = await m.findOneOrFail(Order, {
          where: { id: so.orderId },
        });
        if (
          order.status === 'pending_payment' &&
          action !== 'cancel' &&
          action !== 'expire'
        ) {
          throw new BadRequestException(
            'This order is still waiting for the customer’s payment.',
          );
        }
        if (PICKUP_ONLY.includes(action) && so.fulfillmentType === 'delivery') {
          throw new BadRequestException(
            'This is a home-delivery order: send it with a courier instead.',
          );
        }
        if (
          DELIVERY_ONLY.includes(action) &&
          so.fulfillmentType !== 'delivery'
        ) {
          throw new BadRequestException(
            'Only home-delivery orders go out by courier.',
          );
        }
        if (!FROM[action].includes(so.status)) {
          throw new BadRequestException(
            `Cannot ${action} an order that is ${so.status.replace(/_/g, ' ')}.`,
          );
        }
        if (action === 'complete' && opts.pickupCode !== so.pickupCode) {
          throw new BadRequestException(
            'Wrong pickup code. Ask the customer to show the code in their app.',
          );
        }

        const items = await m.find(OrderItem, {
          where: { shopOrderId: so.id },
        });
        const from = so.status;
        const now = new Date();
        so.status = TO[action];

        if (action === 'confirm') so.confirmedAt = now;
        if (action === 'ready') {
          so.readyAt = now;
          so.confirmedAt ??= now;
        }
        if (action === 'complete')
          await this.complete(m, order, so, items, opts.actorId, {
            sellStock: true,
          });
        if (action === 'ship') {
          // The parcel has left the shop: the hold becomes a sale.
          so.shippedAt = now;
          so.confirmedAt ??= now;
          for (const item of items.filter((i) => i.status === 'active')) {
            await this.inventory.sell(
              m,
              {
                variantId: item.variantId,
                quantity: item.quantity,
                orderItemId: item.id,
              },
              opts.actorId,
            );
          }
        }
        if (action === 'deliver') {
          await this.complete(m, order, so, items, opts.actorId, {
            sellStock: false,
            gateway: opts.courier ?? null,
          });
        }
        if (action === 'return') {
          so.cancelReason = opts.reason ?? 'Returned by courier';
          await this.returnParcel(m, order, so, items, opts.actorId);
        }
        if (action === 'reject' || action === 'cancel' || action === 'expire') {
          so.cancelledAt = now;
          so.cancelReason =
            opts.reason ??
            (action === 'expire' ? 'Not collected in time' : null);
          so.cancelledBy = opts.actorId;
          await this.releaseAndRefund(
            m,
            order,
            so,
            items,
            action,
            opts.actorId,
          );
        }

        await m.save(so);
        await m.insert(ShopOrderEvent, {
          shopOrderId: so.id,
          fromStatus: from,
          toStatus: so.status,
          actorId: opts.actorId,
          note: opts.reason ?? null,
        });
        await this.refreshOrder(m, order);
        return { so, order };
      },
    );

    this.announce(action, outcome.so, outcome.order);
    return outcome.so;
  }

  /** What the customer paid online for this shop's part (goods + delivery charge − cash due). */
  private onlinePortion(so: ShopOrder) {
    return money(so.total + so.deliveryFee - so.cashDue);
  }

  /**
   * Handed over (pickup) or delivered (courier). Cash at the counter is collected by the shop's
   * staff; cash on delivery by the courier, which settles it with the shop's merchant account.
   */
  private async complete(
    m: EntityManager,
    order: Order,
    so: ShopOrder,
    items: OrderItem[],
    actorId: number | null,
    opts: { sellStock: boolean; gateway?: string | null },
  ) {
    so.completedAt = new Date();
    if (opts.sellStock) {
      for (const item of items.filter((i) => i.status === 'active')) {
        await this.inventory.sell(
          m,
          {
            variantId: item.variantId,
            quantity: item.quantity,
            orderItemId: item.id,
          },
          actorId,
        );
      }
    }
    if (so.cashDue > 0) {
      await m.insert(Payment, {
        orderId: order.id,
        shopOrderId: so.id,
        method: 'cash',
        purpose: order.amountPaid > 0 ? 'balance' : 'full',
        amount: so.cashDue,
        status: 'succeeded',
        gateway: opts.gateway ?? null,
        collectedBy: opts.gateway ? null : actorId,
        paidAt: new Date(),
      });
      order.amountPaid = money(order.amountPaid + so.cashDue);
    }

    // Ledger: the platform holds the online part; the shop (or its courier) holds the cash part.
    const onlinePortion = this.onlinePortion(so);
    await this.ledger.add(m, {
      shopId: so.shopId,
      kind: 'sale',
      amount: onlinePortion,
      shopOrderId: so.id,
      description: `Online payment for ${so.subOrderNo}`,
    });
    if (so.discountTotal > 0 && order.couponId) {
      const coupon = await m.findOne(Coupon, { where: { id: order.couponId } });
      if (coupon?.fundedBy !== 'shop') {
        await this.ledger.add(m, {
          shopId: so.shopId,
          kind: 'adjustment',
          amount: so.discountTotal,
          shopOrderId: so.id,
          description: 'Platform-funded coupon',
        });
      }
    }
    await this.ledger.add(m, {
      shopId: so.shopId,
      kind: 'commission',
      amount: -so.commissionTotal,
      shopOrderId: so.id,
      description: `Commission on ${so.subOrderNo}`,
    });
  }

  private async releaseAndRefund(
    m: EntityManager,
    order: Order,
    so: ShopOrder,
    items: OrderItem[],
    action: Action,
    actorId: number | null,
  ) {
    for (const item of items.filter((i) => i.status === 'active')) {
      await this.inventory.release(
        m,
        {
          variantId: item.variantId,
          quantity: item.quantity,
          orderItemId: item.id,
        },
        actorId,
      );
      item.status = 'cancelled';
      await m.save(item);
    }
    if (action === 'expire' && order.status !== 'pending_payment') {
      await m.increment(User, { id: order.customerId }, 'noShowCount', 1);
    }
    if (order.amountPaid <= 0) return;

    const onlinePortion = this.onlinePortion(so);
    if (onlinePortion <= 0) return;
    const payment = await m.findOne(Payment, {
      where: {
        orderId: order.id,
        status: 'succeeded',
        method: In(['bkash', 'nagad', 'card']),
      },
      order: { createdAt: 'ASC' },
    });
    if (!payment) return;

    // A no-show forfeits a deposit: the shop keeps it as compensation.
    if (action === 'expire' && payment.purpose === 'deposit') {
      await this.ledger.add(m, {
        shopId: so.shopId,
        kind: 'sale',
        amount: onlinePortion,
        shopOrderId: so.id,
        description: 'Forfeited deposit (not collected)',
      });
      return;
    }
    await this.refund(
      m,
      order,
      payment,
      onlinePortion,
      so.id,
      `${so.subOrderNo} ${so.status}`,
      actorId,
    );
  }

  /** The courier brought the parcel back: stock returns to the shelf and online payments are refunded. */
  private async returnParcel(
    m: EntityManager,
    order: Order,
    so: ShopOrder,
    items: OrderItem[],
    actorId: number | null,
  ) {
    so.cancelledAt = new Date();
    for (const item of items.filter((i) => i.status === 'active')) {
      await this.inventory.adjust(
        m,
        item.variantId,
        item.quantity,
        'return',
        actorId,
        `Returned parcel ${so.subOrderNo}`,
      );
      item.status = 'returned';
      item.returnedQty = item.quantity;
      await m.save(item);
    }
    const onlinePortion = this.onlinePortion(so);
    if (order.amountPaid <= 0 || onlinePortion <= 0) return;
    const payment = await m.findOne(Payment, {
      where: {
        orderId: order.id,
        status: 'succeeded',
        method: In(['bkash', 'nagad', 'card']),
      },
      order: { createdAt: 'ASC' },
    });
    if (payment)
      await this.refund(
        m,
        order,
        payment,
        onlinePortion,
        so.id,
        `${so.subOrderNo} returned`,
        actorId,
      );
  }

  /** Mock gateway refund: recorded as succeeded. Swap for the bKash/Nagad refund API in production. */
  async refund(
    m: EntityManager,
    order: Order,
    payment: Payment,
    amount: number,
    shopOrderId: number | null,
    reason: string,
    actorId: number | null,
  ) {
    const refund = await m.save(Refund, {
      paymentId: payment.id,
      shopOrderId,
      amount: money(amount),
      reason,
      status: 'succeeded',
      gatewayRefundId: `RF${Date.now()}`,
      processedBy: actorId,
      processedAt: new Date(),
    });
    const refunded = await m
      .createQueryBuilder(Refund, 'r')
      .innerJoin('r.payment', 'p')
      .where('p.order_id = :orderId', { orderId: order.id })
      .andWhere("r.status = 'succeeded'")
      .select('COALESCE(SUM(r.amount), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    order.paymentStatus =
      Number(refunded?.sum ?? 0) >= order.amountPaid
        ? 'refunded'
        : 'partially_refunded';
    return refund;
  }

  /** Roll shop-order statuses up into the customer's order status. */
  private async refreshOrder(m: EntityManager, order: Order) {
    const shopOrders = await m.find(ShopOrder, {
      where: { orderId: order.id },
    });
    const statuses = shopOrders.map((s) => s.status);
    if (statuses.every((s) => TERMINAL.includes(s))) {
      const completed = statuses.filter((s) => s === 'completed').length;
      order.status =
        completed === 0
          ? 'cancelled'
          : completed === statuses.length
            ? 'completed'
            : 'partially_completed';
      // Nothing was collected: give back the pickup fee too.
      if (
        order.status === 'cancelled' &&
        order.pickupFee > 0 &&
        order.amountPaid > 0
      ) {
        const payment = await m.findOne(Payment, {
          where: {
            orderId: order.id,
            status: 'succeeded',
            method: In(['bkash', 'nagad']),
          },
        });
        if (payment)
          await this.refund(
            m,
            order,
            payment,
            order.pickupFee,
            null,
            'Pickup fee',
            null,
          );
      }
    } else if (order.status !== 'pending_payment') {
      order.status = statuses.some((s) =>
        ['confirmed', 'ready_for_pickup', 'shipped', 'completed'].includes(s),
      )
        ? 'in_progress'
        : 'placed';
    }
    if (
      order.amountPaid >= order.grandTotal &&
      order.paymentStatus === 'deposit_paid'
    )
      order.paymentStatus = 'paid';
    if (
      order.amountPaid >= order.grandTotal &&
      order.paymentStatus === 'unpaid'
    )
      order.paymentStatus = 'paid';
    await m.save(order);
  }

  private announce(action: Action, so: ShopOrder, order: Order) {
    const href = `/orders/${order.orderNo}`;
    const messages: Partial<Record<Action, [string, string]>> = {
      confirm: ['Order confirmed', `The shop confirmed ${so.subOrderNo}.`],
      ready: [
        'Ready for pickup',
        `${so.subOrderNo} is ready. Show pickup code ${so.pickupCode} at the counter.`,
      ],
      complete: [
        'Collected — thank you!',
        `How was your experience? Leave a review for ${so.subOrderNo}.`,
      ],
      ship: [
        'Your order is on the way',
        `${so.subOrderNo} has been handed to the courier. Track it from your order page.`,
      ],
      deliver: [
        'Delivered — thank you!',
        `${so.subOrderNo} was delivered. How was it? Leave a review.`,
      ],
      return: [
        'Delivery could not be completed',
        `${so.subOrderNo} was returned to the shop. Any online payment is refunded.`,
      ],
      reject: [
        'Shop could not fulfil your order',
        `${so.subOrderNo}: ${so.cancelReason ?? 'Item unavailable'}. Any online payment is refunded.`,
      ],
      expire: ['Order expired', `${so.subOrderNo} was not collected in time.`],
    };
    const msg = messages[action];
    if (msg) {
      this.notifications.notify({
        userIds: [order.customerId],
        kind: `order_${so.status}`,
        title: msg[0],
        body: msg[1],
        data: { href },
        channels:
          action === 'ready' || action === 'ship'
            ? ['in_app', 'sms']
            : ['in_app'],
      });
    }
    if (action === 'cancel') {
      void this.access.shopMemberIds(so.shopId).then((userIds) =>
        this.notifications.notify({
          userIds,
          kind: 'order_cancelled',
          title: 'Order cancelled by customer',
          body: so.subOrderNo,
          data: { href: `/portal/shop/${so.shopId}/orders` },
        }),
      );
    }
  }

  // ------------------------------------------------------------ helpers for callers

  /** Customer cancels their own shop order. */
  async cancelByCustomer(
    userId: number,
    orderNo: string,
    shopOrderId: number,
    reason?: string,
  ) {
    const so = await this.postgresService.dataSource
      .getRepository(ShopOrder)
      .findOne({ where: { id: shopOrderId }, relations: { order: true } });
    if (!so || so.order.orderNo !== orderNo || so.order.customerId !== userId)
      throw new NotFoundException();
    return this.apply(so.id, 'cancel', {
      actorId: userId,
      reason: reason ?? 'Cancelled by customer',
    });
  }

  /** Market desk staff hand over a desk-pickup order. */
  async completeAtDesk(
    marketId: number,
    shopOrderId: number,
    pickupCode: string,
    actorId: number,
  ) {
    const so = await this.postgresService.dataSource
      .getRepository(ShopOrder)
      .findOne({
        where: { id: shopOrderId },
        relations: { pickupPoint: true },
      });
    if (
      !so ||
      so.fulfillmentType !== 'desk_pickup' ||
      so.pickupPoint?.marketId !== marketId
    ) {
      throw new ForbiddenException('This order is not for your pickup desk.');
    }
    return this.apply(so.id, 'complete', { actorId, pickupCode });
  }

  /** Maintenance: expire reservations past their hold time (and unpaid orders past the payment window). */
  async expireOverdue(): Promise<number> {
    const overdue = await this.postgresService.dataSource
      .getRepository(ShopOrder)
      .find({
        where: {
          status: In(OPEN_SHOP_ORDER_STATUSES),
          reservedUntil: LessThan(new Date()),
        },
        select: { id: true },
        take: 500,
      });
    let count = 0;
    for (const { id } of overdue) {
      try {
        await this.apply(id, 'expire', { actorId: null });
        count++;
      } catch {
        // Changed state since we read it; next run will see the truth.
      }
    }
    return count;
  }

  async shopOfOrder(shopOrderId: number) {
    const so = await this.postgresService.dataSource
      .getRepository(ShopOrder)
      .findOne({ where: { id: shopOrderId }, relations: { shop: true } });
    return so?.shop as Shop | undefined;
  }
}
