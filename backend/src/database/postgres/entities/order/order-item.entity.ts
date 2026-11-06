import {
  ORDER_ITEM_STATUSES,
  inList,
  type OrderItemStatus,
} from 'src/database/enums';
import {
  IdColumn,
  MoneyColumn,
  PercentColumn,
  StatusColumn,
} from 'src/database/postgres/columns';
import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { PriceOffer } from 'src/database/postgres/entities/engagement/price-offer.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/** Order lines with price and commission snapshots that survive later edits. */
@Entity('order_items')
@Check('CHK_order_items_qty', '"quantity" > 0')
@Check('CHK_order_items_line', '"line_total" = "unit_price" * "quantity"')
@Check('CHK_order_items_returned', '"returned_qty" BETWEEN 0 AND "quantity"')
@Check('CHK_order_items_status', inList('status', ORDER_ITEM_STATUSES))
export class OrderItem {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  shopOrderId: number;

  @ManyToOne(() => ShopOrder, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  @Index()
  @Column({ type: 'int' })
  variantId: number;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant>;

  @Column({ type: 'int' })
  productId: number;

  @Column({ type: 'text' })
  productName: string;

  /** e.g. "Red / M" */
  @Column({ type: 'text', nullable: true })
  variantLabel: string | null;

  @Column({ type: 'text', nullable: true })
  sku: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;

  @MoneyColumn()
  listPrice: number;

  /** After bargaining. */
  @MoneyColumn()
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @MoneyColumn()
  lineTotal: number;

  @Column({ type: 'int', nullable: true })
  offerId: number | null;

  @ManyToOne(() => PriceOffer)
  @JoinColumn({ name: 'offer_id' })
  offer: Relation<PriceOffer> | null;

  /** % snapshot at order time. */
  @PercentColumn({ default: 0 })
  commissionRate: number;

  @MoneyColumn({ default: 0 })
  commissionAmount: number;

  @StatusColumn('active', 20)
  status: OrderItemStatus;

  @Column({ type: 'int', default: 0 })
  returnedQty: number;
}
