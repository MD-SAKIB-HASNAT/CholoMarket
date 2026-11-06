import { OFFER_STATUSES, inList, type OfferStatus } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Conversation } from 'src/database/postgres/entities/engagement/conversation.entity';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/**
 * "Make an offer". Flow: pending -> countered -> accepted -> used
 *                        (or rejected / withdrawn / expired).
 * The accepted price becomes the unit price in cart and order.
 */
@Entity('price_offers')
@Check('CHK_price_offers_status', inList('status', OFFER_STATUSES))
@Check('CHK_price_offers_qty', '"quantity" > 0')
@Check('CHK_price_offers_price', '"offered_price" > 0')
@Index(['shopId', 'status'])
@Index(['customerId', 'status'])
export class PriceOffer {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  conversationId: number;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Relation<Conversation>;

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'int' })
  variantId: number;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant>;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  /** Variant price when the offer was made. */
  @MoneyColumn()
  listPrice: number;

  /** Per unit. */
  @MoneyColumn()
  offeredPrice: number;

  @MoneyColumn({ nullable: true })
  counterPrice: number | null;

  /** Agreed per-unit price once accepted. */
  @MoneyColumn({ nullable: true })
  finalPrice: number | null;

  @StatusColumn('pending', 20)
  status: OfferStatus;

  @Column({ type: 'int', nullable: true })
  respondedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responded_by' })
  responder: Relation<User> | null;

  @Timestamp()
  respondedAt: Date | null;

  /** Offer (and later the accepted price) is valid until this time. */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
