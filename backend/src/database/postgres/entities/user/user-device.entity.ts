import { DEVICE_PLATFORMS, inList } from 'src/database/enums';
import { IdColumn } from 'src/database/postgres/columns';
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

@Entity('user_devices')
@Check('CHK_user_devices_platform', inList('platform', DEVICE_PLATFORMS))
export class UserDevice {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 10 })
  platform: string;

  @Column({ type: 'text', unique: true })
  pushToken: string;

  @Column({ type: 'text', nullable: true })
  appVersion: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  lastSeenAt: Date;
}
