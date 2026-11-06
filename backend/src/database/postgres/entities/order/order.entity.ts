import {
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  inList,
  type OrderPaymentStatus,
  type OrderStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { Coupon } from 'src/database/postgres/entities/promotion/coupon.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

/**
 * One checkout by the customer. It may span many shops; each shop's part is a ShopOrder.
 */
@Entity('orders')
@Check('CHK_orders_status', inList('status', ORDER_STATUSES))
@Check(
  'CHK_orders_payment_status',
  inList('payment_status', ORDER_PAYMENT_STATUSES),
)
@Check(
  'CHK_orders_total',
  '"grand_total" = "subtotal" - "discount_total" + "pickup_fee" + "delivery_fee"',
)
@Index(['customerId', 'createdAt'])
export class Order {
  @IdColumn()
  id: number;

  /** Human code, e.g. CM-261022-4F7K2 */
  @Column({ type: 'text', unique: true })
  orderNo: string;

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Column({ type: 'text' })
  contactName: string;

  @Column({ type: 'varchar', length: 14 })
  contactPhone: string;

  @StatusColumn('pending_payment', 25)
  status: OrderStatus;

  @StatusColumn('unpaid', 25)
  paymentStatus: OrderPaymentStatus;

  @MoneyColumn()
  subtotal: number;

  @MoneyColumn({ default: 0 })
  discountTotal: number;

  /** Optional customer pickup fee. */
  @MoneyColumn({ default: 0 })
  pickupFee: number;

  /** [PHASE 2] */
  @MoneyColumn({ default: 0 })
  deliveryFee: number;

  @MoneyColumn()
  grandTotal: number;

  /** Amount required online at checkout (full amount or deposit). */
  @MoneyColumn({ default: 0 })
  amountDueOnline: number;

  @MoneyColumn({ default: 0 })
  amountPaid: number;

  @Column({ type: 'int', nullable: true })
  couponId: number | null;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Relation<Coupon> | null;

  /** [PHASE 2] snapshot of the delivery address. */
  @Column({ type: 'jsonb', nullable: true })
  deliveryAddress: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  customerNote: string | null;

  @Timestamp()
  placedAt: Date | null;

  @OneToMany(() => ShopOrder, (s) => s.order)
  shopOrders: Relation<ShopOrder[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
