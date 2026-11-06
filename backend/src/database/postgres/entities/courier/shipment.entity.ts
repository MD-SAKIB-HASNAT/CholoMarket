import {
  COURIER_PROVIDERS,
  SHIPMENT_STATUSES,
  inList,
  type CourierProvider,
  type ShipmentStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { CourierAccount } from 'src/database/postgres/entities/courier/courier-account.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  type Relation,
} from 'typeorm';

/** One courier parcel per home-delivery shop order. */
@Entity('shipments')
@Check('CHK_shipments_provider', inList('provider', COURIER_PROVIDERS))
@Check('CHK_shipments_status', inList('status', SHIPMENT_STATUSES))
@Index(['provider', 'consignmentId'], { unique: true })
@Index(['status'])
export class Shipment {
  @IdColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  shopOrderId: number;

  @OneToOne(() => ShopOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  @Index()
  @Column({ type: 'int' })
  shopId: number;

  @Column({ type: 'int' })
  courierAccountId: number;

  @ManyToOne(() => CourierAccount)
  @JoinColumn({ name: 'courier_account_id' })
  courierAccount: Relation<CourierAccount>;

  @Column({ type: 'varchar', length: 20 })
  provider: CourierProvider;

  /** Our invoice sent to the courier (the sub-order number). */
  @Column({ type: 'text' })
  invoice: string;

  @Column({ type: 'text' })
  consignmentId: string;

  @Column({ type: 'text', nullable: true })
  trackingCode: string | null;

  @StatusColumn('booked', 20)
  status: ShipmentStatus;

  /** The courier's own status word, e.g. "in_review", "hold". */
  @Column({ type: 'text', nullable: true })
  courierStatus: string | null;

  /** Cash the courier collects from the customer. */
  @MoneyColumn({ default: 0 })
  codAmount: number;

  /** What the courier charges the shop, when it tells us. */
  @MoneyColumn({ nullable: true })
  courierCharge: number | null;

  /** Snapshot of who and where. */
  @Column({ type: 'jsonb' })
  recipient: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: Relation<User> | null;

  @Timestamp()
  deliveredAt: Date | null;

  @Timestamp()
  lastSyncedAt: Date | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
