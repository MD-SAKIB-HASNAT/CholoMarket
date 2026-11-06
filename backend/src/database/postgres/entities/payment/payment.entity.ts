import {
  PAYMENT_METHODS,
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  inList,
  type PaymentMethod,
  type PaymentPurpose,
  type PaymentStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Order } from 'src/database/postgres/entities/order/order.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
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

/**
 * An order can have several payments, e.g. a bKash deposit online plus
 * cash for the balance at pickup.
 */
@Entity('payments')
@Unique(['gateway', 'gatewayTrxId'])
@Check('CHK_payments_method', inList('method', PAYMENT_METHODS))
@Check('CHK_payments_purpose', inList('purpose', PAYMENT_PURPOSES))
@Check('CHK_payments_status', inList('status', PAYMENT_STATUSES))
@Check('CHK_payments_amount', '"amount" > 0')
export class Payment {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  /** Set for cash collected at a specific shop. */
  @Column({ type: 'int', nullable: true })
  shopOrderId: number | null;

  @ManyToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder> | null;

  @Column({ type: 'varchar', length: 15 })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 10 })
  purpose: PaymentPurpose;

  @MoneyColumn()
  amount: number;

  @StatusColumn('initiated', 15)
  status: PaymentStatus;

  /** 'bkash' | 'nagad' | 'sslcommerz' */
  @Column({ type: 'varchar', length: 20, nullable: true })
  gateway: string | null;

  /** Gateway session / paymentID. */
  @Column({ type: 'text', nullable: true })
  gatewayPaymentId: string | null;

  /** Final transaction id; unique per gateway, blocks double-crediting. */
  @Column({ type: 'text', nullable: true })
  gatewayTrxId: string | null;

  /** Masked wallet number, e.g. 01*******89 */
  @Column({ type: 'text', nullable: true })
  payerAccount: string | null;

  /** Staff member who took the cash. */
  @Column({ type: 'int', nullable: true })
  collectedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'collected_by' })
  collector: Relation<User> | null;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, any> | null;

  @Timestamp()
  paidAt: Date | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
