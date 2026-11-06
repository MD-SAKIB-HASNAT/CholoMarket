import { BadRequestException, Injectable } from '@nestjs/common';
import { AccessService } from 'src/auth';
import { usableOffer, variantLabel } from 'src/cart/services/cart.service';
import {
  addHours,
  addMinutes,
  makeOrderNo,
  money,
  normalizeBdPhone,
  randomDigits,
  subOrderSuffix,
} from 'src/common/helper/util';
import type {
  DeliveryZone,
  FulfillmentType,
  PaymentMethod,
} from 'src/database/enums';
import {
  Cart,
  CartItem,
  Coupon,
  CouponRedemption,
  Order,
  OrderItem,
  Payment,
  PickupPoint,
  PriceOffer,
  Product,
  ProductVariant,
  Shop,
  ShopOrder,
  ShopOrderEvent,
  User,
  UserAddress,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type { AddressInputDto, CheckoutDto } from 'src/orders/dto/orders.dto';
import { InventoryService } from 'src/orders/services/inventory.service';
import { CommissionService } from 'src/platform/services/commission.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { SettingsService } from 'src/platform/services/settings.service';
import { In, type EntityManager } from 'typeorm';

interface Line {
  cartItem: CartItem;
  variant: ProductVariant;
  product: Product;
  unitPrice: number;
  lineTotal: number;
  offerId: number | null;
  commissionRate: number;
}

interface ShopGroup {
  shop: Shop;
  lines: Line[];
  subtotal: number;
  discount: number;
  total: number;
  deliveryFee: number;
  onlinePortion: number;
  fulfillmentType: FulfillmentType;
  pickupPointId: number | null;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly inventory: InventoryService,
    private readonly commission: CommissionService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly access: AccessService,
  ) {}

  /**
   * Turns the cart into one order (what the customer pays) split into one
   * shop order per shop (what each shop fulfils). Stock is locked, checked and
   * reserved in the same transaction, so two customers can never buy the last item.
   */
  async checkout(userId: number, dto: CheckoutDto) {
    const contactPhone = normalizeBdPhone(dto.contactPhone);
    const isOnline = dto.paymentMethod !== 'cash';
    const [
      pickupFee,
      paymentWindow,
      noShowThreshold,
      noShowPercent,
      feeInside,
      feeOutside,
    ] = await Promise.all([
      this.settings.get('pickup_fee'),
      this.settings.get('payment_window_minutes'),
      this.settings.get('no_show_deposit_threshold'),
      this.settings.get('no_show_deposit_percent'),
      this.settings.get('delivery_fee_inside_dhaka'),
      this.settings.get('delivery_fee_outside_dhaka'),
    ]);

    const result = await this.postgresService.dataSource.transaction(
      async (m) => {
        const user = await m.findOneOrFail(User, { where: { id: userId } });
        const cart = await m.findOne(Cart, { where: { userId } });
        const cartItems = cart
          ? await m.find(CartItem, {
              where: { cartId: cart.id },
              relations: { offer: true },
            })
          : [];
        if (!cartItems.length)
          throw new BadRequestException('Your cart is empty.');

        // Lock the variants so concurrent checkouts queue up behind us.
        const variants = await m
          .createQueryBuilder(ProductVariant, 'v')
          .setLock('pessimistic_write')
          .where('v.id IN (:...ids)', {
            ids: cartItems.map((i) => i.variantId),
          })
          .getMany();
        const variantById = new Map(variants.map((v) => [v.id, v]));
        const products = await m.find(Product, {
          where: { id: In(variants.map((v) => v.productId)) },
          relations: { shop: true, images: true },
        });
        const productById = new Map(products.map((p) => [p.id, p]));

        const now = new Date();
        const lines: Line[] = cartItems.map((ci) => {
          const variant = variantById.get(ci.variantId);
          const product = variant && productById.get(variant.productId);
          if (
            !variant ||
            !product ||
            !variant.isActive ||
            product.status !== 'active' ||
            product.shop.status !== 'active'
          ) {
            throw new BadRequestException(
              'Some items are no longer available. Please review your cart.',
            );
          }
          if (variant.availableQty < ci.quantity) {
            throw new BadRequestException(
              `Only ${variant.availableQty} left of ${product.nameEn}. Please update your cart.`,
            );
          }
          let unitPrice = variant.price;
          let offerId: number | null = null;
          if (ci.offerId) {
            if (!usableOffer(ci.offer, userId, variant.id, now)) {
              throw new BadRequestException(
                `Your bargained price for ${product.nameEn} has expired.`,
              );
            }
            if (ci.quantity > ci.offer!.quantity) {
              throw new BadRequestException(
                `Your offer for ${product.nameEn} covers ${ci.offer!.quantity} item(s).`,
              );
            }
            unitPrice = ci.offer!.finalPrice!;
            offerId = ci.offerId;
          }
          return {
            cartItem: ci,
            variant,
            product,
            unitPrice,
            lineTotal: money(unitPrice * ci.quantity),
            offerId,
            commissionRate: 0,
          };
        });

        const rates = await this.commission.ratesFor(
          lines.map((l) => ({
            shopId: l.product.shopId,
            marketId: l.product.shop.marketId,
            categoryId: l.product.categoryId,
          })),
          now,
        );
        lines.forEach((l, i) => (l.commissionRate = rates[i]));

        // Group by shop and apply the customer's pickup choice per shop.
        const groups = new Map<number, ShopGroup>();
        for (const line of lines) {
          const shop = line.product.shop;
          const g = groups.get(shop.id) ?? {
            shop,
            lines: [],
            subtotal: 0,
            discount: 0,
            total: 0,
            deliveryFee: 0,
            onlinePortion: 0,
            fulfillmentType: 'shop_pickup' as FulfillmentType,
            pickupPointId: null,
          };
          g.lines.push(line);
          g.subtotal = money(g.subtotal + line.lineTotal);
          groups.set(shop.id, g);
        }
        // Home delivery: one address for the whole order, one parcel (and charge) per shop.
        const wantsDelivery = (dto.shops ?? []).some(
          (c) => c.fulfillmentType === 'delivery' && groups.has(c.shopId),
        );
        const address = wantsDelivery
          ? await this.resolveAddress(m, userId, dto)
          : null;
        for (const choice of dto.shops ?? []) {
          const g = groups.get(choice.shopId);
          if (!g) continue;
          if (choice.fulfillmentType === 'delivery') {
            if (!g.shop.offersDelivery) {
              throw new BadRequestException(
                `${g.shop.nameEn} does not deliver yet. Choose pickup for this shop.`,
              );
            }
            g.fulfillmentType = 'delivery';
            g.deliveryFee = Number(
              address!.zone === 'inside_dhaka' ? feeInside : feeOutside,
            );
            continue;
          }
          if (choice.fulfillmentType !== 'desk_pickup') continue;
          const desk = choice.pickupPointId
            ? await m.findOne(PickupPoint, {
                where: { id: choice.pickupPointId, isActive: true },
              })
            : null;
          if (!desk || desk.marketId !== g.shop.marketId) {
            throw new BadRequestException(
              `Choose a pickup desk in ${g.shop.nameEn}'s market.`,
            );
          }
          g.fulfillmentType = 'desk_pickup';
          g.pickupPointId = desk.id;
        }

        // Coupon.
        const subtotal = money(
          [...groups.values()].reduce((s, g) => s + g.subtotal, 0),
        );
        const coupon = dto.couponCode
          ? await this.validateCoupon(
              m,
              dto.couponCode,
              userId,
              [...groups.values()],
              now,
            )
          : null;
        let discountTotal = 0;
        if (coupon) {
          const eligible = [...groups.values()].filter(
            (g) =>
              (!coupon.shopId || g.shop.id === coupon.shopId) &&
              (!coupon.marketId || g.shop.marketId === coupon.marketId),
          );
          const eligibleTotal = eligible.reduce((s, g) => s + g.subtotal, 0);
          if (eligibleTotal < coupon.minOrderTotal) {
            throw new BadRequestException(
              `Coupon needs a minimum of ৳${coupon.minOrderTotal}.`,
            );
          }
          discountTotal =
            coupon.discountType === 'percent'
              ? money((eligibleTotal * coupon.discountValue) / 100)
              : coupon.discountValue;
          if (coupon.maxDiscount !== null)
            discountTotal = Math.min(discountTotal, coupon.maxDiscount);
          discountTotal = money(Math.min(discountTotal, eligibleTotal));
          // Spread the discount over eligible shops pro-rata; the last one absorbs rounding.
          let left = discountTotal;
          eligible.forEach((g, i) => {
            g.discount =
              i === eligible.length - 1
                ? left
                : money((discountTotal * g.subtotal) / eligibleTotal);
            left = money(left - g.discount);
          });
        }

        // How much must be paid online per shop: everything (wallet), or a deposit (cash at
        // pickup / cash on delivery). The delivery charge is part of what the customer owes the shop.
        const forcedDeposit =
          user.noShowCount >= Number(noShowThreshold)
            ? Number(noShowPercent)
            : 0;
        for (const g of groups.values()) {
          g.total = money(g.subtotal - g.discount);
          if (!isOnline && !g.shop.acceptsCashOnPickup) {
            throw new BadRequestException(
              `${g.shop.nameEn} only accepts bKash or Nagad.`,
            );
          }
          const pct = isOnline
            ? 100
            : Math.max(g.shop.depositPercent, forcedDeposit);
          g.onlinePortion = money(((g.total + g.deliveryFee) * pct) / 100);
        }

        const fee = Number(pickupFee);
        const deliveryFee = money(
          [...groups.values()].reduce((s, g) => s + g.deliveryFee, 0),
        );
        const grandTotal = money(subtotal - discountTotal + fee + deliveryFee);
        const amountDueOnline = money(
          [...groups.values()].reduce((s, g) => s + g.onlinePortion, 0) + fee,
        );
        const needsPayment = amountDueOnline > 0;

        const order = await m.save(Order, {
          orderNo: makeOrderNo(now),
          customerId: userId,
          contactName: dto.contactName.trim(),
          contactPhone,
          status: needsPayment ? 'pending_payment' : 'placed',
          paymentStatus: 'unpaid',
          subtotal,
          discountTotal,
          pickupFee: fee,
          deliveryFee,
          grandTotal,
          amountDueOnline,
          couponId: coupon?.id ?? null,
          deliveryAddress: address,
          customerNote: dto.note ?? null,
          placedAt: needsPayment ? null : now,
        });

        let index = 0;
        for (const g of groups.values()) {
          const shopOrder = await m.save(ShopOrder, {
            orderId: order.id,
            shopId: g.shop.id,
            subOrderNo: `${order.orderNo}-${subOrderSuffix(index++)}`,
            status: 'placed',
            fulfillmentType: g.fulfillmentType,
            pickupPointId: g.pickupPointId,
            pickupCode: randomDigits(6),
            // Unpaid orders are held only for the payment window; pickups for the shop's hold time.
            // Delivery orders don't expire: the shop ships them.
            reservedUntil: needsPayment
              ? addMinutes(now, Number(paymentWindow))
              : g.fulfillmentType === 'delivery'
                ? null
                : addHours(now, g.shop.reservationHours),
            subtotal: g.subtotal,
            discountTotal: g.discount,
            total: g.total,
            commissionTotal: money(
              g.lines.reduce(
                (s, l) => s + (l.lineTotal * l.commissionRate) / 100,
                0,
              ),
            ),
            deliveryFee: g.deliveryFee,
            cashDue: money(g.total + g.deliveryFee - g.onlinePortion),
          });
          await m.insert(ShopOrderEvent, {
            shopOrderId: shopOrder.id,
            fromStatus: null,
            toStatus: 'placed',
            actorId: userId,
          });

          for (const l of g.lines) {
            const image = [...l.product.images].sort(
              (a, b) => a.sortOrder - b.sortOrder,
            )[0];
            const item = await m.save(OrderItem, {
              shopOrderId: shopOrder.id,
              variantId: l.variant.id,
              productId: l.product.id,
              productName: l.product.nameEn,
              variantLabel: variantLabel(l.variant.attributes),
              sku: l.variant.sku,
              imageUrl: image?.url ?? null,
              categoryId: l.product.categoryId,
              listPrice: l.variant.price,
              unitPrice: l.unitPrice,
              quantity: l.cartItem.quantity,
              lineTotal: l.lineTotal,
              offerId: l.offerId,
              commissionRate: l.commissionRate,
              commissionAmount: money((l.lineTotal * l.commissionRate) / 100),
            });
            await this.inventory.reserve(
              m,
              {
                variantId: l.variant.id,
                quantity: l.cartItem.quantity,
                orderItemId: item.id,
              },
              userId,
            );
            if (l.offerId)
              await m.update(PriceOffer, l.offerId, { status: 'used' });
          }
        }

        if (coupon) {
          await m.insert(CouponRedemption, {
            couponId: coupon.id,
            orderId: order.id,
            userId,
            discountAmount: discountTotal,
          });
          await m.increment(Coupon, { id: coupon.id }, 'usedCount', 1);
        }

        let payment: Payment | null = null;
        if (needsPayment) {
          const method: PaymentMethod = isOnline
            ? dto.paymentMethod
            : (dto.depositMethod ?? 'bkash');
          payment = await m.save(Payment, {
            orderId: order.id,
            method,
            purpose: isOnline ? 'full' : 'deposit',
            amount: amountDueOnline,
            status: 'initiated',
            gateway: method,
          });
        }

        await m.delete(CartItem, { cartId: cart!.id });
        return { order, payment, shopIds: [...groups.keys()] };
      },
    );

    if (result.order.status === 'placed')
      await this.announceNewOrder(result.order.orderNo, result.shopIds);
    return {
      orderNo: result.order.orderNo,
      status: result.order.status,
      grandTotal: result.order.grandTotal,
      amountDueOnline: result.order.amountDueOnline,
      payment: result.payment && {
        id: result.payment.id,
        amount: result.payment.amount,
        method: result.payment.method,
      },
    };
  }

  async announceNewOrder(orderNo: string, shopIds: number[]) {
    for (const shopId of shopIds) {
      this.notifications.notify({
        userIds: await this.access.shopMemberIds(shopId),
        kind: 'order_new',
        title: 'New order',
        body: `Order ${orderNo} is waiting for confirmation.`,
        data: { href: `/portal/shop/${shopId}/orders` },
        channels: ['in_app', 'sms'],
      });
    }
  }

  /** A saved address of the customer's, or a new one (optionally saved for next time). */
  private async resolveAddress(
    m: EntityManager,
    userId: number,
    dto: CheckoutDto,
  ) {
    let a: AddressInputDto | UserAddress | null = null;
    if (dto.addressId) {
      a = await m.findOne(UserAddress, {
        where: { id: dto.addressId, userId },
      });
      if (!a) throw new BadRequestException('That address was not found.');
    } else if (dto.address) {
      a = dto.address;
      if (dto.saveAddress) {
        const hasDefault = await m.exists(UserAddress, {
          where: { userId, isDefault: true },
        });
        await m.save(UserAddress, {
          ...dto.address,
          phone: normalizeBdPhone(dto.address.phone),
          userId,
          isDefault: !hasDefault,
        });
      }
    }
    if (!a) throw new BadRequestException('Add a delivery address.');
    return {
      recipientName: a.recipientName.trim(),
      phone: normalizeBdPhone(a.phone),
      district: a.district.trim(),
      areaName: a.areaName.trim(),
      addressLine: a.addressLine.trim(),
      landmark: a.landmark?.trim() || null,
      zone: a.zone as DeliveryZone,
    };
  }

  private async validateCoupon(
    m: EntityManager,
    code: string,
    userId: number,
    groups: ShopGroup[],
    now: Date,
  ) {
    const coupon = await m.findOne(Coupon, {
      where: { code: code.trim().toUpperCase() },
    });
    if (
      !coupon ||
      !coupon.isActive ||
      coupon.startsAt > now ||
      coupon.endsAt < now
    ) {
      throw new BadRequestException('This coupon is not valid.');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has been fully used.');
    }
    const used = await m.count(CouponRedemption, {
      where: { couponId: coupon.id, userId },
    });
    if (used >= coupon.perUserLimit)
      throw new BadRequestException('You have already used this coupon.');
    const applies = groups.some(
      (g) =>
        (!coupon.shopId || g.shop.id === coupon.shopId) &&
        (!coupon.marketId || g.shop.marketId === coupon.marketId),
    );
    if (!applies)
      throw new BadRequestException(
        'This coupon does not apply to the shops in your cart.',
      );
    return coupon;
  }
}
