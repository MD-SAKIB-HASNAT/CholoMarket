import { CreatedAt, IdColumn } from 'src/database/postgres/columns';
import { Cart } from 'src/database/postgres/entities/cart/cart.entity';
import { PriceOffer } from 'src/database/postgres/entities/engagement/price-offer.entity';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';

@Entity('cart_items')
@Unique(['cartId', 'variantId'])
@Check('CHK_cart_items_qty', '"quantity" > 0')
export class CartItem {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  cartId: number;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Relation<Cart>;

  @Index()
  @Column({ type: 'int' })
  variantId: number;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant>;

  /** Denormalised so the cart can be grouped by shop cheaply. */
  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'int' })
  quantity: number;

  /** Bargained price applies when set. */
  @Column({ type: 'int', nullable: true })
  offerId: number | null;

  @ManyToOne(() => PriceOffer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offer_id' })
  offer: Relation<PriceOffer> | null;

  @CreatedAt()
  createdAt: Date;
}
