import { CreatedAt, IdColumn, Timestamp } from 'src/database/postgres/columns';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';

/** One chat thread per customer-shop pair. */
@Entity('conversations')
@Unique(['customerId', 'shopId'])
@Index(['shopId', 'lastMessageAt'])
export class Conversation {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  customerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<User>;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Timestamp()
  lastMessageAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastMessagePreview: string | null;

  @Column({ type: 'int', default: 0 })
  customerUnread: number;

  @Column({ type: 'int', default: 0 })
  shopUnread: number;

  @CreatedAt()
  createdAt: Date;
}
