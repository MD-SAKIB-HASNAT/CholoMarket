import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  addHours,
  maskPhone,
  money,
  normalizeBdPhone,
  randomCode,
} from 'src/common/helper/util';
import { OPEN_SHOP_ORDER_STATUSES } from 'src/database/enums';
import {
  Order,
  Payment,
  PaymentWebhookEvent,
  ShopOrder,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { CheckoutService } from 'src/orders/services/checkout.service';

/**
 * Payment flow (bKash / Nagad). In development a mock gateway page stands in
 * for the wallet: the frontend's /pay/:id page calls `mockComplete`.
 * In production, `start` would call bKash "create payment" and redirect to
 * its URL; the gateway callback then calls `settle` with the verified result.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly checkout: CheckoutService,
  ) {}

  async forCustomer(paymentId: number, userId: number) {
    const payment = await this.postgresService.dataSource
      .getRepository(Payment)
      .findOne({ where: { id: paymentId }, relations: { order: true } });
    if (!payment || payment.order.customerId !== userId)
      throw new NotFoundException();
    return {
      id: payment.id,
      method: payment.method,
      purpose: payment.purpose,
      amount: payment.amount,
      status: payment.status,
      order: {
        orderNo: payment.order.orderNo,
        grandTotal: payment.order.grandTotal,
        status: payment.order.status,
      },
    };
  }

  /** New payment attempt for an order still waiting for payment (after a failed try). */
  async retry(orderNo: string, userId: number, method: 'bkash' | 'nagad') {
    const order = await this.postgresService.dataSource
      .getRepository(Order)
      .findOne({ where: { orderNo, customerId: userId } });
    if (!order) throw new NotFoundException();
    if (order.status !== 'pending_payment')
      throw new BadRequestException('This order does not need payment.');
    const payment = await this.postgresService.dataSource
      .getRepository(Payment)
      .save({
        orderId: order.id,
        method,
        purpose: order.amountDueOnline >= order.grandTotal ? 'full' : 'deposit',
        amount: order.amountDueOnline,
        status: 'initiated',
        gateway: method,
      });
    return { id: payment.id, amount: payment.amount, method: payment.method };
  }

  async mockComplete(
    paymentId: number,
    userId: number,
    success: boolean,
    walletNumber?: string,
  ) {
    const payment = await this.postgresService.dataSource
      .getRepository(Payment)
      .findOne({ where: { id: paymentId }, relations: { order: true } });
    if (!payment || payment.order.customerId !== userId)
      throw new NotFoundException();
    return this.settle(paymentId, {
      eventId: `mock-${paymentId}-${randomUUID()}`,
      success,
      trxId: success ? `MOCK${randomCode(8)}` : undefined,
      payerAccount: walletNumber
        ? maskPhone(normalizeBdPhone(walletNumber))
        : undefined,
      raw: { mock: true, success },
    });
  }

  /** Idempotent: a repeated gateway callback for the same event changes nothing. */
  async settle(
    paymentId: number,
    result: {
      eventId: string;
      success: boolean;
      trxId?: string;
      payerAccount?: string;
      raw: Record<string, any>;
    },
  ) {
    const outcome = await this.postgresService.dataSource.transaction(
      async (m) => {
        const payment = await m
          .createQueryBuilder(Payment, 'p')
          .setLock('pessimistic_write')
          .where('p.id = :id', { id: paymentId })
          .getOne();
        if (!payment) throw new NotFoundException();
        const inserted = await m
          .createQueryBuilder()
          .insert()
          .into(PaymentWebhookEvent)
          .values({
            gateway: payment.gateway ?? payment.method,
            eventId: result.eventId,
            payload: result.raw,
            processedAt: new Date(),
          })
          .orIgnore()
          .execute();
        if (!inserted.identifiers.length || payment.status === 'succeeded')
          return { payment, placed: false, shopIds: [] as number[] };
        if (!['initiated', 'pending'].includes(payment.status))
          throw new BadRequestException('This payment was already closed.');

        const order = await m
          .createQueryBuilder(Order, 'o')
          .setLock('pessimistic_write')
          .where('o.id = :id', { id: payment.orderId })
          .getOneOrFail();
        if (!result.success) {
          payment.status = 'failed';
          payment.gatewayResponse = result.raw;
          await m.save(payment);
          return { payment, placed: false, shopIds: [] };
        }
        if (order.status !== 'pending_payment') {
          // Paid after the order was cancelled (payment window passed): record it, then refund manually.
          payment.status = 'succeeded';
          payment.gatewayTrxId = result.trxId ?? null;
          payment.paidAt = new Date();
          await m.save(payment);
          return { payment, placed: false, shopIds: [] };
        }

        payment.status = 'succeeded';
        payment.gatewayTrxId = result.trxId ?? null;
        payment.payerAccount = result.payerAccount ?? null;
        payment.gatewayResponse = result.raw;
        payment.paidAt = new Date();
        await m.save(payment);

        order.amountPaid = money(order.amountPaid + payment.amount);
        order.paymentStatus =
          order.amountPaid >= order.grandTotal ? 'paid' : 'deposit_paid';
        order.status = 'placed';
        order.placedAt = new Date();
        await m.save(order);

        // Payment done: now hold the items for the shop's normal reservation time.
        const shopOrders = await m.find(ShopOrder, {
          where: { orderId: order.id },
          relations: { shop: true },
        });
        for (const so of shopOrders) {
          if (OPEN_SHOP_ORDER_STATUSES.includes(so.status)) {
            // Delivery orders don't expire once paid: the shop ships them.
            await m.update(ShopOrder, so.id, {
              reservedUntil:
                so.fulfillmentType === 'delivery'
                  ? null
                  : addHours(new Date(), so.shop.reservationHours),
            });
          }
        }
        return {
          payment,
          placed: true,
          shopIds: shopOrders.map((s) => s.shopId),
          orderNo: order.orderNo,
        };
      },
    );

    if (outcome.placed && 'orderNo' in outcome)
      await this.checkout.announceNewOrder(outcome.orderNo!, outcome.shopIds);
    return {
      id: outcome.payment.id,
      status: outcome.payment.status,
      trxId: outcome.payment.gatewayTrxId,
    };
  }
}
