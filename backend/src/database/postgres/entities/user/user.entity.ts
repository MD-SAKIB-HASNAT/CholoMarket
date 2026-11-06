import { USER_STATUSES, inList, type UserStatus } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Check, Column, Entity } from 'typeorm';

/**
 * Everyone is a user. Powers come from membership tables:
 * platform_staff, market_members, shop_members, riders.
 * Login is phone + OTP (codes live in Redis, never here).
 */
@Entity('users')
@Check('CHK_users_status', inList('status', USER_STATUSES))
@Check('CHK_users_language', `"preferred_language" IN ('bn', 'en')`)
export class User {
  @IdColumn()
  id: number;

  /** E.164: +8801XXXXXXXXX */
  @Column({ type: 'varchar', length: 14, unique: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  fullName: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'char', length: 2, default: 'bn' })
  preferredLanguage: 'bn' | 'en';

  @Timestamp()
  phoneVerifiedAt: Date | null;

  @StatusColumn('active', 20)
  status: UserStatus;

  /** Reservations never collected; drives deposit requirements. */
  @Column({ type: 'smallint', default: 0 })
  noShowCount: number;

  @Timestamp()
  lastLoginAt: Date | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
