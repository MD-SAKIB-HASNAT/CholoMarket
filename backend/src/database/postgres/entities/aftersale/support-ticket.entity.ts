import {
  TICKET_CATEGORIES,
  TICKET_CHANNELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  inList,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Order } from 'src/database/postgres/entities/order/order.entity';
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

/** Customer hotline / in-app support. Works for callers without an account. */
@Entity('support_tickets')
@Check('CHK_support_tickets_channel', inList('channel', TICKET_CHANNELS))
@Check('CHK_support_tickets_category', inList('category', TICKET_CATEGORIES))
@Check('CHK_support_tickets_status', inList('status', TICKET_STATUSES))
@Check('CHK_support_tickets_priority', inList('priority', TICKET_PRIORITIES))
@Index(['status', 'priority'])
export class SupportTicket {
  @IdColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  ticketNo: string;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  phone: string | null;

  @Column({ type: 'int', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order> | null;

  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop> | null;

  @Column({ type: 'varchar', length: 15 })
  channel: string;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @StatusColumn('open', 20)
  status: string;

  @StatusColumn('normal', 10)
  priority: string;

  @Column({ type: 'int', nullable: true })
  assignedTo: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: Relation<User> | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;

  @Timestamp()
  resolvedAt: Date | null;
}
