import {
  RETURN_REASONS,
  RETURN_RESOLUTIONS,
  RETURN_STATUSES,
  inList,
  type ReturnReason,
  type ReturnStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { ReturnItem } from 'src/database/postgres/entities/aftersale/return-item.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
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

@Entity('return_requests')
@Check('CHK_return_requests_reason', inList('reason', RETURN_REASONS))
@Check(
  'CHK_return_requests_resolution',
  `"resolution" IS NULL OR ${inList('resolution', RETURN_RESOLUTIONS)}`,
)
@Check('CHK_return_requests_status', inList('status', RETURN_STATUSES))
export class ReturnRequest {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  shopOrderId: number;

  @ManyToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Column({ type: 'varchar', length: 20 })
  reason: ReturnReason;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  photoUrls: string[];

  @Column({ type: 'varchar', length: 20, nullable: true })
  resolution: string | null;

  @StatusColumn('requested', 20)
  status: ReturnStatus;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number | null;

  @Timestamp()
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  shopNote: string | null;

  @OneToMany(() => ReturnItem, (i) => i.returnRequest)
  items: Relation<ReturnItem[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
