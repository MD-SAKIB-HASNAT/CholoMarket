import { BigIdColumn, CreatedAt } from 'src/database/postgres/columns';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('shop_order_events')
@Index(['shopOrderId', 'createdAt'])
export class ShopOrderEvent {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int' })
  shopOrderId: number;

  @ManyToOne(() => ShopOrder, (s) => s.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  @Column({ type: 'varchar', length: 25, nullable: true })
  fromStatus: string | null;

  @Column({ type: 'varchar', length: 25 })
  toStatus: string;

  /** NULL = system, e.g. the expiry job. */
  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: Relation<User> | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreatedAt()
  createdAt: Date;
}
