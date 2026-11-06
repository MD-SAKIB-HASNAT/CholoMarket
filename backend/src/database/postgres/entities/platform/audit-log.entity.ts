import { BigIdColumn, CreatedAt } from 'src/database/postgres/columns';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
export class AuditLog {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: Relation<User> | null;

  /** e.g. 'shop.verify', 'variant.price' */
  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text' })
  entityType: string;

  @Column({ type: 'int', nullable: true })
  entityId: number | null;

  /** {"price":[1200,1100]} */
  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any> | null;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string | null;

  @CreatedAt()
  createdAt: Date;
}
