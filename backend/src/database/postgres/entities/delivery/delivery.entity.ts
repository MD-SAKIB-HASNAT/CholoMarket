import { DELIVERY_STATUSES, inList } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Rider } from 'src/database/postgres/entities/delivery/rider.entity';
import { PickupPoint } from 'src/database/postgres/entities/market/pickup-point.entity';
import { Order } from 'src/database/postgres/entities/order/order.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/** One delivery can bundle several shop orders of the same customer from the same mall. */
@Entity('deliveries')
@Check('CHK_deliveries_status', inList('status', DELIVERY_STATUSES))
@Index(['riderId', 'status'])
export class Delivery {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @Column({ type: 'int' })
  hubId: number;

  @ManyToOne(() => PickupPoint)
  @JoinColumn({ name: 'hub_id' })
  hub: Relation<PickupPoint>;

  @Column({ type: 'int', nullable: true })
  riderId: number | null;

  @ManyToOne(() => Rider)
  @JoinColumn({ name: 'rider_id' })
  rider: Relation<Rider> | null;

  /** Snapshot. */
  @Column({ type: 'jsonb' })
  address: Record<string, any>;

  @StatusColumn('pending', 20)
  status: string;

  @MoneyColumn({ default: 0 })
  fee: number;

  @MoneyColumn({ default: 0 })
  riderEarning: number;

  @MoneyColumn({ default: 0 })
  codAmount: number;

  @Column({ type: 'varchar', length: 6, nullable: true })
  deliveryOtp: string | null;

  @Column({ type: 'text', nullable: true })
  proofPhotoUrl: string | null;

  @Timestamp()
  assignedAt: Date | null;

  @Timestamp()
  deliveredAt: Date | null;

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
