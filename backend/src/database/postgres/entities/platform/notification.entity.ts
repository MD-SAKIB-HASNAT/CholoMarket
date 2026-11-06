import {
  BigIdColumn,
  CreatedAt,
  Timestamp,
} from 'src/database/postgres/columns';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  /** e.g. 'order_ready', 'offer_accepted' */
  @Column({ type: 'varchar', length: 40 })
  kind: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  /** Deep-link target, e.g. {"href":"/orders/CM-..."} */
  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  /** in_app, push, sms */
  @Column({ type: 'text', array: true, default: '{in_app}' })
  channels: string[];

  @Timestamp()
  readAt: Date | null;

  @CreatedAt()
  createdAt: Date;
}
