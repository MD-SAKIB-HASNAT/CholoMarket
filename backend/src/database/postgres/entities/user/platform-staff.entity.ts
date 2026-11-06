import { PLATFORM_ROLES, inList, type PlatformRole } from 'src/database/enums';
import { CreatedAt } from 'src/database/postgres/columns';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('platform_staff')
@Check('CHK_platform_staff_role', inList('role', PLATFORM_ROLES))
export class PlatformStaff {
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 20 })
  role: PlatformRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreatedAt()
  createdAt: Date;
}
