import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { money } from 'src/common/helper/util';
import { Cart, PriceOffer } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';

export function variantLabel(
  attributes: Record<string, string> | null | undefined,
): string | null {
  const values = Object.values(attributes ?? {}).filter(Boolean);
  return values.length ? values.join(' / ') : null;
}

/** An accepted offer applies only to its own customer + variant, before it expires. */
export function usableOffer(
  offer: PriceOffer | null | undefined,
  userId: number,
  variantId: number,
  at = new Date(),
) {
  return (
    !!offer &&
    offer.status === 'accepted' &&
    offer.customerId === userId &&
    offer.variantId === variantId &&
    offer.expiresAt > at
  );
}

@Injectable()
export class CartService {
  constructor(private readonly postgresService: PostgresService) {}

  async cartFor(userId: number): Promise<Cart> {
    const existing = await this.postgresService.carts.findOne({
      where: { userId },
    });
    if (existing) return existing;
    await this.postgresService.carts
      .createQueryBuilder()
      .insert()
      .values({ userId })
      .orIgnore()
      .execute();
    return this.postgresService.carts.findOneOrFail({ where: { userId } });
  }

  /** Cart grouped by shop with live prices, stock warnings and totals. */
  async view(userId: number) {
    const cart = await this.cartFor(userId);
    const items = await this.postgresService.cartItems.find({
      where: { cartId: cart.id },
      relations: {
        variant: { product: { images: true } },
        shop: { market: true },
        offer: true,
      },
      order: { createdAt: 'ASC' },
    });

    const groups = new Map<
      number,
      { shop: Record<string, unknown>; items: unknown[]; subtotal: number }
    >();
    let subtotal = 0;
    let count = 0;
    const now = new Date();
    for (const item of items) {
      const { variant, shop } = item;
      const product = variant.product;
      const offerOk = usableOffer(item.offer, userId, item.variantId, now);
      const unitPrice = offerOk ? item.offer!.finalPrice! : variant.price;
      const issues: string[] = [];
      if (
        product.status !== 'active' ||
        !variant.isActive ||
        shop.status !== 'active'
      )
        issues.push('No longer available');
      else if (variant.availableQty < item.quantity) {
        issues.push(
          variant.availableQty === 0
            ? 'Out of stock'
            : `Only ${variant.availableQty} left`,
        );
      }
      if (item.offerId && !offerOk)
        issues.push('Your bargained price has expired');
      if (offerOk && item.quantity > item.offer!.quantity)
        issues.push(`Offer price covers ${item.offer!.quantity} item(s)`);

      const lineTotal = money(unitPrice * item.quantity);
      const image = [...product.images].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      )[0];
      const group = groups.get(shop.id) ?? {
        shop: {
          id: shop.id,
          slug: shop.slug,
          nameEn: shop.nameEn,
          nameBn: shop.nameBn,
          isVerified: shop.isVerified,
          acceptsCashOnPickup: shop.acceptsCashOnPickup,
          offersDelivery: shop.offersDelivery,
          depositPercent: shop.depositPercent,
          reservationHours: shop.reservationHours,
          shopNumber: shop.shopNumber,
          market: shop.market
            ? {
                id: shop.market.id,
                slug: shop.market.slug,
                nameEn: shop.market.nameEn,
              }
            : null,
        },
        items: [],
        subtotal: 0,
      };
      group.items.push({
        id: item.id,
        quantity: item.quantity,
        variantId: variant.id,
        productId: product.id,
        productName: product.nameEn,
        productNameBn: product.nameBn,
        variantLabel: variantLabel(variant.attributes),
        imageUrl: image?.url ?? null,
        listPrice: variant.price,
        unitPrice,
        lineTotal,
        availableQty: variant.availableQty,
        offerId: offerOk ? item.offerId : null,
        issues,
      });
      group.subtotal = money(group.subtotal + lineTotal);
      groups.set(shop.id, group);
      subtotal = money(subtotal + lineTotal);
      count += item.quantity;
    }
    return {
      id: cart.id,
      groups: [...groups.values()],
      subtotal,
      itemCount: count,
    };
  }

  async add(
    userId: number,
    variantId: number,
    quantity: number,
    offerId?: number,
  ) {
    const variant = await this.postgresService.productVariants.findOne({
      where: { id: variantId },
      relations: { product: { shop: true } },
    });
    if (
      !variant ||
      !variant.isActive ||
      variant.product.status !== 'active' ||
      variant.product.shop.status !== 'active'
    ) {
      throw new NotFoundException('This item is not available.');
    }
    if (offerId) {
      const offer = await this.postgresService.priceOffers.findOne({
        where: { id: offerId },
      });
      if (!usableOffer(offer, userId, variantId))
        throw new BadRequestException('This offer cannot be used.');
      quantity = Math.min(quantity, offer!.quantity);
    }
    const cart = await this.cartFor(userId);
    const existing = await this.postgresService.cartItems.findOne({
      where: { cartId: cart.id, variantId },
    });
    const nextQty = offerId ? quantity : (existing?.quantity ?? 0) + quantity;
    if (nextQty > variant.availableQty) {
      throw new BadRequestException(
        variant.availableQty
          ? `Only ${variant.availableQty} available.`
          : 'Out of stock.',
      );
    }
    if (existing) {
      existing.quantity = nextQty;
      if (offerId) existing.offerId = offerId;
      await this.postgresService.cartItems.save(existing);
    } else {
      await this.postgresService.cartItems.insert({
        cartId: cart.id,
        variantId,
        shopId: variant.product.shopId,
        quantity: nextQty,
        offerId: offerId ?? null,
      });
    }
    return this.view(userId);
  }

  async update(userId: number, itemId: number, quantity: number) {
    const cart = await this.cartFor(userId);
    const item = await this.postgresService.cartItems.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: { variant: true },
    });
    if (!item) throw new NotFoundException();
    if (quantity > item.variant.availableQty)
      throw new BadRequestException(
        `Only ${item.variant.availableQty} available.`,
      );
    item.quantity = quantity;
    await this.postgresService.cartItems.save(item);
    return this.view(userId);
  }

  async remove(userId: number, itemId: number) {
    const cart = await this.cartFor(userId);
    await this.postgresService.cartItems.delete({
      id: itemId,
      cartId: cart.id,
    });
    return this.view(userId);
  }

  async clear(userId: number) {
    const cart = await this.cartFor(userId);
    await this.postgresService.cartItems.delete({ cartId: cart.id });
    return this.view(userId);
  }
}
