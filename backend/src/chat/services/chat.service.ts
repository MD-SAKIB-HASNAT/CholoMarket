import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessService } from 'src/auth';
import { variantLabel } from 'src/cart/services/cart.service';
import { addHours, money } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import type { MessageSide, OfferStatus } from 'src/database/enums';
import {
  Conversation,
  Message,
  PriceOffer,
  Shop,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { SettingsService } from 'src/platform/services/settings.service';
import {
  In,
  LessThan,
  type EntityManager,
  type FindOptionsRelations,
  type SelectQueryBuilder,
} from 'typeorm';

const fmt = (n: number) => `৳${n.toLocaleString('en-IN')}`;

@Injectable()
export class ChatService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
  ) {}

  // ------------------------------------------------------------ conversations

  async getOrCreate(
    customerId: number,
    shopId: number,
    manager: EntityManager = this.postgresService.dataSource.manager,
  ): Promise<Conversation> {
    const shop = await manager.findOne(Shop, { where: { id: shopId } });
    if (!shop || shop.status !== 'active')
      throw new NotFoundException('Shop not found');
    if (await this.access.isShopMember(customerId, shopId))
      throw new BadRequestException('You cannot chat with your own shop.');
    await manager
      .createQueryBuilder()
      .insert()
      .into(Conversation)
      .values({ customerId, shopId })
      .orIgnore()
      .execute();
    return manager.findOneOrFail(Conversation, {
      where: { customerId, shopId },
    });
  }

  /** Which side the user is on, or 403. */
  private async sideOf(
    conv: Conversation,
    userId: number,
  ): Promise<MessageSide> {
    if (conv.customerId === userId) return 'customer';
    await this.access.requireShopMember(userId, conv.shopId);
    return 'shop';
  }

  listForCustomer(userId: number, q: CursorQueryDto) {
    const qb = this.postgresService.conversations
      .createQueryBuilder('c')
      .where('c.customer_id = :userId', { userId });
    return this.conversationsPage(qb, q, { shop: { market: true } });
  }

  listForShop(shopId: number, q: CursorQueryDto) {
    const qb = this.postgresService.conversations
      .createQueryBuilder('c')
      .where('c.shop_id = :shopId', { shopId });
    return this.conversationsPage(qb, q, { customer: true });
  }

  /** Most recent conversation first (one that never got a message counts from when it was opened). */
  private async conversationsPage(
    qb: SelectQueryBuilder<Conversation>,
    q: CursorQueryDto,
    relations: FindOptionsRelations<Conversation>,
  ) {
    const page = await keysetIds(qb, {
      idExpr: 'c.id',
      keys: [
        {
          expr: 'COALESCE(c.last_message_at, c.created_at)',
          dir: 'DESC',
          type: 'timestamptz',
        },
      ],
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.conversations.find({
      where: { id: In(page.ids) },
      relations,
    });
    return toCursorPage(inOrder(page.ids, found), page);
  }

  async thread(conversationId: number, userId: number) {
    const conv = await this.postgresService.conversations.findOne({
      where: { id: conversationId },
      relations: { shop: true, customer: true },
    });
    if (!conv) throw new NotFoundException();
    const side = await this.sideOf(conv, userId);
    const [messages, offers] = await Promise.all([
      this.postgresService.messages.find({
        where: { conversationId },
        relations: { product: { images: true } },
        order: { createdAt: 'ASC' },
        take: 500,
      }),
      this.postgresService.priceOffers.find({
        where: { conversationId },
        relations: { variant: { product: true } },
        order: { createdAt: 'DESC' },
      }),
    ]);
    await this.postgresService.conversations.update(
      conv.id,
      side === 'customer' ? { customerUnread: 0 } : { shopUnread: 0 },
    );
    return {
      conversation: {
        id: conv.id,
        side,
        shop: {
          id: conv.shop.id,
          slug: conv.shop.slug,
          nameEn: conv.shop.nameEn,
          logoUrl: conv.shop.logoUrl,
        },
        customer: { id: conv.customer.id, fullName: conv.customer.fullName },
      },
      messages,
      offers: offers.map((o) => this.offerView(o)),
    };
  }

  async send(
    conversationId: number,
    userId: number,
    body: string,
    productId?: number,
  ) {
    const conv = await this.postgresService.conversations.findOne({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException();
    const side = await this.sideOf(conv, userId);
    const msg = await this.postMessage(
      this.postgresService.dataSource.manager,
      conv,
      userId,
      side,
      { body, productId },
    );
    await this.notifyOtherSide(conv, side, 'New message', body.slice(0, 120));
    return msg;
  }

  /** Customer opens (or reuses) a thread with a shop and sends the first message. */
  async start(
    customerId: number,
    shopId: number,
    body: string,
    productId?: number,
  ) {
    const conv = await this.getOrCreate(customerId, shopId);
    await this.postMessage(
      this.postgresService.dataSource.manager,
      conv,
      customerId,
      'customer',
      { body, productId },
    );
    await this.notifyOtherSide(
      conv,
      'customer',
      'New message',
      body.slice(0, 120),
    );
    return conv;
  }

  private async postMessage(
    manager: EntityManager,
    conv: Conversation,
    senderId: number,
    side: MessageSide,
    content: { body?: string; productId?: number; offerId?: number },
  ) {
    const msg = await manager.save(Message, {
      conversationId: conv.id,
      senderId,
      senderSide: side,
      body: content.body ?? null,
      productId: content.productId ?? null,
      offerId: content.offerId ?? null,
    });
    await manager
      .createQueryBuilder()
      .update(Conversation)
      .set({
        lastMessageAt: () => 'now()',
        lastMessagePreview: (content.body ?? '').slice(0, 120),
        ...(side === 'customer'
          ? { shopUnread: () => 'shop_unread + 1' }
          : { customerUnread: () => 'customer_unread + 1' }),
      })
      .where('id = :id', { id: conv.id })
      .execute();
    return msg;
  }

  private async notifyOtherSide(
    conv: Conversation,
    from: MessageSide,
    title: string,
    body: string,
  ) {
    if (from === 'customer') {
      this.notifications.notify({
        userIds: await this.access.shopMemberIds(conv.shopId),
        kind: 'chat_message',
        title,
        body,
        data: { href: `/portal/shop/${conv.shopId}/messages?c=${conv.id}` },
      });
    } else {
      this.notifications.notify({
        userIds: [conv.customerId],
        kind: 'chat_message',
        title,
        body,
        data: { href: `/messages?c=${conv.id}` },
      });
    }
  }

  // ------------------------------------------------------------ bargaining

  offerView(o: PriceOffer) {
    return {
      id: o.id,
      conversationId: o.conversationId,
      shopId: o.shopId,
      variantId: o.variantId,
      productId: o.variant?.productId,
      productName: o.variant?.product?.nameEn,
      variantLabel: variantLabel(o.variant?.attributes),
      quantity: o.quantity,
      listPrice: o.listPrice,
      offeredPrice: o.offeredPrice,
      counterPrice: o.counterPrice,
      finalPrice: o.finalPrice,
      status: o.status,
      expiresAt: o.expiresAt,
      createdAt: o.createdAt,
    };
  }

  async makeOffer(
    customerId: number,
    variantId: number,
    quantity: number,
    offeredPrice: number,
    note?: string,
  ) {
    const variant = await this.postgresService.productVariants.findOne({
      where: { id: variantId },
      relations: { product: { shop: true } },
    });
    if (!variant || !variant.isActive || variant.product.status !== 'active')
      throw new NotFoundException('Item not available');
    const { product } = variant;
    if (!product.isNegotiable || !product.shop.acceptsOffers)
      throw new BadRequestException(
        'This shop has a fixed price for this item.',
      );
    if (offeredPrice >= variant.price)
      throw new BadRequestException(
        'Your offer must be below the listed price.',
      );
    if (quantity > variant.availableQty)
      throw new BadRequestException(`Only ${variant.availableQty} available.`);

    const validity = Number(await this.settings.get('offer_validity_hours'));
    const result = await this.postgresService.dataSource.transaction(
      async (m) => {
        const conv = await this.getOrCreate(customerId, product.shopId, m);
        const openOffer = await m.findOne(PriceOffer, {
          where: {
            customerId,
            variantId,
            status: In(['pending', 'countered'] as OfferStatus[]),
          },
        });
        if (openOffer)
          throw new BadRequestException(
            'You already have an open offer for this item.',
          );

        // Shop's hidden floor: reject instantly without bothering the shop.
        const autoReject =
          variant.minOfferPrice !== null &&
          offeredPrice < variant.minOfferPrice;
        const offer = await m.save(PriceOffer, {
          conversationId: conv.id,
          customerId,
          shopId: product.shopId,
          variantId,
          quantity,
          listPrice: variant.price,
          offeredPrice: money(offeredPrice),
          status: autoReject ? 'rejected' : 'pending',
          respondedAt: autoReject ? new Date() : null,
          expiresAt: addHours(new Date(), validity),
        });
        await this.postMessage(m, conv, customerId, 'customer', {
          body: `Offer: ${fmt(offeredPrice)} each for ${quantity} × ${product.nameEn}${note ? ` — ${note}` : ''}`,
          productId: product.id,
          offerId: offer.id,
        });
        if (autoReject) {
          await this.postMessage(m, conv, customerId, 'system', {
            body: 'This offer is below what the shop can accept. Try a higher price.',
            offerId: offer.id,
          });
        }
        return { conv, offer, autoReject };
      },
    );

    if (!result.autoReject) {
      this.notifications.notify({
        userIds: await this.access.shopMemberIds(product.shopId),
        kind: 'offer_received',
        title: 'New price offer',
        body: `${fmt(offeredPrice)} for ${product.nameEn} (listed ${fmt(variant.price)})`,
        data: { href: `/portal/shop/${product.shopId}/offers` },
      });
    }
    return this.offerById(result.offer.id);
  }

  async offerById(id: number) {
    const o = await this.postgresService.priceOffers.findOne({
      where: { id },
      relations: { variant: { product: true } },
    });
    if (!o) throw new NotFoundException();
    return this.offerView(o);
  }

  async respondAsShop(
    shopId: number,
    offerId: number,
    userId: number,
    action: 'accept' | 'reject' | 'counter',
    counterPrice?: number,
  ) {
    const offer = await this.postgresService.priceOffers.findOne({
      where: { id: offerId, shopId },
      relations: { variant: { product: true } },
    });
    if (!offer) throw new NotFoundException();
    if (offer.status !== 'pending')
      throw new BadRequestException(`This offer is already ${offer.status}.`);
    if (offer.expiresAt < new Date())
      throw new BadRequestException('This offer has expired.');

    const acceptHours = Number(await this.settings.get('accepted_offer_hours'));
    let message: string;
    if (action === 'accept') {
      offer.status = 'accepted';
      offer.finalPrice = offer.offeredPrice;
      offer.expiresAt = addHours(new Date(), acceptHours);
      message = `Offer accepted: ${fmt(offer.offeredPrice)} each. Add it to your cart within ${acceptHours} hours.`;
    } else if (action === 'reject') {
      offer.status = 'rejected';
      message = 'Offer declined.';
    } else {
      if (
        !counterPrice ||
        counterPrice <= offer.offeredPrice ||
        counterPrice >= offer.listPrice
      ) {
        throw new BadRequestException(
          'Counter price must be between the offer and the listed price.',
        );
      }
      offer.status = 'countered';
      offer.counterPrice = money(counterPrice);
      message = `Counter-offer: ${fmt(counterPrice)} each.`;
    }
    offer.respondedBy = userId;
    offer.respondedAt = new Date();

    const conv = await this.postgresService.conversations.findOneOrFail({
      where: { id: offer.conversationId },
    });
    await this.postgresService.dataSource.transaction(async (m) => {
      await m.save(offer);
      await this.postMessage(m, conv, userId, 'shop', {
        body: message,
        offerId: offer.id,
        productId: offer.variant.productId,
      });
    });
    this.notifications.notify({
      userIds: [offer.customerId],
      kind: `offer_${offer.status}`,
      title:
        action === 'accept'
          ? 'Your offer was accepted!'
          : action === 'counter'
            ? 'The shop sent a counter-offer'
            : 'Offer declined',
      body: `${offer.variant.product.nameEn}: ${message}`,
      data: { href: '/offers' },
    });
    return this.offerView(offer);
  }

  async respondAsCustomer(
    offerId: number,
    userId: number,
    action: 'accept_counter' | 'decline_counter' | 'withdraw',
  ) {
    const offer = await this.postgresService.priceOffers.findOne({
      where: { id: offerId },
      relations: { variant: { product: true } },
    });
    if (!offer || offer.customerId !== userId) throw new NotFoundException();
    const conv = await this.postgresService.conversations.findOneOrFail({
      where: { id: offer.conversationId },
    });
    let message: string;
    if (action === 'withdraw') {
      if (!['pending', 'countered'].includes(offer.status))
        throw new BadRequestException('Only open offers can be withdrawn.');
      offer.status = 'withdrawn';
      message = 'Offer withdrawn.';
    } else {
      if (offer.status !== 'countered')
        throw new BadRequestException(
          'There is no counter-offer to respond to.',
        );
      if (offer.expiresAt < new Date())
        throw new BadRequestException('This counter-offer has expired.');
      if (action === 'accept_counter') {
        offer.status = 'accepted';
        offer.finalPrice = offer.counterPrice;
        offer.expiresAt = addHours(
          new Date(),
          Number(await this.settings.get('accepted_offer_hours')),
        );
        message = `Counter-offer accepted at ${fmt(offer.counterPrice!)} each.`;
      } else {
        offer.status = 'rejected';
        message = 'Counter-offer declined.';
      }
    }
    await this.postgresService.dataSource.transaction(async (m) => {
      await m.save(offer);
      await this.postMessage(m, conv, userId, 'customer', {
        body: message,
        offerId: offer.id,
      });
    });
    await this.notifyOtherSide(
      conv,
      'customer',
      'Offer update',
      `${offer.variant.product.nameEn}: ${message}`,
    );
    return this.offerView(offer);
  }

  async customerOffers(userId: number, q: CursorQueryDto) {
    const qb = this.postgresService.priceOffers
      .createQueryBuilder('o')
      .where('o.customer_id = :userId', { userId });
    const page = await this.offersPage(qb, q, {
      variant: { product: { images: true } },
      shop: true,
    });
    return toCursorPage(
      page.items.map((o) => ({
        ...this.offerView(o),
        shop: { id: o.shop.id, slug: o.shop.slug, nameEn: o.shop.nameEn },
        imageUrl:
          o.variant.product.images.sort((a, b) => a.sortOrder - b.sortOrder)[0]
            ?.url ?? null,
      })),
      page,
    );
  }

  async shopOffers(shopId: number, q: CursorQueryDto, status?: OfferStatus) {
    const qb = this.postgresService.priceOffers
      .createQueryBuilder('o')
      .where('o.shop_id = :shopId', { shopId });
    if (status) qb.andWhere('o.status = :status', { status });
    const page = await this.offersPage(qb, q, {
      variant: { product: true },
      customer: true,
    });
    return toCursorPage(
      page.items.map((o) => ({
        ...this.offerView(o),
        customer: {
          id: o.customer.id,
          fullName: o.customer.fullName,
          noShowCount: o.customer.noShowCount,
        },
      })),
      page,
    );
  }

  /** Newest offers first, loaded with the relations the caller needs. */
  private async offersPage(
    qb: SelectQueryBuilder<PriceOffer>,
    q: CursorQueryDto,
    relations: FindOptionsRelations<PriceOffer>,
  ) {
    const page = await keysetIds(qb, {
      idExpr: 'o.id',
      keys: [{ expr: 'o.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.priceOffers.find({
      where: { id: In(page.ids) },
      relations,
    });
    return {
      items: inOrder(page.ids, found),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  /** Maintenance job: close offers nobody acted on. */
  async expireOffers() {
    const now = new Date();
    const res = await this.postgresService.priceOffers.update(
      {
        status: In(['pending', 'countered', 'accepted'] as OfferStatus[]),
        expiresAt: LessThan(now),
      },
      { status: 'expired' },
    );
    return res.affected ?? 0;
  }

  assertCustomer(conv: Conversation, userId: number) {
    if (conv.customerId !== userId) throw new ForbiddenException();
  }
}
