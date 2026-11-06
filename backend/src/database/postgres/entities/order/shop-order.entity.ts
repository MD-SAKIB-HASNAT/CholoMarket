import {
  FULFILLMENT_TYPES,
  SHOP_ORDER_STATUSES,
  inList,
  type FulfillmentType,
  type ShopOrderStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { PickupPoint } from 'src/database/postgres/entities/market/pickup-point.entity';
import { OrderItem } from 'src/database/postgres/entities/order/order-item.entity';
import { Order } from 'src/database/postgres/entities/order/order.entity';
import { ShopOrderEvent } from 'src/database/postgres/entities/order/shop-order-event.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  type Relation,
} from 'typeorm';

/**
 * The part of an order fulfilled by one shop. Own status and pickup code.
 *   placed -> confirmed -> ready_for_pickup -> completed
 *      \-> rejected            \-> expired (not collected)    \-> cancelled
 */
@Entity('shop_orders')
@Unique(['orderId', 'shopId'])
@Check('CHK_shop_orders_status', inList('status', SHOP_ORDER_STATUSES))
@Check(
  'CHK_shop_orders_fulfillment',
  inList('fulfillment_type', FULFILLMENT_TYPES),
)
@Check(
  'CHK_shop_orders_desk',
  `"fulfillment_type" <> 'desk_pickup' OR "pickup_point_id" IS NOT NULL`,
)
@Index('IDX_shop_orders_shop_status', ['shopId', 'status', 'createdAt'])
@Index('IDX_shop_orders_reserved_until', ['reservedUntil'], {
  where: `"status" IN ('placed', 'confirmed', 'ready_for_pickup')`,
})
export class ShopOrder {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @ManyToOne(() => Order, (o) => o.shopOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  /** e.g. CM-261022-4F7K2-A */
  @Column({ type: 'text', unique: true })
  subOrderNo: string;

  @StatusColumn('placed', 25)
  status: ShopOrderStatus;

  @StatusColumn('shop_pickup', 20)
  fulfillmentType: FulfillmentType;

  @Column({ type: 'int', nullable: true })
  pickupPointId: number | null;

  @ManyToOne(() => PickupPoint)
  @JoinColumn({ name: 'pickup_point_id' })
  pickupPoint: Relation<PickupPoint> | null;

  /** Shown to the customer, checked at the counter. */
  @Column({ type: 'varchar', length: 6 })
  pickupCode: string;

  /** Uncollected orders expire after this and stock is released. */
  @Timestamp()
  reservedUntil: Date | null;

  @MoneyColumn()
  subtotal: number;

  @MoneyColumn({ default: 0 })
  discountTotal: number;

  @MoneyColumn()
  total: number;

  /** Sum of order_items.commission_amount. */
  @MoneyColumn({ default: 0 })
  commissionTotal: number;

  /** Home-delivery charge for this shop's parcel (0 for pickup). */
  @MoneyColumn({ default: 0 })
  deliveryFee: number;

  /**
   * Cash still to collect: at the counter for pickup, or by the courier (COD) for delivery.
   * = total + delivery fee − what was paid online.
   */
  @MoneyColumn({ default: 0 })
  cashDue: number;

  @Timestamp()
  confirmedAt: Date | null;

  @Timestamp()
  readyAt: Date | null;

  /** Handed to the courier. */
  @Timestamp()
  shippedAt: Date | null;

  @Timestamp()
  completedAt: Date | null;

  @Timestamp()
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ type: 'int', nullable: true })
  cancelledBy: number | null;

  @OneToMany(() => OrderItem, (i) => i.shopOrder)
  items: Relation<OrderItem[]>;

  @OneToMany(() => ShopOrderEvent, (e) => e.shopOrder)
  events: Relation<ShopOrderEvent[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
